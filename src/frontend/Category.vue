<template>
  <div class="category">
    {{ category.name }}
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Category } from "./types";

export default defineComponent({
  props: {
    category: {
      type: Object as () => Category
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
