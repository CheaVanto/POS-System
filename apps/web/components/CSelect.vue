<script setup lang="ts">
defineProps<{
  modelValue: string | number | null;
  label?: string;
  options: { value: any; label: string }[];
  placeholder?: string;
}>();
defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<template>
  <div :class="label ? 'field' : ''">
    <label v-if="label" class="label">{{ label }}</label>
    <select
      class="select"
      :value="modelValue ?? ''"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option v-for="opt in options" :key="String(opt.value)" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>
