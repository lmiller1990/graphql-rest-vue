<template>
  <select-project :projects="projects" />
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { store } from './store'
import SelectProject from './SelectProject.vue'

export default defineComponent({
  components: {
    SelectProject
  },

  setup() {
    store.fetchProjects()

    return {
      projects: computed(() => store.getState().projects)
    }
  }
})
</script>
