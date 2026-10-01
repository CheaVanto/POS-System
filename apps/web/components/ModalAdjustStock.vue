<script setup lang="ts">
const props = defineProps<{ item: any }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const inventoryStore = useInventoryStore();

const state = reactive({ delta: "", reason: "", isSaving: false, error: "" });

const preview = computed(() => {
  const d = parseInt(state.delta || "0", 10);
  return props.item.quantity + (isNaN(d) ? 0 : d);
});

async function onSave() {
  const d = parseInt(state.delta, 10);
  if (isNaN(d) || d === 0) {
    state.error = "Enter a non-zero adjustment (e.g. +10 or -3).";
    return;
  }
  state.isSaving = true;
  state.error = "";
  const response = await inventoryStore.adjust({
    warehouseId: props.item.warehouseId,
    productId: props.item.productId,
    variantId: props.item.variantId || undefined,
    quantity: d,
    reason: state.reason || undefined,
  });
  state.isSaving = false;
  if (HelperUtil.isOk(response)) emit("saved");
  else state.error = HelperUtil.errorMessage(response);
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal" style="max-width: 400px">
      <div class="modal-head">
        <div class="modal-title">Adjust stock</div>
        <button class="modal-x" @click="emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <div class="card-pad" style="background: #f8fafc; border-radius: 10px; margin-bottom: 14px">
          <div style="font-weight: 600">{{ item.product.name }}</div>
          <div class="muted" style="font-size: 13px">{{ item.warehouse.name }} · on hand {{ item.quantity }}</div>
        </div>
        <c-input v-model="state.delta" label="Adjustment (+ receive / − shrink)" type="number" placeholder="e.g. 10 or -3" />
        <p class="muted" style="font-size: 12px; margin-top: -8px">New on-hand: <strong>{{ preview }}</strong></p>
        <c-input v-model="state.reason" label="Reason" placeholder="Optional note" />
        <div v-if="state.error" class="alert-danger">{{ state.error }}</div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" @click="emit('close')">Cancel</button>
        <button class="btn btn-primary" :disabled="state.isSaving" @click="onSave">{{ state.isSaving ? "Saving…" : "Apply" }}</button>
      </div>
    </div>
  </div>
</template>
