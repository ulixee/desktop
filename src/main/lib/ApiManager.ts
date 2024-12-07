import { CloudNode } from '@ulixee/cloud';
import UlixeeHostsConfig from '@ulixee/commons/config/hosts';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import { toUrl } from '@ulixee/commons/lib/utils';
import IDatastoreDeployLogEntry from '@ulixee/datastore-core/interfaces/IDatastoreDeployLogEntry';
import { IWallet } from '@ulixee/datastore/interfaces/IPaymentService';
import IQueryLogEntry from '@ulixee/datastore/interfaces/IQueryLogEntry';
import DatastoreApiClient from '@ulixee/datastore/lib/DatastoreApiClient';
import DatastoreApiClients from '@ulixee/datastore/lib/DatastoreApiClients';
import LocalUserProfile from '@ulixee/datastore/lib/LocalUserProfile';
import QueryLog from '@ulixee/datastore/lib/QueryLog';
import DefaultPaymentService from '@ulixee/datastore/payments/DefaultPaymentService';
import { IDesktopAppApis } from '@ulixee/desktop-interfaces/apis';
import { IDatabrokerAuthAccount } from '@ulixee/datastore/interfaces/ILocalUserProfile';
import { ICloudConnected } from '@ulixee/desktop-interfaces/apis/IDesktopApis';
import IDesktopAppEvents from '@ulixee/desktop-interfaces/events/IDesktopAppEvents';
import ArgonUtils from '@ulixee/platform-utils/lib/ArgonUtils';
import { screen, app } from 'electron';
import * as http from 'http';
import { AddressInfo } from 'net';
import * as Path from 'path';
import { ClientOptions } from 'ws';
import WebSocket from 'ws';
import ArgonPaymentProcessor from '@ulixee/datastore-core/lib/ArgonPaymentProcessor';
import AccountManager from './AccountManager';
import ApiClient from './ApiClient';
import ArgonFile, { IArgonFile } from './ArgonFile';
import DeploymentWatcher from './DeploymentWatcher';
import PrivateDesktopApiHandler from './PrivateDesktopApiHandler';
import { version } from '..';

const bundledDatastoreExample = Path.resolve(app.getAppPath(), 'resources', 'ulixee-docs.dbx.tgz');

export default class ApiManager<
  TEventType extends keyof IDesktopAppEvents & string = keyof IDesktopAppEvents,
