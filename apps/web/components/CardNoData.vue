<script setup lang="ts">
defineProps<{ message?: string }>();
</script>

<template>
  <div class="center muted" style="padding: 40px 0">
    {{ message || "No data found." }}
  </div>
</template>
