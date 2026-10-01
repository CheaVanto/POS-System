<script setup lang="ts">
definePageMeta({ middleware: "unauthorized" });

const route = useRoute();
const router = useRouter();
const inventoryStore = useInventoryStore();
const mainStore = useMainStore();

const pageName = "inventory:history";
const hasPagePermission = computed(() => HelperUtil.can(pageName));

const state = reactive({
  isLoading: true,
  searchString: (route.query.q as string) || "",
  kind: (route.query.kind as string) || "",
  branchId: (route.query.branchId as string) || "",
});

const rows = computed(() => inventoryStore.getHistory);
const pagination = computed(() => inventoryStore.getHistoryPagination);
const branches = computed(() => mainStore.getBranches);

const kindBadge: Record<string, string> = {
  SALE: "badge-danger",
  PURCHASE: "badge-ok",
  ADJUSTMENT: "badge-warn",
  RETURN: "badge-info",
  TRANSFER_IN: "badge-info",
  TRANSFER_OUT: "badge-muted",
};

async function fetchData() {
  state.isLoading = true;
  let params = HelperUtil.getPageParams(route.query);
  if (route.query.kind) params += `&kind=${route.query.kind}`;
  if (route.query.branchId) params += `&branchId=${route.query.branchId}`;
  await inventoryStore.fetchHistory(params);
  state.isLoading = false;
}
function applyFilters() {
  router.push({
    query: { ...route.query, q: state.searchString || undefined, kind: state.kind || undefined, branchId: state.branchId || undefined, page: "1" },
  });
}

watch(() => route.fullPath, fetchData);
onMounted(async () => {
  await Promise.all([mainStore.fetchContext(), fetchData()]);
});
</script>

<template>
  <div class="page" v-if="hasPagePermission">
    <div class="mb-6">
      <h1 style="font-size: 22px">Stock history</h1>
      <p class="muted">Every inventory movement — who, what, when and why.</p>
    </div>

    <div class="card card-pad flex items-end gap-3 wrap mb-4">
      <c-input v-model="state.searchString" label="Product" type="search" placeholder="Search product…" @enter="applyFilters" />
      <c-select v-model="state.kind" label="Type" placeholder="All types" :options="PredefinedUtil.stockKinds.map((k) => ({ value: k, label: k.replace('_', ' ') }))" @update:model-value="applyFilters" />
      <c-select v-if="branches.length > 1" v-model="state.branchId" label="Branch" placeholder="All branches" :options="branches.map((b: any) => ({ value: b.id, label: b.name }))" @update:model-value="applyFilters" />
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Type</th>
              <th class="right">Change</th>
              <th class="right">Balance</th>
              <th>Reason / Ref</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="state.isLoading"><td colspan="8"><CardLoading /></td></tr>
            <tr v-else-if="!rows.length"><td colspan="8"><CardNoData message="No movements match." /></td></tr>
            <tr v-for="r in rows" :key="r.id">
              <td class="muted nowrap">{{ HelperUtil.formatDate(r.createdAt) }}</td>
              <td style="font-weight: 600">{{ r.product.name }}</td>
              <td class="muted">{{ r.warehouse.name }}</td>
              <td><span class="badge" :class="kindBadge[r.kind] || 'badge-muted'">{{ r.kind.replace('_', ' ') }}</span></td>
              <td class="right" style="font-weight: 700" :style="{ color: r.quantity >= 0 ? 'var(--ok)' : 'var(--danger)' }">{{ r.quantity >= 0 ? "+" : "" }}{{ r.quantity }}</td>
              <td class="right">{{ r.balanceAfter }}</td>
              <td class="muted">{{ r.reference || "—" }}</td>
              <td class="muted">{{ r.by }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <CustomPagination :pagination="pagination" />
    </div>
  </div>

  <NoPermission v-else />
</template>
