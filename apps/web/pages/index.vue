<script setup lang="ts">
definePageMeta({ middleware: "unauthorized" });

const reportStore = useReportStore();
const mainStore = useMainStore();

const pageName = "report:read";
const hasPagePermission = computed(() => HelperUtil.can(pageName));

const state = reactive({ isLoading: true });

const dashboard = computed(() => reportStore.getDashboard);
const currency = computed(() => mainStore.getCurrency);
const maxTop = computed(() =>
  Math.max(1, ...(dashboard.value.topProducts || []).map((p: any) => p.revenue)),
);

async function fetchData() {
  state.isLoading = true;
  await Promise.all([mainStore.fetchContext(), reportStore.fetchDashboard()]);
  state.isLoading = false;
}

onMounted(fetchData);
</script>

<template>
  <div class="page" v-if="hasPagePermission">
    <div class="mb-6">
      <h1 style="font-size: 22px">Dashboard</h1>
      <p class="muted">Live overview of your store</p>
    </div>

    <CardLoading v-if="state.isLoading" />

    <template v-else>
      <div class="kpi-grid mb-6">
        <div class="card kpi">
          <div class="kpi-label">Sales today</div>
          <div class="kpi-value" style="color: var(--brand)">
            {{ HelperUtil.formatMoney(dashboard.today?.revenue || 0, currency) }}
          </div>
          <div class="kpi-sub">{{ dashboard.today?.orders || 0 }} orders</div>
        </div>
        <div class="card kpi">
          <div class="kpi-label">All-time revenue</div>
          <div class="kpi-value">{{ HelperUtil.formatMoney(dashboard.allTime?.revenue || 0, currency) }}</div>
          <div class="kpi-sub">{{ dashboard.allTime?.orders || 0 }} orders</div>
        </div>
        <div class="card kpi">
          <div class="kpi-label">Inventory value</div>
          <div class="kpi-value">{{ HelperUtil.formatMoney(dashboard.inventoryValue || 0, currency) }}</div>
          <div class="kpi-sub">at avg cost</div>
        </div>
        <div class="card kpi">
          <div class="kpi-label">Low stock</div>
          <div class="kpi-value" :style="{ color: dashboard.lowStockCount ? 'var(--warn)' : 'var(--ok)' }">
            {{ dashboard.lowStockCount || 0 }}
          </div>
          <div class="kpi-sub">at/below reorder</div>
        </div>
      </div>

      <div class="grid gap-4" style="grid-template-columns: 1fr 1fr">
        <div class="card card-pad">
          <h3 class="mb-4">Top products</h3>
          <CardNoData v-if="!(dashboard.topProducts || []).length" message="No sales yet." />
          <div v-for="p in dashboard.topProducts" :key="p.productId" class="mb-4">
            <div class="flex justify-between mb-2" style="font-size: 13px">
              <span style="font-weight: 600">{{ p.name }}</span>
              <span class="muted">{{ HelperUtil.formatMoney(p.revenue, currency) }} · {{ p.quantity }} sold</span>
            </div>
            <div style="height: 8px; background: #eef1f6; border-radius: 999px; overflow: hidden">
              <div :style="{ width: Math.round((p.revenue / maxTop) * 100) + '%', height: '100%', background: 'var(--brand)', borderRadius: '999px' }"></div>
            </div>
          </div>
        </div>

        <div class="card card-pad">
          <div class="flex justify-between items-center mb-4">
            <h3>Recent orders</h3>
            <NuxtLink to="/sale" class="link">View all</NuxtLink>
          </div>
          <CardNoData v-if="!(dashboard.recentOrders || []).length" message="No orders yet." />
          <table v-else class="table">
            <tbody>
              <tr v-for="o in dashboard.recentOrders" :key="o.id">
                <td style="font-weight: 600">{{ o.number }}</td>
                <td class="muted">{{ o.itemCount }} items</td>
                <td><span class="badge badge-ok">{{ o.status }}</span></td>
                <td class="right" style="font-weight: 700">{{ HelperUtil.formatMoney(o.grandTotal, currency) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>

  <NoPermission v-else />
</template>
