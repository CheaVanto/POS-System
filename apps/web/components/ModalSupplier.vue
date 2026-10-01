<script setup lang="ts">
const props = defineProps<{ supplier?: any | null }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const supplierStore = useSupplierStore();
const isEdit = computed(() => !!props.supplier);

const state = reactive({
  name: props.supplier?.name || "",
  contactName: props.supplier?.contactName || "",
  email: props.supplier?.email || "",
  phone: props.supplier?.phone || "",
  address: props.supplier?.address || "",
  rating: props.supplier?.rating != null ? String(props.supplier.rating) : "",
  isSaving: false,
  error: "",
});

async function onSave() {
  state.error = "";
  if (!state.name) {
    state.error = "Name is required.";
    return;
  }
  state.isSaving = true;
  const body: any = {
    name: state.name,
    contactName: state.contactName || undefined,
    email: state.email || undefined,
    phone: state.phone || undefined,
    address: state.address || undefined,
    rating: state.rating === "" ? undefined : Number(state.rating),
  };
  const response = isEdit.value
    ? await supplierStore.update({ id: props.supplier.id, ...body })
    : await supplierStore.create(body);
  state.isSaving = false;
  if (HelperUtil.isOk(response)) emit("saved");
  else state.error = HelperUtil.errorMessage(response);
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-head">
        <div class="modal-title">{{ isEdit ? "Edit supplier" : "New supplier" }}</div>
        <button class="modal-x" @click="emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <c-input v-model="state.name" label="Name" />
        <div class="grid gap-3" style="grid-template-columns: 1fr 1fr">
          <c-input v-model="state.contactName" label="Contact" />
          <c-input v-model="state.rating" label="Rating (1-5)" type="number" min="1" />
        </div>
        <div class="grid gap-3" style="grid-template-columns: 1fr 1fr">
          <c-input v-model="state.phone" label="Phone" />
          <c-input v-model="state.email" label="Email" type="email" />
        </div>
        <c-input v-model="state.address" label="Address" />
        <div v-if="state.error" class="alert-danger">{{ state.error }}</div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" @click="emit('close')">Cancel</button>
        <button class="btn btn-primary" :disabled="state.isSaving" @click="onSave">{{ state.isSaving ? "Saving…" : "Save" }}</button>
      </div>
    </div>
  </div>
</template>
