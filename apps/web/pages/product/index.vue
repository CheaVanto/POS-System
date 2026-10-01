<script setup lang="ts">
definePageMeta({ middleware: "unauthorized" });

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const mainStore = useMainStore();

const pageName = "product:read";
const hasPagePermission = computed(() => HelperUtil.can(pageName));
const hasWritePermission = computed(() => HelperUtil.can("product:write"));

const state = reactive({
  isLoading: true,
  searchString: (route.query.q as string) || "",
  categories: [] as any[],
  showModal: false,
  editing: null as any,
  showDelete: false,
  deleteItem: null as any,
  isDeleting: false,
});

const products = computed(() => productStore.getProducts);
const pagination = computed(() => productStore.getPagination);
const currency = computed(() => mainStore.getCurrency);

async function fetchData() {
  state.isLoading = true;
  await productStore.fetchData(HelperUtil.getPageParams(route.query));
  state.isLoading = false;
}

function onSearch() {
  router.push({ query: { ...route.query, q: state.searchString || undefined, page: "1" } });
}

function openCreate() {
  state.editing = null;
  state.showModal = true;
}
function openEdit(item: any) {
  state.editing = item;
  state.showModal = true;
}
async function onSaved() {
  state.showModal = false;
  useNuxtApp().$toast.success("Saved");
  await fetchData();
}

function askDelete(item: any) {
  state.deleteItem = item;
  state.showDelete = true;
}
async function confirmDelete() {
  state.isDeleting = true;
  const response = await productStore.delete(state.deleteItem.id);
  state.isDeleting = false;
  state.showDelete = false;
  if (HelperUtil.isOk(response)) {
    useNuxtApp().$toast.success("Deleted");
    await fetchData();
  } else {
    useNuxtApp().$toast.error(HelperUtil.errorMessage(response));
  }
}

// Pagination / search changes push into the query → refetch.
watch(() => route.fullPath, fetchData);

onMounted(async () => {
  state.categories = await productStore.getCategories();
  await Promise.all([mainStore.fetchContext(), fetchData()]);
});
</script>

<template>
  <div class="page" v-if="hasPagePermission">
    <div class="flex justify-between items-center mb-6 wrap gap-3">
      <div>
        <h1 style="font-size: 22px">Products</h1>
        <p class="muted">{{ pagination.length }} items</p>
      </div>
      <div class="flex items-center gap-2">
        <c-input v-model="state.searchString" type="search" placeholder="Search name / SKU…" @enter="onSearch" />
        <button v-if="hasWritePermission" class="btn btn-primary" @click="openCreate">
          <Icon name="plus" :size="16" /> New product
        </button>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 56px"></th>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th class="right">Cost</th>
              <th class="right">Sell</th>
              <th v-if="hasWritePermission" class="right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="state.isLoading"><td colspan="7"><CardLoading /></td></tr>
            <tr v-else-if="!products.length"><td colspan="7"><CardNoData message="No products." /></td></tr>
            <tr v-for="p in products" :key="p.id">
              <td>
                <img v-if="p.imageUrl" :src="HelperUtil.mediaUrl(p.imageUrl)" class="thumb" />
                <div v-else class="thumb center" style="display: grid; place-items: center; color: var(--muted)">▦</div>
              </td>
              <td style="font-weight: 600">{{ p.name }}</td>
              <td class="muted">{{ p.sku }}</td>
              <td class="muted">{{ p.category?.name || "—" }}</td>
              <td class="right muted">{{ HelperUtil.formatMoney(p.costPrice, currency) }}</td>
              <td class="right" style="font-weight: 700">{{ HelperUtil.formatMoney(p.sellPrice, currency) }}</td>
              <td v-if="hasWritePermission" class="right nowrap">
                <span class="link" @click="openEdit(p)">Edit</span>
                <span class="link-danger" style="margin-left: 14px" @click="askDelete(p)">Delete</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <CustomPagination :pagination="pagination" />
    </div>

    <ModalProduct
      v-if="state.showModal"
      :product="state.editing"
      :categories="state.categories"
      @close="state.showModal = false"
      @saved="onSaved"
    />
    <ModalConfirm
      v-if="state.showDelete"
      title="Delete product"
      :message="`Delete “${state.deleteItem?.name}”?`"
      :busy="state.isDeleting"
      @close="state.showDelete = false"
      @confirm="confirmDelete"
    />
  </div>

  <NoPermission v-else />
</template>
