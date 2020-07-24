<template>
  <select @change="change" :value="modelValue">
    <option :value="null">Select a project</option>
    <option v-for="project in projects" :key="project.id" :value="project.id">
      {{ project.name }}
    </option>
  </select>
</template>

// prop: modelValue
// emit update:modelValue

<script lang="ts">
import { defineComponent } from 'vue'
import { SelectProject } from './types'

export default defineComponent({
  props: {
    modelValue: {
      type: String
    },
    projects: {
      type: Array as () => SelectProject[]
    }
  },

  setup(props, ctx) {
    return {
      change: e => {
        ctx.emit('update:modelValue', e.target.value)
      }
    }
  }
})
</script>
