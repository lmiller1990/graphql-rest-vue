<template>
  <select data-testid="select-project" :value="modelValue" @change="change">
    <option :value="null">Select project</option>
    <option v-for="project in projects" :key="project.id" :value="project.id">
      {{ project.name }}
    </option>
  </select>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { SelectProject } from './types'
import { useStore } from './store'

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
    const change = (e) => {
      if (e.target.value) {
        ctx.emit('update:modelValue', e.target.value)
      }
    }

    return {
      change
    }
  }
})
</script>
