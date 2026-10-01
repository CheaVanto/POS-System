<script setup lang="ts">
defineProps<{
  modelValue: string | number;
  type?: string;
  placeholder?: string;
  label?: string;
  step?: string;
  min?: string;
}>();
defineEmits<{ "update:modelValue": [value: string]; enter: [] }>();
</script>

<template>
  <div :class="label ? 'field' : ''">
    <label v-if="label" class="label">{{ label }}</label>
    <input
      class="input"
      :type="type || 'text'"
      :placeholder="placeholder"
      :step="step"
      :min="min"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keyup.enter="$emit('enter')"
    />
  </div>
</template>
