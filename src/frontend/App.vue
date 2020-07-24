<template>
  <select-project :projects="projects" v-model="selectedProject" />
  <div class="categories">
    <category v-for="category in categories" :key="category.id" :category="category" />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue'
import { store } from './store'
import SelectProject from './SelectProject.vue'
import Category from './Category.vue'

export default defineComponent({
  components: {
    SelectProject,
    Category
  },

  setup() {
    store.fetchProjects()
    const selectedProject = ref<string>()

    watch(selectedProject, id => {
      if (!id) {
         return
      }

      store.fetchProject(id)
    })

    return {
      projects: computed(() => store.getState().projects),
      categories: computed(() => store.getState().currentProject?.categories),
      selectedProject,
    }
  }
})
</script>

<style scoped>
.categories {
  margin: 10px 0 0 0;
  display: flex;
}
</style>
