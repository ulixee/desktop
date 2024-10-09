<template>
  <div class="h-full">
    <h2 class="mb-5 text-lg font-semibold">Query with Payment</h2>
    <h3 class="text-md mb-2 font-semibold text-gray-800">1. Get Testnet Argons</h3>
    <p class="font-light">
      Now let's see how to use Argons to pay for your Datastore query. The first step is to get some
      Testnet Argons.
      <br /><br />
      First visit the
      <router-link
        to="/wallet"
        class="font-semibold text-fuchsia-800 underline hover:text-fuchsia-800/70"
        >Wallet</router-link
      >
      tab and copy the Localchain address that Desktop will use for queries (it should be
      <span class="text-fuchsia-800">'{{ localchainForQuery.address }}'</span>). <br /><br />
      Now you need to get some Testnet Argons. Join the
      <a
        href="https://discord.gg/6JxjCNvu6x"
        class="font-semibold text-fuchsia-800 underline hover:text-fuchsia-800/70"
        target="_blank"
        >Argon Discord</a
      >
      and come into the #testnet channel. <br /><br />
      Request Testnet argons using the `drip` command below (NOTE: you need to prompt it using /drip
      first - don't copy/paste the whole line). Once the Argons are confirmed, they'll be available
      on the "Mainchain" and visible on the wallet tab.
    </p>

    <!-- prettier-ignore -->
    <Prism language="bash" style='font-size: 0.9em' >
      /drip '{{ localchainForQuery.address }}'
    </Prism>
    <p class="my-5 text-sm font-light text-gray-800">
      Learn more about how Argons work
      <a
        href="https://ulixee.org/docs/datastore/overview/relationship-with-argon"
        class="font-semibold text-fuchsia-800 underline hover:text-fuchsia-800/70"
        target="_blank"
        >here</a
      >.
    </p>
    <hr />
    <h3 class="text-md my-2 font-semibold text-gray-800">2. Move Argons to Localchain</h3>

    <p class="my-5">
      You now have some Argons on the Mainchain. To use them for queries, you need to move them to
      your Localchain. Go into your
      <router-link
        :to="'/wallet/' + localchainForQuery.address"
        class="font-semibold text-fuchsia-800 underline hover:text-fuchsia-800/70"
        >{{ localchainForQuery.name }} Localchain</router-link
      >
      and click the "Move to Localchain" button next to your Argon balance.
      <ZoomableImage
        name="MoveArgonsToLocalchain.png"
        alt="Move argons to localchain"
        class="my-2 shadow"
      />
      <br />
      Now you'll need to wait for two things to complete behind the scenes:
    </p>
    <ol class="list-decimal pl-8">
      <li class="list-item">
        the Argons will be sent in the Mainchain to the <i>chain_transfer</i> pallet, where your
        notary will look for them to be ready.<br />
        If you were to look in the
        <a
          href="https://polkadot.js.org/apps/?rpc=wss://rpc.testnet.argonprotocol.org#/explorer"
          target="_blank"
          class="underline hover:text-fuchsia-800/70"
          >Polkadot Explorer</a
        >, you'd see a ChainTransfer.TransferToLocalchain event.

        <ZoomableImage
          name="pjs-transfer-to-localchain"
          alt="Move argons to localchain"
          class="my-2 shadow"
        />
      </li>
      <li>Your Localchain will initiate the "move" into the Localchain.</li>
    </ol>

    <p v-if="localchainForQuery.balance > 0n" class="my-10 border-t-2 border-fuchsia-800 pt-5">
      You're ready to buy your first data query! Let's move on to the next step.
    </p>
    <p v-else class="my-10 border-t-2 pt-5">
      We're waiting for your Localchain to have funding. In this example, I've moved 8 Argons to my
      Localchain:
      <ZoomableImage name="LocalchainFunded.png" alt="Localchain funded" class="mt-2 shadow" />
    </p>
    <hr />
    <h3 class="text-md my-2 font-semibold text-gray-800">3. Retry your Query</h3>
    <p class="my-5">
      When you query using a Localchain, it will put a one hour hold on your Localchain for the
      amount of Argons you need. You can control how it allocates these Argons using the
      <code>channelHoldAllocationStrategy</code> parameter. Let's add our Localchain to the client
      query from a few steps ago:
    </p>
    <!-- prettier-ignore -->
    <Prism language="typescript" style='font-size: 0.9em' data-line="3-13,17" data-prism-copy='Copy this code' >
      import {Client, DefaultPaymentService} from '@ulixee/client';

      async function getPaymentService() {
        return DefaultPaymentService.fromLocalchain({
            localchainName: '{{ localchainForQuery.name }}',
            // don't activate sync since this is managed by Desktop
            disableAutomaticSync: true,
            channelHoldAllocationStrategy: {
                type: 'multiplier',
                queries: 2, // hold 2 queries worth of argons
            },
        });
      }

      async function query() {
        const client = new Client(`{{ datastoreUrl }}`, {
          paymentService: await getPaymentService(),
        });
        const results = await client.query(
          `SELECT title, href from docPages(tool => $1)
          order by title desc`,
          ['hero'],
        );

        console.log(results);

        await client.disconnect();
      }

      query().catch(console.error);
    </Prism>

    <p v-if="step.isComplete" class="my-10 border-t-2 border-fuchsia-800 pt-5">
      <span class="font-light"
        >Your Datastore recorded payments for this query! Check the
        <router-link
          to="/datastores"
          class="font-semibold text-fuchsia-800 underline hover:text-fuchsia-800/70"
          >Datastores</router-link
        >
        tab in the sidebar.
      </span>
      <br />
    </p>
    <p
      v-if="step.isComplete"
      class="grid-row mb-10 grid grid-cols-2 items-center bg-fuchsia-800/10 p-5 text-gray-700"
    >
      <span class="text-lg">Moving on:</span>
      <button
        class="ml-5 inline-flex items-center gap-x-1.5 rounded-md bg-fuchsia-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-fuchsia-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-800"
        @click.prevent="next"
      >
        Next
        <ArrowRightCircleIcon class="relative mr-1 inline w-5" />
      </button>
    </p>
  </div>
</template>

<script lang="ts">
import { IDatastoresById, useDatastoreStore } from '@/pages/desktop/stores/DatastoresStore';
import { useGettingStartedStore } from '@/pages/desktop/stores/GettingStartedStore';
import { useWalletStore } from '@/pages/desktop/stores/WalletStore';
import { ArrowRightCircleIcon } from '@heroicons/vue/24/outline';
import { storeToRefs } from 'pinia';
import * as Vue from 'vue';
import { computed, watch } from 'vue';
import Prism from '../../components/Prism.vue';
import ZoomableImage from '../../components/ZoomableImage.vue';

export default Vue.defineComponent({
  name: 'GettingStartedQueryPayment',
  props: {},
  components: {
    ArrowRightCircleIcon,
    Prism,
    ZoomableImage,
  },
  setup() {
    const gettingStarted = useGettingStartedStore();

    const { steps } = storeToRefs(gettingStarted);
    const step = computed(() => steps.value.find(x => x.href === 'queryPayment'));
    const datastoreStore = useDatastoreStore();
    const version = Vue.ref('');
    const datastoreId = Vue.ref('');
    const { datastoresById } = storeToRefs(datastoreStore);
    const walletStore = useWalletStore();
    const { wallet } = storeToRefs(walletStore);

    const localchainForQuery = Vue.computed(
      () =>
        wallet.value.accounts.find(x => x.name === wallet.value.localchainForQuery) ?? {
          name: '',
          address: '',
          balance: 0n,
        },
    );

    const datastoreUrl = Vue.ref('');
    function setDatastoreUrl(value: IDatastoresById) {
      for (const [id, entry] of Object.entries(value)) {
        if (entry.summary.scriptEntrypoint.includes('ulixee.org.')) {
          const datastoreVersion = entry.summary.version;
          datastoreId.value = id;
          version.value = datastoreVersion;
          const cloudAddress = datastoreStore.getCloudAddress(id, datastoreVersion, 'local');
          datastoreUrl.value = cloudAddress.href;
        }
      }
    }
    setDatastoreUrl(datastoresById.value);
    watch(datastoresById.value, value => {
      setDatastoreUrl(value);
    });

    return {
      version,
      datastoreId,
      datastoresById,
      gotoNextStep: gettingStarted.gotoNextStep,
      datastoreUrl,
      localchainForQuery,
      step,
    };
  },
  methods: {
    next() {
      this.gotoNextStep(this.step.href);
    },
  },
});
</script>
