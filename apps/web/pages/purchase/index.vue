<script setup lang="ts">
definePageMeta({ middleware: "unauthorized" });

const route = useRoute();
const purchaseStore = usePurchaseStore();
const mainStore = useMainStore();

const pageName = "purchase:read";
const hasPagePermission = computed(() => HelperUtil.can(pageName));
const canWrite = computed(() => HelperUtil.can("purchase:write"));

const state = reactive({
  isLoading: true,
  showCreate: false,
  detail: null as any,
  detailLoading: false,
  acting: false,
});

const orders = computed(() => purchaseStore.getOrders);
const pagination = computed(() => purchaseStore.getPagination);
const currency = computed(() => mainStore.getCurrency);

const statusBadge: Record<string, string> = {
  DRAFT: "badge-muted",
  ORDERED: "badge-info",
  PARTIAL: "badge-warn",
  RECEIVED: "badge-ok",
  CANCELLED: "badge-danger",
};

async function fetchData() {
  state.isLoading = true;
  await purchaseStore.fetchData(HelperUtil.getPageParams(route.query));
  state.isLoading = false;
}
async function openDetail(o: any) {
  state.detailLoading = true;
  state.detail = { id: o.id };
  const response = await purchaseStore.fetchDetail(o.id);
  if (HelperUtil.isOk(response)) state.detail = (response as any).data;
  state.detailLoading = false;
}
async function act(name: "submit" | "receive" | "cancel") {
  state.acting = true;
  const response = await purchaseStore.action(state.detail.id, name);
  state.acting = false;
  if (HelperUtil.isOk(response)) {
    state.detail = (response as any).data;
    useNuxtApp().$toast.success("Done");
    await fetchData();
  } else {
    useNuxtApp().$toast.error(HelperUtil.errorMessage(response));
  }
}
async function onCreated() {
  state.showCreate = false;
  useNuxtApp().$toast.success("PO created");
  await fetchData();
}

watch(() => route.fullPath, fetchData);
onMounted(async () => {
  await Promise.all([mainStore.fetchContext(), fetchData()]);
});
</script>

<template>
  <div class="page" v-if="hasPagePermission">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 style="font-size: 22px">Purchase orders</h1>
        <p class="muted">Bring stock in from suppliers</p>
      </div>
      <button v-if="canWrite" class="btn btn-primary" @click="state.showCreate = true">
        <Icon name="plus" :size="16" /> New PO
      </button>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>PO</th><th>Supplier</th><th>Date</th><th>Status</th><th class="right">Total</th></tr>
          </thead>
          <tbody>
            <tr v-if="state.isLoading"><td colspan="5"><CardLoading /></td></tr>
            <tr v-else-if="!orders.length"><td colspan="5"><CardNoData message="No purchase orders yet." /></td></tr>
            <tr v-for="o in orders" :key="o.id" style="cursor: pointer" @click="openDetail(o)">
              <td class="link">{{ o.number }}</td>
              <td class="muted">{{ o.supplier?.name }}</td>
              <td class="muted">{{ HelperUtil.formatDate(o.createdAt, "DD-MMM-YYYY") }}</td>
              <td><span class="badge" :class="statusBadge[o.status]">{{ o.status }}</span></td>
              <td class="right" style="font-weight: 700">{{ HelperUtil.formatMoney(o.grandTotal, currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <CustomPagination :pagination="pagination" />
    </div>

    <ModalPurchaseOrder v-if="state.showCreate" :currency="currency" @close="state.showCreate = false" @saved="onCreated" />

    <div v-if="state.detail && !state.detailLoading" class="modal-backdrop" @click.self="state.detail = null">
      <div class="modal">
        <div class="modal-head">
          <div>
            <div class="modal-title">{{ state.detail.number }}</div>
            <div class="muted" style="font-size: 12px">{{ state.detail.supplier?.name }}</div>
          </div>
          <button class="modal-x" @click="state.detail = null">✕</button>
        </div>
        <div class="modal-body">
          <span class="badge" :class="statusBadge[state.detail.status]" style="margin-bottom: 12px; display: inline-block">{{ state.detail.status }}</span>
          <table class="table" style="font-size: 13px">
            <thead><tr><th>Product</th><th class="center">Recv/Ord</th><th class="right">Cost</th></tr></thead>
            <tbody>
              <tr v-for="it in state.detail.items" :key="it.id">
                <td>{{ it.nameSnapshot }}</td>
                <td class="center" :style="{ color: it.quantityReceived >= it.quantity ? 'var(--ok)' : 'var(--warn)' }">{{ it.quantityReceived }}/{{ it.quantity }}</td>
                <td class="right">{{ HelperUtil.formatMoney(it.unitCost, currency) }}</td>
              </tr>
            </tbody>
          </table>
          <div style="border-top: 1px solid var(--line); margin-top: 10px; padding-top: 10px">
            <div class="flex justify-between muted mb-2"><span>Subtotal</span><span>{{ HelperUtil.formatMoney(state.detail.subtotal, currency) }}</span></div>
            <div class="flex justify-between muted mb-2"><span>Tax</span><span>{{ HelperUtil.formatMoney(state.detail.taxTotal, currency) }}</span></div>
            <div class="flex justify-between" style="font-weight: 800"><span>Total</span><span>{{ HelperUtil.formatMoney(state.detail.grandTotal, currency) }}</span></div>
          </div>
        </div>
        <div v-if="canWrite" class="modal-foot">
          <button v-if="state.detail.status === 'DRAFT'" class="btn btn-primary" :disabled="state.acting" @click="act('submit')">Mark ordered</button>
          <button v-if="['ORDERED', 'PARTIAL'].includes(state.detail.status)" class="btn" style="background: var(--ok); color: #fff" :disabled="state.acting" @click="act('receive')">Receive all</button>
          <button v-if="['DRAFT', 'ORDERED'].includes(state.detail.status)" class="btn btn-danger" :disabled="state.acting" @click="act('cancel')">Cancel</button>
        </div>
      </div>
    </div>
  </div>

  <NoPermission v-else />
</template>
