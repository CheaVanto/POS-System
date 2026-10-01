<script setup lang="ts">
const authStore = useAuthStore();

// On a fresh load the store is empty but the cookie survives — re-hydrate the
// principal so sidebar menus and permission gates work after a refresh.
onMounted(async () => {
  const token = useCookie("access_token").value;
  if (token && !authStore.getUser.id) {
    await authStore.fetchMe();
  }
});
</script>

<template>
  <div class="shell">
    <Sidebar />
    <div class="main">
      <Navbar />
      <div class="content">
        <slot />
      </div>
    </div>
  </div>
</template>
