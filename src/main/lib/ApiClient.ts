import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { toUrl } from '@ulixee/commons/lib/utils';
import { IChromeAliveSessionApis, IDesktopAppApis } from '@ulixee/desktop-interfaces/apis';
import IChromeAliveSessionEvents from '@ulixee/desktop-interfaces/events/IChromeAliveSessionEvents';
import IDesktopAppEvents from '@ulixee/desktop-interfaces/events/IDesktopAppEvents';
import ICoreEventPayload from '@ulixee/net/interfaces/ICoreEventPayload';
import { ConnectionToCore, WsTransportToCore } from '@ulixee/net';
import ICoreRequestPayload from '@ulixee/net/interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '@ulixee/net/interfaces/ICoreResponsePayload';
import ITransport from '@ulixee/net/interfaces/ITransport';

export default class ApiClient<
  TApis extends IDesktopAppApis | IChromeAliveSessionApis,
  TEvents extends IChromeAliveSessionEvents | IDesktopAppEvents,
  TEventNames extends keyof TEvents = keyof TEvents,
> extends TypedEventEmitter<{ close: void }> {
  public isConnected = false;
  public address: string;
  public readonly transport: ITransport;
  private connection: ConnectionToCore<TApis, TEvents>;

  constructor(
    address: string,
    public onEvent: (event: TEventNames, data?: TEvents[TEventNames]) => any,
  ) {
    super();
    try {
      const url = toUrl(address);
      url.hostname.replace('localhost', '127.0.0.1');
      this.address = url.href;
    } catch (error) {
      console.error('Invalid API URL', error, { address });
      throw error;
    }
    this.transport = new WsTransportToCore(this.address);
    this.connection = new ConnectionToCore(this.transport);
    this.connection.on('event', this.onMessage.bind(this));
    this.connection.on('disconnected', this.onDisconnected.bind(this));
  }

  public async connect(): Promise<void> {
    await this.connection.connect({ timeoutMs: 15e3, isAutoConnect: false });
    this.isConnected = true;
  }

  public async disconnect(): Promise<void> {
    this.isConnected = false;
    await this.connection.disconnect();
  }

  public async send<T extends keyof TApis & string>(
    command: T,
    ...args: ICoreRequestPayload<TApis, T>['args']
  ): Promise<ICoreResponsePayload<TApis, T>['data']> {
    return await this.connection.sendRequest({ command, args });
  }

  private onDisconnected(): void {
    this.emit('close');
  }

  private onMessage(message: ICoreEventPayload<TEvents, any> | any): void {
    if (typeof message === 'string' && message === 'exit') {
      this.onEvent('App.quit' as any);
      return;
    }
    const apiEvent = message.event;
    this.onEvent(apiEvent.eventType, apiEvent.data);
  }
}
