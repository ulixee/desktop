<template>
  <div class="y-0 l-0 r-0 drag-bar absolute h-8 w-full">&nbsp;</div>
  <Sidebar />

  <div class="flex flex-col pl-64">
    <main class="flex-1">
      <div class="py-6">
        <div class="mx-auto max-w-7xl px-8">
          <div class="transition-opacity duration-150 ease-linear">
            <button
              @click="goBack()"
              :disabled="!hasBack"
              class="text-gray-500 shadow-sm p-2 rounded-full hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800"
            >
              <ArrowLeftIcon class="h-5" aria-hidden="true" />
            </button>
            <button
              @click="goForward()"
              v-if='hasForward'
              class="ml-2 text-gray-500 shadow-sm  p-2 rounded-full hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800"
            >
              <ArrowRightIcon class="h-5" aria-hidden="true" />
            </button>
            <RouterView />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import * as Vue from 'vue';
import { RouterView, useRouter } from 'vue-router';
import Sidebar from './views/Sidebar.vue';
import Datastores from './views/Datastores.vue';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/vue/24/outline';

export default Vue.defineComponent({
  name: 'App',
  components: {
    Sidebar,
    Datastores,
    RouterView,
    ArrowLeftIcon,
    ArrowRightIcon,
  },
  setup() {
    document.title = 'Ulixee Desktop';
    const router = useRouter();

    // Reactive variables to track back and forward navigation
    const hasBack = ref(!!history.state?.back);
    const hasForward = ref(!!history.state?.forward);
    router.afterEach(() => {
      hasBack.value = !!history.state?.back;
      hasForward.value = !!history.state?.forward;
    });
    return {
      hasForward,
      hasBack,
    };
  },
  methods: {
    goBack() {
      this.$router.back();
    },
    goForward() {
      this.$router.forward();
    },
  },
});
</script>

<style lang="scss">
@import '../../assets/style/resets.scss';

html {
  @apply h-full bg-gray-100;
}

body {
  @apply h-full;
  padding: 0;
  margin: 0;
  height: 100%;
}

#app {
  height: 100%;
}
.drag-bar {
  -webkit-app-region: drag;
}
</style>
