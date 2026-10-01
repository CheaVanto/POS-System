<script setup lang="ts">
import dayjs from "dayjs";

definePageMeta({ middleware: "unauthorized" });

const reportStore = useReportStore();
const mainStore = useMainStore();

const pageName = "report:read";
const hasPagePermission = computed(() => HelperUtil.can(pageName));

const state = reactive({
  isLoading: true,
  from: dayjs().subtract(29, "day").format("YYYY-MM-DD"),
  to: dayjs().format("YYYY-MM-DD"),
  branchId: "",
  exporting: false,
});

const report = computed(() => reportStore.getSales);
const currency = computed(() => mainStore.getCurrency);
const branches = computed(() => mainStore.getBranches);

function buildParams() {
  let p = `?from=${state.from}&to=${state.to}`;
  if (state.branchId) p += `&branchId=${state.branchId}`;
  return p;
}

async function run() {
  state.isLoading = true;
  await reportStore.fetchSales(buildParams());
  state.isLoading = false;
}

async function exportCsv() {
  state.exporting = true;
  const response = await reportStore.exportSalesCsv(buildParams() + "&format=csv");
  state.exporting = false;
  if (HelperUtil.isOk(response)) {
    const url = URL.createObjectURL((response as any).data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${state.from}_${state.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    useNuxtApp().$toast.error("Export failed");
  }
}

onMounted(async () => {
  await mainStore.fetchContext();
  await run();
});
</script>

<template>
  <div class="page" v-if="hasPagePermission">
    <div class="flex justify-between items-end mb-6 wrap gap-3">
      <div>
        <h1 style="font-size: 22px">Sales report</h1>
        <p class="muted">Filter by period and branch, then export</p>
      </div>
      <button class="btn btn-primary" :disabled="state.exporting" @click="exportCsv">
        <Icon name="download" :size="16" /> {{ state.exporting ? "Exporting…" : "Export CSV" }}
      </button>
    </div>

    <div class="card card-pad flex items-end gap-3 wrap mb-4">
      <c-input v-model="state.from" label="From" type="date" />
      <c-input v-model="state.to" label="To" type="date" />
      <c-select v-if="branches.length > 1" v-model="state.branchId" label="Branch" placeholder="All branches" :options="branches.map((b: any) => ({ value: b.id, label: b.name }))" />
      <button class="btn" style="background: var(--ink); color: #fff" @click="run">Apply</button>
    </div>

    <CardLoading v-if="state.isLoading" />
    <template v-else-if="report.summary">
      <div class="kpi-grid mb-6">
        <div class="card kpi"><div class="kpi-label">Orders</div><div class="kpi-value">{{ report.summary.orders }}</div></div>
        <div class="card kpi"><div class="kpi-label">Gross sales</div><div class="kpi-value" style="color: var(--brand)">{{ HelperUtil.formatMoney(report.summary.grossSales, currency) }}</div></div>
        <div class="card kpi"><div class="kpi-label">Discounts</div><div class="kpi-value">{{ HelperUtil.formatMoney(report.summary.discountTotal, currency) }}</div></div>
        <div class="card kpi"><div class="kpi-label">Tax</div><div class="kpi-value">{{ HelperUtil.formatMoney(report.summary.taxTotal, currency) }}</div></div>
        <div class="card kpi"><div class="kpi-label">Net sales</div><div class="kpi-value" style="color: var(--ok)">{{ HelperUtil.formatMoney(report.summary.netSales, currency) }}</div></div>
        <div class="card kpi"><div class="kpi-label">Avg order</div><div class="kpi-value">{{ HelperUtil.formatMoney(report.summary.avgOrderValue, currency) }}</div></div>
      </div>

      <div class="card">
        <div class="flex justify-between items-center" style="padding: 14px 18px; border-bottom: 1px solid var(--line)">
          <strong>Transactions</strong>
          <span class="muted">{{ (report.rows || []).length }} orders</span>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr><th>Receipt</th><th>Date</th><th>Customer</th><th class="center">Items</th><th>Payments</th><th class="right">Tax</th><th class="right">Total</th></tr>
            </thead>
            <tbody>
              <tr v-if="!(report.rows || []).length"><td colspan="7"><CardNoData message="No transactions." /></td></tr>
              <tr v-for="r in report.rows" :key="r.id">
                <td style="font-weight: 600">{{ r.number }}</td>
                <td class="muted">{{ HelperUtil.formatDate(r.date, "DD-MMM-YYYY") }}</td>
                <td class="muted">{{ r.customer }}</td>
                <td class="center muted">{{ r.items }}</td>
                <td class="muted">{{ r.payments }}</td>
                <td class="right muted">{{ HelperUtil.formatMoney(r.taxTotal, currency) }}</td>
                <td class="right" style="font-weight: 700">{{ HelperUtil.formatMoney(r.grandTotal, currency) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>

  <NoPermission v-else />
</template>
