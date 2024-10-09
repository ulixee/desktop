<template>
  <Modal
    ref="modal"
    title="Connect a Databroker Account"
    dialog-class="w-1/2"
    :close-handler="onClose"
  >
    <div class="divider-y divider-slate-100 my-5">
      <div class="text-med mb-2 px-3 font-light">
        Wire up an account you already created with a Databroker. NOTE: this will not create a new
        account with the databroker!
      </div>

      <div class="items-left my-5 flex flex-col px-3">
        <p v-if="errorMessage" class="px-1 py-2 text-sm font-semibold text-red-500">
          {{ errorMessage }}
        </p>

        <div class="my-5">
          <div class="mb-1 whitespace-nowrap font-light">User Identity Path</div>
          <div class="mb-2 font-thin">
            The path to the UserIdentity file you registered with this Databroker
          </div>
          <div class="relative">
            <input
              v-model="pemPath"
              type="text"
              placeholder="eg, ~/ulixee/identity/id1xv7empyzlwuvlshs2vlf9eruf72jeesr8yxrrd3esusj75qsr6jqj6dv3p"
              class="w-full rounded-md border border-gray-300 p-3 placeholder-gray-400"
            />
          </div>
        </div>
        <div class="my-5">
          <div class="mb-1 whitespace-nowrap font-light">User Identity Passphrase</div>
          <div class="mb-2 font-thin">
            The passphrase to your UserIdentity file. Leave blank if you don't have one.
          </div>
          <div class="relative">
            <input
              v-model="pemPassword"
              type="text"
              placeholder="your passphrase (if applicable)"
              class="w-full rounded-md border border-gray-300 p-3 placeholder-gray-400"
            />
          </div>
        </div>
        <div class="my-5">
          <div class="mb-1 whitespace-nowrap font-light">Databroker URL</div>
          <div class="relative">
            <input
              v-model="host"
              type="url"
              placeholder="The url for this databroker"
              class="w-full rounded-md border border-gray-300 p-3 placeholder-gray-400"
            />
          </div>
        </div>

        <div class="my-5">
          <div class="text-med mb-1 whitespace-nowrap font-light">Display Name (optional)</div>
          <div class="mb-2 font-thin">
            The name of your account is an easy way to identify it in Ulixee Desktop.
          </div>
          <div class="relative">
            <input
              v-model="displayName"
              type="text"
              placeholder="Give your account a name"
              class="w-full rounded-md border border-gray-300 p-3 placeholder-gray-400"
            />
          </div>
        </div>
        <button
          class="mt-3 inline-flex w-full items-center gap-x-1.5 rounded-md bg-fuchsia-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-fuchsia-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-800"
          @click="create"
        >
          <ArrowRightCircleIcon class="-ml-0.5 h-5 w-5" aria-hidden="true" />
          Connect your Account
        </button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import ArgfileIcon from '@/assets/icons/argfile.svg';
import { useWalletStore } from '@/pages/desktop/stores/WalletStore';
import { ArrowLeftIcon, ArrowRightCircleIcon } from '@heroicons/vue/24/outline';
import * as Vue from 'vue';
import Modal from '../../components/Modal.vue';

export default Vue.defineComponent({
  name: 'NewAccountModal',
  components: {
    Modal,
    ArrowLeftIcon,
    ArrowRightCircleIcon,
    ArgfileIcon,
  },
  emits: ['added'],
  setup() {
    return {
      displayName: Vue.ref<string>(''),
      host: Vue.ref<string>(''),
      pemPath: Vue.ref<string>(''),
      pemPassword: Vue.ref<string>(''),
      modal: Vue.ref<typeof Modal>(null),
      errorMessage: Vue.ref<string>(),
    };
  },
  methods: {
    async create() {
      if (!this.pemPath) {
        this.errorMessage = 'Path to your UserIdentity is required';
        return;
      }
      if (!this.host) {
        this.errorMessage = 'Databroker url is required';
        return;
      }

      try {
        const password = this.pemPassword.length ? this.pemPassword : undefined;
        await useWalletStore().addBrokerAccount(
          this.host,
          this.pemPath,
          this.displayName,
          password,
        );
      } catch (e) {
        this.errorMessage = e.message;
        return;
      }
      this.$emit('added');
      this.modal.close();
    },
    open() {
      this.modal.open();
    },
    onClose() {
      this.modal.close();
      requestAnimationFrame(() => {
        this.displayName = '';
        this.host = '';
        this.pemPassword = '';
        this.pemPath = '';
      });
    },
  },
});
</script>
