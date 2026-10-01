<script setup lang="ts">
import type { PaginationInterface } from "~/interfaces/pagination.interface";

const props = defineProps<{ pagination: PaginationInterface }>();

const route = useRoute();
const router = useRouter();

// Pushes page/limit into the route query; list pages watch route.fullPath and refetch.
function goTo(page: number) {
  if (page < 1 || page > (props.pagination.totalPage || 1)) return;
  router.push({ query: { ...route.query, page: String(page), limit: String(props.pagination.limit || 10) } });
}
</script>

<template>
  <div class="pager">
    <span>{{ pagination.length || 0 }} records</span>
    <div class="pager-btns">
      <button class="btn btn-sm" :disabled="(pagination.page || 1) <= 1" @click="goTo((pagination.page || 1) - 1)">
        Prev
      </button>
      <span>Page {{ pagination.page || 1 }} / {{ pagination.totalPage || 1 }}</span>
      <button
        class="btn btn-sm"
        :disabled="(pagination.page || 1) >= (pagination.totalPage || 1)"
        @click="goTo((pagination.page || 1) + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>
