<template>
  <img
    :src="imageUrl"
    v-bind="$attrs"
    @click="toggleZoom"
    :class="{ 'fullscreen-image': isZoomed }"
  />
</template>

<script lang="ts">
import * as Vue from 'vue';

export default Vue.defineComponent({
  name: 'ZoomableImage',
  props: {
    name: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const images = import.meta.glob('@/assets/images/*.png');

    const imageUrl = Vue.ref('');
    Object.entries(images)
      .find(([path]) => path.includes(props.name))?.[1]()
      .then(image => {
        imageUrl.value = (image as any).default;
      });

    return {
      imageUrl,
      isZoomed: Vue.ref(false),
    };
  },
  methods: {
    toggleZoom() {
      this.isZoomed = !this.isZoomed;
    },
  },
});
</script>
<style scoped>
img {
  height: auto;
  cursor: pointer;
  transition: transform 0.3s ease-in-out; /* Smooth transition */
}

.fullscreen-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw; /* Full viewport width */
  height: 100vh; /* Full viewport height */
  object-fit: contain;
  z-index: 9999;
  cursor: zoom-out;
  background-color: rgba(0, 0, 0, 0.8);
}
</style>
