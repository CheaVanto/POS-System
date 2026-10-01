<script setup lang="ts">
const props = defineProps<{ currency: string }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const purchaseStore = usePurchaseStore();
const supplierStore = useSupplierStore();
const productStore = useProductStore();
const mainStore = useMainStore();

const state = reactive({
  suppliers: [] as any[],
  products: [] as any[],
  warehouses: [] as any[],
  supplierId: "",
  warehouseId: "",
  note: "",
  lines: [] as any[],
  isLoading: true,
  isSaving: false,
  error: "",
});

const grandTotal = computed(() =>
  state.lines.reduce((sum, l) => {
    const net = HelperUtil.toMinor(l.unitCost) * (Number(l.quantity) || 0);
    const tax = Math.round((net * (parseFloat(l.taxPercent || "0") * 100)) / 10000);
    return sum + net + tax;
  }, 0),
);

function addLine() {
  state.lines.push({ productId: state.products[0]?.id || "", quantity: 1, unitCost: "", taxPercent: "0" });
}
function removeLine(i: number) {
  state.lines.splice(i, 1);
}
function onProductChange(line: any) {
  const p = state.products.find((x) => x.id === line.productId);
  if (p && line.unitCost === "") line.unitCost = (p.costPrice / 100).toFixed(2);
}

async function onSave() {
  state.error = "";
  if (!state.supplierId || !state.warehouseId) {
    state.error = "Pick a supplier and a warehouse.";
    return;
  }
  if (!state.lines.length || state.lines.some((l) => !l.productId || !l.quantity || l.unitCost === "")) {
    state.error = "Every line needs a product, quantity and unit cost.";
    return;
  }
  state.isSaving = true;
  const body = {
    supplierId: state.supplierId,
    warehouseId: state.warehouseId,
    note: state.note || undefined,
    items: state.lines.map((l) => ({
      productId: l.productId,
      quantity: Number(l.quantity),
      unitCost: HelperUtil.toMinor(l.unitCost),
      taxRateBps: Math.round(parseFloat(l.taxPercent || "0") * 100),
    })),
  };
  const response = await purchaseStore.create(body);
  state.isSaving = false;
  if (HelperUtil.isOk(response)) emit("saved");
  else state.error = HelperUtil.errorMessage(response);
}

onMounted(async () => {
  await Promise.all([
    supplierStore.fetchData("?page=1&limit=200"),
    productStore.fetchData("?page=1&limit=200"),
    mainStore.fetchContext(),
  ]);
  state.suppliers = supplierStore.getSuppliers;
  state.products = productStore.getProducts;
  state.warehouses = mainStore.getWarehouses;
  state.supplierId = state.suppliers[0]?.id || "";
  state.warehouseId = state.warehouses[0]?.id || "";
  addLine();
  onProductChange(state.lines[0]);
  state.isLoading = false;
});
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal modal-lg">
      <div class="modal-head">
        <div class="modal-title">New purchase order</div>
        <button class="modal-x" @click="emit('close')">✕</button>
      </div>

      <CardLoading v-if="state.isLoading" />
      <div v-else class="modal-body">
        <div class="grid gap-3 mb-4" style="grid-template-columns: 1fr 1fr">
          <c-select v-model="state.supplierId" label="Supplier" :options="state.suppliers.map((s) => ({ value: s.id, label: s.name }))" />
          <c-select v-model="state.warehouseId" label="Receive to warehouse" :options="state.warehouses.map((w) => ({ value: w.id, label: w.name }))" />
        </div>

        <div class="flex justify-between items-center mb-2">
          <span class="label" style="margin: 0">Line items</span>
          <span class="link" @click="addLine">+ Add line</span>
        </div>

        <div v-for="(line, i) in state.lines" :key="i" class="flex gap-2 mb-2 items-center">
          <select v-model="line.productId" class="select" style="flex: 1" @change="onProductChange(line)">
            <option v-for="p in state.products" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <input v-model.number="line.quantity" class="input" type="number" min="1" style="width: 70px" />
          <input v-model="line.unitCost" class="input" type="number" step="0.01" min="0" style="width: 90px" />
          <input v-model="line.taxPercent" class="input" type="number" step="0.1" min="0" style="width: 70px" />
          <span class="link-danger" @click="removeLine(i)">✕</span>
        </div>

        <c-input v-model="state.note" label="Note" placeholder="Optional" />
        <div v-if="state.error" class="alert-danger">{{ state.error }}</div>
      </div>

      <div class="modal-foot" style="justify-content: space-between">
        <div class="muted">Total <strong style="font-size: 16px; color: var(--ink)">{{ HelperUtil.formatMoney(grandTotal, currency) }}</strong></div>
        <div class="flex gap-2">
          <button class="btn btn-ghost" @click="emit('close')">Cancel</button>
          <button class="btn btn-primary" :disabled="state.isSaving || state.isLoading" @click="onSave">{{ state.isSaving ? "Creating…" : "Create PO" }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
