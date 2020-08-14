<template>
  <select-project :projects="projects" v-model="selectedProject" />
  Count: {{ count }}
  <div class="categories">
    <category
      v-for="category in categories"
      :key="category.id"
      :category="category"
      :tasks="getTasks(category)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue'
import { useStore } from './store'
import SelectProject from './SelectProject.vue'
import Category from './Category.vue'
import { Category as ICategory, Task } from './types'

export default defineComponent({
  components: {
    SelectProject,
    Category
  },

  setup() {
    const store = useStore()
    store.increment()
    store.fetchProjects()
    const selectedProject = ref<string>()

    const getTasks = (category: ICategory): Task[] => {
      const tasks = computed(() => store.getState().currentProject?.tasks)
      const myTasks: Task[] = []
      for (const [id, task] of Object.entries(tasks.value)) {
        if (task.categoryId === category.id) {
          myTasks.push(task)
        }
      }
      return myTasks
    }

    watch(selectedProject, id => {
      if (!id) {
         return
      }

      store.fetchProject(id)
    })

    return {
      count: computed(() => store.getState().count),
      projects: computed(() => store.getState().projects),
      categories: computed(() => store.getState().currentProject?.categories),
      selectedProject,
      getTasks
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
