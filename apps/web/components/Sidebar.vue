<script setup lang="ts">
const route = useRoute();
const authStore = useAuthStore();

// Only show menu items the principal is allowed to see.
const menus = computed(() =>
  PredefinedUtil.menus.filter((m) => !m.permission || HelperUtil.can(m.permission)),
);

const isActive = (path: string) =>
  path === "/" ? route.path === "/" : route.path.startsWith(path);

async function signOut() {
  await authStore.logout();
  navigateTo("/login");
}
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-badge">P</div>
      <div>
        <div style="font-weight: 700; font-size: 14px">POS Backoffice</div>
        <div class="muted" style="font-size: 12px">{{ authStore.getRoles[0] || "" }}</div>
      </div>
    </div>

    <nav class="nav">
      <NuxtLink
        v-for="m in menus"
        :key="m.route"
        :to="m.route"
        class="nav-item"
        :class="{ active: isActive(m.route) }"
      >
        <Icon :name="m.icon" :size="18" />
        {{ m.label }}
      </NuxtLink>
    </nav>

    <div class="nav-foot">
      <NuxtLink v-if="HelperUtil.can('sale:create')" to="/pos" class="nav-item">
        <Icon name="monitor" :size="18" /> Open POS
      </NuxtLink>
      <div class="nav-item" @click="signOut">
        <Icon name="logout" :size="18" /> Sign out
      </div>
    </div>
  </aside>
</template>
