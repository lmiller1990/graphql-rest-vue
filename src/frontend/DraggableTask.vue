<template>
  <div
    class="task"
    draggable="true"
    @dragstart="dragstart"
    @dragend="dragend"
    :data-taskid="task.id"
  >
    {{ task.name }}
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { Category, Task } from "./types";

export default defineComponent({
  props: {
    task: {
      type: Object as () => Task
    }
  },

  setup(props) {
    const dragging = ref(false)
    const dragstart = (e) => {
      dragging.value = true
      e.dataTransfer.setData('text/plain', JSON.stringify({
        id: e.target.id,
        taskid: props.task.id
      }))
    }

    const dragend = (e) => {
      dragging.value = false
    }

    return {
      dragstart,
      dragend
    }
  }
})
</script>

<style scoped>
.task {
  background: white;
  color: black;
  padding: 5px;
  height: 40px;
  border-radius: 8px;
  margin: 5px 0;
  cursor: move;
}
</style>
