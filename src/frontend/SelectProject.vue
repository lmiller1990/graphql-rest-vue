<template>
  <select>
    <option v-for="project in projects" :key="project.id">
      {{ project.name }}
    </option>
  </select>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { SelectProject } from './types'

export default defineComponent({
  props: {
    projects: {
      type: Array as () => SelectProject[]
    }
  }
})
</script>
