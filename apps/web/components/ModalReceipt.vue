<script setup lang="ts">
defineProps<{ order: any; currency: string }>();
defineEmits<{ newSale: [] }>();
</script>

<template>
  <div class="modal-backdrop">
    <div class="modal" style="max-width: 380px">
      <div class="center" style="background: var(--ok); color: #fff; padding: 20px">
        <div style="font-size: 30px">✓</div>
        <div style="font-weight: 700; font-size: 17px">Sale complete</div>
        <div style="opacity: .85; font-size: 13px">{{ order.number }}</div>
      </div>
      <div class="modal-body">
        <table class="table" style="font-size: 13px">
          <tbody>
            <tr v-for="item in order.items" :key="item.id">
              <td>{{ item.quantity }} × {{ item.nameSnapshot }}</td>
              <td class="right" style="font-weight: 600">{{ HelperUtil.formatMoney(item.lineTotal, currency) }}</td>
            </tr>
          </tbody>
        </table>
        <div style="border-top: 1px solid var(--line); margin-top: 10px; padding-top: 10px">
          <div class="flex justify-between muted mb-2"><span>Subtotal</span><span>{{ HelperUtil.formatMoney(order.subtotal, currency) }}</span></div>
          <div class="flex justify-between muted mb-2"><span>Tax</span><span>{{ HelperUtil.formatMoney(order.taxTotal, currency) }}</span></div>
          <div class="flex justify-between" style="font-weight: 800"><span>Total</span><span>{{ HelperUtil.formatMoney(order.grandTotal, currency) }}</span></div>
          <div v-if="order.changeDue" class="flex justify-between" style="color: var(--ok); font-weight: 700; margin-top: 4px"><span>Change</span><span>{{ HelperUtil.formatMoney(order.changeDue, currency) }}</span></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-primary btn-block" @click="$emit('newSale')">New sale</button>
      </div>
    </div>
  </div>
</template>
