<script setup lang="ts">
const props = defineProps<{
  currency: string;
  warehouseId: string;
  storeId?: string | null;
  terminalId?: string | null;
}>();
const emit = defineEmits<{ close: []; completed: [order: any] }>();

const cartStore = useCartStore();
const saleStore = useSaleStore();

const state = reactive({
  method: "CASH",
  amountInput: "",
  payments: [] as any[],
  isSaving: false,
  error: "",
});

const quickTenders = [500, 1000, 2000, 5000, 10000];
const grand = computed(() => cartStore.grandTotal);
const applied = computed(() => state.payments.reduce((s, p) => s + p.amount, 0));
const remaining = computed(() => Math.max(0, grand.value - applied.value));
const change = computed(() => {
  const cashTendered = state.payments.filter((p) => p.method === "CASH").reduce((s, p) => s + (p.tendered ?? p.amount), 0);
  const nonCash = state.payments.filter((p) => p.method !== "CASH").reduce((s, p) => s + p.amount, 0);
  return Math.max(0, cashTendered + nonCash - grand.value);
});
const canComplete = computed(() => applied.value >= grand.value && grand.value > 0);

function addPayment(method: string, rawMinor: number) {
  if (rawMinor <= 0 || remaining.value <= 0) return;
  const amount = Math.min(rawMinor, remaining.value);
  state.payments.push(method === "CASH" ? { method, amount, tendered: rawMinor } : { method, amount });
  state.amountInput = "";
}
function addFromInput() {
  addPayment(state.method, HelperUtil.toMinor(state.amountInput));
}
function removePayment(i: number) {
  state.payments.splice(i, 1);
}

async function complete() {
  state.error = "";
  state.isSaving = true;
  const payload = cartStore.toCheckout(
    props.warehouseId,
    state.payments.map((p) => ({ method: p.method, amount: p.amount, tendered: p.tendered })),
    { storeId: props.storeId || undefined, terminalId: props.terminalId || undefined },
  );
  const response = await saleStore.checkout(payload);
  state.isSaving = false;
  if (HelperUtil.isOk(response)) {
    emit("completed", (response as any).data);
  } else {
    state.error = HelperUtil.errorMessage(response);
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-head">
        <div class="modal-title">Payment</div>
        <button class="modal-x" @click="emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="flex justify-between card card-pad mb-4" style="background: #f8fafc">
          <div>
            <div class="kpi-label">Total due</div>
            <div style="font-size: 22px; font-weight: 800">{{ HelperUtil.formatMoney(grand, currency) }}</div>
          </div>
          <div class="right">
            <div class="kpi-label">{{ remaining > 0 ? "Remaining" : "Change" }}</div>
            <div style="font-size: 22px; font-weight: 800" :style="{ color: remaining > 0 ? 'var(--brand)' : 'var(--ok)' }">
              {{ HelperUtil.formatMoney(remaining > 0 ? remaining : change, currency) }}
            </div>
          </div>
        </div>

        <div class="grid gap-2 mb-4" style="grid-template-columns: repeat(3, 1fr)">
          <button v-for="m in ['CASH', 'CARD', 'KHQR']" :key="m" class="btn" :class="state.method === m ? 'btn-primary' : ''" @click="state.method = m">{{ m }}</button>
        </div>

        <div v-if="state.method === 'CASH'" class="flex wrap gap-2 mb-4">
          <button class="btn btn-sm" @click="addPayment('CASH', remaining)">Exact {{ HelperUtil.formatMoney(remaining, currency) }}</button>
          <button v-for="t in quickTenders" :key="t" class="btn btn-sm" @click="addPayment('CASH', t)">{{ HelperUtil.formatMoney(t, currency) }}</button>
        </div>

        <div class="flex gap-2 mb-4">
          <input v-model="state.amountInput" class="input" type="number" step="0.01" min="0" :placeholder="`Amount (${currency})`" @keyup.enter="addFromInput" />
          <button class="btn" style="background: var(--ink); color: #fff" @click="addFromInput">Add {{ state.method }}</button>
        </div>

        <div v-for="(p, i) in state.payments" :key="i" class="flex justify-between items-center card-pad" style="background: #f8fafc; border-radius: 10px; padding: 8px 12px; margin-bottom: 6px">
          <span style="font-weight: 600">
            {{ p.method }}
            <span v-if="p.tendered && p.tendered !== p.amount" class="muted">(tendered {{ HelperUtil.formatMoney(p.tendered, currency) }})</span>
          </span>
          <span class="flex items-center gap-3">
            <strong>{{ HelperUtil.formatMoney(p.amount, currency) }}</strong>
            <span class="link-danger" @click="removePayment(i)">✕</span>
          </span>
        </div>

        <div v-if="state.error" class="alert-danger" style="margin-top: 12px">{{ state.error }}</div>
      </div>

      <div class="modal-foot">
        <button class="btn" style="background: var(--ok); color: #fff; width: 100%; justify-content: center; padding: 13px; font-size: 16px" :disabled="!canComplete || state.isSaving" @click="complete">
          {{ state.isSaving ? "Processing…" : "Complete sale" }}
        </button>
      </div>
    </div>
  </div>
</template>
