<script setup lang="ts">
defineProps<{ currency: string; canCharge: boolean }>();
defineEmits<{ charge: [] }>();
const cartStore = useCartStore();
</script>

<template>
  <aside class="pos-cart">
    <div class="pos-cart-head">
      <strong>Current sale</strong>
      <span v-if="!cartStore.isEmpty" class="link-danger" @click="cartStore.clear()">Clear</span>
    </div>

    <div class="pos-cart-lines">
      <div v-if="cartStore.isEmpty" class="center muted" style="padding: 40px 12px">
        Tap a product to start a sale.
      </div>
      <div v-for="line in cartStore.lines" :key="line.product.id" class="pos-line">
        <div class="flex-1">
          <div style="font-weight: 600">{{ line.product.name }}</div>
          <div class="muted" style="font-size: 12px">
            {{ HelperUtil.formatMoney(line.product.sellPrice, currency) }} each
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="qty-btn" @click="cartStore.setQuantity(line.product.id, line.quantity - 1)">−</button>
          <span style="width: 22px; text-align: center; font-weight: 600">{{ line.quantity }}</span>
          <button class="qty-btn" @click="cartStore.setQuantity(line.product.id, line.quantity + 1)">+</button>
        </div>
        <div style="width: 72px; text-align: right; font-weight: 700">
          {{ HelperUtil.formatMoney(line.product.sellPrice * line.quantity, currency) }}
        </div>
      </div>
    </div>

    <div class="pos-cart-foot">
      <div class="flex justify-between muted mb-2"><span>Subtotal</span><span>{{ HelperUtil.formatMoney(cartStore.subtotal, currency) }}</span></div>
      <div v-if="cartStore.discountTotal" class="flex justify-between muted mb-2"><span>Discount</span><span>−{{ HelperUtil.formatMoney(cartStore.discountTotal, currency) }}</span></div>
      <div class="flex justify-between muted mb-2"><span>Tax</span><span>{{ HelperUtil.formatMoney(cartStore.taxTotal, currency) }}</span></div>
      <div class="flex justify-between" style="font-size: 18px; font-weight: 800; border-top: 1px solid var(--line); padding-top: 10px; margin-top: 4px">
        <span>Total</span><span>{{ HelperUtil.formatMoney(cartStore.grandTotal, currency) }}</span>
      </div>
      <button class="btn btn-primary btn-block" style="margin-top: 12px; padding: 14px; font-size: 16px" :disabled="cartStore.isEmpty || !canCharge" @click="$emit('charge')">
        Charge {{ HelperUtil.formatMoney(cartStore.grandTotal, currency) }}
      </button>
    </div>
  </aside>
</template>
