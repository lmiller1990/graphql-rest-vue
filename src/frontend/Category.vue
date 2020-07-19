<template>
  <div class="category">
    <h4>{{ category.name }}</h4>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  props: {
    category: {
      type: Object as () => any[] // Category[]
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
  border-radius: 5px;
}
</style>
