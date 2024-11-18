import {
  BalanceSyncResult,
  CryptoScheme,
  Localchain,
  LocalchainOverview,
  MainchainClient,
} from '@argonprotocol/localchain';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import Logger from '@ulixee/commons/lib/Logger';
import Queue from '@ulixee/commons/lib/Queue';
import TypedEventEmitter from '@ulixee/commons/lib/TypedEventEmitter';
import Env from '@ulixee/datastore/env';
import IDatastoreHostLookup from '@ulixee/datastore/interfaces/IDatastoreHostLookup';
import ILocalchainConfig from '@ulixee/datastore/interfaces/ILocalchainConfig';
import { IDatabrokerAuthAccount } from '@ulixee/datastore/interfaces/ILocalUserProfile';
import { IDatabrokerAccount, IWallet } from '@ulixee/datastore/interfaces/IPaymentService';
import DatastoreLookup from '@ulixee/datastore/lib/DatastoreLookup';
import LocalUserProfile from '@ulixee/datastore/lib/LocalUserProfile';
import BrokerChannelHoldSource from '@ulixee/datastore/payments/BrokerChannelHoldSource';
import LocalchainWithSync from '@ulixee/datastore/payments/LocalchainWithSync';
import { IArgonFileMeta } from '@ulixee/desktop-interfaces/apis';
import {
  ARGON_FILE_EXTENSION,
  ArgonFileSchema,
} from '@ulixee/platform-specification/types/IArgonFile';
import ArgonUtils from '@ulixee/platform-utils/lib/ArgonUtils';
import Identity from '@ulixee/platform-utils/lib/Identity';
import { gettersToObject } from '@ulixee/platform-utils/lib/objectUtils';
import serdeJson from '@ulixee/platform-utils/lib/serdeJson';
import * as Path from 'path';
import { IArgonFile } from './ArgonFile';

const { log } = Logger(module);

