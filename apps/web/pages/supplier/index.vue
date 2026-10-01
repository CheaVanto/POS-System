<script setup lang="ts">
definePageMeta({ middleware: "unauthorized" });

const route = useRoute();
const router = useRouter();
const supplierStore = useSupplierStore();
const mainStore = useMainStore();

const pageName = "supplier:read";
const hasPagePermission = computed(() => HelperUtil.can(pageName));
const hasWritePermission = computed(() => HelperUtil.can("supplier:write"));

const state = reactive({
  isLoading: true,
  searchString: (route.query.q as string) || "",
  showModal: false,
  editing: null as any,
});

const suppliers = computed(() => supplierStore.getSuppliers);
const pagination = computed(() => supplierStore.getPagination);
const currency = computed(() => mainStore.getCurrency);

async function fetchData() {
  state.isLoading = true;
  await supplierStore.fetchData(HelperUtil.getPageParams(route.query));
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

watch(() => route.fullPath, fetchData);
onMounted(async () => {
  await Promise.all([mainStore.fetchContext(), fetchData()]);
});
</script>

<template>
  <div class="page" v-if="hasPagePermission">
    <div class="flex justify-between items-center mb-6 wrap gap-3">
      <div>
        <h1 style="font-size: 22px">Suppliers</h1>
        <p class="muted">{{ pagination.length }} vendors</p>
      </div>
      <div class="flex items-center gap-2">
        <c-input v-model="state.searchString" type="search" placeholder="Search name / phone…" @enter="onSearch" />
        <button v-if="hasWritePermission" class="btn btn-primary" @click="openCreate">
          <Icon name="plus" :size="16" /> New supplier
        </button>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Contact</th>
              <th>Phone</th>
              <th>Rating</th>
              <th class="right">Balance owed</th>
              <th v-if="hasWritePermission" class="right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="state.isLoading"><td colspan="6"><CardLoading /></td></tr>
            <tr v-else-if="!suppliers.length"><td colspan="6"><CardNoData message="No suppliers." /></td></tr>
            <tr v-for="s in suppliers" :key="s.id">
              <td style="font-weight: 600">{{ s.name }}</td>
              <td class="muted">{{ s.contactName || "—" }}</td>
              <td class="muted">{{ s.phone || "—" }}</td>
              <td style="color: #d0940a">{{ s.rating ? "★".repeat(s.rating) : "—" }}</td>
              <td class="right" style="font-weight: 700" :style="{ color: s.balance > 0 ? 'var(--danger)' : 'var(--ink)' }">
                {{ HelperUtil.formatMoney(s.balance, currency) }}
              </td>
              <td v-if="hasWritePermission" class="right"><span class="link" @click="openEdit(s)">Edit</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <CustomPagination :pagination="pagination" />
    </div>

    <ModalSupplier v-if="state.showModal" :supplier="state.editing" @close="state.showModal = false" @saved="onSaved" />
  </div>

  <NoPermission v-else />
</template>
