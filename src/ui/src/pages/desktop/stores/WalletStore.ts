import type { IWallet } from '@ulixee/datastore/interfaces/IPaymentService';
import IArgonFile from '@ulixee/platform-specification/types/IArgonFile';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { deepUnref } from '@/pages/desktop/lib/utils';

export { IWallet };

export const useWalletStore = defineStore('walletStore', () => {
  const wallet = ref<IWallet>({
    accounts: [],
    credits: [],
    brokerAccounts: [],
    formattedBalance: '0',
    localchainForQuery: 'primary',
    localchainForCloudNode: '',
  } as IWallet);

  window.desktopApi.on('Wallet.updated', data => {
    wallet.value = data.wallet;
  });

  async function load() {
    wallet.value = await window.desktopApi.send('User.getWallet');
  }
  void load();

  async function createAccount(name: string, suri?: string, password?: string) {
    const account = await window.desktopApi.send('User.createAccount', { name, suri, password });
    wallet.value.accounts.push(account);
    return account;
  }

  async function addBrokerAccount(
    host: string,
    pemPath: string,
    name?: string,
    pemPassword?: string,
  ) {
    const account = await window.desktopApi.send('User.addBrokerAccount', {
      name,
      host,
      pemPassword,
      pemPath,
    });
    wallet.value.brokerAccounts.push(account);
    return account;
  }

  async function transferFromMainchain(microgons: bigint, address: string) {
    await window.desktopApi.send('Argon.transferFromMainchain', { microgons, address });
    await load();
  }

  async function transferToMainchain(microgons: bigint, address: string) {
    await window.desktopApi.send('Argon.transferToMainchain', { microgons, address });
    await load();
  }

  async function saveCredits(credit: IArgonFile['credit']) {
    await window.desktopApi.send('Credit.save', { credit });
    await load();
  }

  async function saveSentArgons(argonFile: IArgonFile) {
    await window.desktopApi.send('Argon.importSend', { argonFile: deepUnref(argonFile) });
    await load();
  }

  async function approveRequestedArgons(argonFile: IArgonFile, fundWithAddress: string) {
    await window.desktopApi.send('Argon.acceptRequest', {
      argonFile: deepUnref(argonFile),
      fundWithAddress,
    });
    await load();
  }

  async function createSendArgonsFile(microgons: bigint, toAddress?: string, fromAddress?: string) {
    const argons = await window.desktopApi.send('Argon.send', {
      microgons,
      toAddress,
      fromAddress,
    });
    await load();
    return argons;
  }

  async function createRequestArgonsFile(microgons: bigint, sendToMyAddress?: string) {
    const argons = await window.desktopApi.send('Argon.request', {
      microgons,
      sendToMyAddress,
    });
    await load();
    return argons;
  }

  return {
    load,
    saveCredits,
    approveRequestedArgons,
    saveSentArgons,
    createSendArgonsFile,
    createRequestArgonsFile,
    createAccount,
    addBrokerAccount,
    transferFromMainchain,
    transferToMainchain,
    wallet,
  };
});
