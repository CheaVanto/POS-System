<script setup lang="ts">
defineProps<{ title?: string }>();
const authStore = useAuthStore();
</script>

<template>
  <div class="topbar">
    <div style="font-weight: 700; font-size: 16px">{{ title || "" }}</div>
    <div class="flex items-center gap-2 muted" style="font-size: 13px">
      {{ authStore.getUser.email }}
    </div>
  </div>
</template>
