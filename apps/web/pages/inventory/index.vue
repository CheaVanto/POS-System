<script setup lang="ts">
definePageMeta({ middleware: "unauthorized" });

const route = useRoute();
const router = useRouter();
const inventoryStore = useInventoryStore();
const mainStore = useMainStore();

const pageName = "inventory:read";
const hasPagePermission = computed(() => HelperUtil.can(pageName));
const canAdjust = computed(() => HelperUtil.can("inventory:adjust"));

const state = reactive({
  isLoading: true,
  searchString: (route.query.q as string) || "",
  branchId: (route.query.branchId as string) || "",
  adjusting: null as any,
});

const items = computed(() => inventoryStore.getLevels);
const pagination = computed(() => inventoryStore.getLevelsPagination);
const currency = computed(() => mainStore.getCurrency);
const branches = computed(() => mainStore.getBranches);

async function fetchData() {
  state.isLoading = true;
  let params = HelperUtil.getPageParams(route.query);
  if (route.query.branchId) params += `&branchId=${route.query.branchId}`;
  await inventoryStore.fetchLevels(params);
  state.isLoading = false;
}
function applyFilters() {
  router.push({
    query: { ...route.query, q: state.searchString || undefined, branchId: state.branchId || undefined, page: "1" },
  });
}
async function onAdjusted() {
  state.adjusting = null;
  useNuxtApp().$toast.success("Stock adjusted");
  await fetchData();
}

watch(() => route.fullPath, fetchData);
onMounted(async () => {
  await Promise.all([mainStore.fetchContext(), fetchData()]);
});
</script>

<template>
  <div class="page" v-if="hasPagePermission">
    <div class="flex justify-between items-end mb-6 wrap gap-3">
      <div>
        <h1 style="font-size: 22px">Inventory</h1>
        <p class="muted">On-hand stock by warehouse</p>
      </div>
      <div class="flex items-end gap-2">
        <c-input v-model="state.searchString" type="search" placeholder="Search product…" @enter="applyFilters" />
        <c-select v-if="branches.length > 1" v-model="state.branchId" :options="branches.map((b: any) => ({ value: b.id, label: b.name }))" placeholder="All branches" @update:model-value="applyFilters" />
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Warehouse</th>
              <th class="right">On hand</th>
              <th class="right">Avg cost</th>
              <th class="right">Value</th>
              <th v-if="canAdjust" class="right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="state.isLoading"><td colspan="6"><CardLoading /></td></tr>
            <tr v-else-if="!items.length"><td colspan="6"><CardNoData message="No stock rows." /></td></tr>
            <tr v-for="i in items" :key="i.id">
              <td style="font-weight: 600">{{ i.product.name }}</td>
              <td class="muted">{{ i.warehouse.name }}</td>
              <td class="right" style="font-weight: 700" :style="{ color: i.quantity <= i.reorderPoint ? 'var(--warn)' : 'var(--ink)' }">{{ i.quantity }}</td>
              <td class="right muted">{{ HelperUtil.formatMoney(i.avgCost, currency) }}</td>
              <td class="right muted">{{ HelperUtil.formatMoney(i.quantity * i.avgCost, currency) }}</td>
              <td v-if="canAdjust" class="right"><span class="link" @click="state.adjusting = i">Adjust</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <CustomPagination :pagination="pagination" />
    </div>

    <ModalAdjustStock v-if="state.adjusting" :item="state.adjusting" @close="state.adjusting = null" @saved="onAdjusted" />
  </div>

  <NoPermission v-else />
</template>