export default class AccountManager extends TypedEventEmitter<{
  update: { wallet: IWallet };
}> {
  exited = false;
  events = new EventSubscriber();
  public localchains: LocalchainWithSync[] = [];
  public localchainForQuery?: LocalchainWithSync;
  public localchainForCloudNode?: LocalchainWithSync;
  private localchainToAddressCache = new WeakMap<LocalchainWithSync, string>();
  private nextTick?: NodeJS.Timeout;
  private mainchainClient?: MainchainClient;
  private queue = new Queue('LOCALCHAIN', 1);

  constructor(readonly localUserProfile: LocalUserProfile) {
    super();
  }

  public getDefaultLocalchain(): LocalchainWithSync {
    return this.localchains.find(x => x.name === 'primary') ?? this.localchains[0];
  }

  public async loadMainchainClient(url?: string, timeoutMillis?: number): Promise<void> {
    url ??= Env.argonMainchainUrl;
    if (url) {
      try {
        this.mainchainClient = await MainchainClient.connect(url, timeoutMillis ?? 10e3);
        for (const localchain of this.localchains) {
          await localchain.attachMainchain(this.mainchainClient);
        }
      } catch (error) {
        log.error('Could not connect to mainchain', { error });
        throw error;
      }
    }
  }

  public async start(): Promise<void> {
    for (const config of this.localUserProfile.localchains) {
      await this.loadLocalchain({
        localchainPath: config.path,
        disableAutomaticSync: true,
        // TODO: need to prompt for passwords of needed
        // keystorePassword: config.hasPassword ? { password: Buffer.from(config.password) } : undefined
      });
    }
    if (!this.localUserProfile.localchains.length) {
      await Promise.all([
        this.addAccount({ role: 'query' }),
        this.addAccount({
          path: Path.join(Localchain.getDefaultDir(), `Cloudnode1.db`),
          role: 'cloudNode',
        }),
      ]);
    }
    void this.loadMainchainClient().then(this.emitWallet.bind(this));
    this.scheduleNextSync();
  }

  public async close(): Promise<void> {
    if (this.exited) return;
    this.exited = true;
  }

  public async addBrokerAccount(
    config: Omit<IDatabrokerAuthAccount, 'userIdentity'>,
  ): Promise<IDatabrokerAccount> {
    const identity = Identity.loadFromPem(config.pemPath, { keyPassphrase: config.pemPassword });
    const userIdentity = identity.bech32;
    Object.assign(config, { userIdentity });
    // check first and throw error if invalid
    const balance = await this.getBrokerBalance(config.host, userIdentity);
    const entry = this.localUserProfile.databrokers.find(x => x.host === config.host);
    if (entry) {
      entry.pemPath = config.pemPath;
      entry.pemPassword = config.pemPassword;
      entry.userIdentity = userIdentity;
      entry.name = config.name;
    } else {
      this.localUserProfile.databrokers.push(config as IDatabrokerAuthAccount);
    }
    await this.localUserProfile.save();
    return {
      ...config,
      userIdentity,
      balance,
    };
  }

  public async getBrokerBalance(host: string, identity: string): Promise<bigint> {
    return await BrokerChannelHoldSource.getBalance(host, identity);
  }

  public async getBrokerAccounts(): Promise<IDatabrokerAccount[]> {
    const brokers = this.localUserProfile.databrokers.map(x => ({ ...x, balance: 0n }));
    for (const broker of brokers) {
      broker.balance = await this.getBrokerBalance(broker.host, broker.userIdentity).catch(
        () => 0n,
      );
    }
    return brokers;
  }

  public async addAccount(
    config: {
      path?: string;
      password?: string;
      cryptoScheme?: CryptoScheme;
      suri?: string;
      role?: 'query' | 'cloudNode';
    } = {},
  ): Promise<LocalchainWithSync> {
    config ??= {};
    const password = config.password
      ? {
          password: Buffer.from(config.password),
        }
      : undefined;
    const localchain = await this.loadLocalchain({
      localchainPath: config.path,
      disableAutomaticSync: true,
      keystorePassword: password,
    });
    if (config.role === 'cloudNode') {
      this.localUserProfile.localchainForCloudNodeName = localchain.name;
      this.localchainForCloudNode = localchain;
    }
    if (config.role === 'query') {
      this.localUserProfile.localchainForQueryName = localchain.name;
      this.localchainForQuery = localchain;
    }

    let entry = this.localUserProfile.localchains.find(x => x.path === localchain.path);
    if (!entry) {
      entry = {
        path: localchain.path,
        hasPassword: !!config.password,
      };
      this.localUserProfile.localchains.push(entry);
    }
    await this.localUserProfile.save();

    if (this.mainchainClient) {
      await localchain.attachMainchain(this.mainchainClient);
    }
    await localchain.createIfMissing(config);
    return localchain;
  }

  private async loadLocalchain(config: ILocalchainConfig): Promise<LocalchainWithSync> {
    const localchain = await LocalchainWithSync.load(config);
    this.localchains.push(localchain);

    if (localchain.name === this.localUserProfile.localchainForQueryName) {
      this.localchainForQuery = localchain;
    }
    if (localchain.name === this.localUserProfile.localchainForCloudNodeName) {
      this.localchainForCloudNode = localchain;
    }
    return localchain;
  }

  private sortLocalchains(): void {
    this.localchains.sort((a, b) => {
      if (a.name === 'primary') return -1;
      if (b.name === 'primary') return 1;
      if (a.name === this.localUserProfile.localchainForQueryName) return -1;
      if (b.name === this.localUserProfile.localchainForQueryName) return 1;
      if (a.name === this.localUserProfile.localchainForCloudNodeName) return -1;
      if (b.name === this.localUserProfile.localchainForCloudNodeName) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  public async getAddress(localchain: LocalchainWithSync): Promise<string | undefined> {
    if (!this.localchainToAddressCache.has(localchain)) {
      this.localchainToAddressCache.set(localchain, await localchain.address);
    }
    return this.localchainToAddressCache.get(localchain);
  }

  public async getLocalchain(address?: string): Promise<LocalchainWithSync | undefined> {
    if (!address) return;
    for (const chain of this.localchains) {
      if ((await this.getAddress(chain)) === address) return chain;
    }
  }

  public async getDatastoreHostLookup(): Promise<IDatastoreHostLookup | undefined> {
    return new DatastoreLookup(this.mainchainClient ? Promise.resolve(this.mainchainClient) : null);
  }

  public async getWallet(): Promise<IWallet> {
    const accounts = await Promise.all(this.localchains.map(x => x.accountOverview()));
    const brokerAccounts = await this.getBrokerAccounts();
    let balance = 0n;
    for (const account of accounts) {
      balance += account.balance + account.mainchainBalance;
    }
    for (const account of brokerAccounts) {
      balance += account.balance;
    }

    const formattedBalance = ArgonUtils.format(balance, 'microgons', 'argons');

    return {
      credits: [],
      brokerAccounts,
      accounts,
      formattedBalance,
      localchainForQuery: this.localUserProfile.localchainForQueryName,
      localchainForCloudNode: this.localUserProfile.localchainForCloudNodeName,
    };
  }

  public async transferMainchainToLocal(address: string, amount: bigint): Promise<void> {
    const localchain = await this.getLocalchain(address);
    if (!localchain) throw new Error('No localchain found for address');
    await localchain.mainchainTransfers.sendToLocalchain(amount);
  }

  public async transferLocalToMainchain(address: string, amount: bigint): Promise<void> {
    const localchain = await this.getLocalchain(address);
    if (!localchain) throw new Error('No localchain found for address');
    const change = localchain.inner.beginChange();
    const account = await change.defaultDepositAccount();
    await account.sendToMainchain(amount);
    const result = await change.notarize();
    log.info('Localchain to mainchain transfer notarized', {
      notarizationTracker: await gettersToObject(result),
    } as any);
  }

  public async createAccount(
    name: string,
    suri?: string,
    password?: string,
  ): Promise<LocalchainOverview> {
    const path = Path.join(Localchain.getDefaultDir(), `${name}.db`);
    const localchain = await this.addAccount({ path, suri, password });
    return await localchain.accountOverview();
  }

  public async createArgonsToSendFile(request: {
    microgons: bigint;
    fromAddress?: string;
    toAddress?: string;
  }): Promise<IArgonFileMeta> {
    const localchain =
      (await this.getLocalchain(request.fromAddress)) ?? this.getDefaultLocalchain();

    const file = await localchain.transactions.send(
      request.microgons,
      request.toAddress ? [request.toAddress] : null,
    );
    const argonFile = JSON.parse(file);

    const recipient = request.toAddress ? `for ${request.toAddress}` : 'cash';
    return {
      rawJson: file,
      file: ArgonFileSchema.parse(argonFile),
      name: `${ArgonUtils.format(request.microgons, 'microgons', 'argons')} ${recipient}.${ARGON_FILE_EXTENSION}`,
    };
  }

  public async createArgonsToRequestFile(request: {
    microgons: bigint;
    sendToMyAddress?: string;
  }): Promise<IArgonFileMeta> {
    const localchain =
      (await this.getLocalchain(request.sendToMyAddress)) ?? this.getDefaultLocalchain();
    const file = await localchain.transactions.request(request.microgons);
    const argonFile = JSON.parse(file);

    return {
      rawJson: file,
      file: ArgonFileSchema.parse(argonFile),
      name: `Argon Request ${new Date().toLocaleString()}`,
    };
  }

  public async acceptArgonRequest(
    argonFile: IArgonFile,
    fulfillFromAccount?: string,
  ): Promise<void> {
    if (!argonFile.request) {
      throw new Error('This Argon file is not a request');
    }
    let fromAddress = fulfillFromAccount;
    if (!fromAddress) {
      const funding = argonFile.request.reduce((sum, x) => {
        if (x.accountType === 'deposit') {
          for (const note of x.notes) {
            if (note.noteType.action === 'claim') sum += note.microgons;
          }
        }
        return sum;
      }, 0n);
      for (const account of this.localchains) {
        const overview = await account.accountOverview();
        if (overview.balance >= funding) {
          fromAddress = overview.address;
          break;
        }
      }
    }
    const localchain = (await this.getLocalchain(fromAddress)) ?? this.getDefaultLocalchain();
    const argonFileJson = serdeJson(argonFile);
    await this.queue.run(async () => {
      const importChange = localchain.inner.beginChange();
      await importChange.acceptArgonFileRequest(argonFileJson);
      const result = await importChange.notarize();
      log.info('Argon request notarized', {
        notarizationTracker: await gettersToObject(result),
      } as any);
    });
  }

  public async importArgons(argonFile: IArgonFile): Promise<void> {
    if (!argonFile.send) {
      throw new Error('This Argon file does not contain any sent argons');
    }

    const filters = argonFile.send
      .map(x => {
        if (x.accountType === 'deposit') {
          for (const note of x.notes) {
            if (note.noteType.action === 'send') {
              return note.noteType.to;
            }
          }
        }
        return [];
      })
      .flat()
      .filter(Boolean);

    let localchain = this.getDefaultLocalchain();
    for (const filter of filters) {
      if (!filter) continue;
      const lookup = await this.getLocalchain(filter);
      if (lookup) {
        localchain = lookup;
        break;
      }
    }

    const argonFileJson = serdeJson(argonFile);
    await this.queue.run(async () => {
      const importChange = localchain.inner.beginChange();
      await importChange.importArgonFile(argonFileJson);
      const result = await importChange.notarize();
      log.info('Argon import notarized', {
        notarizationTracker: await gettersToObject(result),
      } as any);
    });
  }

  private scheduleNextSync(): void {
    const localchain = this.getDefaultLocalchain();
    if (!localchain) return;
    const nextTick = Number(localchain.ticker.millisToNextTick());
    this.nextTick = setTimeout(() => this.sync().catch(() => null), nextTick + 1);
  }

  private async sync(): Promise<void> {
    clearTimeout(this.nextTick);
    try {
      const syncs = await Promise.allSettled(
        this.localchains.map(localchain =>
          this.queue.run(async () => await localchain.balanceSync.sync()),
        ),
      );
      const result: BalanceSyncResult = {
        channelHoldNotarizations: [],
        balanceChanges: [],
        jumpAccountConsolidations: [],
        mainchainTransfers: [],
        blockVotes: [],
        channelHoldsUpdated: [],
      };
      for (let i = 0; i < syncs.length; i++) {
        const sync = syncs[i];
        const localchain = this.localchains[i];
        if (sync.status === 'fulfilled') {
          const next = sync.value;

          result.channelHoldNotarizations.push(...next.channelHoldNotarizations);
          result.balanceChanges.push(...next.balanceChanges);
          result.jumpAccountConsolidations.push(...next.jumpAccountConsolidations);
          result.mainchainTransfers.push(...next.mainchainTransfers);
          result.channelHoldsUpdated.push(...next.channelHoldsUpdated);
        }
        if (sync.status === 'rejected') {
          log.warn('Error synching account balance changes', {
            error: sync.reason,
            localchain: localchain.name,
          } as any);
        }
      }
      if (result.mainchainTransfers.length || result.balanceChanges.length) {
        log.info('Account sync result', {
          ...(await gettersToObject(result)),
        } as any);
        await this.emitWallet();
      }
    } catch (error) {
      log.error('Error synching account balance changes', { error });
    }
    this.scheduleNextSync();
  }

  private async emitWallet(): Promise<void> {
    const wallet = await this.getWallet();
    this.emit('update', { wallet });
  }
}