> extends TypedEventEmitter<{
  'api-event': {
    cloudAddress: string;
    eventType: TEventType;
    data: IDesktopAppEvents[TEventType];
  };
  'new-cloud-address': ICloudConnected;
  'argon-file-opened': IArgonFile;
  deployment: IDatastoreDeployLogEntry;
  'wallet-updated': { wallet: IWallet };
  query: IQueryLogEntry;
}> {
  apiByCloudAddress = new Map<
    string,
    {
      name: string;
      adminIdentity?: string;
      cloudNodes: number;
      type: 'local' | 'public' | 'private';
      resolvable: Resolvable<IApiGroup>;
    }
  >();

  localCloud?: CloudNode;
  exited = false;
  events = new EventSubscriber();
  localCloudAddress?: string;
  debuggerUrl?: string;
  localUserProfile: LocalUserProfile;
  deploymentWatcher: DeploymentWatcher;
  paymentService?: DefaultPaymentService;
  databrokerPaymentService?: DefaultPaymentService;
  accountManager: AccountManager;
  queryLogWatcher: QueryLog;
  privateDesktopApiHandler: PrivateDesktopApiHandler;
  privateDesktopWsServer?: WebSocket.Server;
  privateDesktopWsServerAddress?: string;
  datastoreApiClients = new DatastoreApiClients();
  private reconnectsByAddress: { [address: string]: NodeJS.Timeout } = {};

  constructor() {
    super();
    this.localUserProfile = new LocalUserProfile();
    this.deploymentWatcher = new DeploymentWatcher();
    this.queryLogWatcher = new QueryLog();
    this.privateDesktopApiHandler = new PrivateDesktopApiHandler(this);
    this.accountManager = new AccountManager(this.localUserProfile);
  }

  public async start(): Promise<void> {
    this.debuggerUrl = await this.getDebuggerUrl();
    this.privateDesktopWsServer = new WebSocket.Server({ port: 0 });
    this.events.on(
      this.privateDesktopWsServer,
      'connection',
      this.handlePrivateApiWsConnection.bind(this),
    );
    this.privateDesktopWsServerAddress = await new Promise<string>(resolve => {
      this.privateDesktopWsServer.once('listening', () => {
        const address = this.privateDesktopWsServer.address() as AddressInfo;
        resolve(`ws://127.0.0.1:${address.port}`);
      });
    });
    await this.accountManager.start();
    this.events.on(this.accountManager, 'update', ev =>
      this.emit('wallet-updated', { wallet: ev.wallet }),
    );

    if (!this.localUserProfile.defaultAdminIdentityPath) {
      await this.localUserProfile.createDefaultAdminIdentity();
    }
    this.deploymentWatcher.start();
    this.queryLogWatcher.monitor(x => this.emit('query', x));

    if (this.localUserProfile.databrokers.length) {
      await this.setDatabroker(this.localUserProfile.databrokers[0]);
    }

    if (this.accountManager.localchains.length) {
      const localchain = this.accountManager.localchainForQuery;
      if (localchain) await this.setLocalchainForPayment(localchain.name);
    } else {
      this.paymentService = new DefaultPaymentService();
    }

    // start before registering change handlers
    await this.startLocalCloud();

    this.events.on(UlixeeHostsConfig.global, 'change', this.onNewLocalCloudAddress.bind(this));
    this.events.on(this.deploymentWatcher, 'new', x => this.emit('deployment', x));

    // don't connect before we have a cloud started
    for (const cloud of this.localUserProfile.clouds) {
      await this.connectToCloud({
        ...cloud,
        adminIdentity: cloud.adminIdentity,
        type: 'private',
      });
    }
  }

  public async setLocalchainForPayment(name: string): Promise<void> {
    const localchain = this.accountManager.localchains.find(x => x.name === name);
    if (!localchain) throw new Error(`Localchain ${name} not found`);
    this.paymentService = await DefaultPaymentService.fromOpenLocalchain(
      localchain,
      {
        queries: 10,
        type: 'multiplier',
      },
      this.datastoreApiClients,
    );
  }

  public async setDatabroker(broker: Omit<IDatabrokerAuthAccount, 'userIdentity'>): Promise<void> {
    this.databrokerPaymentService = await DefaultPaymentService.fromBroker(
      broker.host,
      {
        pemPath: broker.pemPath,
        passphrase: broker.pemPassword,
      },
      {
        queries: 10,
        type: 'multiplier',
      },
      this.datastoreApiClients,
    );
  }

  public async getWallet(): Promise<IWallet> {
    if (!this.paymentService) throw new Error("Payment service isn't initialized");
    const localchainWallet = await this.accountManager.getWallet();
    const credits = await this.paymentService.credits();
    const creditBalance = credits.reduce((sum, x) => sum + x.remaining, 0n);

    const localchainBalance = localchainWallet.accounts.reduce(
      (sum, x) => sum + x.balance + x.mainchainBalance,
      0n,
    );

    const brokerBalance = localchainWallet.brokerAccounts.reduce((sum, x) => sum + x.balance, 0n);

    const formattedBalance = ArgonUtils.format(
      localchainBalance + creditBalance + brokerBalance,
      'microgons',
      'argons',
    );

    return {
      ...localchainWallet,
      credits,
      formattedBalance,
    };
  }

  public async close(): Promise<void> {
    if (this.exited) return;
    this.exited = true;

    await this.localCloud?.desktopCore?.shutdown();
    await this.stopLocalCloud();
    this.privateDesktopWsServer?.close();
    await this.privateDesktopApiHandler.close();
    this.events.close('error');
    for (const connection of this.apiByCloudAddress.values()) {
      await this.closeApiGroup(connection.resolvable);
    }
    await this.datastoreApiClients.close();
    this.apiByCloudAddress.clear();
    this.deploymentWatcher.stop();
    await this.queryLogWatcher.close();
  }

  public async stopLocalCloud(): Promise<void> {
    await this.localCloud?.close();
  }

  public async startLocalCloud(): Promise<void> {
    let localCloudAddress = UlixeeHostsConfig.global.getVersionHost(version);

    localCloudAddress = await UlixeeHostsConfig.global.checkLocalVersionHost(
      version,
      localCloudAddress,
    );
    let adminIdentity: string | undefined;
    if (!localCloudAddress) {
      adminIdentity = this.localUserProfile.defaultAdminIdentity.bech32;
      this.localCloud ??= new CloudNode({
        shouldShutdownOnSignals: false,
        host: 'localhost',
        datastoreConfiguration: {
          cloudAdminIdentities: [adminIdentity],
        },
      });
      await this.localCloud.datastoreCore.copyDbxToStartDir(bundledDatastoreExample);

      this.localCloud.datastoreCore.argonPaymentProcessor = new ArgonPaymentProcessor(
        this.localCloud.datastoreCore.datastoresDir,
        this.accountManager.localchainForCloudNode!,
      );
      await this.localCloud.listen();
      localCloudAddress = await this.localCloud.address;
    }
    await this.connectToCloud({ address: localCloudAddress, type: 'local', adminIdentity });
  }

  public getDatastoreClient(cloudHost: string): DatastoreApiClient {
    const hostUrl = toUrl(cloudHost);
    this.datastoreApiClients[cloudHost] ??= new DatastoreApiClient(hostUrl.origin);
    return this.datastoreApiClients[cloudHost];
  }

  public getCloudAddressByName(name: string): string | undefined {
    for (const [address, entry] of this.apiByCloudAddress) {
      if (entry.name === name) return address;
    }
  }

  public async getCloudConnectionIdByAddress(address: string): Promise<string | undefined> {
    return (await this.apiByCloudAddress.get(address)?.resolvable)?.id;
  }

  public async connectToCloud(cloud: ICloudSetup): Promise<void> {
    const { adminIdentity, oldAddress, type } = cloud;
    let { address, name } = cloud;
    if (!address) return;
    name ??= type;
    address = this.formatCloudAddress(address);
    if (this.apiByCloudAddress.has(address)) {
      await this.apiByCloudAddress.get(address)?.resolvable.promise;
      return;
    }
    try {
      this.apiByCloudAddress.set(address, {
        name: name ?? type,
        adminIdentity,
        type,
        cloudNodes: 0,
        resolvable: new Resolvable(),
      });

      const api = new ApiClient<IDesktopAppApis, IDesktopAppEvents>(
        `${address}?type=app`,
        this.onDesktopEvent.bind(this, address) as any,
      );
      await api.connect();
      const onApiClosed = this.events.once(api, 'close', this.onApiClosed.bind(this, cloud));

      const mainScreen = screen.getPrimaryDisplay();
      const workarea = mainScreen.workArea;
      const { id, cloudNodes } = await api.send('App.connect', {
        workarea: {
          left: workarea.x,
          top: workarea.y,
          ...workarea,
          scale: mainScreen.scaleFactor,
        },
      });
      const cloudApi = this.apiByCloudAddress.get(address);
      if (!cloudApi) throw new Error("Cloud Api wasn't found");
      if (!this.debuggerUrl) throw new Error('Debugger URL not initialized');
      cloudApi.cloudNodes = cloudNodes ?? 0;

      const url = new URL(`/desktop-devtools`, api.transport.host);
      url.searchParams.set('id', id);
      // pipe connection
      const [wsToCore, wsToDevtoolsProtocol] = await Promise.all([
        this.connectToWebSocket(url.href, { perMessageDeflate: true }),
        this.connectToWebSocket(this.debuggerUrl),
      ]);
      clearInterval(this.reconnectsByAddress[address]);
      const events = [
        this.events.on(wsToCore, 'message', msg => {
          wsToDevtoolsProtocol.send(msg.toString());
        }),
        this.events.on(wsToCore, 'error', this.onDevtoolsError.bind(this, wsToCore)),
        this.events.once(wsToCore, 'close', this.onApiClosed.bind(this, cloud)),
        this.events.on(wsToDevtoolsProtocol, 'message', msg => wsToCore.send(msg.toString())),
        this.events.on(
          wsToDevtoolsProtocol,
          'error',
          this.onDevtoolsError.bind(this, wsToDevtoolsProtocol),
        ),
        this.events.once(wsToDevtoolsProtocol, 'close', this.onApiClosed.bind(this, cloud)),
      ];
      this.events.group(`ws-${address}`, onApiClosed, ...events);
      cloudApi.resolvable.resolve({
        id,
        api,
        wsToCore,
        wsToDevtoolsProtocol,
      });
      this.emit('new-cloud-address', {
        address,
        adminIdentity,
        name,
        cloudNodes,
        type,
        oldAddress,
      });
    } catch (error) {
      this.apiByCloudAddress.get(address)?.resolvable.reject(error, true);
      this.apiByCloudAddress.delete(address);
    }
  }

  public async onArgonFileOpened(file: string): Promise<void> {
    const argonFile = await ArgonFile.readFromPath(file);
    if (argonFile) {
      this.emit('argon-file-opened', argonFile);
    }
  }

  private onDesktopEvent(
    cloudAddress: string,
    eventType: TEventType,
    data: IDesktopAppEvents[TEventType],
  ): void {
    if (this.exited) return;

    if (eventType === 'Session.opened') {
      this.emit('api-event', { cloudAddress, eventType, data });
    }

    if (eventType === 'App.quit') {
      const apis = this.apiByCloudAddress.get(cloudAddress);
      if (apis) {
        void this.closeApiGroup(apis.resolvable);
      }
    }
  }

  private onDevtoolsError(ws: WebSocket, error: Error): void {
    console.warn('ERROR in devtools websocket with Core at %s', ws.url, error);
  }

  private async onNewLocalCloudAddress(): Promise<void> {
    const newAddress = UlixeeHostsConfig.global.getVersionHost(version);
    if (!newAddress) return;
    if (this.localCloudAddress !== newAddress) {
      const oldAddress = this.localCloudAddress;
      this.localCloudAddress = this.formatCloudAddress(newAddress);
      // eslint-disable-next-line no-console
      console.log('Desktop app connecting to local cloud', this.localCloudAddress);
      await this.connectToCloud({
        address: this.localCloudAddress,
        adminIdentity: this.localUserProfile.defaultAdminIdentity?.bech32,
        name: 'local',
        type: 'local',
        oldAddress,
      });
    }
  }

  private onApiClosed(cloud: ICloudSetup): void {
    const { address, name } = cloud;
    console.warn('Api Disconnected', address, name);
    const api = this.apiByCloudAddress.get(address);
    this.events.endGroup(`ws-${address}`);
    if (api) {
      void this.closeApiGroup(api.resolvable);
    }
    this.apiByCloudAddress.delete(address);
    if (!this.exited) {
      this.reconnectsByAddress[cloud.address] = setTimeout(
        this.reconnect.bind(this, cloud, 1e3),
        1e3,
      ).unref();
    }
  }

  private reconnect(cloud: ICloudSetup, delay: number): void {
    if (this.exited) return;
    console.warn('Reconnecting to Api', { address: cloud.address, name: cloud.name });
    void this.connectToCloud(cloud).catch(() => {
      this.reconnectsByAddress[cloud.address] = setTimeout(
        this.reconnect.bind(this, cloud, delay * 2),
        Math.min(5 * 60e3, delay * 2),
      ).unref();
    });
  }

  private async closeApiGroup(group: Resolvable<IApiGroup>): Promise<void> {
    const { api, wsToCore, wsToDevtoolsProtocol } = await group;
    if (api.isConnected) await api.disconnect();
    wsToCore?.close();
    return wsToDevtoolsProtocol?.close();
  }

  private async connectToWebSocket(host: string, options?: ClientOptions): Promise<WebSocket> {
    const ws = new WebSocket(host, options);
    await new Promise<void>((resolve, reject) => {
      const closeEvents = [
        this.events.once(ws, 'close', reject),
        this.events.once(ws, 'error', reject),
      ];
      this.events.once(ws, 'open', () => {
        this.events.off(...closeEvents);
        resolve();
      });
    });
    return ws;
  }

  private handlePrivateApiWsConnection(ws: WebSocket, req: http.IncomingMessage): void {
    this.privateDesktopApiHandler.onConnection(ws, req);
  }

  private async getDebuggerUrl(): Promise<string> {
    const responseBody = await new Promise<string>((resolve, reject) => {
      const request = http.get(
        `http://127.0.0.1:${process.env.DEVTOOLS_PORT}/json/version`,
        async res => {
          let jsonString = '';
          res.setEncoding('utf8');
          for await (const chunk of res) jsonString += chunk;
          resolve(jsonString);
        },
      );
      request.once('error', reject);
      request.end();
    });
    const debugEndpoints = JSON.parse(responseBody);

    return debugEndpoints.webSocketDebuggerUrl;
  }

  private formatCloudAddress(host: string): string {
    const url = toUrl(host);
    url.pathname = '/desktop';
    return url.href;
  }
}

interface IApiGroup {
  api: ApiClient<IDesktopAppApis, IDesktopAppEvents>;
  id: string;
  wsToCore: WebSocket;
  wsToDevtoolsProtocol: WebSocket;
}

interface ICloudSetup {
  address: string;
  adminIdentity?: string;
  type: 'public' | 'private' | 'local';
  name?: string;
  oldAddress?: string;
}
