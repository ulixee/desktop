"use strict";
var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var _a, _childWindowsByName, _toolbarView, _toolbarHeight, _activeTabIdx, _replayTabs, _mainView, _showingPopupName, _hasShown, _addTabQueue, _eventSubscriber, _window, _events, _windowStateKeeper, _chromeAliveWindowsBySessionId, _tray, _menuWindow, _blurTimeout, _windowManager, _isClosing, _updateInfoPromise, _installUpdateOnExit, _downloadProgress, _apiManager, _argonFileOpen, _options, _trayMouseover, _b;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const log$1 = require("electron-log");
const Logger = require("@ulixee/commons/lib/Logger");
const Path = require("path");
const util = require("util");
require("@ulixee/commons/lib/SourceMapSupport");
const UlixeeConfig = require("@ulixee/commons/config");
const envUtils = require("@ulixee/commons/lib/envUtils");
const electronUpdater = require("electron-updater");
const events = require("events");
const IArgonFile = require("@ulixee/platform-specification/types/IArgonFile");
const cloud = require("@ulixee/cloud");
const UlixeeHostsConfig = require("@ulixee/commons/config/hosts");
const EventSubscriber = require("@ulixee/commons/lib/EventSubscriber");
const eventUtils = require("@ulixee/commons/lib/eventUtils");
const Resolvable = require("@ulixee/commons/lib/Resolvable");
const utils = require("@ulixee/commons/lib/utils");
const DatastoreApiClient = require("@ulixee/datastore/lib/DatastoreApiClient");
const DatastoreApiClients = require("@ulixee/datastore/lib/DatastoreApiClients");
const LocalUserProfile = require("@ulixee/datastore/lib/LocalUserProfile");
const QueryLog = require("@ulixee/datastore/lib/QueryLog");
const DefaultPaymentService = require("@ulixee/datastore/payments/DefaultPaymentService");
const ArgonUtils = require("@ulixee/platform-utils/lib/ArgonUtils");
const http = require("http");
const WebSocket = require("ws");
const ArgonPaymentProcessor = require("@ulixee/datastore-core/lib/ArgonPaymentProcessor");
const localchain = require("@argonprotocol/localchain");
const Queue = require("@ulixee/commons/lib/Queue");
const TypedEventEmitter = require("@ulixee/commons/lib/TypedEventEmitter");
const Env = require("@ulixee/datastore/env");
const DatastoreLookup = require("@ulixee/datastore/lib/DatastoreLookup");
const BrokerChannelHoldSource = require("@ulixee/datastore/payments/BrokerChannelHoldSource");
const LocalchainWithSync = require("@ulixee/datastore/payments/LocalchainWithSync");
const Identity = require("@ulixee/platform-utils/lib/Identity");
const objectUtils = require("@ulixee/platform-utils/lib/objectUtils");
const serdeJson = require("@ulixee/platform-utils/lib/serdeJson");
const net = require("@ulixee/net");
const fileUtils = require("@ulixee/commons/lib/fileUtils");
const ValidationError = require("@ulixee/platform-specification/utils/ValidationError");
const Fs = require("fs");
const dirUtils = require("@ulixee/commons/lib/dirUtils");
const DatastoreManifest = require("@ulixee/datastore-core/lib/DatastoreManifest");
const CreditReserver = require("@ulixee/datastore/payments/CreditReserver");
const nanoid = require("nanoid");
const Os = require("os");
const sassEmbedded = require("sass-embedded");
const defaultBrowserEmulator = require("@ulixee/default-browser-emulator");
const HeroCore = require("@ulixee/hero-core");
const moment = require("moment");
const _interopDefaultCompat = (e) => e && typeof e === "object" && "default" in e ? e : { default: e };
function _interopNamespaceCompat(e) {
  if (e && typeof e === "object" && "default" in e) return e;
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const log__default = /* @__PURE__ */ _interopDefaultCompat(log$1);
const Logger__default = /* @__PURE__ */ _interopDefaultCompat(Logger);
const Path__namespace = /* @__PURE__ */ _interopNamespaceCompat(Path);
const UlixeeConfig__default = /* @__PURE__ */ _interopDefaultCompat(UlixeeConfig);
const UlixeeHostsConfig__default = /* @__PURE__ */ _interopDefaultCompat(UlixeeHostsConfig);
const EventSubscriber__default = /* @__PURE__ */ _interopDefaultCompat(EventSubscriber);
const Resolvable__default = /* @__PURE__ */ _interopDefaultCompat(Resolvable);
const DatastoreApiClient__default = /* @__PURE__ */ _interopDefaultCompat(DatastoreApiClient);
const DatastoreApiClients__default = /* @__PURE__ */ _interopDefaultCompat(DatastoreApiClients);
const LocalUserProfile__default = /* @__PURE__ */ _interopDefaultCompat(LocalUserProfile);
const QueryLog__default = /* @__PURE__ */ _interopDefaultCompat(QueryLog);
const DefaultPaymentService__default = /* @__PURE__ */ _interopDefaultCompat(DefaultPaymentService);
const ArgonUtils__default = /* @__PURE__ */ _interopDefaultCompat(ArgonUtils);
const http__namespace = /* @__PURE__ */ _interopNamespaceCompat(http);
const WebSocket__default = /* @__PURE__ */ _interopDefaultCompat(WebSocket);
const ArgonPaymentProcessor__default = /* @__PURE__ */ _interopDefaultCompat(ArgonPaymentProcessor);
const Queue__default = /* @__PURE__ */ _interopDefaultCompat(Queue);
const TypedEventEmitter__default = /* @__PURE__ */ _interopDefaultCompat(TypedEventEmitter);
const Env__default = /* @__PURE__ */ _interopDefaultCompat(Env);
const DatastoreLookup__default = /* @__PURE__ */ _interopDefaultCompat(DatastoreLookup);
const BrokerChannelHoldSource__default = /* @__PURE__ */ _interopDefaultCompat(BrokerChannelHoldSource);
const LocalchainWithSync__default = /* @__PURE__ */ _interopDefaultCompat(LocalchainWithSync);
const Identity__default = /* @__PURE__ */ _interopDefaultCompat(Identity);
const serdeJson__default = /* @__PURE__ */ _interopDefaultCompat(serdeJson);
const ValidationError__default = /* @__PURE__ */ _interopDefaultCompat(ValidationError);
const Fs__namespace = /* @__PURE__ */ _interopNamespaceCompat(Fs);
const DatastoreManifest__default = /* @__PURE__ */ _interopDefaultCompat(DatastoreManifest);
const CreditReserver__default = /* @__PURE__ */ _interopDefaultCompat(CreditReserver);
const Os__namespace = /* @__PURE__ */ _interopNamespaceCompat(Os);
const HeroCore__default = /* @__PURE__ */ _interopDefaultCompat(HeroCore);
const moment__default = /* @__PURE__ */ _interopDefaultCompat(moment);
(_a = process.env).RUST_LOG || (_a.RUST_LOG = "info");
if (electron.app.isPackaged) {
  process.env.DEBUG = [process.env.DEBUG ?? "", "ulx:*"].filter(Boolean).join(",");
  process.env.NODE_DISABLE_COLORS = "true";
} else {
  process.env.DEBUG = [process.env.DEBUG ?? "", "ulx:*"].filter(Boolean).join(",");
}
Object.assign(console, log__default.default.functions);
class UlixeeLogger extends Logger.Log {
  constructor(module2, boundContext) {
    super(module2, boundContext);
    this.useColors = !electron.app.isPackaged;
  }
  logToConsole(level, entry) {
    const printablePath = entry.module.replace(".js", "").replace(".ts", "").replace(`build${Path__namespace.sep}`, "").replace(`desktop${Path__namespace.sep}packages`, "");
    const { error, printData } = Logger.translateToPrintable(entry.data);
    if (level === "warn" || level === "error") {
      printData.sessionId = entry.sessionId;
      if (entry.sessionId) {
        printData.sessionName = Logger.loggerSessionIdNames.get(entry.sessionId) ?? void 0;
      }
    }
    const params = Object.keys(printData).length ? [printData] : [];
    if (error) params.push(error);
    const args = [
      `[${printablePath}] ${entry.action}`,
      ...params.map((x) => util.inspect(x, false, 5, this.useColors))
    ];
    if (level === "stats") {
      log__default.default.debug(...args);
    } else {
      log__default.default[level](...args);
    }
  }
  static register() {
    Logger.injectLogger((module2) => {
      return { log: new UlixeeLogger(module2) };
    });
  }
}
UlixeeLogger.register();
const { log } = Logger__default.default(module);
class AccountManager extends TypedEventEmitter__default.default {
  constructor(localUserProfile) {
    super();
    __publicField(this, "exited", false);
    __publicField(this, "events", new EventSubscriber__default.default());
    __publicField(this, "localchains", []);
    __publicField(this, "localchainForQuery");
    __publicField(this, "localchainForCloudNode");
    __publicField(this, "localchainToAddressCache", /* @__PURE__ */ new WeakMap());
    __publicField(this, "nextTick");
    __publicField(this, "mainchainClient");
    __publicField(this, "queue", new Queue__default.default("LOCALCHAIN", 1));
    this.localUserProfile = localUserProfile;
  }
  getDefaultLocalchain() {
    return this.localchains.find((x) => x.name === "primary") ?? this.localchains[0];
  }
  async loadMainchainClient(url, timeoutMillis) {
    url ?? (url = Env__default.default.argonMainchainUrl);
    if (url) {
      try {
        this.mainchainClient = await localchain.MainchainClient.connect(url, timeoutMillis ?? 1e4);
        for (const localchain2 of this.localchains) {
          await localchain2.attachMainchain(this.mainchainClient);
        }
      } catch (error) {
        log.error("Could not connect to mainchain", { error });
        throw error;
      }
    }
  }
  async start() {
    for (const config of this.localUserProfile.localchains) {
      await this.loadLocalchain({
        localchainPath: config.path,
        disableAutomaticSync: true
        // TODO: need to prompt for passwords of needed
        // keystorePassword: config.hasPassword ? { password: Buffer.from(config.password) } : undefined
      });
    }
    if (!this.localUserProfile.localchains.length) {
      await Promise.all([
        this.addAccount({ role: "query" }),
        this.addAccount({
          path: Path__namespace.join(localchain.Localchain.getDefaultDir(), `Cloudnode1.db`),
          role: "cloudNode"
        })
      ]);
    }
    void this.loadMainchainClient().then(this.emitWallet.bind(this));
    this.scheduleNextSync();
  }
  async close() {
    if (this.exited) return;
    this.exited = true;
  }
  async addBrokerAccount(config) {
    const identity = Identity__default.default.loadFromPem(config.pemPath, { keyPassphrase: config.pemPassword });
    const userIdentity = identity.bech32;
    Object.assign(config, { userIdentity });
    const balance = await this.getBrokerBalance(config.host, userIdentity);
    const entry = this.localUserProfile.databrokers.find((x) => x.host === config.host);
    if (entry) {
      entry.pemPath = config.pemPath;
      entry.pemPassword = config.pemPassword;
      entry.userIdentity = userIdentity;
      entry.name = config.name;
    } else {
      this.localUserProfile.databrokers.push(config);
    }
    await this.localUserProfile.save();
    return {
      ...config,
      userIdentity,
      balance
    };
  }
  async getBrokerBalance(host, identity) {
    return await BrokerChannelHoldSource__default.default.getBalance(host, identity);
  }
  async getBrokerAccounts() {
    const brokers = this.localUserProfile.databrokers.map((x) => ({ ...x, balance: 0n }));
    for (const broker of brokers) {
      broker.balance = await this.getBrokerBalance(broker.host, broker.userIdentity).catch(
        () => 0n
      );
    }
    return brokers;
  }
  async addAccount(config = {}) {
    config ?? (config = {});
    const password = config.password ? {
      password: Buffer.from(config.password)
    } : void 0;
    const localchain2 = await this.loadLocalchain({
      localchainPath: config.path,
      disableAutomaticSync: true,
      keystorePassword: password
    });
    if (config.role === "cloudNode") {
      this.localUserProfile.localchainForCloudNodeName = localchain2.name;
      this.localchainForCloudNode = localchain2;
    }
    if (config.role === "query") {
      this.localUserProfile.localchainForQueryName = localchain2.name;
      this.localchainForQuery = localchain2;
    }
    let entry = this.localUserProfile.localchains.find((x) => x.path === localchain2.path);
    if (!entry) {
      entry = {
        path: localchain2.path,
        hasPassword: !!config.password
      };
      this.localUserProfile.localchains.push(entry);
    }
    await this.localUserProfile.save();
    if (this.mainchainClient) {
      await localchain2.attachMainchain(this.mainchainClient);
    }
    const needsBootstrap = !await localchain2.isCreated();
    if (needsBootstrap) {
      await localchain2.create(config);
    }
    return localchain2;
  }
  async loadLocalchain(config) {
    const localchain2 = await LocalchainWithSync__default.default.load(config);
    this.localchains.push(localchain2);
    if (localchain2.name === this.localUserProfile.localchainForQueryName) {
      this.localchainForQuery = localchain2;
    }
    if (localchain2.name === this.localUserProfile.localchainForCloudNodeName) {
      this.localchainForCloudNode = localchain2;
    }
    return localchain2;
  }
  sortLocalchains() {
    this.localchains.sort((a, b) => {
      if (a.name === "primary") return -1;
      if (b.name === "primary") return 1;
      if (a.name === this.localUserProfile.localchainForQueryName) return -1;
      if (b.name === this.localUserProfile.localchainForQueryName) return 1;
      if (a.name === this.localUserProfile.localchainForCloudNodeName) return -1;
      if (b.name === this.localUserProfile.localchainForCloudNodeName) return 1;
      return a.name.localeCompare(b.name);
    });
  }
  async getAddress(localchain2) {
    if (!this.localchainToAddressCache.has(localchain2)) {
      this.localchainToAddressCache.set(localchain2, await localchain2.address);
    }
    return this.localchainToAddressCache.get(localchain2);
  }
  async getLocalchain(address) {
    if (!address) return;
    for (const chain of this.localchains) {
      if (await this.getAddress(chain) === address) return chain;
    }
  }
  async getDatastoreHostLookup() {
    return new DatastoreLookup__default.default(this.mainchainClient ? Promise.resolve(this.mainchainClient) : null);
  }
  async getWallet() {
    const accounts = await Promise.all(this.localchains.map((x) => x.accountOverview()));
    const brokerAccounts = await this.getBrokerAccounts();
    let balance = 0n;
    for (const account of accounts) {
      balance += account.balance + account.mainchainBalance;
    }
    for (const account of brokerAccounts) {
      balance += account.balance;
    }
    const formattedBalance = ArgonUtils__default.default.format(balance, "milligons", "argons");
    return {
      credits: [],
      brokerAccounts,
      accounts,
      formattedBalance,
      localchainForQuery: this.localUserProfile.localchainForQueryName,
      localchainForCloudNode: this.localUserProfile.localchainForCloudNodeName
    };
  }
  async transferMainchainToLocal(address, amount) {
    const localchain2 = await this.getLocalchain(address);
    if (!localchain2) throw new Error("No localchain found for address");
    await localchain2.mainchainTransfers.sendToLocalchain(amount);
  }
  async transferLocalToMainchain(address, amount) {
    const localchain2 = await this.getLocalchain(address);
    if (!localchain2) throw new Error("No localchain found for address");
    const change = localchain2.inner.beginChange();
    const account = await change.defaultDepositAccount();
    await account.sendToMainchain(amount);
    const result = await change.notarize();
    log.info("Localchain to mainchain transfer notarized", {
      notarizationTracker: await objectUtils.gettersToObject(result)
    });
  }
  async createAccount(name, suri, password) {
    const path = Path__namespace.join(localchain.Localchain.getDefaultDir(), `${name}.db`);
    const localchain$1 = await this.addAccount({ path, suri, password });
    return await localchain$1.accountOverview();
  }
  async createArgonsToSendFile(request) {
    const localchain2 = await this.getLocalchain(request.fromAddress) ?? this.getDefaultLocalchain();
    const file = await localchain2.transactions.send(
      request.milligons,
      request.toAddress ? [request.toAddress] : null
    );
    const argonFile = JSON.parse(file);
    const recipient = request.toAddress ? `for ${request.toAddress}` : "cash";
    return {
      rawJson: file,
      file: IArgonFile.ArgonFileSchema.parse(argonFile),
      name: `${ArgonUtils__default.default.format(request.milligons, "milligons", "argons")} ${recipient}.${IArgonFile.ARGON_FILE_EXTENSION}`
    };
  }
  async createArgonsToRequestFile(request) {
    const localchain2 = await this.getLocalchain(request.sendToMyAddress) ?? this.getDefaultLocalchain();
    const file = await localchain2.transactions.request(request.milligons);
    const argonFile = JSON.parse(file);
    return {
      rawJson: file,
      file: IArgonFile.ArgonFileSchema.parse(argonFile),
      name: `Argon Request ${(/* @__PURE__ */ new Date()).toLocaleString()}`
    };
  }
  async acceptArgonRequest(argonFile, fulfillFromAccount) {
    if (!argonFile.request) {
      throw new Error("This Argon file is not a request");
    }
    let fromAddress = fulfillFromAccount;
    if (!fromAddress) {
      const funding = argonFile.request.reduce((sum, x) => {
        if (x.accountType === "deposit") {
          for (const note of x.notes) {
            if (note.noteType.action === "claim") sum += note.milligons;
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
    const localchain2 = await this.getLocalchain(fromAddress) ?? this.getDefaultLocalchain();
    const argonFileJson = serdeJson__default.default(argonFile);
    await this.queue.run(async () => {
      const importChange = localchain2.inner.beginChange();
      await importChange.acceptArgonFileRequest(argonFileJson);
      const result = await importChange.notarize();
      log.info("Argon request notarized", {
        notarizationTracker: await objectUtils.gettersToObject(result)
      });
    });
  }
  async importArgons(argonFile) {
    if (!argonFile.send) {
      throw new Error("This Argon file does not contain any sent argons");
    }
    const filters = argonFile.send.map((x) => {
      if (x.accountType === "deposit") {
        for (const note of x.notes) {
          if (note.noteType.action === "send") {
            return note.noteType.to;
          }
        }
      }
      return [];
    }).flat().filter(Boolean);
    let localchain2 = this.getDefaultLocalchain();
    for (const filter of filters) {
      if (!filter) continue;
      const lookup = await this.getLocalchain(filter);
      if (lookup) {
        localchain2 = lookup;
        break;
      }
    }
    const argonFileJson = serdeJson__default.default(argonFile);
    await this.queue.run(async () => {
      const importChange = localchain2.inner.beginChange();
      await importChange.importArgonFile(argonFileJson);
      const result = await importChange.notarize();
      log.info("Argon import notarized", {
        notarizationTracker: await objectUtils.gettersToObject(result)
      });
    });
  }
  scheduleNextSync() {
    const localchain2 = this.getDefaultLocalchain();
    if (!localchain2) return;
    const nextTick = Number(localchain2.ticker.millisToNextTick());
    this.nextTick = setTimeout(() => this.sync().catch(() => null), nextTick + 1);
  }
  async sync() {
    clearTimeout(this.nextTick);
    try {
      const syncs = await Promise.allSettled(
        this.localchains.map(
          (localchain2) => this.queue.run(async () => await localchain2.balanceSync.sync())
        )
      );
      const result = {
        channelHoldNotarizations: [],
        balanceChanges: [],
        jumpAccountConsolidations: [],
        mainchainTransfers: [],
        blockVotes: [],
        channelHoldsUpdated: []
      };
      for (let i = 0; i < syncs.length; i++) {
        const sync = syncs[i];
        const localchain2 = this.localchains[i];
        if (sync.status === "fulfilled") {
          const next = sync.value;
          result.channelHoldNotarizations.push(...next.channelHoldNotarizations);
          result.balanceChanges.push(...next.balanceChanges);
          result.jumpAccountConsolidations.push(...next.jumpAccountConsolidations);
          result.mainchainTransfers.push(...next.mainchainTransfers);
          result.channelHoldsUpdated.push(...next.channelHoldsUpdated);
        }
        if (sync.status === "rejected") {
          log.warn("Error synching account balance changes", {
            error: sync.reason,
            localchain: localchain2.name
          });
        }
      }
      if (result.mainchainTransfers.length || result.balanceChanges.length) {
        log.info("Account sync result", {
          ...await objectUtils.gettersToObject(result)
        });
        await this.emitWallet();
      }
    } catch (error) {
      log.error("Error synching account balance changes", { error });
    }
    this.scheduleNextSync();
  }
  async emitWallet() {
    const wallet = await this.getWallet();
    this.emit("update", { wallet });
  }
}
class ApiClient extends eventUtils.TypedEventEmitter {
  constructor(address, onEvent) {
    super();
    __publicField(this, "isConnected", false);
    __publicField(this, "address");
    __publicField(this, "transport");
    __publicField(this, "connection");
    this.onEvent = onEvent;
    try {
      const url = utils.toUrl(address);
      url.hostname.replace("localhost", "127.0.0.1");
      this.address = url.href;
    } catch (error) {
      console.error("Invalid API URL", error, { address });
      throw error;
    }
    this.transport = new net.WsTransportToCore(this.address);
    this.connection = new net.ConnectionToCore(this.transport);
    this.connection.on("event", this.onMessage.bind(this));
    this.connection.on("disconnected", this.onDisconnected.bind(this));
  }
  async connect() {
    await this.connection.connect(false, 15e3);
    this.isConnected = true;
  }
  async disconnect() {
    this.isConnected = false;
    await this.connection.disconnect();
  }
  async send(command, ...args) {
    return await this.connection.sendRequest({ command, args });
  }
  onDisconnected() {
    this.emit("close");
  }
  onMessage(message) {
    if (typeof message === "string" && message === "exit") {
      this.onEvent("App.quit");
      return;
    }
    const apiEvent = message.event;
    this.onEvent(apiEvent.eventType, apiEvent.data);
  }
}
const ArgonFile = {
  async create(json, file) {
    if (await fileUtils.existsAsync(file)) await Fs__namespace.promises.rm(file);
    await Fs__namespace.promises.writeFile(file, json);
  },
  async readFromPath(path) {
    const data = await fileUtils.readFileAsJson(path).catch(() => null);
    if (data) {
      const result = IArgonFile.ArgonFileSchema.safeParse(data);
      if (result.success === false) {
        throw ValidationError__default.default.fromZodValidation(
          `The Argon file you've just opened has invalid parameters.`,
          result.error
        );
      }
      return result.data;
    }
    return null;
  }
};
const deploymentsFile = Path__namespace.join(UlixeeConfig__default.default.global.directoryPath, "datastore-deployments.jsonl");
class DeploymentWatcher extends eventUtils.TypedEventEmitter {
  constructor() {
    super();
    __publicField(this, "deployments", []);
    __publicField(this, "deploymentFileWatch");
    void this.checkFile();
  }
  start() {
    if (!Fs__namespace.existsSync(deploymentsFile)) {
      if (!Fs__namespace.existsSync(UlixeeConfig__default.default.global.directoryPath)) {
        Fs__namespace.mkdirSync(UlixeeConfig__default.default.global.directoryPath, { recursive: true });
      }
      Fs__namespace.writeFileSync(deploymentsFile, "");
    }
    if (process.platform === "win32" || process.platform === "darwin") {
      this.deploymentFileWatch = Fs__namespace.watch(deploymentsFile, { persistent: false }, () => {
        void this.checkFile();
      });
    } else {
      Fs__namespace.watchFile(deploymentsFile, { persistent: false }, (curr, prev) => {
        if (curr.mtimeMs > prev.mtimeMs) {
          void this.checkFile();
        }
      });
    }
  }
  stop() {
    var _a2;
    if (this.deploymentFileWatch) (_a2 = this.deploymentFileWatch) == null ? void 0 : _a2.close();
    else Fs__namespace.unwatchFile(deploymentsFile);
  }
  async checkFile() {
    try {
      const data = await Fs__namespace.promises.readFile(deploymentsFile, "utf8");
      const allRecords = data.split(/\r?\n/g).filter(Boolean).map((x) => JSON.parse(x));
      for (const record of allRecords) {
        if (this.deployments.some(
          (x) => x.cloudHost === record.cloudHost && x.version === record.version
        )) {
          continue;
        }
        this.deployments.push(record);
        this.emit("new", record);
      }
    } catch {
    }
  }
}
const Error$1 = sassEmbedded.types.Error;
const argIconPath = Path__namespace.resolve(electron.app.getAppPath(), "resources", "arg.png");
class PrivateDesktopApiHandler extends eventUtils.TypedEventEmitter {
  constructor(apiManager) {
    super();
    __publicField(this, "Apis", {
      "Argon.importSend": this.importArgons.bind(this),
      "Argon.acceptRequest": this.acceptArgonRequest.bind(this),
      "Argon.send": this.createArgonsToSendFile.bind(this),
      "Argon.request": this.createArgonsToRequestFile.bind(this),
      "Argon.dropFile": this.onArgonFileDrop.bind(this),
      "Argon.showFileContextMenu": this.showContextMenu.bind(this),
      "Argon.transferFromMainchain": this.transferArgonsFromMainchain.bind(this),
      "Argon.transferToMainchain": this.transferArgonsToMainchain.bind(this),
      "Credit.create": this.createCredit.bind(this),
      "Credit.save": this.saveCredit.bind(this),
      "Cloud.findAdminIdentity": this.findCloudAdminIdentity.bind(this),
      "Datastore.setAdminIdentity": this.setDatastoreAdminIdentity.bind(this),
      "Datastore.findAdminIdentity": this.findAdminIdentity.bind(this),
      "Datastore.getInstalled": this.getInstalledDatastores.bind(this),
      "Datastore.query": this.queryDatastore.bind(this),
      "Datastore.deploy": this.deployDatastore.bind(this),
      "Datastore.install": this.installDatastore.bind(this),
      "Datastore.uninstall": this.uninstallDatastore.bind(this),
      "Desktop.getAdminIdentities": this.getAdminIdentities.bind(this),
      "Desktop.getCloudConnections": this.getCloudConnections.bind(this),
      "Desktop.connectToPrivateCloud": this.connectToPrivateCloud.bind(this),
      "GettingStarted.getCompletedSteps": this.gettingStartedProgress.bind(this),
      "GettingStarted.completeStep": this.completeGettingStartedStep.bind(this),
      "Session.openReplay": this.openReplay.bind(this),
      "User.getQueries": this.getQueries.bind(this),
      "User.getWallet": this.getWallet.bind(this),
      "User.createAccount": this.createAccount.bind(this),
      "User.addBrokerAccount": this.addBrokerAccount.bind(this)
    });
    __publicField(this, "Events");
    __publicField(this, "connectionToClient");
    __publicField(this, "waitForConnection", new Resolvable__default.default());
    __publicField(this, "events", new EventSubscriber__default.default());
    this.apiManager = apiManager;
    this.events.on(apiManager, "new-cloud-address", this.onNewCloudAddress.bind(this));
    this.events.on(apiManager, "deployment", this.onDeployment.bind(this));
    this.events.on(apiManager, "query", this.onQuery.bind(this));
    this.events.on(apiManager, "wallet-updated", this.onWalletUpdated.bind(this));
  }
  onConnection(ws, req) {
    if (this.connectionToClient) {
      void this.connectionToClient.disconnect();
    }
    this.waitForConnection.resolve();
    const transport = new net.WsTransportToClient(ws, req);
    this.connectionToClient = new net.ConnectionToClient(transport, this.Apis);
    const promise = this.waitForConnection;
    this.events.once(this.connectionToClient, "disconnected", () => {
      if (this.waitForConnection === promise) this.waitForConnection = new Resolvable__default.default();
    });
  }
  async close() {
    var _a2;
    try {
      await ((_a2 = this.connectionToClient) == null ? void 0 : _a2.disconnect());
    } catch {
    }
    this.events.close();
  }
  async getWallet() {
    return this.apiManager.getWallet();
  }
  async completeGettingStartedStep(step) {
    if (!this.apiManager.localUserProfile.gettingStartedCompletedSteps.includes(step)) {
      this.apiManager.localUserProfile.gettingStartedCompletedSteps.push(step);
      await this.apiManager.localUserProfile.save();
    }
  }
  gettingStartedProgress() {
    return this.apiManager.localUserProfile.gettingStartedCompletedSteps ?? [];
  }
  async onArgonFileDrop(path) {
    const argonFile = await ArgonFile.readFromPath(path);
    if (!argonFile) {
      throw new Error$1("Sorry, we couldn't read the Argon file you've just dropped.");
    }
    await this.onArgonFileOpened(argonFile);
  }
  async addBrokerAccount(request) {
    var _a2;
    if ((_a2 = request.pemPath) == null ? void 0 : _a2.startsWith("~")) {
      request.pemPath = Path__namespace.join(Os__namespace.homedir(), request.pemPath.slice(1));
    }
    const account = await this.apiManager.accountManager.addBrokerAccount(request);
    await this.apiManager.setDatabroker(request);
    return account;
  }
  async createAccount(request) {
    return await this.apiManager.accountManager.createAccount(
      request.name,
      request.suri,
      request.password
    );
  }
  async createArgonsToSendFile(request) {
    return this.apiManager.accountManager.createArgonsToSendFile(request);
  }
  async transferArgonsFromMainchain(request) {
    await this.apiManager.accountManager.transferMainchainToLocal(
      request.address,
      request.milligons
    );
  }
  async transferArgonsToMainchain(request) {
    return this.apiManager.accountManager.transferLocalToMainchain(
      request.address,
      request.milligons
    );
  }
  async createArgonsToRequestFile(request) {
    return this.apiManager.accountManager.createArgonsToRequestFile(request);
  }
  async acceptArgonRequest(request) {
    const argonFile = IArgonFile.ArgonFileSchema.parse(request.argonFile);
    if (argonFile.credit) {
      await this.saveCredit({ credit: argonFile.credit });
      return;
    }
    return this.apiManager.accountManager.acceptArgonRequest(argonFile, request.fundWithAddress);
  }
  async importArgons(claim) {
    const argonFile = IArgonFile.ArgonFileSchema.parse(claim.argonFile);
    if (argonFile.credit) {
      await this.saveCredit({ credit: argonFile.credit });
      return;
    }
    return this.apiManager.accountManager.importArgons(argonFile);
  }
  getInstalledDatastores() {
    return this.apiManager.localUserProfile.installedDatastores;
  }
  getQueries() {
    return Object.values(this.apiManager.queryLogWatcher.queriesById);
  }
  queryDatastore(args) {
    const { id, version: version2, query, cloudHost } = args;
    const client = this.apiManager.getDatastoreClient(cloudHost);
    const queryId = nanoid.nanoid(12);
    const date = /* @__PURE__ */ new Date();
    const paymentService = this.apiManager.databrokerPaymentService ?? this.apiManager.paymentService;
    void client.query(id, version2, query, { queryId, paymentService });
    return Promise.resolve({
      date,
      query,
      input: [],
      id,
      version: version2,
      queryId
    });
  }
  async deployDatastore(args) {
    const { id, version: version2, cloudName, cloudHost } = args;
    const adminIdentity = this.apiManager.localUserProfile.getAdminIdentity(id, cloudName);
    if (!cloudHost) throw new Error$1("No cloud host available.");
    const apiClient = new DatastoreApiClient__default.default(cloudHost);
    if (version2.includes(DatastoreManifest__default.default.TemporaryIdPrefix)) {
      throw new Error$1("This Datastore has only been started. You need to deploy it.");
    }
    const {
      compressedDbx,
      adminSignature,
      adminIdentity: identityResult
    } = await apiClient.download(id, version2, adminIdentity);
    await apiClient.upload(compressedDbx, {
      forwardedSignature: { adminIdentity: identityResult, adminSignature }
    });
  }
  async installDatastore(arg) {
    const { cloudHost, id, version: version2 } = arg;
    await this.apiManager.localUserProfile.installDatastore(cloudHost, id, version2);
  }
  async uninstallDatastore(arg) {
    const { cloudHost, id, version: version2 } = arg;
    await this.apiManager.localUserProfile.uninstallDatastore(cloudHost, id, version2);
  }
  async setDatastoreAdminIdentity(datastoreId, adminIdentityPath) {
    return await this.apiManager.localUserProfile.setDatastoreAdminIdentity(
      datastoreId,
      adminIdentityPath
    );
  }
  async saveCredit(arg) {
    if (!arg.credit) return;
    const credit = await CreditReserver__default.default.storeCreditFromUrl(
      arg.credit.datastoreUrl,
      arg.credit.microgons,
      await this.apiManager.accountManager.getDatastoreHostLookup()
    );
    if (!this.apiManager.paymentService) throw new Error$1("No payment service available.");
    this.apiManager.paymentService.addCredit(credit);
  }
  async createCredit(args) {
    var _a2;
    const { argons, datastore } = args;
    const address = new URL(this.apiManager.getCloudAddressByName(args.cloud) ?? "");
    const adminIdentity = this.apiManager.localUserProfile.getAdminIdentity(
      datastore.id,
      args.cloud
    );
    if (!adminIdentity) {
      throw new Error$1("Sorry, we couldn't find the AdminIdentity for this cloud.");
    }
    const microgons = argons * Number(ArgonUtils__default.default.MicrogonsPerArgon);
    const client = new DatastoreApiClient__default.default(address.href);
    try {
      const { id, remainingCredits, secret } = await client.createCredits(
        datastore.id,
        datastore.version,
        microgons,
        adminIdentity
      );
      const file = {
        version: localchain.ARGON_FILE_VERSION,
        credit: {
          datastoreUrl: `ulx://${id}:${secret}@${address.host}/${datastore.id}@v${datastore.version}`,
          microgons: remainingCredits
        }
      };
      return {
        rawJson: JSON.stringify(file),
        file,
        name: `₳${argons} at ${((_a2 = datastore.name ?? datastore.scriptEntrypoint) == null ? void 0 : _a2.replace(/[.\\/]/g, "-")) ?? "a Ulixee Datastore"}.${IArgonFile.ARGON_FILE_EXTENSION}`
      };
    } finally {
      await client.disconnect();
    }
  }
  async dragArgonsAsFile(args, context) {
    const file = Path__namespace.join(Os__namespace.tmpdir(), ".ulixee", args.name);
    await ArgonFile.create(args.rawJson, file);
    context.startDrag({
      file,
      icon: argIconPath
    });
  }
  async showContextMenu(args) {
    const file = Path__namespace.join(Os__namespace.tmpdir(), ".ulixee", args.name);
    await ArgonFile.create(args.rawJson, file);
    const menu = electron.Menu.buildFromTemplate([
      {
        label: "Copy",
        accelerator: "CmdOrCtrl+C",
        click() {
          try {
            const clipboardEx = require("electron-clipboard-ex");
            clipboardEx.writeFilePaths([file]);
          } catch (e) {
          }
        }
      },
      {
        type: "separator"
      },
      {
        role: "shareMenu",
        sharingItem: {
          filePaths: [file]
        }
      }
    ]);
    menu.popup({ x: args.position.x, y: args.position.y });
  }
  async onArgonFileOpened(file) {
    var _a2;
    await this.waitForConnection;
    (_a2 = this.connectionToClient) == null ? void 0 : _a2.sendEvent({ eventType: "Argon.opened", data: file });
  }
  async findAdminIdentity(datastoreId) {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openFile", "showHiddenFiles"],
      message: "Select your Admin Identity for this Datastore to enable administrative features.",
      defaultPath: Path__namespace.join(dirUtils.getDataDirectory(), "ulixee", "identities"),
      filters: [{ name: "Identities", extensions: ["pem"] }]
    });
    if (result.filePaths.length) {
      const [filename] = result.filePaths;
      return await this.setDatastoreAdminIdentity(datastoreId, filename);
    }
    return null;
  }
  async findCloudAdminIdentity(cloudName) {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openFile", "showHiddenFiles"],
      message: "Select your Admin Identity for this Cloud to enable administrative features.",
      defaultPath: Path__namespace.join(dirUtils.getDataDirectory(), "ulixee", "identities"),
      filters: [{ name: "Identities", extensions: ["pem"] }]
    });
    if (result.filePaths.length) {
      const [filename] = result.filePaths;
      return await this.apiManager.localUserProfile.setCloudAdminIdentity(cloudName, filename);
    }
    return null;
  }
  getAdminIdentities() {
    const datastoresById = {};
    for (const { datastoreId, adminIdentity } of this.apiManager.localUserProfile.datastoreAdminIdentities) {
      if (adminIdentity) datastoresById[datastoreId] = adminIdentity;
    }
    const cloudsByName = {};
    for (const cloud2 of this.apiManager.apiByCloudAddress.values()) {
      if (cloud2.adminIdentity) {
        cloudsByName[cloud2.name] = cloud2.adminIdentity;
      }
    }
    return { datastoresById, cloudsByName };
  }
  async onDeployment(event) {
    var _a2;
    (_a2 = this.connectionToClient) == null ? void 0 : _a2.sendEvent({ eventType: "Datastore.onDeployed", data: event });
  }
  async onQuery(event) {
    var _a2;
    (_a2 = this.connectionToClient) == null ? void 0 : _a2.sendEvent({ eventType: "User.onQuery", data: event });
  }
  async onNewCloudAddress(event) {
    var _a2;
    (_a2 = this.connectionToClient) == null ? void 0 : _a2.sendEvent({ eventType: "Cloud.onConnected", data: event });
  }
  async onWalletUpdated(event) {
    var _a2;
    (_a2 = this.connectionToClient) == null ? void 0 : _a2.sendEvent({ eventType: "Wallet.updated", data: event });
  }
  openReplay(arg) {
    this.emit("open-replay", arg);
  }
  getCloudConnections() {
    var _a2;
    const result = [];
    for (const [address, group] of this.apiManager.apiByCloudAddress) {
      if (group.resolvable.isResolved && !((_a2 = group.resolvable.resolved) == null ? void 0 : _a2.api)) continue;
      result.push({
        address,
        cloudNodes: group.cloudNodes,
        adminIdentity: group.adminIdentity,
        name: group.name,
        type: group.type
      });
    }
    return result;
  }
  async connectToPrivateCloud(arg) {
    const { address, name, adminIdentityPath } = arg;
    if (!address) {
      console.warn("No valid address provided to connect to", arg);
      return;
    }
    const adminIdentity = adminIdentityPath ? Identity__default.default.loadFromFile(adminIdentityPath).bech32 : void 0;
    await this.apiManager.connectToCloud({
      address,
      type: "private",
      name,
      adminIdentity
    });
    const profile = this.apiManager.localUserProfile;
    if (!profile.clouds.find((x) => x.address === address)) {
      profile.clouds.push({ address, name, adminIdentityPath });
      await profile.save();
    }
  }
}
const bundledDatastoreExample = Path__namespace.resolve(electron.app.getAppPath(), "resources", "ulixee-docs.dbx.tgz");
class ApiManager extends eventUtils.TypedEventEmitter {
  constructor() {
    super();
    __publicField(this, "apiByCloudAddress", /* @__PURE__ */ new Map());
    __publicField(this, "localCloud");
    __publicField(this, "exited", false);
    __publicField(this, "events", new EventSubscriber__default.default());
    __publicField(this, "localCloudAddress");
    __publicField(this, "debuggerUrl");
    __publicField(this, "localUserProfile");
    __publicField(this, "deploymentWatcher");
    __publicField(this, "paymentService");
    __publicField(this, "databrokerPaymentService");
    __publicField(this, "accountManager");
    __publicField(this, "queryLogWatcher");
    __publicField(this, "privateDesktopApiHandler");
    __publicField(this, "privateDesktopWsServer");
    __publicField(this, "privateDesktopWsServerAddress");
    __publicField(this, "datastoreApiClients", new DatastoreApiClients__default.default());
    __publicField(this, "reconnectsByAddress", {});
    this.localUserProfile = new LocalUserProfile__default.default();
    this.deploymentWatcher = new DeploymentWatcher();
    this.queryLogWatcher = new QueryLog__default.default();
    this.privateDesktopApiHandler = new PrivateDesktopApiHandler(this);
    this.accountManager = new AccountManager(this.localUserProfile);
  }
  async start() {
    this.debuggerUrl = await this.getDebuggerUrl();
    this.privateDesktopWsServer = new WebSocket__default.default.Server({ port: 0 });
    this.events.on(
      this.privateDesktopWsServer,
      "connection",
      this.handlePrivateApiWsConnection.bind(this)
    );
    this.privateDesktopWsServerAddress = await new Promise((resolve) => {
      this.privateDesktopWsServer.once("listening", () => {
        const address = this.privateDesktopWsServer.address();
        resolve(`ws://127.0.0.1:${address.port}`);
      });
    });
    await this.accountManager.start();
    this.events.on(
      this.accountManager,
      "update",
      (ev) => this.emit("wallet-updated", { wallet: ev.wallet })
    );
    if (!this.localUserProfile.defaultAdminIdentityPath) {
      await this.localUserProfile.createDefaultAdminIdentity();
    }
    this.deploymentWatcher.start();
    this.queryLogWatcher.monitor((x) => this.emit("query", x));
    if (this.localUserProfile.databrokers.length) {
      await this.setDatabroker(this.localUserProfile.databrokers[0]);
    }
    if (this.accountManager.localchains.length) {
      const localchain2 = this.accountManager.localchainForQuery;
      if (localchain2) await this.setLocalchainForPayment(localchain2.name);
    } else {
      this.paymentService = new DefaultPaymentService__default.default();
    }
    await this.startLocalCloud();
    this.events.on(UlixeeHostsConfig__default.default.global, "change", this.onNewLocalCloudAddress.bind(this));
    this.events.on(this.deploymentWatcher, "new", (x) => this.emit("deployment", x));
    for (const cloud2 of this.localUserProfile.clouds) {
      await this.connectToCloud({
        ...cloud2,
        adminIdentity: cloud2.adminIdentity,
        type: "private"
      });
    }
  }
  async setLocalchainForPayment(name) {
    const localchain2 = this.accountManager.localchains.find((x) => x.name === name);
    if (!localchain2) throw new Error(`Localchain ${name} not found`);
    this.paymentService = await DefaultPaymentService__default.default.fromOpenLocalchain(
      localchain2,
      {
        queries: 10,
        type: "multiplier"
      },
      this.datastoreApiClients
    );
  }
  async setDatabroker(broker) {
    this.databrokerPaymentService = await DefaultPaymentService__default.default.fromBroker(
      broker.host,
      {
        pemPath: broker.pemPath,
        passphrase: broker.pemPassword
      },
      {
        queries: 10,
        type: "multiplier"
      },
      this.datastoreApiClients
    );
  }
  async getWallet() {
    if (!this.paymentService) throw new Error("Payment service isn't initialized");
    const localchainWallet = await this.accountManager.getWallet();
    const credits = await this.paymentService.credits();
    const creditBalance = credits.reduce((sum, x) => sum + x.remaining, 0);
    const creditMilligons = ArgonUtils__default.default.microgonsToMilligons(creditBalance);
    const localchainBalance = localchainWallet.accounts.reduce(
      (sum, x) => sum + x.balance + x.mainchainBalance,
      0n
    );
    const brokerBalance = localchainWallet.brokerAccounts.reduce((sum, x) => sum + x.balance, 0n);
    const formattedBalance = ArgonUtils__default.default.format(
      localchainBalance + creditMilligons + brokerBalance,
      "milligons",
      "argons"
    );
    return {
      ...localchainWallet,
      credits,
      formattedBalance
    };
  }
  async close() {
    var _a2, _b2, _c;
    if (this.exited) return;
    this.exited = true;
    await ((_b2 = (_a2 = this.localCloud) == null ? void 0 : _a2.desktopCore) == null ? void 0 : _b2.shutdown());
    await this.stopLocalCloud();
    (_c = this.privateDesktopWsServer) == null ? void 0 : _c.close();
    await this.privateDesktopApiHandler.close();
    this.events.close("error");
    for (const connection of this.apiByCloudAddress.values()) {
      await this.closeApiGroup(connection.resolvable);
    }
    await this.datastoreApiClients.close();
    this.apiByCloudAddress.clear();
    this.deploymentWatcher.stop();
    await this.queryLogWatcher.close();
  }
  async stopLocalCloud() {
    var _a2;
    await ((_a2 = this.localCloud) == null ? void 0 : _a2.close());
  }
  async startLocalCloud() {
    let localCloudAddress = UlixeeHostsConfig__default.default.global.getVersionHost(version);
    localCloudAddress = await UlixeeHostsConfig__default.default.global.checkLocalVersionHost(
      version,
      localCloudAddress
    );
    let adminIdentity;
    if (!localCloudAddress) {
      adminIdentity = this.localUserProfile.defaultAdminIdentity.bech32;
      this.localCloud ?? (this.localCloud = new cloud.CloudNode({
        shouldShutdownOnSignals: false,
        host: "localhost",
        datastoreConfiguration: {
          cloudAdminIdentities: [adminIdentity]
        }
      }));
      await this.localCloud.datastoreCore.copyDbxToStartDir(bundledDatastoreExample);
      this.localCloud.datastoreCore.argonPaymentProcessor = new ArgonPaymentProcessor__default.default(
        this.localCloud.datastoreCore.datastoresDir,
        this.accountManager.localchainForCloudNode
      );
      await this.localCloud.listen();
      localCloudAddress = await this.localCloud.address;
    }
    await this.connectToCloud({ address: localCloudAddress, type: "local", adminIdentity });
  }
  getDatastoreClient(cloudHost) {
    var _a2;
    const hostUrl = utils.toUrl(cloudHost);
    (_a2 = this.datastoreApiClients)[cloudHost] ?? (_a2[cloudHost] = new DatastoreApiClient__default.default(hostUrl.origin));
    return this.datastoreApiClients[cloudHost];
  }
  getCloudAddressByName(name) {
    for (const [address, entry] of this.apiByCloudAddress) {
      if (entry.name === name) return address;
    }
  }
  async connectToCloud(cloud2) {
    var _a2, _b2;
    const { adminIdentity, oldAddress, type } = cloud2;
    let { address, name } = cloud2;
    if (!address) return;
    name ?? (name = type);
    address = this.formatCloudAddress(address);
    if (this.apiByCloudAddress.has(address)) {
      await ((_a2 = this.apiByCloudAddress.get(address)) == null ? void 0 : _a2.resolvable.promise);
      return;
    }
    try {
      this.apiByCloudAddress.set(address, {
        name: name ?? type,
        adminIdentity,
        type,
        cloudNodes: 0,
        resolvable: new Resolvable__default.default()
      });
      const api = new ApiClient(
        `${address}?type=app`,
        this.onDesktopEvent.bind(this, address)
      );
      await api.connect();
      const onApiClosed = this.events.once(api, "close", this.onApiClosed.bind(this, cloud2));
      const mainScreen = electron.screen.getPrimaryDisplay();
      const workarea = mainScreen.workArea;
      const { id, cloudNodes } = await api.send("App.connect", {
        workarea: {
          left: workarea.x,
          top: workarea.y,
          ...workarea,
          scale: mainScreen.scaleFactor
        }
      });
      const cloudApi = this.apiByCloudAddress.get(address);
      if (!cloudApi) throw new Error("Cloud Api wasn't found");
      if (!this.debuggerUrl) throw new Error("Debugger URL not initialized");
      cloudApi.cloudNodes = cloudNodes ?? 0;
      const url = new URL(`/desktop-devtools`, api.transport.host);
      url.searchParams.set("id", id);
      const [wsToCore, wsToDevtoolsProtocol] = await Promise.all([
        this.connectToWebSocket(url.href, { perMessageDeflate: true }),
        this.connectToWebSocket(this.debuggerUrl)
      ]);
      clearInterval(this.reconnectsByAddress[address]);
      const events2 = [
        this.events.on(wsToCore, "message", (msg) => {
          wsToDevtoolsProtocol.send(msg.toString());
        }),
        this.events.on(wsToCore, "error", this.onDevtoolsError.bind(this, wsToCore)),
        this.events.once(wsToCore, "close", this.onApiClosed.bind(this, cloud2)),
        this.events.on(wsToDevtoolsProtocol, "message", (msg) => wsToCore.send(msg.toString())),
        this.events.on(
          wsToDevtoolsProtocol,
          "error",
          this.onDevtoolsError.bind(this, wsToDevtoolsProtocol)
        ),
        this.events.once(wsToDevtoolsProtocol, "close", this.onApiClosed.bind(this, cloud2))
      ];
      this.events.group(`ws-${address}`, onApiClosed, ...events2);
      cloudApi.resolvable.resolve({
        id,
        api,
        wsToCore,
        wsToDevtoolsProtocol
      });
      this.emit("new-cloud-address", {
        address,
        adminIdentity,
        name,
        cloudNodes,
        type,
        oldAddress
      });
    } catch (error) {
      (_b2 = this.apiByCloudAddress.get(address)) == null ? void 0 : _b2.resolvable.reject(error, true);
      this.apiByCloudAddress.delete(address);
    }
  }
  async onArgonFileOpened(file) {
    const argonFile = await ArgonFile.readFromPath(file);
    if (argonFile) {
      this.emit("argon-file-opened", argonFile);
    }
  }
  onDesktopEvent(cloudAddress, eventType, data) {
    if (this.exited) return;
    if (eventType === "Session.opened") {
      this.emit("api-event", { cloudAddress, eventType, data });
    }
    if (eventType === "App.quit") {
      const apis = this.apiByCloudAddress.get(cloudAddress);
      if (apis) {
        void this.closeApiGroup(apis.resolvable);
      }
    }
  }
  onDevtoolsError(ws, error) {
    console.warn("ERROR in devtools websocket with Core at %s", ws.url, error);
  }
  async onNewLocalCloudAddress() {
    var _a2;
    const newAddress = UlixeeHostsConfig__default.default.global.getVersionHost(version);
    if (!newAddress) return;
    if (this.localCloudAddress !== newAddress) {
      const oldAddress = this.localCloudAddress;
      this.localCloudAddress = this.formatCloudAddress(newAddress);
      console.log("Desktop app connecting to local cloud", this.localCloudAddress);
      await this.connectToCloud({
        address: this.localCloudAddress,
        adminIdentity: (_a2 = this.localUserProfile.defaultAdminIdentity) == null ? void 0 : _a2.bech32,
        name: "local",
        type: "local",
        oldAddress
      });
    }
  }
  onApiClosed(cloud2) {
    const { address, name } = cloud2;
    console.warn("Api Disconnected", address, name);
    const api = this.apiByCloudAddress.get(address);
    this.events.endGroup(`ws-${address}`);
    if (api) {
      void this.closeApiGroup(api.resolvable);
    }
    this.apiByCloudAddress.delete(address);
    if (!this.exited) {
      this.reconnectsByAddress[cloud2.address] = setTimeout(
        this.reconnect.bind(this, cloud2, 1e3),
        1e3
      ).unref();
    }
  }
  reconnect(cloud2, delay) {
    if (this.exited) return;
    console.warn("Reconnecting to Api", { address: cloud2.address, name: cloud2.name });
    void this.connectToCloud(cloud2).catch(() => {
      this.reconnectsByAddress[cloud2.address] = setTimeout(
        this.reconnect.bind(this, cloud2, delay * 2),
        Math.min(5 * 6e4, delay * 2)
      ).unref();
    });
  }
  async closeApiGroup(group) {
    const { api, wsToCore, wsToDevtoolsProtocol } = await group;
    if (api.isConnected) await api.disconnect();
    wsToCore == null ? void 0 : wsToCore.close();
    return wsToDevtoolsProtocol == null ? void 0 : wsToDevtoolsProtocol.close();
  }
  async connectToWebSocket(host, options) {
    const ws = new WebSocket__default.default(host, options);
    await new Promise((resolve, reject) => {
      const closeEvents = [
        this.events.once(ws, "close", reject),
        this.events.once(ws, "error", reject)
      ];
      this.events.once(ws, "open", () => {
        this.events.off(...closeEvents);
        resolve();
      });
    });
    return ws;
  }
  handlePrivateApiWsConnection(ws, req) {
    this.privateDesktopApiHandler.onConnection(ws, req);
  }
  async getDebuggerUrl() {
    const responseBody = await new Promise((resolve, reject) => {
      const request = http__namespace.get(
        `http://127.0.0.1:${process.env.DEVTOOLS_PORT}/json/version`,
        async (res) => {
          let jsonString = "";
          res.setEncoding("utf8");
          for await (const chunk of res) jsonString += chunk;
          resolve(jsonString);
        }
      );
      request.once("error", reject);
      request.end();
    });
    const debugEndpoints = JSON.parse(responseBody);
    return debugEndpoints.webSocketDebuggerUrl;
  }
  formatCloudAddress(host) {
    const url = utils.toUrl(host);
    url.pathname = "/desktop";
    return url.href;
  }
}
let hasUnpackedChrome = false;
async function installDefaultChrome() {
  if (hasUnpackedChrome) return;
  try {
    let LatestChrome = require(`@ulixee/${defaultBrowserEmulator.defaultBrowserEngine.id}`);
    if (LatestChrome.default) LatestChrome = LatestChrome.default;
    const chromeApp = new LatestChrome();
    if (chromeApp.isInstalled) {
      hasUnpackedChrome = true;
      return;
    }
    await chromeApp.install();
    hasUnpackedChrome = true;
  } catch (err) {
    console.error("ERROR trying to install latest browser", err);
  }
}
function isDev() {
  return !electron.app.isPackaged;
}
async function loadUrl(webContents, path) {
  if (isDev() && process.env["VITE_DEV_SERVER_URL"]) {
    await webContents.loadURL(`${process.env["VITE_DEV_SERVER_URL"]}/ui/${path}`);
  } else {
    await webContents.loadFile(Path__namespace.default.join(electron.app.getAppPath(), `ui/${path}`));
  }
}
const trayPositioner = {
  alignTrayMenu(trayWindow, trayBounds) {
    if (process.platform === "linux") {
      trayBounds = { width: 0, height: 0, ...electron.screen.getCursorScreenPoint() };
    }
    const windowBounds = trayWindow.getBounds();
    const display = electron.screen.getDisplayNearestPoint(trayBounds);
    let x;
    let y;
    if (display.workArea.y > display.bounds.y) {
      x = calculateXAlign(display, windowBounds, trayBounds);
      y = display.workArea.y;
    } else if (display.workArea.x > display.bounds.x) {
      x = display.workArea.x;
      y = calculateYAlign(display, windowBounds, trayBounds);
    } else if (display.workArea.width === display.bounds.width) {
      x = calculateXAlign(display, windowBounds, trayBounds);
      y = display.workArea.height - windowBounds.height;
      if (trayBounds.y < display.workArea.y + display.workArea.height) {
        y = trayBounds.y - windowBounds.height;
      }
    } else {
      x = display.workArea.width - windowBounds.width;
      y = calculateYAlign(display, windowBounds, trayBounds);
    }
    y = Math.round(y);
    x = Math.round(x);
    trayWindow.setPosition(x, y);
  }
};
function calculateXAlign(display, windowBounds, trayBounds) {
  let x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);
  if (x + windowBounds.width > display.bounds.width + display.bounds.x) {
    x = trayBounds.x + trayBounds.width - windowBounds.width;
  } else if (x < display.bounds.x) {
    x = trayBounds.x;
  }
  return x;
}
function calculateYAlign(display, windowBounds, trayBounds) {
  let y = trayBounds.y;
  if (y + windowBounds.height > display.bounds.height) {
    y = trayBounds.y + trayBounds.height - windowBounds.height;
  }
  return y;
}
function generateContextMenu(params, webContents) {
  let menuItems = [];
  if (params.linkURL !== "") {
    menuItems = menuItems.concat([
      {
        label: "Copy link address",
        click: () => {
          electron.clipboard.clear();
          electron.clipboard.writeText(params.linkURL);
        }
      },
      {
        type: "separator"
      }
    ]);
  }
  if (params.hasImageContents) {
    menuItems = menuItems.concat([
      {
        label: "Copy image",
        click: () => {
          const img = electron.nativeImage.createFromDataURL(params.srcURL);
          electron.clipboard.clear();
          electron.clipboard.writeImage(img);
        }
      },
      {
        label: "Copy image address",
        click: () => {
          electron.clipboard.clear();
          electron.clipboard.writeText(params.srcURL);
        }
      },
      {
        type: "separator"
      }
    ]);
  }
  if (params.isEditable) {
    menuItems = menuItems.concat([
      {
        role: "undo",
        accelerator: "CmdOrCtrl+Z"
      },
      {
        role: "redo",
        accelerator: "CmdOrCtrl+Shift+Z"
      },
      {
        type: "separator"
      },
      {
        role: "cut",
        accelerator: "CmdOrCtrl+X"
      },
      {
        role: "copy",
        accelerator: "CmdOrCtrl+C"
      },
      {
        role: "pasteAndMatchStyle",
        accelerator: "CmdOrCtrl+V",
        label: "Paste"
      },
      {
        role: "paste",
        accelerator: "CmdOrCtrl+Shift+V",
        label: "Paste as plain text"
      },
      {
        role: "selectAll",
        accelerator: "CmdOrCtrl+A"
      },
      {
        type: "separator"
      }
    ]);
  }
  if (!params.isEditable && params.selectionText !== "") {
    menuItems = menuItems.concat([
      {
        role: "copy",
        accelerator: "CmdOrCtrl+C"
      },
      {
        type: "separator"
      }
    ]);
  }
  menuItems.push({
    label: "Inspect",
    accelerator: "CmdOrCtrl+Shift+I",
    click: () => {
      var _a2;
      webContents.inspectElement(params.x, params.y);
      if (!webContents.isDevToolsFocused()) (_a2 = webContents.devToolsWebContents) == null ? void 0 : _a2.focus();
    }
  });
  return electron.Menu.buildFromTemplate(menuItems);
}
class View {
  constructor(window, webPreferences = {}) {
    __publicField(this, "isHidden", false);
    __publicField(this, "bounds");
    __publicField(this, "browserView");
    __publicField(this, "isAttached", false);
    __publicField(this, "window");
    this.window = window;
    this.browserView = new electron.BrowserView({
      webPreferences: {
        sandbox: false,
        ...webPreferences
      }
    });
  }
  get webContents() {
    var _a2;
    return (_a2 = this.browserView) == null ? void 0 : _a2.webContents;
  }
  addContextMenu() {
    const { webContents } = this;
    if (!webContents) return;
    webContents.on("context-menu", (e, params) => {
      generateContextMenu(params, webContents).popup();
    });
  }
  attach() {
    if (!this.isAttached) {
      if (this.browserView) this.window.addBrowserView(this.browserView);
      this.isAttached = true;
    }
  }
  bringToFront() {
    this.attach();
    if (this.browserView) this.window.setTopBrowserView(this.browserView);
  }
  detach() {
    if (this.browserView) this.window.removeBrowserView(this.browserView);
    this.isAttached = false;
  }
  destroy() {
    this.detach();
    this.browserView = void 0;
  }
  hide() {
    const { x, y } = this.bounds ?? { x: 0, y: 0 };
    this.setBounds({ x, y, width: 0, height: 0 });
  }
  async getContentsHeight() {
    if (!this.webContents) return 0;
    return await this.webContents.executeJavaScript(
      `document.querySelector('body > #app').offsetHeight`
    );
  }
  setBounds(newBounds) {
    var _a2;
    if (this.bounds && this.bounds.x === newBounds.x && this.bounds.y === newBounds.y && this.bounds.width === newBounds.width && this.bounds.height === newBounds.height) {
      return;
    }
    (_a2 = this.browserView) == null ? void 0 : _a2.setBounds(newBounds);
    this.bounds = newBounds;
    this.isHidden = newBounds.width === 0 && newBounds.height === 0;
  }
  static async getTargetInfo(wc) {
    wc.debugger.attach();
    const { targetInfo } = await wc.debugger.sendCommand("Target.getTargetInfo");
    wc.debugger.detach();
    return targetInfo;
  }
}
const extensionPath = Path__namespace.resolve(__dirname, "../ui").replace("app.asar", "app.asar.unpacked");
const _ChromeAliveWindow = class _ChromeAliveWindow {
  constructor(session, cloudAddress) {
    __publicField(this, "window");
    __publicField(this, "api");
    __publicField(this, "enableDevtoolsOnDevtools", process.env.DEVTOOLS ?? false);
    __privateAdd(this, _childWindowsByName, /* @__PURE__ */ new Map());
    __privateAdd(this, _toolbarView);
    __privateAdd(this, _toolbarHeight, 44);
    __privateAdd(this, _activeTabIdx, 0);
    __privateAdd(this, _replayTabs, []);
    __privateAdd(this, _mainView);
    __privateAdd(this, _showingPopupName);
    __privateAdd(this, _hasShown, false);
    __privateAdd(this, _addTabQueue, new Queue__default.default("TAB CREATOR", 1));
    __privateAdd(this, _eventSubscriber, new EventSubscriber__default.default());
    this.session = session;
    utils.bindFunctions(this);
    this.createApi(cloudAddress);
    const currentWindow = electron.BrowserWindow.getFocusedWindow() ?? electron.BrowserWindow.getAllWindows()[0];
    const windowBounds = currentWindow.getBounds();
    const display = electron.screen.getDisplayNearestPoint({ x: windowBounds.x, y: windowBounds.y });
    const workarea = display.bounds;
    this.window = new electron.BrowserWindow({
      show: false,
      acceptFirstMouse: true,
      titleBarStyle: "hiddenInset",
      icon: Path__namespace.resolve(electron.app.getAppPath(), "resources", "icon.png"),
      width: workarea.width,
      height: workarea.height,
      y: workarea.y,
      x: workarea.x
    });
    this.window.title = `${this.session.heroSessionId}`;
    __privateGet(this, _eventSubscriber).on(this.window, "resize", this.relayout);
    __privateGet(this, _eventSubscriber).on(this.window, "maximize", this.relayout);
    __privateGet(this, _eventSubscriber).on(this.window, "restore", this.relayout);
    __privateGet(this, _eventSubscriber).on(this.window, "unmaximize", this.relayout);
    __privateGet(this, _eventSubscriber).on(this.window, "close", this.onClose);
    __privateGet(this, _eventSubscriber).on(this.window, "blur", () => {
      const finderMenu = __privateGet(this, _childWindowsByName).get("MenuFinder");
      if (finderMenu) {
        finderMenu.setAlwaysOnTop(false);
        finderMenu.moveAbove(this.window.getMediaSourceId());
      }
    });
    __privateGet(this, _eventSubscriber).on(this.window, "focus", () => {
      var _a2;
      (_a2 = __privateGet(this, _childWindowsByName).get("MenuFinder")) == null ? void 0 : _a2.setAlwaysOnTop(true);
    });
    __privateSet(this, _mainView, new View(this.window, {
      preload: `${__dirname}/preload/chromealive.js`
    }));
    __privateGet(this, _mainView).attach();
    __privateGet(this, _mainView).hide();
    __privateGet(this, _eventSubscriber).on(__privateGet(this, _mainView).webContents, "focus", this.closeOpenPopup);
    __privateSet(this, _toolbarView, new View(this.window, {
      preload: `${__dirname}/preload/chromealive.js`
    }));
    __privateGet(this, _toolbarView).attach();
    __privateGet(this, _toolbarView).webContents.setWindowOpenHandler((details) => {
      const isMenu = details.frameName.includes("Menu");
      const canMoveAndResize = !isMenu || details.frameName.startsWith("MenuFinder");
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          resizable: canMoveAndResize,
          frame: !isMenu,
          roundedCorners: true,
          movable: canMoveAndResize,
          closable: true,
          transparent: isMenu,
          titleBarStyle: "default",
          alwaysOnTop: details.frameName.startsWith("MenuFinder"),
          hasShadow: !isMenu,
          details,
          acceptFirstMouse: true,
          useContentSize: true,
          webPreferences: {
            preload: `${__dirname}/preload/menubar.js`
          }
        }
      };
    });
    const toolbarWc = __privateGet(this, _toolbarView).webContents;
    __privateGet(this, _eventSubscriber).on(toolbarWc, "did-create-window", (childWindow, details) => {
      childWindow.moveAbove(this.window.getMediaSourceId());
      this.trackChildWindow(childWindow, details);
    });
    if (process.env.DEVTOOLS) {
      toolbarWc.openDevTools({ mode: "detach" });
    }
    __privateGet(this, _eventSubscriber).on(toolbarWc, "ipc-message", (e, eventName, ...args) => {
      var _a2;
      if (eventName === "App:changeHeight") {
        __privateSet(this, _toolbarHeight, args[0]);
        void this.relayout();
      } else if (eventName === "App:showChildWindow") {
        const frameName = args[0];
        const window = __privateGet(this, _childWindowsByName).get(frameName);
        window == null ? void 0 : window.show();
        window == null ? void 0 : window.focusOnWebView();
      } else if (eventName === "App:hideChildWindow") {
        (_a2 = __privateGet(this, _childWindowsByName).get(args[0])) == null ? void 0 : _a2.close();
      }
    });
  }
  get activeReplayTab() {
    return __privateGet(this, _replayTabs)[__privateGet(this, _activeTabIdx)];
  }
  replayControl(direction) {
    var _a2;
    void ((_a2 = this.api) == null ? void 0 : _a2.send("Session.timetravel", {
      step: direction
    }));
  }
  async load() {
    var _a2, _b2;
    await ((_a2 = this.api) == null ? void 0 : _a2.connect());
    await this.addReplayTab();
    await this.relayout();
    if (!((_b2 = __privateGet(this, _toolbarView)) == null ? void 0 : _b2.webContents)) return;
    await loadUrl(__privateGet(this, _toolbarView).webContents, "toolbar.html");
    await __privateGet(this, _toolbarView).webContents.executeJavaScript(`
        const elem = document.querySelector('body > #app');
        const resizeObserver = new ResizeObserver(() => {
          document.dispatchEvent(
            new CustomEvent('App:changeHeight', {
              detail: {
                height:elem.getBoundingClientRect().height,
              },
            }),
          );
        });
        resizeObserver.observe(elem);
      `);
    if (__privateGet(this, _toolbarView).browserView) await this.injectCloudAddress(__privateGet(this, _toolbarView).browserView);
  }
  async onClose() {
    var _a2, _b2, _c, _d, _e, _f;
    for (const win of __privateGet(this, _childWindowsByName).values()) {
      if ((_a2 = win.webContents) == null ? void 0 : _a2.isDevToolsOpened()) win.webContents.closeDevTools();
      win.close();
    }
    if ((_b2 = __privateGet(this, _toolbarView).webContents) == null ? void 0 : _b2.isDevToolsOpened()) {
      __privateGet(this, _toolbarView).webContents.closeDevTools();
    }
    (_c = __privateGet(this, _toolbarView).webContents) == null ? void 0 : _c.close();
    for (const tab of __privateGet(this, _replayTabs)) {
      (_d = tab.view.webContents) == null ? void 0 : _d.close();
    }
    __privateGet(this, _childWindowsByName).clear();
    __privateGet(this, _eventSubscriber).close();
    await ((_e = this.api) == null ? void 0 : _e.send("Session.close"));
    await ((_f = this.api) == null ? void 0 : _f.disconnect());
  }
  async reconnect(address) {
    var _a2, _b2;
    if ((_a2 = this.api) == null ? void 0 : _a2.address.includes(address)) return;
    if ((_b2 = this.api) == null ? void 0 : _b2.isConnected) {
      await this.api.disconnect();
    }
    this.createApi(address);
    if (!this.api) return;
    await this.api.connect();
    for (const tab of __privateGet(this, _replayTabs)) {
      const webContents = tab.view.webContents;
      await this.api.send("Session.replayTargetCreated", {
        browserContextId: tab.browserContextId,
        targetId: tab.targetId,
        chromeTabId: tab.chromeTabId,
        heroTabId: tab.heroTabId,
        isReconnect: true
      });
      const devtoolsWc = webContents == null ? void 0 : webContents.devToolsWebContents;
      if (devtoolsWc) {
        const { targetId, browserContextId } = await View.getTargetInfo(devtoolsWc);
        await this.api.send("Session.devtoolsTargetOpened", {
          isReconnect: true,
          targetId,
          browserContextId
        });
      }
    }
    if (__privateGet(this, _toolbarView).browserView && __privateGet(this, _mainView).browserView) {
      await Promise.all([
        this.injectCloudAddress(__privateGet(this, _toolbarView).browserView),
        this.injectCloudAddress(__privateGet(this, _mainView).browserView)
      ]);
    }
  }
  // NOTE: 1 is the default hero tab id for an incognito context. DOES NOT WORK in default context
  async addReplayTab(heroTabId = 1) {
    await __privateGet(this, _addTabQueue).run(async () => {
      var _a2, _b2;
      if (__privateGet(this, _replayTabs).some((x) => x.heroTabId === heroTabId)) return;
      const view = new View(this.window);
      (_a2 = view.browserView) == null ? void 0 : _a2.setAutoResize({ width: true, height: true });
      view.attach();
      if (!view.webContents) throw new Error("No web contents on view");
      await view.webContents.session.loadExtension(extensionPath, {
        allowFileAccess: false
      });
      view.webContents.on("focus", () => {
        var _a3;
        if (!((_a3 = __privateGet(this, _showingPopupName)) == null ? void 0 : _a3.startsWith("MenuFinder"))) this.closeOpenPopup();
      });
      if (this.enableDevtoolsOnDevtools) await this.addDevtoolsOnDevtools(view);
      __privateGet(this, _eventSubscriber).on(view.webContents, "devtools-opened", async () => {
        var _a3, _b3, _c, _d;
        const address = (_a3 = this.api) == null ? void 0 : _a3.address;
        if (address) {
          await ((_b3 = view.webContents) == null ? void 0 : _b3.executeJavaScript(`window.cloudAddress = '${address}'`));
        }
        const devtoolsWc = (_c = view.webContents) == null ? void 0 : _c.devToolsWebContents;
        if (!devtoolsWc) {
          console.warn("No web contents on showing devtools");
          return;
        }
        await devtoolsWc.executeJavaScript(
          `(async () => {
            while (typeof UI === 'undefined') {
            console.log('waiting')
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            const tabbedPane = UI.panels.elements.parentWidgetInternal.parentWidgetInternal;
            tabbedPane.closeTabs(['timeline', 'heap_profiler','heap-profiler', 'lighthouse', 'chrome_recorder', 'chrome-recorder', 'security', 'memory', 'resources', 'network', 'sources']);

            for (let i =0; i < 50; i+=1) {
               const tab = tabbedPane.tabs.find(x => x.titleInternal === 'Hero Script');
               if (tab) {
                 tabbedPane.insertBefore(tab, 0);
                 tabbedPane.selectTab(tab.id);
                 break;
               }
               await new Promise(resolve => setTimeout(resolve, i * 10));
               await new Promise(requestAnimationFrame);
            }
          })()`
        );
        const target = await View.getTargetInfo(devtoolsWc);
        await ((_d = this.api) == null ? void 0 : _d.send("Session.devtoolsTargetOpened", target));
      });
      view.webContents.on("context-menu", (ev, params) => {
        if (!view.webContents) return;
        const menu = generateContextMenu(params, view.webContents);
        menu.append(
          new electron.MenuItem({
            label: "Generate Selector",
            click: () => {
              var _a3, _b3;
              (_a3 = view.webContents) == null ? void 0 : _a3.inspectElement(params.x, params.y);
              void ((_b3 = this.api) == null ? void 0 : _b3.send("Session.openMode", {
                mode: "Finder",
                position: { x: params.x, y: params.y },
                trigger: "contextMenu"
              }));
            }
          })
        );
        menu.popup();
      });
      await view.webContents.loadURL("about:blank");
      view.webContents.openDevTools({ mode: "bottom" });
      const { targetId, browserContextId } = await View.getTargetInfo(view.webContents);
      const chromeTabId = view.webContents.id;
      __privateGet(this, _replayTabs).push({ view, targetId, heroTabId, browserContextId, chromeTabId });
      await ((_b2 = this.api) == null ? void 0 : _b2.send("Session.replayTargetCreated", {
        targetId,
        browserContextId,
        heroTabId,
        chromeTabId
      }));
    });
  }
  createApi(baseHost) {
    const address = new URL(`/chromealive/${this.session.heroSessionId}`, baseHost);
    if (!this.session.dbPath.includes(HeroCore__default.default.dataDir)) {
      address.searchParams.set("path", this.session.dbPath);
    }
    this.api = new ApiClient(address.href, this.onChromeAliveEvent);
    console.log("Window connected to %s", this.api.address);
    __privateGet(this, _eventSubscriber).once(this.api, "close", this.onApiClose);
  }
  async injectCloudAddress(view) {
    var _a2, _b2;
    const address = (_a2 = this.api) == null ? void 0 : _a2.address;
    if (!address) return;
    await ((_b2 = view.webContents) == null ? void 0 : _b2.executeJavaScript(
      `(() => {
        window.cloudAddress = '${address}';
        if ('setCloudAddress' in window) window.setCloudAddress(window.cloudAddress);
      })()`
    ));
  }
  onApiClose() {
    if (!this.api) return;
    __privateGet(this, _eventSubscriber).off({ emitter: this.api, eventName: "close", handler: this.onApiClose });
    this.api = void 0;
  }
  async addDevtoolsOnDevtools(view) {
    var _a2;
    const devtoolsOnDevtoolsWindow = new electron.BrowserWindow({
      show: false
    });
    await devtoolsOnDevtoolsWindow.webContents.session.loadExtension(extensionPath, {
      allowFileAccess: true
    });
    devtoolsOnDevtoolsWindow.show();
    (_a2 = view.webContents) == null ? void 0 : _a2.setDevToolsWebContents(devtoolsOnDevtoolsWindow.webContents);
    devtoolsOnDevtoolsWindow.webContents.openDevTools({ mode: "undocked" });
  }
  async activateView(mode) {
    var _a2;
    let needsLayout = false;
    if (mode === "Live" || mode === "Timetravel" || mode === "Finder") {
      if (this.activeReplayTab) {
        needsLayout = this.activeReplayTab.view.isHidden;
        this.activeReplayTab.view.isHidden = false;
        this.activeReplayTab.view.bringToFront();
      }
      __privateGet(this, _mainView).hide();
    } else {
      needsLayout = __privateGet(this, _mainView).isHidden;
      (_a2 = this.activeReplayTab) == null ? void 0 : _a2.view.hide();
      __privateGet(this, _mainView).bringToFront();
      __privateGet(this, _mainView).isHidden = false;
      const page = _ChromeAliveWindow.pages[mode];
      if (page) {
        const webContents = __privateGet(this, _mainView).webContents;
        if (webContents && !webContents.getURL().includes(page)) {
          await loadUrl(webContents, page);
          if (__privateGet(this, _mainView).browserView) await this.injectCloudAddress(__privateGet(this, _mainView).browserView);
          if (mode === "Output") {
            webContents.openDevTools({ mode: "bottom" });
            __privateGet(this, _eventSubscriber).on(webContents, "devtools-opened", () => {
              var _a3;
              const devtoolsWc = (_a3 = __privateGet(this, _mainView).webContents) == null ? void 0 : _a3.devToolsWebContents;
              void (devtoolsWc == null ? void 0 : devtoolsWc.executeJavaScript(
                `(async () => {
                  while (!UI.panels.elements.parentWidgetInternal) await new Promise(requestAnimationFrame);
         UI.panels.elements.parentWidgetInternal.parentWidgetInternal.closeTabs(['timeline', 'heap_profiler', 'chrome_recorder', 'lighthouse', 'security', 'resources', 'network', 'sources', 'elements']);
      })()`
              ).catch(() => null));
            });
          }
        }
      }
    }
    if (needsLayout) await this.relayout();
  }
  async relayout() {
    var _a2, _b2;
    const { width, height } = this.window.getContentBounds();
    __privateGet(this, _toolbarView).setBounds({ height: __privateGet(this, _toolbarHeight), x: 0, y: 0, width });
    const heightoffset = __privateGet(this, _toolbarHeight);
    const remainingBounds = {
      x: 0,
      y: heightoffset + 1,
      width,
      height: height - heightoffset
    };
    if (!__privateGet(this, _mainView).isHidden) __privateGet(this, _mainView).setBounds(remainingBounds);
    if (!((_b2 = (_a2 = this.activeReplayTab) == null ? void 0 : _a2.view) == null ? void 0 : _b2.isHidden)) this.activeReplayTab.view.setBounds(remainingBounds);
  }
  closeOpenPopup() {
    var _a2;
    try {
      if (__privateGet(this, _showingPopupName)) {
        (_a2 = __privateGet(this, _childWindowsByName).get(__privateGet(this, _showingPopupName))) == null ? void 0 : _a2.close();
        __privateGet(this, _childWindowsByName).delete(__privateGet(this, _showingPopupName));
      }
    } catch {
    }
    __privateSet(this, _showingPopupName, void 0);
  }
  onChromeAliveEvent(eventType, data2) {
    var _a2, _b2, _c;
    if (eventType === "Session.updated") {
      const session = data2;
      let scriptEntrypoint = session.scriptEntrypoint;
      const divider = scriptEntrypoint.includes("/") ? "/" : "\\";
      scriptEntrypoint = scriptEntrypoint.split(divider).slice(-2).join(divider);
      const title = `${scriptEntrypoint} (${moment__default.default(session.startTime).format(
        "MMM D [at] h:mm a"
      )})`;
      if (this.window.title !== title) {
        this.window.setTitle(title);
        void ((_a2 = __privateGet(this, _toolbarView).webContents) == null ? void 0 : _a2.executeJavaScript(`document.title="${title}"`));
      }
    }
    if (eventType === "Session.loaded" && !__privateGet(this, _hasShown)) {
      this.window.show();
      __privateSet(this, _hasShown, true);
    }
    if (eventType === "DevtoolsBackdoor.toggleInspectElementMode") {
      (_b2 = this.activeReplayTab.view.webContents) == null ? void 0 : _b2.focus();
    }
    if (eventType === "Session.tabCreated") {
      const createdTab = data2;
      void this.addReplayTab(createdTab.tabId);
    }
    if (eventType === "Session.appMode") {
      const mode = data2.mode;
      const isFinderPopup = ((_c = __privateGet(this, _showingPopupName)) == null ? void 0 : _c.startsWith("MenuFinder")) && mode === "Finder";
      if (!isFinderPopup) this.closeOpenPopup();
      void this.activateView(mode);
    }
  }
  trackChildWindow(childWindow, details) {
    const { frameName } = details;
    if (__privateGet(this, _childWindowsByName).has(frameName)) {
      throw new Error(`Child window with the same frameName already exists: ${frameName}`);
    }
    __privateGet(this, _childWindowsByName).set(frameName, childWindow);
    const onIpcMessage = __privateGet(this, _eventSubscriber).on(
      childWindow.webContents,
      "ipc-message",
      (e, eventName, ...args) => {
        if (eventName === "chromealive:api") {
          const [command, apiArgs] = args;
          if (command === "File:navigate") {
            const { filepath } = apiArgs;
            electron.shell.showItemInFolder(filepath);
          }
        } else if (eventName === "App:changeHeight") {
          childWindow.setBounds({
            height: Math.round(args[0])
          });
        }
      }
    );
    const onshow = __privateGet(this, _eventSubscriber).on(childWindow, "show", () => {
      if (__privateGet(this, _showingPopupName) === frameName) return;
      this.closeOpenPopup();
      __privateSet(this, _showingPopupName, frameName);
    });
    let hasHandled = false;
    childWindow.once("close", async (e) => {
      __privateGet(this, _eventSubscriber).off(onshow, onIpcMessage);
      if (__privateGet(this, _showingPopupName) === frameName) __privateSet(this, _showingPopupName, void 0);
      const popup = __privateGet(this, _childWindowsByName).get(frameName);
      __privateGet(this, _childWindowsByName).delete(frameName);
      if (!hasHandled && popup) {
        hasHandled = true;
        e.preventDefault();
        await (popup == null ? void 0 : popup.webContents.executeJavaScript(
          'window.dispatchEvent(new CustomEvent("manual-close"))'
        ));
        try {
          popup == null ? void 0 : popup.close();
        } catch {
        }
      }
    });
  }
};
_childWindowsByName = new WeakMap();
_toolbarView = new WeakMap();
_toolbarHeight = new WeakMap();
_activeTabIdx = new WeakMap();
_replayTabs = new WeakMap();
_mainView = new WeakMap();
_showingPopupName = new WeakMap();
_hasShown = new WeakMap();
_addTabQueue = new WeakMap();
_eventSubscriber = new WeakMap();
__publicField(_ChromeAliveWindow, "pages", {
  Input: "/screen-input.html",
  Output: "/screen-output.html",
  Reliability: "/screen-reliability.html"
});
let ChromeAliveWindow = _ChromeAliveWindow;
class WindowStateKeeper {
  constructor(windowName) {
    __publicField(this, "windowState", {
      x: 0,
      y: 0,
      width: 1400,
      height: 800,
      isMaximized: false
    });
    __publicField(this, "configPath");
    __publicField(this, "events", new EventSubscriber__default.default());
    this.windowName = windowName;
    this.configPath = Path__namespace.join(electron.app.getPath("userData"), `${windowName}.json`);
    if (Fs__namespace.existsSync(this.configPath)) {
      try {
        this.windowState = JSON.parse(Fs__namespace.readFileSync(this.configPath, "utf8"));
      } catch {
      }
    }
  }
  track(window) {
    this.events.on(window, "resize", this.save.bind(this, window));
    this.events.on(window, "move", this.save.bind(this, window));
    this.events.once(window, "close", this.save.bind(this, window));
    this.events.once(window, "close", () => this.events.close());
  }
  save(window) {
    if (!this.windowState.isMaximized) {
      this.windowState = window.getBounds();
    }
    this.windowState.isMaximized = window.isMaximized();
    Fs__namespace.writeFileSync(this.configPath, JSON.stringify(this.windowState));
  }
}
class DesktopWindow extends eventUtils.TypedEventEmitter {
  constructor(apiManager) {
    super();
    __privateAdd(this, _window);
    __privateAdd(this, _events, new EventSubscriber__default.default());
    __privateAdd(this, _windowStateKeeper, new WindowStateKeeper("DesktopWindow"));
    this.apiManager = apiManager;
    void this.open(false);
  }
  get isOpen() {
    var _a2;
    return ((_a2 = __privateGet(this, _window)) == null ? void 0 : _a2.isVisible()) ?? false;
  }
  get isFocused() {
    var _a2;
    return ((_a2 = __privateGet(this, _window)) == null ? void 0 : _a2.isFocused()) ?? false;
  }
  get webContents() {
    var _a2;
    return (_a2 = __privateGet(this, _window)) == null ? void 0 : _a2.webContents;
  }
  focus() {
    var _a2;
    (_a2 = __privateGet(this, _window)) == null ? void 0 : _a2.moveTop();
  }
  async open(show = true) {
    if (__privateGet(this, _window)) {
      if (show) {
        __privateGet(this, _window).setAlwaysOnTop(true);
        __privateGet(this, _window).show();
        __privateGet(this, _window).setAlwaysOnTop(false);
      }
      return;
    }
    __privateSet(this, _window, new electron.BrowserWindow({
      show: false,
      acceptFirstMouse: true,
      useContentSize: true,
      titleBarStyle: "hiddenInset",
      ...__privateGet(this, _windowStateKeeper).windowState,
      webPreferences: {
        preload: `${__dirname}/preload/desktop.js`
      },
      icon: Path__namespace.resolve(electron.app.getAppPath(), "resources", "icon.png")
    }));
    __privateGet(this, _windowStateKeeper).track(__privateGet(this, _window));
    __privateGet(this, _window).setTitle("Ulixee Desktop");
    __privateGet(this, _window).webContents.ipc.handle("desktop:api", async (e, { api, args }) => {
      if (api === "Argon.dragAsFile") {
        return await this.apiManager.privateDesktopApiHandler.dragArgonsAsFile(args, e.sender);
      }
    });
    __privateGet(this, _window).webContents.ipc.on("getPrivateApiHost", (e) => {
      e.returnValue = this.apiManager.privateDesktopWsServerAddress;
    });
    __privateGet(this, _window).webContents.setWindowOpenHandler((details) => {
      void electron.shell.openExternal(details.url);
      return { action: "deny" };
    });
    __privateGet(this, _events).on(__privateGet(this, _window).webContents, "context-menu", (e, params) => {
      var _a2;
      if ((_a2 = __privateGet(this, _window)) == null ? void 0 : _a2.webContents) generateContextMenu(params, __privateGet(this, _window).webContents).popup();
    });
    __privateGet(this, _events).on(__privateGet(this, _window), "focus", this.emit.bind(this, "focus"));
    __privateGet(this, _events).on(__privateGet(this, _window), "close", this.close.bind(this));
    await loadUrl(__privateGet(this, _window).webContents, "desktop.html");
    if (show) {
      __privateGet(this, _window).show();
      __privateGet(this, _window).moveTop();
    }
  }
  close(e, force = false) {
    var _a2;
    if (force) {
      __privateGet(this, _events).close();
      __privateSet(this, _window, void 0);
    } else {
      (_a2 = __privateGet(this, _window)) == null ? void 0 : _a2.hide();
      e.preventDefault();
    }
    this.emit("close");
  }
}
_window = new WeakMap();
_events = new WeakMap();
_windowStateKeeper = new WeakMap();
const isMac = process.platform === "darwin";
function generateAppMenu(loadedChromeAlive) {
  const template = [
    ...isMac ? [
      {
        label: electron.app.name,
        submenu: [
          { role: "about" },
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideothers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" }
        ]
      }
    ] : [],
    {
      label: "File",
      submenu: [
        {
          type: "separator"
        },
        ...createMenuItem(
          ["CmdOrCtrl+Shift+O"],
          () => {
            electron.ipcMain.emit("open-file");
          },
          "Open Hero Session"
        ),
        {
          type: "separator"
        },
        isMac ? { role: "close" } : { role: "quit" },
        {
          type: "separator"
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...isMac ? [
          { role: "pasteAndMatchStyle" },
          { role: "delete" },
          { role: "selectAll" },
          { type: "separator" },
          {
            label: "Speech",
            submenu: [{ role: "startspeaking" }, { role: "stopspeaking" }]
          }
        ] : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]
      ]
    },
    {
      label: "View",
      submenu: [
        !loadedChromeAlive ? { role: "reload" } : void 0,
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ].filter(Boolean)
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...isMac ? [{ type: "separator" }, { role: "front" }, { type: "separator" }, { role: "window" }] : [{ role: "close" }],
        { type: "separator" },
        {
          label: "Always on top",
          type: "checkbox",
          checked: false,
          click(menuItem, browserWindow) {
            browserWindow.setAlwaysOnTop(!browserWindow.isAlwaysOnTop());
            menuItem.checked = browserWindow.isAlwaysOnTop();
          }
        }
      ]
    }
  ];
  if (loadedChromeAlive) {
    template.splice(template.length - 1, 0, {
      label: "Replay",
      submenu: [
        {
          label: "Open Database",
          click: () => {
            void electron.shell.openPath(loadedChromeAlive.session.dbPath);
          }
        },
        ...createMenuItem(["Left"], () => {
          loadedChromeAlive.replayControl("back");
        }),
        ...createMenuItem(["Right"], () => {
          loadedChromeAlive.replayControl("forward");
        })
      ]
    });
  }
  return electron.Menu.buildFromTemplate(template);
}
function createMenuItem(shortcuts, action, label = "", enabled = true) {
  return shortcuts.map((shortcut, key) => ({
    accelerator: shortcut,
    visible: !!label && key === 0,
    label: !!label && key === 0 ? label : "",
    enabled,
    click: (menuItem, browserWindow, _) => action(browserWindow, menuItem, key)
  }));
}
class WindowManager {
  constructor(menuBar, apiManager) {
    __publicField(this, "chromeAliveWindows", []);
    __publicField(this, "activeChromeAliveWindowIdx", 0);
    __publicField(this, "desktopWindow");
    __publicField(this, "events", new EventSubscriber__default.default());
    __privateAdd(this, _chromeAliveWindowsBySessionId, /* @__PURE__ */ new Map());
    this.menuBar = menuBar;
    this.apiManager = apiManager;
    this.events.on(apiManager, "new-cloud-address", this.onNewCloudAddress.bind(this));
    this.events.on(apiManager, "api-event", this.onApiEvent.bind(this));
    this.events.on(apiManager, "argon-file-opened", this.onArgonFileOpened.bind(this));
    this.bindIpcEvents();
    this.desktopWindow = new DesktopWindow(apiManager);
    this.events.on(this.desktopWindow, "close", this.checkOpenWindows.bind(this));
    this.events.on(this.desktopWindow, "focus", this.setMenu.bind(this));
    this.events.on(
      apiManager.privateDesktopApiHandler,
      "open-replay",
      this.loadChromeAliveWindow.bind(this)
    );
  }
  get activeChromeAliveWindow() {
    return this.chromeAliveWindows[this.activeChromeAliveWindowIdx];
  }
  async openDesktop() {
    var _a2;
    await ((_a2 = electron.app.dock) == null ? void 0 : _a2.show());
    this.setMenu();
    await this.desktopWindow.open();
  }
  close() {
    this.events.close();
  }
  async loadChromeAliveWindow(data) {
    var _a2, _b2;
    if (__privateGet(this, _chromeAliveWindowsBySessionId).has(data.heroSessionId)) {
      (_a2 = __privateGet(this, _chromeAliveWindowsBySessionId).get(data.heroSessionId)) == null ? void 0 : _a2.window.focus();
      return;
    }
    await ((_b2 = electron.app.dock) == null ? void 0 : _b2.show());
    const chromeAliveWindow = new ChromeAliveWindow(data, data.cloudAddress);
    const { heroSessionId } = data;
    this.chromeAliveWindows.push(chromeAliveWindow);
    __privateGet(this, _chromeAliveWindowsBySessionId).set(heroSessionId, chromeAliveWindow);
    await chromeAliveWindow.load().catch((err) => console.error("Error Loading ChromeAlive window", err));
    const focusEvent = this.events.on(
      chromeAliveWindow.window,
      "focus",
      this.focusWindow.bind(this, heroSessionId)
    );
    this.events.once(
      chromeAliveWindow.window,
      "close",
      this.closeWindow.bind(this, heroSessionId, focusEvent)
    );
    this.setMenu();
  }
  async pickHeroSession() {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openFile", "showHiddenFiles"],
      defaultPath: Path__namespace.join(Os__namespace.tmpdir(), ".ulixee", "hero-sessions"),
      filters: [
        // { name: 'All Files', extensions: ['js', 'ts', 'db'] },
        { name: "Session Database", extensions: ["db"] }
        // { name: 'Javascript', extensions: ['js'] },
        // { name: 'Typescript', extensions: ['ts'] },
      ]
    });
    if (result.filePaths.length) {
      const [filename] = result.filePaths;
      if (filename.endsWith(".db")) {
        return this.loadChromeAliveWindow({
          cloudAddress: this.apiManager.localCloudAddress,
          dbPath: filename,
          heroSessionId: Path__namespace.basename(filename).replace(".db", "")
        });
      }
    }
  }
  async onArgonFileOpened(file) {
    await this.openDesktop();
    await this.apiManager.privateDesktopApiHandler.onArgonFileOpened(file);
  }
  setMenu() {
    if (this.desktopWindow.isFocused) {
      electron.Menu.setApplicationMenu(generateAppMenu(null));
    } else {
      electron.Menu.setApplicationMenu(generateAppMenu(this.activeChromeAliveWindow));
    }
  }
  onApiEvent(event) {
    if (event.eventType === "Session.opened") {
      void this.loadChromeAliveWindow({
        ...event.data,
        cloudAddress: event.cloudAddress
      });
    }
  }
  async onNewCloudAddress(event) {
    var _a2;
    const { oldAddress, address } = event;
    if (!oldAddress) return;
    for (const window of this.chromeAliveWindows) {
      if ((_a2 = window.api) == null ? void 0 : _a2.address.startsWith(oldAddress)) {
        await window.reconnect(address);
      }
    }
  }
  bindIpcEvents() {
    electron.ipcMain.on("open-file", this.pickHeroSession.bind(this));
  }
  closeWindow(heroSessionId, ...eventsToUnregister) {
    const chromeAliveWindow = __privateGet(this, _chromeAliveWindowsBySessionId).get(heroSessionId);
    if (!chromeAliveWindow) return;
    __privateGet(this, _chromeAliveWindowsBySessionId).delete(heroSessionId);
    this.events.off(...eventsToUnregister);
    const idx = this.chromeAliveWindows.indexOf(chromeAliveWindow);
    if (idx === this.activeChromeAliveWindowIdx) {
      this.activeChromeAliveWindowIdx = 0;
    }
    this.chromeAliveWindows.splice(idx, 1);
    this.checkOpenWindows();
    this.setMenu();
  }
  checkOpenWindows() {
    var _a2;
    if (this.chromeAliveWindows.length === 0 && !this.desktopWindow.isOpen) {
      (_a2 = electron.app.dock) == null ? void 0 : _a2.hide();
    }
  }
  focusWindow(heroSessionId) {
    const chromeAliveWindow = __privateGet(this, _chromeAliveWindowsBySessionId).get(heroSessionId);
    if (chromeAliveWindow)
      this.activeChromeAliveWindowIdx = this.chromeAliveWindows.indexOf(chromeAliveWindow);
    this.setMenu();
  }
}
_chromeAliveWindowsBySessionId = new WeakMap();
const iconPath = Path__namespace.resolve(electron.app.getAppPath(), "resources", "IconTemplate.png");
class Menubar extends events.EventEmitter {
  constructor(options) {
    super();
    __privateAdd(this, _tray);
    __privateAdd(this, _menuWindow);
    __privateAdd(this, _blurTimeout);
    // track blur events with timeout
    __privateAdd(this, _windowManager);
    __privateAdd(this, _isClosing, false);
    __privateAdd(this, _updateInfoPromise);
    __privateAdd(this, _installUpdateOnExit, false);
    __privateAdd(this, _downloadProgress, 0);
    __privateAdd(this, _apiManager);
    __privateAdd(this, _argonFileOpen);
    __privateAdd(this, _options);
    __privateAdd(this, _trayMouseover);
    __privateSet(this, _options, options);
    if (!electron.app.requestSingleInstanceLock()) {
      electron.app.quit();
      return;
    }
    if (process.platform === "darwin") {
      electron.app.setActivationPolicy("accessory");
    }
    electron.app.on("second-instance", this.onSecondInstance.bind(this));
    electron.app.on("open-file", this.onFileOpened.bind(this));
    electron.app.setAppLogsPath();
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;
    void this.appReady();
  }
  get tray() {
    if (!__privateGet(this, _tray))
      throw new Error("Please access `this.tray` after the `ready` event has fired.");
    return __privateGet(this, _tray);
  }
  bindSignals() {
    let didRun = false;
    const exit = () => {
      if (didRun) return Promise.resolve();
      didRun = true;
      return this.appExit();
    };
    process.once("beforeExit", exit);
    process.once("exit", exit);
    process.once("SIGTERM", exit);
    process.once("SIGINT", exit);
    process.once("SIGQUIT", exit);
  }
  hideMenu() {
    var _a2, _b2;
    if (__privateGet(this, _blurTimeout)) {
      clearTimeout(__privateGet(this, _blurTimeout));
      __privateSet(this, _blurTimeout, void 0);
    }
    try {
      if (!((_a2 = __privateGet(this, _menuWindow)) == null ? void 0 : _a2.isDestroyed())) {
        (_b2 = __privateGet(this, _menuWindow)) == null ? void 0 : _b2.hide();
      }
    } catch (error) {
      if (!String(error).includes("Object has been destroyed")) throw error;
    }
  }
  onSecondInstance(_, argv) {
    const argonFile = argv.find((x) => x.endsWith(`.${IArgonFile.ARGON_FILE_EXTENSION}`));
    if (argonFile) {
      this.handleArgonFile(argonFile);
    }
  }
  handleArgonFile(path) {
    if (!path.endsWith(`.${IArgonFile.ARGON_FILE_EXTENSION}`)) return;
    if (__privateGet(this, _apiManager)) {
      void __privateGet(this, _apiManager).onArgonFileOpened(path);
    } else {
      __privateSet(this, _argonFileOpen, path);
    }
  }
  onFileOpened(e, path) {
    if (!path.endsWith(`.${IArgonFile.ARGON_FILE_EXTENSION}`)) return;
    e.preventDefault();
    this.handleArgonFile(path);
  }
  async showMenu(trayPos) {
    if (!__privateGet(this, _tray)) {
      throw new Error("Tray should have been instantiated by now");
    }
    if (!__privateGet(this, _menuWindow)) {
      await this.createWindow();
    }
    if (!__privateGet(this, _menuWindow)) {
      throw new Error("Window has been initialized just above. qed.");
    }
    if (trayPos) trayPositioner.alignTrayMenu(__privateGet(this, _menuWindow), trayPos);
    __privateGet(this, _menuWindow).show();
    __privateGet(this, _menuWindow).focus();
    __privateGet(this, _menuWindow).on("blur", this.checkHideMenu.bind(this));
  }
  async beforeQuit() {
    var _a2, _b2, _c;
    if (__privateGet(this, _isClosing)) return;
    __privateSet(this, _isClosing, true);
    console.warn("Quitting Ulixee Menubar");
    (_a2 = __privateGet(this, _tray)) == null ? void 0 : _a2.removeAllListeners();
    this.hideMenu();
    await ((_b2 = __privateGet(this, _apiManager)) == null ? void 0 : _b2.close());
    (_c = __privateGet(this, _windowManager)) == null ? void 0 : _c.close();
    if (__privateGet(this, _installUpdateOnExit)) {
      await __privateGet(this, _updateInfoPromise);
      await electronUpdater.autoUpdater.quitAndInstall(false, true);
    }
  }
  async appExit() {
    await this.beforeQuit();
    electron.app.exit();
  }
  async appReady() {
    var _a2;
    try {
      await electron.app.whenReady();
      __privateSet(this, _apiManager, new ApiManager());
      __privateSet(this, _windowManager, new WindowManager(this, __privateGet(this, _apiManager)));
      await __privateGet(this, _apiManager).start();
      this.bindSignals();
      if (__privateGet(this, _argonFileOpen)) {
        await __privateGet(this, _apiManager).onArgonFileOpened(__privateGet(this, _argonFileOpen));
        __privateSet(this, _argonFileOpen, void 0);
      }
      await this.updateLocalCloudStatus();
      await this.createWindow();
      __privateSet(this, _tray, new electron.Tray(iconPath));
      electron.app.on("activate", () => {
        var _a3;
        if (!((_a3 = __privateGet(this, _windowManager)) == null ? void 0 : _a3.desktopWindow.isOpen)) {
          __privateGet(this, _windowManager).desktopWindow.focus();
        }
      });
      __privateGet(this, _tray).on("click", this.clicked.bind(this));
      __privateGet(this, _tray).on("mouse-leave", this.leaveTray.bind(this));
      __privateGet(this, _tray).on("mouse-enter", this.enterTray.bind(this));
      __privateGet(this, _tray).on("right-click", this.rightClicked.bind(this));
      __privateGet(this, _tray).on("drop-files", this.onDropFiles.bind(this));
      __privateGet(this, _tray).setToolTip(__privateGet(this, _options).tooltip || "");
      (_a2 = electron.app.dock) == null ? void 0 : _a2.hide();
      this.emit("ready");
      this.initUpdater();
      await installDefaultChrome();
    } catch (error) {
      console.error("ERROR in appReady: ", error);
      await this.appExit();
    }
  }
  checkHideMenu() {
    if (!__privateGet(this, _trayMouseover)) {
      this.hideMenu();
    }
  }
  enterTray() {
    __privateSet(this, _trayMouseover, true);
  }
  leaveTray() {
    var _a2;
    __privateSet(this, _trayMouseover, false);
    if (!((_a2 = __privateGet(this, _menuWindow)) == null ? void 0 : _a2.isFocused())) {
      this.hideMenu();
    }
  }
  initUpdater() {
    try {
      electronUpdater.autoUpdater.logger = null;
      electronUpdater.autoUpdater.autoDownload = true;
      electronUpdater.autoUpdater.autoInstallOnAppQuit = false;
      electronUpdater.autoUpdater.allowDowngrade = true;
      electronUpdater.autoUpdater.allowPrerelease = version.includes("alpha");
      electronUpdater.autoUpdater.on("update-not-available", this.noUpdateAvailable.bind(this));
      electronUpdater.autoUpdater.on("update-available", this.onUpdateAvailable.bind(this));
      electronUpdater.autoUpdater.signals.progress(this.onDownloadProgress.bind(this));
    } catch (error) {
      log__default.default.error("Error initializing AutoUpdater", { error });
    }
  }
  async noUpdateAvailable() {
    log__default.default.verbose("No new Ulixee.app versions available");
    await this.sendToFrontend("Version.onLatest", {});
  }
  async onUpdateAvailable(update) {
    log__default.default.info("New Ulixee.app version available", update);
    __privateSet(this, _updateInfoPromise, Promise.resolve(update));
    await this.sendToFrontend("Version.available", {
      version: update.version
    });
  }
  async onDownloadProgress(progress) {
    log__default.default.verbose("New version download progress", progress);
    __privateSet(this, _downloadProgress, Math.round(progress.percent));
    await this.sendToFrontend("Version.download", {
      progress: __privateGet(this, _downloadProgress)
    });
  }
  async versionCheck() {
    if (await __privateGet(this, _updateInfoPromise)) return;
    if (electronUpdater.autoUpdater.isUpdaterActive()) return;
    try {
      log__default.default.verbose("Checking for version update");
      __privateSet(this, _updateInfoPromise, electronUpdater.autoUpdater.checkForUpdates().then((x) => (x == null ? void 0 : x.updateInfo) ?? null));
      await __privateGet(this, _updateInfoPromise);
    } catch (error) {
      log__default.default.error("ERROR checking for new version", error);
    }
  }
  async versionInstall() {
    log__default.default.verbose("Installing version", {
      progress: __privateGet(this, _downloadProgress),
      update: await __privateGet(this, _updateInfoPromise)
    });
    __privateSet(this, _installUpdateOnExit, true);
    await this.sendToFrontend("Version.installing", {});
    if (__privateGet(this, _downloadProgress) < 100) await electronUpdater.autoUpdater.downloadUpdate();
    electronUpdater.autoUpdater.quitAndInstall(false, true);
  }
  async clicked() {
    var _a2, _b2;
    if ((_a2 = __privateGet(this, _menuWindow)) == null ? void 0 : _a2.isVisible()) {
      this.hideMenu();
    }
    await ((_b2 = __privateGet(this, _windowManager)) == null ? void 0 : _b2.openDesktop());
    await this.checkForUpdates();
  }
  async rightClicked(event, bounds) {
    var _a2;
    if (event && (event.shiftKey || event.ctrlKey || event.metaKey)) {
      return this.hideMenu();
    }
    if (__privateGet(this, _blurTimeout)) {
      clearInterval(__privateGet(this, _blurTimeout));
      __privateSet(this, _blurTimeout, void 0);
    }
    if ((_a2 = __privateGet(this, _menuWindow)) == null ? void 0 : _a2.isVisible()) {
      return this.hideMenu();
    }
    await this.showMenu(bounds);
    await this.checkForUpdates();
  }
  onDropFiles(_, files) {
    for (const file of files) {
      if (file.endsWith(IArgonFile.ARGON_FILE_EXTENSION)) this.handleArgonFile(file);
    }
  }
  async checkForUpdates() {
    try {
      if (!__privateGet(this, _updateInfoPromise)) {
        __privateSet(this, _updateInfoPromise, electronUpdater.autoUpdater.checkForUpdatesAndNotify().then((x) => (x == null ? void 0 : x.updateInfo) ?? null));
        await __privateGet(this, _updateInfoPromise);
      }
    } catch (error) {
      log__default.default.error("ERROR checking for new version", error);
    }
  }
  async createWindow() {
    var _a2;
    const defaults = {
      show: false,
      // Don't show it at first
      frame: false,
      // Remove window frame
      width: __privateGet(this, _options).width,
      height: __privateGet(this, _options).height
    };
    __privateSet(this, _menuWindow, new electron.BrowserWindow({
      ...defaults,
      roundedCorners: true,
      skipTaskbar: true,
      autoHideMenuBar: true,
      transparent: false,
      alwaysOnTop: true,
      useContentSize: true,
      webPreferences: {
        javascript: true,
        preload: `${__dirname}/preload/menubar.js`
      }
    }));
    __privateGet(this, _menuWindow).on("blur", () => {
      if (!__privateGet(this, _menuWindow) || __privateGet(this, _isClosing)) {
        return;
      }
      __privateSet(this, _blurTimeout, setTimeout(() => this.hideMenu(), 100));
    });
    __privateGet(this, _menuWindow).on("focus", () => {
      clearTimeout(__privateGet(this, _blurTimeout));
      __privateSet(this, _blurTimeout, void 0);
    });
    __privateGet(this, _menuWindow).setVisibleOnAllWorkspaces(true);
    __privateGet(this, _menuWindow).on("close", this.windowClear.bind(this));
    __privateGet(this, _menuWindow).webContents.on("ipc-message", async (e, message, ...args) => {
      var _a3, _b2, _c;
      if (message === "desktop:api") {
        const [api] = args;
        if (api === "mousedown") {
          this.hideMenu();
        }
        if (api === "App.quit") {
          await this.appExit();
        }
        if (api === "App.openLogsDirectory") {
          await electron.shell.openPath(Path__namespace.dirname(log__default.default.transports.file.getFile().path));
        }
        if (api === "App.openDataDirectory") {
          if ((_a3 = __privateGet(this, _apiManager)) == null ? void 0 : _a3.localCloud) {
            await electron.shell.openPath(__privateGet(this, _apiManager).localCloud.datastoreCore.options.datastoresDir);
          }
        }
        if (api === "App.openHeroSession") {
          await ((_b2 = __privateGet(this, _windowManager)) == null ? void 0 : _b2.pickHeroSession());
        }
        if (api === "App.openDesktop") {
          await ((_c = __privateGet(this, _windowManager)) == null ? void 0 : _c.openDesktop());
        }
        if (api === "Cloud.stop" || api === "Cloud.restart") {
          await this.stopCloud();
        }
        if (api === "Cloud.start" || api === "Cloud.restart") {
          await this.startCloud();
        }
        if (api === "Cloud.getStatus") {
          await this.updateLocalCloudStatus();
        }
        if (api === "Version.check") {
          await this.versionCheck();
        }
        if (api === "Version.install") {
          await this.versionInstall();
        }
      }
    });
    await loadUrl(__privateGet(this, _menuWindow).webContents, `menubar.html`);
    if (process.env.OPEN_DEVTOOLS) {
      __privateGet(this, _menuWindow).webContents.openDevTools({ mode: "detach" });
    }
    if ((_a2 = __privateGet(this, _apiManager)) == null ? void 0 : _a2.localCloud) {
      await this.updateLocalCloudStatus();
    }
  }
  windowClear() {
    __privateSet(this, _menuWindow, void 0);
  }
  /// //// CLOUD MANAGEMENT ////////////////////////////////////////////////////////////////////////////////////////////
  async stopCloud() {
    var _a2;
    if (!__privateGet(this, _apiManager) || !((_a2 = __privateGet(this, _apiManager)) == null ? void 0 : _a2.localCloud)) return;
    console.log(`CLOSING ULIXEE CLOUD`);
    await __privateGet(this, _apiManager).stopLocalCloud();
    await this.updateLocalCloudStatus();
  }
  async startCloud() {
    if (!__privateGet(this, _apiManager)) return;
    await __privateGet(this, _apiManager).startLocalCloud();
    console.log(`STARTED ULIXEE CLOUD at ${await __privateGet(this, _apiManager).localCloud.address}`);
    await this.updateLocalCloudStatus();
  }
  async updateLocalCloudStatus() {
    if (__privateGet(this, _isClosing) || !__privateGet(this, _apiManager)) return;
    let address;
    if (__privateGet(this, _apiManager).localCloud) {
      address = await __privateGet(this, _apiManager).localCloud.address;
    }
    await this.sendToFrontend("Cloud.status", {
      started: !!__privateGet(this, _apiManager).localCloud,
      address
    });
  }
  async sendToFrontend(eventType, data) {
    if (__privateGet(this, _menuWindow)) {
      const json = { detail: { eventType, data } };
      await __privateGet(this, _menuWindow).webContents.executeJavaScript(`(()=>{
      const evt = ${JSON.stringify(json)};
      document.dispatchEvent(new CustomEvent('desktop:event', evt));
    })()`);
    }
  }
}
_tray = new WeakMap();
_menuWindow = new WeakMap();
_blurTimeout = new WeakMap();
_windowManager = new WeakMap();
_isClosing = new WeakMap();
_updateInfoPromise = new WeakMap();
_installUpdateOnExit = new WeakMap();
_downloadProgress = new WeakMap();
_apiManager = new WeakMap();
_argonFileOpen = new WeakMap();
_options = new WeakMap();
_trayMouseover = new WeakMap();
const version = "2.0.0-alpha.29";
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
(_b = process.env).DEVTOOLS_PORT ?? (_b.DEVTOOLS_PORT = "8315");
envUtils.loadEnv(UlixeeConfig__default.default.global.directoryPath);
electron.app.commandLine.appendSwitch("remote-debugging-port", process.env.DEVTOOLS_PORT);
const menubar = new Menubar({
  width: 300,
  height: 300,
  tooltip: "Ulixee"
});
menubar.on("ready", () => {
  console.log("RUNNING ULIXEE DESKTOP", version);
});
const root = __dirname;
exports.root = root;
exports.version = version;
//# sourceMappingURL=index.js.map
