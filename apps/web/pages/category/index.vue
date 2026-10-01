<script setup lang="ts">
definePageMeta({ middleware: "unauthorized" });

const categoryStore = useCategoryStore();

const pageName = "product:read";
const hasPagePermission = computed(() => HelperUtil.can(pageName));
const hasWritePermission = computed(() => HelperUtil.can("product:write"));

const state = reactive({
  isLoading: true,
  showModal: false,
  editing: null as any,
  busyId: "" as string,
});

const categories = computed(() => categoryStore.getCategories);
const nameById = computed(() => {
  const m: Record<string, string> = {};
  categories.value.forEach((c: any) => (m[c.id] = c.name));
  return m;
});

async function fetchData() {
  state.isLoading = true;
  await categoryStore.fetchData();
  state.isLoading = false;
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

async function toggleActive(item: any) {
  state.busyId = item.id;
  const response = await categoryStore.update({ id: item.id, isActive: !item.isActive });
  state.busyId = "";
  if (HelperUtil.isOk(response)) await fetchData();
  else useNuxtApp().$toast.error(HelperUtil.errorMessage(response));
}

async function remove(item: any) {
  if (!confirm(`Delete category "${item.name}"?`)) return;
  const response = await categoryStore.delete(item.id);
  if (HelperUtil.isOk(response)) {
    useNuxtApp().$toast.success("Deleted");
    await fetchData();
  } else {
    useNuxtApp().$toast.error(HelperUtil.errorMessage(response));
  }
}

onMounted(fetchData);
</script>

<template>
  <div class="page" v-if="hasPagePermission">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 style="font-size: 22px">Categories</h1>
        <p class="muted">Organize products</p>
      </div>
      <button v-if="hasWritePermission" class="btn btn-primary" @click="openCreate">
        <Icon name="plus" :size="16" /> New category
      </button>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Parent</th>
              <th>Status</th>
              <th v-if="hasWritePermission" class="right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="state.isLoading"><td colspan="4"><CardLoading /></td></tr>
            <tr v-else-if="!categories.length"><td colspan="4"><CardNoData message="No categories yet." /></td></tr>
            <tr v-for="c in categories" :key="c.id">
              <td style="font-weight: 600">{{ c.name }}</td>
              <td class="muted">{{ c.parentId ? nameById[c.parentId] || "—" : "—" }}</td>
              <td><span class="badge" :class="c.isActive ? 'badge-ok' : 'badge-muted'">{{ c.isActive ? "Active" : "Disabled" }}</span></td>
              <td v-if="hasWritePermission" class="right nowrap">
                <span class="link" @click="openEdit(c)">Edit</span>
                <span class="link" style="margin-left: 14px" :style="{ color: c.isActive ? 'var(--warn)' : 'var(--ok)' }" @click="toggleActive(c)">
                  {{ c.isActive ? "Disable" : "Enable" }}
                </span>
                <span class="link-danger" style="margin-left: 14px" @click="remove(c)">Delete</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ModalCategory v-if="state.showModal" :category="state.editing" :categories="categories" @close="state.showModal = false" @saved="onSaved" />
  </div>

  <NoPermission v-else />
</template>
