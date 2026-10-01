<script setup lang="ts">
definePageMeta({ layout: false, middleware: "unauthorized" });

const authStore = useAuthStore();
const mainStore = useMainStore();
const productStore = useProductStore();
const cartStore = useCartStore();

const state = reactive({
  isLoading: true,
  searchString: "",
  registers: [] as any[],
  selectedTerminalId: "" as string | null,
  showPicker: false,
  showPayment: false,
  showReceipt: false,
  lastOrder: null as any,
});

const currency = computed(() => mainStore.getCurrency);
const products = computed(() => productStore.getProducts);
const filtered = computed(() => {
  const q = state.searchString.trim().toLowerCase();
  if (!q) return products.value;
  return products.value.filter(
    (p: any) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
  );
});
const currentRegister = computed(() => {
  if (state.registers.length === 1) return state.registers[0];
  return state.registers.find((r) => r.terminalId === state.selectedTerminalId) || null;
});

function buildRegisters(ctx: any) {
  const out: any[] = [];
  for (const b of ctx.tree || []) {
    for (const s of b.stores || []) {
      const wh = s.defaultWarehouseId || b.warehouses?.[0]?.id || ctx.warehouses?.[0]?.id;
      if (!wh) continue;
      for (const t of s.terminals || []) {
        out.push({ terminalId: t.id, storeId: s.id, warehouseId: wh, label: `${b.name} · ${s.name} · ${t.name}` });
      }
    }
  }
  if (!out.length && ctx.warehouses?.[0]) {
    const s = ctx.stores?.[0];
    out.push({ terminalId: null, storeId: s?.id || null, warehouseId: s?.defaultWarehouseId || ctx.warehouses[0].id, label: "Register" });
  }
  return out;
}

async function boot() {
  state.isLoading = true;
  const ctxRes = await mainStore.fetchContext();
  const ctx = (ctxRes as any)?.data || {};
  cartStore.companyTaxRateBps = mainStore.company.taxRateBps || 0;
  state.registers = buildRegisters(ctx);
  state.selectedTerminalId = useCookie("pos_terminal").value || "";
  if (!currentRegister.value && state.registers.length > 1) state.showPicker = true;
  await productStore.fetchData("?page=1&limit=100");
  state.isLoading = false;
}

function pickRegister(r: any) {
  state.selectedTerminalId = r.terminalId;
  if (r.terminalId) useCookie("pos_terminal").value = r.terminalId;
  state.showPicker = false;
}

function onCompleted(order: any) {
  state.lastOrder = order;
  state.showPayment = false;
  state.showReceipt = true;
  cartStore.clear();
}
function newSale() {
  state.showReceipt = false;
  state.lastOrder = null;
}
async function signOut() {
  await authStore.logout();
  navigateTo("/login");
}

onMounted(boot);
</script>

<template>
  <div class="pos-shell">
    <div class="pos-header">
      <div class="flex items-center gap-3">
        <div class="brand-badge">P</div>
        <div>
          <div style="font-weight: 700; font-size: 14px">{{ currentRegister ? currentRegister.label : "Select a register" }}</div>
          <div class="muted" style="font-size: 12px">{{ authStore.getUser.email }}</div>
        </div>
        <button v-if="state.registers.length > 1" class="btn btn-sm" @click="state.showPicker = true">Change register</button>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink to="/" class="btn btn-sm">Admin</NuxtLink>
        <button class="btn btn-sm" @click="signOut">Sign out</button>
      </div>
    </div>

    <div class="pos-body">
      <section class="pos-catalog">
        <c-input v-model="state.searchString" type="search" placeholder="Search products or scan SKU…" style="margin-bottom: 14px" />
        <CardLoading v-if="state.isLoading" />
        <div v-else class="pos-grid">
          <button v-for="p in filtered" :key="p.id" class="product-card" @click="cartStore.add(p)">
            <div class="pc-img">
              <img v-if="p.imageUrl" :src="HelperUtil.mediaUrl(p.imageUrl)" />
              <span v-else style="font-size: 26px; font-weight: 800; color: #c4ccd6">{{ p.name.charAt(0) }}</span>
            </div>
            <div class="pc-body">
              <div style="font-weight: 600; font-size: 13px">{{ p.name }}</div>
              <div class="flex justify-between items-center">
                <span class="muted" style="font-size: 11px">{{ p.sku }}</span>
                <span style="font-weight: 700; color: var(--brand)">{{ HelperUtil.formatMoney(p.sellPrice, currency) }}</span>
              </div>
            </div>
          </button>
        </div>
      </section>

      <PosCart :currency="currency" :can-charge="!!currentRegister" @charge="state.showPayment = true" />
    </div>

    <ModalPayment
      v-if="state.showPayment && currentRegister"
      :currency="currency"
      :warehouse-id="currentRegister.warehouseId"
      :store-id="currentRegister.storeId"
      :terminal-id="currentRegister.terminalId"
      @close="state.showPayment = false"
      @completed="onCompleted"
    />
    <ModalReceipt v-if="state.showReceipt && state.lastOrder" :order="state.lastOrder" :currency="currency" @new-sale="newSale" />

    <div v-if="state.showPicker" class="modal-backdrop">
      <div class="modal">
        <div class="modal-head"><div class="modal-title">Choose your register</div></div>
        <div class="modal-body">
          <button v-for="r in state.registers" :key="r.terminalId || r.label" class="btn btn-block" style="justify-content: flex-start; margin-bottom: 8px" :class="r.terminalId === state.selectedTerminalId ? 'btn-primary' : ''" @click="pickRegister(r)">
            {{ r.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
