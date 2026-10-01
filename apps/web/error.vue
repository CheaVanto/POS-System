<script setup lang="ts">
defineProps<{ error: any }>();
</script>

<template>
  <div style="min-height: 100vh; display: grid; place-items: center; padding: 20px">
    <div class="card card-pad center" style="max-width: 420px">
      <h2>Something went wrong</h2>
      <p class="muted">{{ error?.message || "Unexpected error." }}</p>
      <button class="btn btn-primary" @click="clearError({ redirect: '/' })">Go home</button>
    </div>
  </div>
</template>
