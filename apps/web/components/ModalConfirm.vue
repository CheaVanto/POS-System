<script setup lang="ts">
defineProps<{ title?: string; message?: string; busy?: boolean; confirmLabel?: string }>();
defineEmits<{ close: []; confirm: [] }>();
</script>

<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal" style="max-width: 400px">
      <div class="modal-head">
        <div class="modal-title">{{ title || "Please confirm" }}</div>
        <button class="modal-x" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <p style="margin: 0">{{ message || "Are you sure?" }}</p>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
        <button class="btn btn-danger" :disabled="busy" @click="$emit('confirm')">
          {{ busy ? "Working…" : confirmLabel || "Delete" }}
        </button>
      </div>
    </div>
  </div>
</template>
