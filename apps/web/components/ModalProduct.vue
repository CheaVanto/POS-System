<script setup lang="ts">
const props = defineProps<{ product?: any | null; categories: any[] }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const productStore = useProductStore();
const isEdit = computed(() => !!props.product);

const state = reactive({
  name: props.product?.name || "",
  sku: props.product?.sku || "",
  barcode: props.product?.barcode || "",
  categoryId: props.product?.categoryId || "",
  sellPrice: props.product ? (props.product.sellPrice / 100).toFixed(2) : "",
  costPrice: props.product ? (props.product.costPrice / 100).toFixed(2) : "",
  taxPercent: props.product?.taxRateBps != null ? String(props.product.taxRateBps / 100) : "",
  file: null as File | null,
  localPreview: "",
  isSaving: false,
  error: "",
});

const previewSrc = computed(() => state.localPreview || HelperUtil.mediaUrl(props.product?.imageUrl));
const categoryOptions = computed(() =>
  props.categories.map((c: any) => ({ value: c.id, label: c.name })),
);

function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] || null;
  state.file = f;
  state.localPreview = f ? URL.createObjectURL(f) : "";
}

async function onSave() {
  state.error = "";
  if (!state.name || !state.sku || state.sellPrice === "") {
    state.error = "Name, SKU and sell price are required.";
    return;
  }
  state.isSaving = true;

  const body: any = {
    name: state.name,
    sku: state.sku,
    barcode: state.barcode || undefined,
    categoryId: state.categoryId || undefined,
    sellPrice: HelperUtil.toMinor(state.sellPrice),
    costPrice: state.costPrice === "" ? undefined : HelperUtil.toMinor(state.costPrice),
    taxRateBps: state.taxPercent === "" ? undefined : Math.round(parseFloat(state.taxPercent) * 100),
  };

  const response = isEdit.value
    ? await productStore.update({ id: props.product.id, ...body })
    : await productStore.create(body);

  if (!HelperUtil.isOk(response)) {
    state.error = HelperUtil.errorMessage(response);
    state.isSaving = false;
    return;
  }

  if (state.file) {
    const savedId = (response as any).data.id;
    await productStore.uploadImage(savedId, state.file);
  }

  state.isSaving = false;
  emit("saved");
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-head">
        <div class="modal-title">{{ isEdit ? "Edit product" : "New product" }}</div>
        <button class="modal-x" @click="emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="flex items-center gap-4 mb-4">
          <img v-if="previewSrc" :src="previewSrc" class="thumb" style="width: 72px; height: 72px" />
          <div v-else class="thumb center" style="width: 72px; height: 72px; display: grid; place-items: center; color: var(--muted)">▦</div>
          <label class="btn btn-sm">
            {{ previewSrc ? "Change image" : "Upload image" }}
            <input type="file" accept="image/*" hidden @change="onFile" />
          </label>
        </div>

        <c-input v-model="state.name" label="Name" placeholder="Product name" />

        <div class="grid gap-3" style="grid-template-columns: 1fr 1fr">
          <c-input v-model="state.sku" label="SKU" placeholder="SKU-001" />
          <c-input v-model="state.barcode" label="Barcode" placeholder="Optional" />
        </div>

        <c-select v-model="state.categoryId" label="Category" placeholder="— none —" :options="categoryOptions" />

        <div class="grid gap-3" style="grid-template-columns: 1fr 1fr 1fr">
          <c-input v-model="state.sellPrice" label="Sell" type="number" step="0.01" min="0" />
          <c-input v-model="state.costPrice" label="Cost" type="number" step="0.01" min="0" />
          <c-input v-model="state.taxPercent" label="Tax %" type="number" step="0.1" min="0" placeholder="default" />
        </div>

        <div v-if="state.error" class="alert-danger">{{ state.error }}</div>
      </div>

      <div class="modal-foot">
        <button class="btn btn-ghost" @click="emit('close')">Cancel</button>
        <button class="btn btn-primary" :disabled="state.isSaving" @click="onSave">
          {{ state.isSaving ? "Saving…" : "Save" }}
        </button>
      </div>
    </div>
  </div>
</template>
