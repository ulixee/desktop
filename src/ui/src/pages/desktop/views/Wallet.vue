<template>
  <div class="h-full">
    <h3 class="mb-1 mt-3 text-xl font-semibold text-gray-900">Your Argon Accounts</h3>
    <p class="text-med mb-8 mt-1 text-gray-500">
      Argon is the currency that powers Ulixee Datastore payments. Learn more
      <a
        href="https://ulixee.org/docs/datastore/basics/payments"
        target="_blank"
        class="cursor-pointer text-fuchsia-800 underline hover:font-light"
        >here</a
      >.
    </p>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="account of wallet.accounts"
        :key="account.address"
        class="ol-span-1 mb-10 flex cursor-pointer flex-col divide-y divide-gray-200 rounded-lg bg-white shadow-md hover:shadow-sm"
        @click.prevent="$router.push(`/wallet/${account.address}`)"
      >
        <div class="relative w-full flex-grow flex-col p-6">
          <h3 class="grid w-full grid-cols-2 align-middle">
            <span class="font-bold text-gray-700">{{ titleCase(account.name) }}</span>

            <span class="">
              <span
                v-if="account.mainchainIdentity?.chain != 'mainnet'"
                class="float-end rounded p-1 px-1 text-[10px]/[12px] font-medium uppercase text-white"
                :class="
                  {
                    testnet: 'bg-green-400',
                    'local-testnet': 'bg-amber-400',
                    development: 'bg-cyan-500',
                  }[String(account.mainchainIdentity?.chain ?? '')]
                "
                >{{ account.mainchainIdentity?.chain }}</span
              >
            </span>
          </h3>
          <div class="mt-1 w-full overflow-hidden text-ellipsis text-xs font-light text-gray-500">
            {{ account.address }}
          </div>
          <div
            class="mt-4 text-base text-gray-400"
            v-if="wallet.localchainForQuery === account.name"
          >
            Used to fund queries created in Ulixee Desktop
          </div>
          <div
            class="mt-4 text-base text-gray-400"
            v-if="wallet.localchainForCloudNode === account.name"
          >
            Used to accept payments sent to the built-in Desktop Cloudnode
          </div>
        </div>
        <div class="-mt-px flex divide-x divide-gray-200">
          <div class="grid-row grid basis-1/2 py-2 text-center text-xl">
            <div class="text-sm font-normal text-gray-900">
              <WalletIcon class="relative mr-1 inline h-4 align-text-bottom text-fuchsia-600" />
              Balance
              <span class="font-semibold">{{
                toArgons(account.balance + account.mainchainBalance)
              }}</span>
            </div>
          </div>

          <div class="grid-row grid basis-1/2 place-content-center py-2 text-center text-xl">
            <div class="text-sm font-normal text-gray-900">
              <ClockIcon class="relative mr-1 inline h-4 align-text-bottom text-fuchsia-600" />
              Pending
              <span class="font-semibold"
                >{{ toArgons(account.pendingBalanceChange) }}
                <slot v-if="account.heldBalance > 0n"
                  >, Hold {{ toArgons(account.heldBalance) }}</slot
                ></span
              >
            </div>
          </div>
        </div>
      </div>

      <div class="mb-10">
        <button
          class="group relative block h-full w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-800/90 focus:ring-offset-2"
          @click.prevent="newAccountModal.open()"
        >
          <PlusCircleIcon class="mx-auto h-12 w-12 text-gray-400" />
          <span class="mt-2 block text-sm font-semibold text-gray-900">Add an Account</span>
        </button>
      </div>
    </div>

    <h3 class="mb-1 mt-3 text-xl font-semibold text-gray-900">Your Databroker Accounts</h3>
    <p class="text-med mb-8 mt-1 text-gray-500">
      Databrokers manage payments for you so you don't have to worry about keeping an Argon wallet
      topped-up.
    </p>
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="(account, i) in wallet.brokerAccounts"
        :key="i"
        class="ol-span-1 mb-10 flex flex-col divide-y divide-gray-200 rounded-lg bg-white"
      >
        <div class="relative flex w-full flex-grow justify-between space-x-6 p-6">
          <div class="relative mb-1 mt-2 overflow-hidden pb-1 text-base leading-6 text-gray-400">
            <h3 class="overflow-hidden text-ellipsis">
              <span v-if="account.name" class="font-bold text-gray-700">{{
                titleCase(account.name)
              }}</span>
              <span v-else class="font-bold text-gray-700">{{ account.userIdentity }}</span>
            </h3>
            <div class="mt-1 w-full overflow-hidden text-ellipsis text-xs font-light text-gray-500">
              {{ account.host }}
            </div>
          </div>
        </div>
        <div class="-mt-px divide-gray-200">
          <div class="py-2 text-center text-xl">
            <div class="text-sm font-normal text-gray-900">
              <CommandLineIcon
                class="relative mr-1 inline h-4 align-text-bottom text-fuchsia-600"
              />
              Balance
              <span class="font-semibold">{{ toArgons(account.balance) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-10">
        <button
          class="group relative block h-full w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-800/90 focus:ring-offset-2"
          @click.prevent="newBrokerAccountModal.open()"
        >
          <PlusCircleIcon class="mx-auto h-12 w-12 text-gray-400" />
          <span class="mt-2 block text-sm font-semibold text-gray-900"
            >Connect a Databroker Account</span
          >
        </button>
      </div>
    </div>

    <div class="mx-auto max-w-none">
      <div class="mt-12 overflow-hidden rounded-lg bg-white shadow">
        <div class="border-b border-gray-200 bg-white px-4 py-5">
          <div
            class="-ml-4 -mt-2 flex flex-wrap content-end items-center justify-between border-b border-gray-200 pb-2"
          >
            <div class="mt-2 px-5">
              <h3 class="text-middle font-semibold leading-6 text-gray-900">
                <CakeIcon class="relative -top-0.5 mr-2 inline-block h-6 w-6" />
                Datastore Credits
              </h3>
              <p class="mt-1 text-sm text-gray-500">
                Credits valid for trying out a Datastore. Contact a Datastore author to request
                them.
              </p>
            </div>
          </div>
          <ul>
            <li
              v-for="credit in wallet?.credits"
              :key="credit.creditsId"
              class="flex flex-row items-stretch p-2"
            >
              <div class="basis-1/2 text-base font-light">
                Credit at {{ getDatastoreName(credit.datastoreId) }}
              </div>
              <div class="basis-1/2 text-lg">
                {{ toArgons(credit.remaining) }}
              </div>
            </li>
            <li v-if="!wallet?.credits?.length">
              <div class="mt-5 text-center text-gray-500">No credits available</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  <NewAccountModal ref="newAccountModal" @added="refreshWallet()" />
  <NewBrokerAccountModal ref="newBrokerAccountModal" @added="refreshWallet()" />
</template>

<script lang="ts">
import ArgonIcon from '@/assets/icons/argon.svg';
import { titleCase, toArgons } from '@/pages/desktop/lib/utils';
import { useDatastoreStore } from '@/pages/desktop/stores/DatastoresStore';
import { useWalletStore } from '@/pages/desktop/stores/WalletStore';
import { Chain } from '@argonprotocol/localchain';
import {
  CakeIcon,
  ClockIcon,
  CogIcon,
  CommandLineIcon,
  EnvelopeIcon,
  HandRaisedIcon,
  PlusCircleIcon,
  QuestionMarkCircleIcon,
  WalletIcon,
} from '@heroicons/vue/24/outline';
import { storeToRefs } from 'pinia';
import * as Vue from 'vue';
import { ref } from 'vue';
import NewAccountModal from './accounts/NewAccountModal.vue';
import NewBrokerAccountModal from './accounts/NewBrokerAccountModal.vue';

export default Vue.defineComponent({
  name: 'Wallet',
  components: {
    CommandLineIcon,
    WalletIcon,
    ArgonIcon,
    HandRaisedIcon,
    CogIcon,
    EnvelopeIcon,
    PlusCircleIcon,
    QuestionMarkCircleIcon,
    ClockIcon,
    CakeIcon,
    NewAccountModal,
    NewBrokerAccountModal,
  },
  setup() {
    const walletStore = useWalletStore();
    return {
      ...storeToRefs(walletStore),
      toArgons,
      walletStore,
      newAccountModal: ref<typeof NewAccountModal>(null),
      newBrokerAccountModal: ref<typeof NewBrokerAccountModal>(null),
      titleCase,
    };
  },
  methods: {
    getDatastoreName(datastoreId: string): string {
      const datastoresStore = useDatastoreStore();
      const datastore = datastoresStore.datastoresById[datastoreId]?.summary;
      return (
        datastore?.name ??
        datastore?.scriptEntrypoint ??
        `a not-installed Datastore (${datastoreId})`
      );
    },
    refreshWallet() {
      void this.walletStore.load();
    },
  },
});
</script>
