<template>
  <select-project :projects="projects" v-model="selected" />
  <div class="categories">
    <category v-for="category in categories" :key="category.id" :category="category" />
  </div>
</template>

<script lang="ts">
import { watch, defineComponent, computed, ref } from 'vue'
import { store } from './store'
import SelectProject from './SelectProject.vue'
import Category from './Category.vue'

export default defineComponent({
  components: {
    SelectProject,
    Category,
  },

  setup() {
    store.fetchProjects()
    const selected = ref()
    watch(selected, val => {
      store.fetchProject(val)
    })

    return {
      selected,
      projects: computed(() => store.getState().projects),
      categories: computed(() => store.getState().currentProject && store.getState().currentProject.categories),
    }
  }
})
</script>

<style scoped>
.categories {
  display: flex;
}
</style>
