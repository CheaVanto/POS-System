<script setup lang="ts">
definePageMeta({ middleware: "unauthorized" });

const route = useRoute();
const saleStore = useSaleStore();
const mainStore = useMainStore();

const pageName = "sale:read";
const hasPagePermission = computed(() => HelperUtil.can(pageName));

const state = reactive({ isLoading: true, detail: null as any, detailLoading: false });

const sales = computed(() => saleStore.getSales);
const pagination = computed(() => saleStore.getPagination);
const currency = computed(() => mainStore.getCurrency);

const statusBadge: Record<string, string> = {
  COMPLETED: "badge-ok",
  REFUNDED: "badge-danger",
  DRAFT: "badge-muted",
  VOID: "badge-muted",
};

async function fetchData() {
  state.isLoading = true;
  await saleStore.fetchData(HelperUtil.getPageParams(route.query));
  state.isLoading = false;
}
async function openDetail(o: any) {
  state.detailLoading = true;
  state.detail = { id: o.id };
  const response = await saleStore.fetchDetail(o.id);
  if (HelperUtil.isOk(response)) state.detail = (response as any).data;
  state.detailLoading = false;
}
async function onRefunded() {
  state.detail = null;
  await fetchData();
}

watch(() => route.fullPath, fetchData);
onMounted(async () => {
  await Promise.all([mainStore.fetchContext(), fetchData()]);
});
</script>

<template>
  <div class="page" v-if="hasPagePermission">
    <div class="mb-6">
      <h1 style="font-size: 22px">Sales</h1>
      <p class="muted">Order history</p>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Status</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="state.isLoading"><td colspan="5"><CardLoading /></td></tr>
            <tr v-else-if="!sales.length"><td colspan="5"><CardNoData message="No sales yet." /></td></tr>
            <tr v-for="o in sales" :key="o.id" style="cursor: pointer" @click="openDetail(o)">
              <td class="link">{{ o.number }}</td>
              <td class="muted">{{ HelperUtil.formatDate(o.createdAt, "DD-MMM-YYYY") }}</td>
              <td class="muted">{{ o.customer?.name || "Walk-in" }}</td>
              <td><span class="badge" :class="statusBadge[o.status] || 'badge-muted'">{{ o.status }}</span></td>
              <td class="right" style="font-weight: 700">{{ HelperUtil.formatMoney(o.grandTotal, currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <CustomPagination :pagination="pagination" />
    </div>

    <ModalSaleDetail v-if="state.detail && !state.detailLoading" :order="state.detail" :currency="currency" @close="state.detail = null" @refunded="onRefunded" />
  </div>

  <NoPermission v-else />
</template>
