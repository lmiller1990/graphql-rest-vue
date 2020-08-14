<template>
  <div
    class="category"
    @dragover.prevent
    @drop.prevent="drop"
    data-dropzone="true"
  >
    {{ category.name }}

    <draggable-task
      v-for="task in tasks"
      :key="task.id"
      :task="task"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Category, Task } from "./types";
import DraggableTask from './DraggableTask.vue'
import { useStore } from './store'

export default defineComponent({
  components: { DraggableTask },
  props: {
    tasks: {
      type: Array as () => Task[]
    },
    category: {
      type: Object as () => Category
    }
  },
  setup(props) {
    const store = useStore()
    const drop = (e) => {
      e.preventDefault()
      const { id, taskid } = JSON.parse(e.dataTransfer.getData('text'))
      const draggableElement = document.querySelector(`[data-taskid="${taskid}"]`)
      const dropzone = e.target
      if (dropzone.getAttribute('data-dropzone')) {
        store.updateTask(taskid, props.category.id)
        dropzone.appendChild(draggableElement)
        e.dataTransfer.clearData()
      }
    }
    return {
      drop
    }
  }
})
</script>

<style scoped>
.category {
  background: silver;
  width: 150px;
  margin: 2px;
  padding: 5px;
  min-height: 400px;
  border-radius: 5px;
}
</style>
