<script setup lang="ts">
definePageMeta({ layout: "login", middleware: "authenticated" });

const authStore = useAuthStore();

const state = reactive({
  email: "admin@demo.pos",
  password: "Admin123!",
  isLoading: false,
  error: "",
});

async function onSubmit() {
  state.error = "";
  state.isLoading = true;
  const response = await authStore.login({ email: state.email, password: state.password });
  state.isLoading = false;

  if (HelperUtil.isOk(response)) {
    useNuxtApp().$toast.success("Welcome back");
    navigateTo("/");
  } else if ((response as any)?.response?.status === 401) {
    state.error = "Invalid email or password.";
  } else {
    state.error = HelperUtil.errorMessage(response);
  }
}
</script>

<template>
  <div class="card card-pad" style="width: 100%; max-width: 380px">
    <div class="center mb-6">
      <div class="brand-badge" style="margin: 0 auto 10px; width: 44px; height: 44px; font-size: 20px">P</div>
      <h2>POS Backoffice</h2>
      <p class="muted">Sign in to continue</p>
    </div>

    <form @submit.prevent="onSubmit">
      <c-input v-model="state.email" label="Email" type="email" placeholder="you@company.com" />
      <c-input v-model="state.password" label="Password" type="password" placeholder="••••••••" @enter="onSubmit" />

      <div v-if="state.error" class="alert-danger">{{ state.error }}</div>

      <button class="btn btn-primary btn-block" :disabled="state.isLoading" type="submit">
        {{ state.isLoading ? "Signing in…" : "Sign in" }}
      </button>
    </form>

    <p class="center muted mt-1" style="margin-top: 14px; font-size: 12px">
      Demo: admin@demo.pos · Admin123!
    </p>
  </div>
</template>
