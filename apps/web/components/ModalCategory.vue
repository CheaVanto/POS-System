<script setup lang="ts">
const props = defineProps<{ category?: any | null; categories: any[] }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const categoryStore = useCategoryStore();
const isEdit = computed(() => !!props.category);

const state = reactive({
  name: props.category?.name || "",
  parentId: props.category?.parentId || "",
  isSaving: false,
  error: "",
});

const parentOptions = computed(() =>
  props.categories
    .filter((c: any) => c.id !== props.category?.id)
    .map((c: any) => ({ value: c.id, label: c.name })),
);

async function onSave() {
  state.error = "";
  if (!state.name) {
    state.error = "Name is required.";
    return;
  }
  state.isSaving = true;
  const body: any = { name: state.name, parentId: state.parentId || null };
  const response = isEdit.value
    ? await categoryStore.update({ id: props.category.id, ...body })
    : await categoryStore.create(body);
  state.isSaving = false;
  if (HelperUtil.isOk(response)) emit("saved");
  else state.error = HelperUtil.errorMessage(response);
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal" style="max-width: 420px">
      <div class="modal-head">
        <div class="modal-title">{{ isEdit ? "Edit category" : "New category" }}</div>
        <button class="modal-x" @click="emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <c-input v-model="state.name" label="Name" placeholder="e.g. Bakery" />
        <c-select v-model="state.parentId" label="Parent (optional)" placeholder="— top level —" :options="parentOptions" />
        <div v-if="state.error" class="alert-danger">{{ state.error }}</div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" @click="emit('close')">Cancel</button>
        <button class="btn btn-primary" :disabled="state.isSaving" @click="onSave">{{ state.isSaving ? "Saving…" : "Save" }}</button>
      </div>
    </div>
  </div>
</template>
