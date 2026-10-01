<script setup lang="ts">
const props = defineProps<{ order: any; currency: string }>();
const emit = defineEmits<{ close: []; refunded: [] }>();

const saleStore = useSaleStore();
const state = reactive({ isRefunding: false });

async function refund() {
  if (!confirm("Refund this sale? Stock will be returned.")) return;
  state.isRefunding = true;
  const response = await saleStore.refund(props.order.id);
  state.isRefunding = false;
  if (HelperUtil.isOk(response)) {
    useNuxtApp().$toast.success("Refunded");
    emit("refunded");
  } else {
    useNuxtApp().$toast.error(HelperUtil.errorMessage(response));
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-head">
        <div>
          <div class="modal-title">{{ order.number }}</div>
          <div class="muted" style="font-size: 12px">{{ order.status }}</div>
        </div>
        <button class="modal-x" @click="emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <div class="label">Items</div>
        <table class="table" style="font-size: 13px; margin-bottom: 16px">
          <tbody>
            <tr v-for="it in order.items" :key="it.id">
              <td>{{ it.quantity }} × {{ it.nameSnapshot }}</td>
              <td class="right" style="font-weight: 600">{{ HelperUtil.formatMoney(it.lineTotal, currency) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="label">Payments</div>
        <table class="table" style="font-size: 13px; margin-bottom: 16px">
          <tbody>
            <tr v-for="p in order.payments" :key="p.id">
              <td>{{ p.method }}</td>
              <td class="right" style="font-weight: 600">{{ HelperUtil.formatMoney(p.amount, currency) }}</td>
            </tr>
          </tbody>
        </table>

        <div style="border-top: 1px solid var(--line); padding-top: 10px">
          <div class="flex justify-between muted mb-2"><span>Subtotal</span><span>{{ HelperUtil.formatMoney(order.subtotal, currency) }}</span></div>
          <div class="flex justify-between muted mb-2"><span>Tax</span><span>{{ HelperUtil.formatMoney(order.taxTotal, currency) }}</span></div>
          <div class="flex justify-between" style="font-weight: 800"><span>Total</span><span>{{ HelperUtil.formatMoney(order.grandTotal, currency) }}</span></div>
        </div>
      </div>
      <div v-if="order.status === 'COMPLETED' && HelperUtil.can('sale:refund')" class="modal-foot">
        <button class="btn btn-danger btn-block" :disabled="state.isRefunding" @click="refund">
          {{ state.isRefunding ? "Refunding…" : "Refund sale" }}
        </button>
      </div>
    </div>
  </div>
</template>
