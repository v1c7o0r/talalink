import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Users,
  Search,
  Menu,
  Bell,
  ChevronDown,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  UserCheck,
  Shield,
  RefreshCw,
  X,
  Pencil,
  Trash2,
  Plus,
  Image as ImageIcon,
  Save,
  ShoppingCart,
  PackageCheck,
  Package,
  DollarSign,
  Wallet,
  BarChart3,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

const API_BASE = "http://127.0.0.1:5000";
const CHART_COLORS = [
  "#2563eb",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];

const ORDER_COMMISSION_RATE = 0.05; // 5%
const MAINTENANCE_COMMISSION_RATE = 0.02; // 2% of maintenance fee

const cardBase =
  "rounded-2xl border border-blue-900/40 bg-[#0b1220] shadow-[0_10px_30px_rgba(0,0,0,0.35)]";
const panelBase =
  "rounded-2xl border border-blue-900/40 bg-[#0f172a] shadow-[0_10px_30px_rgba(0,0,0,0.28)]";

function formatMoney(value) {
  return `KES ${Number(value || 0).toLocaleString()}`;
}

function formatDateLabel(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", { month: "short" });
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getDateValue(item) {
  return (
    item?.created_at ||
    item?.date_created ||
    item?.timestamp ||
    item?.requested_at ||
    item?.updated_at ||
    item?.date ||
    null
  );
}

function getListingStatus(item) {
  return (
    item?.status ||
    item?.listing_status ||
    item?.approval_status ||
    "active"
  )
    .toString()
    .toLowerCase();
}

function getMaintenanceStatus(item) {
  return (
    item?.status ||
    item?.request_status ||
    item?.maintenance_status ||
    "pending"
  )
    .toString()
    .toLowerCase();
}

function getOrderStatus(item) {
  return (item?.status || "pending").toString().toLowerCase();
}

function getUserRole(user) {
  if (user?.is_admin === true || user?.role === "admin") return "admin";
  return "user";
}

function buildMonthlySeries(listings, maintenance, orders) {
  const bucket = {};

  listings.forEach((item) => {
    const rawDate = getDateValue(item);
    const label = rawDate ? formatDateLabel(rawDate) : "Unknown";
    if (!bucket[label]) {
      bucket[label] = { month: label, listings: 0, maintenance: 0, orders: 0 };
    }
    bucket[label].listings += 1;
  });

  maintenance.forEach((item) => {
    const rawDate = getDateValue(item);
    const label = rawDate ? formatDateLabel(rawDate) : "Unknown";
    if (!bucket[label]) {
      bucket[label] = { month: label, listings: 0, maintenance: 0, orders: 0 };
    }
    bucket[label].maintenance += 1;
  });

  orders.forEach((item) => {
    const rawDate = getDateValue(item);
    const label = rawDate ? formatDateLabel(rawDate) : "Unknown";
    if (!bucket[label]) {
      bucket[label] = { month: label, listings: 0, maintenance: 0, orders: 0 };
    }
    bucket[label].orders += 1;
  });

  const monthOrder = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Unknown",
  ];

  return Object.values(bucket).sort(
    (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
  );
}

function buildListingStatusData(listings) {
  const counts = {
    active: 0,
    pending: 0,
    sold: 0,
    rejected: 0,
    other: 0,
  };

  listings.forEach((item) => {
    const status = getListingStatus(item);
    if (counts[status] !== undefined) counts[status] += 1;
    else counts.other += 1;
  });

  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));
}

function buildMaintenanceStatusData(maintenance) {
  const counts = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    rejected: 0,
    other: 0,
  };

  maintenance.forEach((item) => {
    const status = getMaintenanceStatus(item).replace(/\s+/g, "_");
    if (counts[status] !== undefined) counts[status] += 1;
    else counts.other += 1;
  });

  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
    }));
}

function buildOrderStatusData(orders) {
  const counts = {
    pending: 0,
    confirmed: 0,
    delivered: 0,
    completed: 0,
    cancelled: 0,
    other: 0,
  };

  orders.forEach((item) => {
    const status = getOrderStatus(item);
    if (counts[status] !== undefined) counts[status] += 1;
    else counts.other += 1;
  });

  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));
}

function buildMonthlyRevenueSeries(orders, maintenance) {
  const bucket = {};

  orders.forEach((item) => {
    const rawDate = getDateValue(item);
    const label = rawDate ? formatDateLabel(rawDate) : "Unknown";

    if (!bucket[label]) {
      bucket[label] = {
        month: label,
        orderValue: 0,
        orderCommission: 0,
        maintenanceCut: 0,
      };
    }

    const status = getOrderStatus(item);
    const total = Number(item?.total_price || 0);

    if (status !== "cancelled") {
      bucket[label].orderValue += total;
      bucket[label].orderCommission += total * ORDER_COMMISSION_RATE;
    }
  });

  maintenance.forEach((item) => {
    const rawDate = getDateValue(item);
    const label = rawDate ? formatDateLabel(rawDate) : "Unknown";

    if (!bucket[label]) {
      bucket[label] = {
        month: label,
        orderValue: 0,
        orderCommission: 0,
        maintenanceCut: 0,
      };
    }

    const status = getMaintenanceStatus(item);
    const maintenanceFee = Number(item?.maintenance_fee || 0);

    if (status !== "rejected") {
      bucket[label].maintenanceCut +=
        maintenanceFee * MAINTENANCE_COMMISSION_RATE;
    }
  });

  const monthOrder = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Unknown",
  ];

  return Object.values(bucket).sort(
    (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
  );
}

function getAuthHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("adminToken");

  return token ? { Authorization: `Bearer ${token}` } : {};
}

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  config.headers = {
    ...(config.headers || {}),
    ...getAuthHeaders(),
  };
  return config;
});

function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-blue-900/40 bg-[#081120] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function InputField({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-blue-900/50 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
      />
    </label>
  );
}

function SelectField({ label, children, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <select
        {...props}
        className="w-full rounded-xl border border-blue-900/50 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
      >
        {children}
      </select>
    </label>
  );
}

function TextAreaField({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <textarea
        {...props}
        className="min-h-[110px] w-full rounded-xl border border-blue-900/50 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
      />
    </label>
  );
}

// eslint-disable-next-line no-unused-vars
function StatCard({ title, value, subtitle, icon: Icon, accent = "blue" }) {
  const accentClasses = {
    blue: "from-blue-600/20 to-cyan-500/10 border-blue-500/30",
    green: "from-emerald-600/20 to-teal-500/10 border-emerald-500/30",
    yellow: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
    red: "from-rose-600/20 to-red-500/10 border-rose-500/30",
    purple: "from-violet-600/20 to-fuchsia-500/10 border-violet-500/30",
  };

  return (
    <div
      className={`${cardBase} border ${accentClasses[accent]} bg-gradient-to-br p-5`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-white">{value}</h3>
        </div>
        <div className="rounded-2xl bg-slate-900/70 p-3 text-blue-400">
          <Icon size={22} />
        </div>
      </div>
      <p className="text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function SidebarLink({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/admin"}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
          isActive
            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

function DashboardOverview({
  loading,
  totalUsers,
  verifiedUsers,
  totalListings,
  activeListings,
  pendingListings,
  totalMaintenance,
  pendingMaintenance,
  completedMaintenance,
  // eslint-disable-next-line no-unused-vars
  adminCount,
  totalOrders,
  pendingOrders,
  completedOrders,
  cancelledOrders,
  totalCartItems,
  grossOrderValue,
  totalOrderCommission,
  totalMaintenanceCommission,
  totalPlatformRevenue,
  chartData,
  listingStatusData,
  recentActivity,
  maintenanceStatusData,
  orderStatusData,
  revenueChartData,
  topUsers,
}) {
  return (
    <>
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Users"
          value={loading ? "..." : totalUsers}
          subtitle={`${verifiedUsers} verified accounts`}
          icon={Users}
          accent="blue"
        />
        <StatCard
          title="Total Listings"
          value={loading ? "..." : totalListings}
          subtitle={`${activeListings} active · ${pendingListings} pending`}
          icon={ClipboardList}
          accent="green"
        />
        <StatCard
          title="Maintenance Requests"
          value={loading ? "..." : totalMaintenance}
          subtitle={`${pendingMaintenance} pending · ${completedMaintenance} completed`}
          icon={Wrench}
          accent="yellow"
        />
        <StatCard
          title="Total Orders"
          value={loading ? "..." : totalOrders}
          subtitle={`${pendingOrders} pending · ${completedOrders} completed`}
          icon={Package}
          accent="purple"
        />
        <StatCard
          title="Platform Revenue"
          value={loading ? "..." : formatMoney(totalPlatformRevenue)}
          subtitle="Order cut + maintenance cut"
          icon={Wallet}
          accent="red"
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Order Commission"
          value={loading ? "..." : formatMoney(totalOrderCommission)}
          subtitle="5% of non-cancelled orders"
          icon={DollarSign}
          accent="blue"
        />
        <StatCard
          title="Maintenance Cut"
          value={loading ? "..." : formatMoney(totalMaintenanceCommission)}
          subtitle="2% of maintenance fee"
          icon={Wrench}
          accent="green"
        />
        <StatCard
          title="Gross Order Value"
          value={loading ? "..." : formatMoney(grossOrderValue)}
          subtitle={`${cancelledOrders} cancelled orders excluded`}
          icon={PackageCheck}
          accent="yellow"
        />
        <StatCard
          title="Cart Items"
          value={loading ? "..." : totalCartItems}
          subtitle="All items currently in carts"
          icon={ShoppingCart}
          accent="purple"
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className={`${panelBase} xl:col-span-2 p-5`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Platform Activity Trend</h2>
              <p className="text-sm text-slate-400">
                Monthly listings, maintenance, and orders
              </p>
            </div>
            <div className="rounded-xl bg-blue-600/10 px-3 py-2 text-sm text-blue-300">
              <TrendingUp size={16} className="mr-2 inline" />
              Live overview
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="listingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="maintenanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0b1220",
                    border: "1px solid #1e3a8a",
                    borderRadius: "14px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="listings"
                  stroke="#2563eb"
                  fill="url(#listingFill)"
                  strokeWidth={3}
                  name="Listings"
                />
                <Area
                  type="monotone"
                  dataKey="maintenance"
                  stroke="#06b6d4"
                  fill="url(#maintenanceFill)"
                  strokeWidth={3}
                  name="Maintenance"
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#8b5cf6"
                  fill="url(#ordersFill)"
                  strokeWidth={3}
                  name="Orders"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${panelBase} p-5`}>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Listing Status</h2>
            <p className="text-sm text-slate-400">
              Distribution of listing states
            </p>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={listingStatusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {listingStatusData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0b1220",
                    border: "1px solid #1e3a8a",
                    borderRadius: "14px",
                    color: "#fff",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={`${panelBase} p-5`}>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Order Status</h2>
            <p className="text-sm text-slate-400">
              Current order workflow distribution
            </p>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={5}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0b1220",
                    border: "1px solid #1e3a8a",
                    borderRadius: "14px",
                    color: "#fff",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${panelBase} p-5`}>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">
              Maintenance Summary
            </h2>
            <p className="text-sm text-slate-400">
              Current request status breakdown
            </p>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceStatusData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0b1220",
                    border: "1px solid #1e3a8a",
                    borderRadius: "14px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={`${panelBase} p-5`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Revenue Analytics</h2>
              <p className="text-sm text-slate-400">
                Gross order value, order commission, and maintenance platform cut
              </p>
            </div>
            <BarChart3 size={18} className="text-blue-400" />
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  formatter={(value) => formatMoney(value)}
                  contentStyle={{
                    backgroundColor: "#0b1220",
                    border: "1px solid #1e3a8a",
                    borderRadius: "14px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Bar dataKey="orderValue" fill="#2563eb" radius={[8, 8, 0, 0]} name="Gross Order Value" />
                <Bar dataKey="orderCommission" fill="#22c55e" radius={[8, 8, 0, 0]} name="Order Commission" />
                <Bar dataKey="maintenanceCut" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Maintenance Cut" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${panelBase} p-5`}>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Finance Snapshot</h2>
            <p className="text-sm text-slate-400">
              Platform owner earnings summary
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-900/40 bg-[#0b1220] p-4">
              <p className="text-sm text-slate-400">Gross Order Value</p>
              <h3 className="mt-2 text-3xl font-bold text-white">{formatMoney(grossOrderValue)}</h3>
              <p className="mt-2 text-sm text-slate-500">
                Based on all non-cancelled orders
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-900/40 bg-[#0b1220] p-4">
              <p className="text-sm text-slate-400">Order Commission Revenue</p>
              <h3 className="mt-2 text-3xl font-bold text-emerald-400">
                {formatMoney(totalOrderCommission)}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                5% taken from each non-cancelled order
              </p>
            </div>

            <div className="rounded-2xl border border-amber-900/40 bg-[#0b1220] p-4">
              <p className="text-sm text-slate-400">Maintenance Commission Revenue</p>
              <h3 className="mt-2 text-3xl font-bold text-amber-400">
                {formatMoney(totalMaintenanceCommission)}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                2% of maintenance fee
              </p>
            </div>

            <div className="rounded-2xl border border-violet-900/40 bg-[#0b1220] p-4">
              <p className="text-sm text-slate-400">Total Platform Revenue</p>
              <h3 className="mt-2 text-3xl font-bold text-violet-400">
                {formatMoney(totalPlatformRevenue)}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Combined owner earnings from the platform
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className={`${panelBase} xl:col-span-2 p-5`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <p className="text-sm text-slate-400">
                Latest items from listings, maintenance, and orders
              </p>
            </div>
            <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-slate-400">
              Filtered by search
            </div>
          </div>

          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
                No activity found.
              </div>
            ) : (
              recentActivity.map((item) => {
                const isMaintenance = item.type === "Maintenance";
                const isOrder = item.type === "Order";
                const isCompleted =
                  item.status === "completed" ||
                  item.status === "resolved" ||
                  item.status === "delivered";
                const isPending =
                  item.status === "pending" ||
                  item.status === "open" ||
                  item.status === "confirmed";

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`rounded-2xl p-3 ${
                          isMaintenance
                            ? "bg-cyan-500/10 text-cyan-400"
                            : isOrder
                            ? "bg-violet-500/10 text-violet-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {isMaintenance ? (
                          <Wrench size={18} />
                        ) : isOrder ? (
                          <Package size={18} />
                        ) : (
                          <ClipboardList size={18} />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {item.type} • {item.owner}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.date
                            ? new Date(item.date).toLocaleString()
                            : "No date available"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                          <CheckCircle2 size={14} />
                          {item.status}
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                          <Clock3 size={14} />
                          {item.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400">
                          <AlertTriangle size={14} />
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={`${panelBase} p-5`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">User Snapshot</h2>
              <p className="text-sm text-slate-400">
                Quick view of registered users
              </p>
            </div>
            <Link
              to="/admin/users"
              className="rounded-xl border border-blue-800/50 bg-blue-600/10 px-4 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-600/20"
            >
              View all
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="px-3 py-3">Username</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Verified</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-3 py-6 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  topUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-900/70 text-slate-300"
                    >
                      <td className="px-3 py-4 font-medium text-white">
                        {user.username}
                      </td>
                      <td className="px-3 py-4">{user.email}</td>
                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-slate-700/50 text-slate-300"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        {user.verified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <UserCheck size={14} />
                            Yes
                          </span>
                        ) : (
                          <span className="text-amber-400">No</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={`${panelBase} p-5`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Quick Routes</h2>
              <p className="text-sm text-slate-400">
                Navigate to admin operations
              </p>
            </div>
            <Activity size={18} className="text-blue-400" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              to="/admin/listings"
              className="rounded-2xl border border-blue-900/40 bg-[#0b1220] p-5 transition hover:-translate-y-1 hover:border-blue-500/60"
            >
              <ClipboardList className="mb-4 text-blue-400" size={22} />
              <h3 className="font-semibold text-white">Listings</h3>
              <p className="mt-2 text-sm text-slate-400">
                Manage all property or product listings.
              </p>
            </Link>

            <Link
              to="/admin/maintenance"
              className="rounded-2xl border border-blue-900/40 bg-[#0b1220] p-5 transition hover:-translate-y-1 hover:border-cyan-500/60"
            >
              <Wrench className="mb-4 text-cyan-400" size={22} />
              <h3 className="font-semibold text-white">Maintenance</h3>
              <p className="mt-2 text-sm text-slate-400">
                Review requests, updates, and statuses.
              </p>
            </Link>

            <Link
              to="/admin/users"
              className="rounded-2xl border border-blue-900/40 bg-[#0b1220] p-5 transition hover:-translate-y-1 hover:border-emerald-500/60"
            >
              <Users className="mb-4 text-emerald-400" size={22} />
              <h3 className="font-semibold text-white">Users</h3>
              <p className="mt-2 text-sm text-slate-400">
                View user accounts and admin access.
              </p>
            </Link>
          </div>
        </div>

        <div className={`${panelBase} p-5`}>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Owner Notes</h2>
            <p className="text-sm text-slate-400">
              Revenue rules currently applied in dashboard analytics
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-[#0b1220] p-4">
              <p className="text-sm font-semibold text-white">Order Commission Rule</p>
              <p className="mt-2 text-sm text-slate-400">
                Each non-cancelled order contributes <span className="text-emerald-400 font-semibold">5%</span> of
                its total price to the app owner.
              </p>
            </div>

            <div className="rounded-2xl bg-[#0b1220] p-4">
              <p className="text-sm font-semibold text-white">Maintenance Commission Rule</p>
              <p className="mt-2 text-sm text-slate-400">
                Each maintenance request contributes <span className="text-amber-400 font-semibold">2%</span> of the
                maintenance fee to the app owner.
              </p>
            </div>

            <div className="rounded-2xl bg-[#0b1220] p-4">
              <p className="text-sm font-semibold text-white">Cart Analytics</p>
              <p className="mt-2 text-sm text-slate-400">
                This dashboard can show total cart item count from admin stats.
                For full cart charts by user, date, or listing, add a backend admin cart endpoint.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ListingsPanel({
  listings,
  onCreate,
  onEdit,
  onDelete,
}) {
  return (
    <section className={`${panelBase} p-5`}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Listings</h2>
          <p className="text-sm text-slate-400">All listing records</p>
        </div>

        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-700/50 bg-emerald-600/10 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-600/20"
        >
          <Plus size={16} />
          Add Listing
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
            No listings found.
          </div>
        ) : (
          listings.map((item) => (
            <div
              key={item?.id}
              className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1220]"
            >
              <div className="h-56 w-full overflow-hidden bg-slate-900">
                {item?.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item?.title || "Listing"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-500">
                    <div className="text-center">
                      <ImageIcon className="mx-auto mb-2" size={28} />
                      <p className="text-sm">No image</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {item?.title || item?.name || "Listing"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {item?.category || "General"} • {item?.location || "Unknown"}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                    {getListingStatus(item)}
                  </span>
                </div>

                <p className="line-clamp-3 text-sm text-slate-400">
                  {item?.description || "No description"}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-900/70 p-3">
                    <p className="text-slate-500">Price</p>
                    <p className="mt-1 font-semibold text-white">
                      KES {Number(item?.price || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-900/70 p-3">
                    <p className="text-slate-500">Owner</p>
                    <p className="mt-1 font-semibold text-white">
                      {item?.author_username || item?.username || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {getDateValue(item)
                      ? new Date(getDateValue(item)).toLocaleString()
                      : "No date"}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-800/60 bg-blue-600/10 px-3 py-2 text-sm text-blue-300 hover:bg-blue-600/20"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-800/60 bg-rose-600/10 px-3 py-2 text-sm text-rose-300 hover:bg-rose-600/20"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function MaintenancePanel({ maintenance }) {
  return (
    <section className={`${panelBase} p-5`}>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">Maintenance</h2>
        <p className="text-sm text-slate-400">All maintenance requests</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="px-3 py-3">Issue</th>
              <th className="px-3 py-3">Client</th>
              <th className="px-3 py-3">Artisan</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {maintenance.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-3 py-6 text-center text-slate-500">
                  No maintenance requests found.
                </td>
              </tr>
            ) : (
              maintenance.map((item) => (
                <tr
                  key={item?.id}
                  className="border-b border-slate-900/70 text-slate-300"
                >
                  <td className="px-3 py-4 font-medium text-white">
                    {item?.item || item?.title || item?.issue || item?.subject || "Request"}
                  </td>
                  <td className="px-3 py-4">{item?.client || "Unknown"}</td>
                  <td className="px-3 py-4">{item?.artisan || "Unknown"}</td>
                  <td className="px-3 py-4">{getMaintenanceStatus(item)}</td>
                  <td className="px-3 py-4">
                    {getDateValue(item)
                      ? new Date(getDateValue(item)).toLocaleString()
                      : "No date"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UsersPanel({
  users,
  onCreate,
  onEdit,
  onDelete,
}) {
  return (
    <section className={`${panelBase} p-5`}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Users</h2>
          <p className="text-sm text-slate-400">All registered users</p>
        </div>

        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-700/50 bg-emerald-600/10 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-600/20"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="px-3 py-3">Username</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Verified</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-3 py-6 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user?.id}
                  className="border-b border-slate-900/70 text-slate-300"
                >
                  <td className="px-3 py-4 font-medium text-white">
                    {user?.username || "Unknown"}
                  </td>
                  <td className="px-3 py-4">{user?.email || "No email"}</td>
                  <td className="px-3 py-4">{user?.phone_number || "-"}</td>
                  <td className="px-3 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        getUserRole(user) === "admin"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-slate-700/50 text-slate-300"
                      }`}
                    >
                      {getUserRole(user)}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    {user?.is_verified ? "Yes" : "No"}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(user)}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-800/60 bg-blue-600/10 px-3 py-2 text-sm text-blue-300 hover:bg-blue-600/20"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(user)}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-800/60 bg-rose-600/10 px-3 py-2 text-sm text-rose-300 hover:bg-rose-600/20"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [listings, setListings] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [listingForm, setListingForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    location: "",
    image_url: "",
    status: "active",
    user_id: "",
  });

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    phone_number: "",
    role: "user",
    is_verified: true,
  });

  const fetchDashboardData = async (showRefreshState = false) => {
    try {
      if (showRefreshState) setRefreshing(true);
      setError("");
      setActionMessage("");

      const [
        statsRes,
        listingsRes,
        maintenanceRes,
        usersRes,
        ordersRes,
      ] = await Promise.allSettled([
        api.get("/admin/stats"),
        api.get("/listings"),
        api.get("/maintenance"),
        api.get("/users"),
        api.get("/orders"),
      ]);

      const listingsData =
        listingsRes.status === "fulfilled"
          ? safeArray(listingsRes.value.data)
          : [];
      const maintenanceData =
        maintenanceRes.status === "fulfilled"
          ? safeArray(maintenanceRes.value.data)
          : [];
      const usersData =
        usersRes.status === "fulfilled" ? safeArray(usersRes.value.data) : [];
      const ordersData =
        ordersRes.status === "fulfilled" ? safeArray(ordersRes.value.data) : [];
      const statsData =
        statsRes.status === "fulfilled" ? statsRes.value.data : null;

      setListings(listingsData);
      setMaintenance(maintenanceData);
      setUsers(usersData);
      setOrders(ordersData);
      setStats(statsData);

      if (
        statsRes.status === "rejected" ||
        listingsRes.status === "rejected" ||
        maintenanceRes.status === "rejected" ||
        usersRes.status === "rejected" ||
        ordersRes.status === "rejected"
      ) {
        setError(
          "Some dashboard data could not be loaded. Confirm your backend admin endpoints and JWT token are working."
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.error || "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalUsers = stats?.total_users ?? users.length;
  const totalListings = stats?.total_listings ?? listings.length;
  const totalMaintenance = stats?.total_maintenance ?? maintenance.length;
  const totalOrders = stats?.total_orders ?? orders.length;
  const totalCartItems = stats?.total_cart_items ?? 0;

  const adminCount =
    stats?.admin_count ??
    users.filter((user) => getUserRole(user) === "admin").length;

  const verifiedUsers =
    stats?.verified_users ??
    users.filter((user) => user?.is_verified).length;

  const activeListings =
    stats?.active_listings ??
    listings.filter((item) => getListingStatus(item) === "active").length;

  const pendingListings =
    stats?.pending_listings ??
    listings.filter((item) => getListingStatus(item) === "pending").length;

  const pendingMaintenance =
    stats?.pending_maintenance ??
    maintenance.filter((item) => {
      const status = getMaintenanceStatus(item);
      return status === "pending" || status === "open";
    }).length;

  const completedMaintenance =
    stats?.completed_maintenance ??
    maintenance.filter((item) => {
      const status = getMaintenanceStatus(item);
      return status === "completed" || status === "resolved";
    }).length;

  const pendingOrders =
    stats?.pending_orders ??
    orders.filter((item) => {
      const status = getOrderStatus(item);
      return status === "pending" || status === "confirmed";
    }).length;

  const completedOrders =
    stats?.completed_orders ??
    orders.filter((item) => {
      const status = getOrderStatus(item);
      return status === "completed" || status === "delivered";
    }).length;

  const cancelledOrders = useMemo(
    () => orders.filter((item) => getOrderStatus(item) === "cancelled").length,
    [orders]
  );

  const grossOrderValue = useMemo(() => {
    return orders.reduce((sum, order) => {
      const status = getOrderStatus(order);
      if (status === "cancelled") return sum;
      return sum + Number(order?.total_price || 0);
    }, 0);
  }, [orders]);

  const totalOrderCommission = useMemo(() => {
    return orders.reduce((sum, order) => {
      const status = getOrderStatus(order);
      if (status === "cancelled") return sum;
      return sum + Number(order?.total_price || 0) * ORDER_COMMISSION_RATE;
    }, 0);
  }, [orders]);

  const totalMaintenanceCommission = useMemo(() => {
    return maintenance.reduce((sum, item) => {
      const status = getMaintenanceStatus(item);
      if (status === "rejected") return sum;
      return (
        sum +
        Number(item?.maintenance_fee || 0) * MAINTENANCE_COMMISSION_RATE
      );
    }, 0);
  }, [maintenance]);

  const totalPlatformRevenue = totalOrderCommission + totalMaintenanceCommission;

  const chartData = useMemo(
    () => buildMonthlySeries(listings, maintenance, orders),
    [listings, maintenance, orders]
  );

  const revenueChartData = useMemo(
    () => buildMonthlyRevenueSeries(orders, maintenance),
    [orders, maintenance]
  );

  const listingStatusData = useMemo(
    () => buildListingStatusData(listings),
    [listings]
  );

  const maintenanceStatusData = useMemo(
    () => buildMaintenanceStatusData(maintenance),
    [maintenance]
  );

  const orderStatusData = useMemo(
    () => buildOrderStatusData(orders),
    [orders]
  );

  const recentActivity = useMemo(() => {
    const listingActivity = listings.map((item) => ({
      id: `listing-${item?.id ?? Math.random()}`,
      title: item?.title || item?.name || "Listing",
      type: "Listing",
      status: getListingStatus(item),
      date: getDateValue(item),
      owner:
        item?.author_username ||
        item?.username ||
        item?.owner_name ||
        item?.seller_name ||
        item?.email ||
        "Unknown user",
    }));

    const maintenanceActivity = maintenance.map((item) => ({
      id: `maintenance-${item?.id ?? Math.random()}`,
      title:
        item?.item ||
        item?.title ||
        item?.issue ||
        item?.subject ||
        "Maintenance Request",
      type: "Maintenance",
      status: getMaintenanceStatus(item),
      date: getDateValue(item),
      owner: item?.client || item?.artisan || item?.username || "Unknown user",
    }));

    const orderActivity = orders.map((item) => ({
      id: `order-${item?.id ?? Math.random()}`,
      title: item?.item || item?.title || "Order",
      type: "Order",
      status: getOrderStatus(item),
      date: getDateValue(item),
      owner: item?.buyer || item?.seller || "Unknown user",
    }));

    return [...listingActivity, ...maintenanceActivity, ...orderActivity]
      .sort((a, b) => {
        const aTime = new Date(a.date || 0).getTime();
        const bTime = new Date(b.date || 0).getTime();
        return bTime - aTime;
      })
      .filter((item) => {
        const search = searchTerm.trim().toLowerCase();
        if (!search) return true;
        return (
          item.title.toLowerCase().includes(search) ||
          item.type.toLowerCase().includes(search) ||
          item.owner.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search)
        );
      })
      .slice(0, 10);
  }, [listings, maintenance, orders, searchTerm]);

  const topUsers = useMemo(() => {
    return users.slice(0, 6).map((user) => ({
      id: user?.id,
      username: user?.username || "Unknown",
      email: user?.email || "No email",
      role: getUserRole(user),
      verified: !!user?.is_verified,
    }));
  }, [users]);

  const pageTitle = useMemo(() => {
    if (location.pathname === "/admin/listings") return "Listings";
    if (location.pathname === "/admin/maintenance") return "Maintenance";
    if (location.pathname === "/admin/users") return "Users";
    return "Dashboard";
  }, [location.pathname]);

  const pageSubtitle = useMemo(() => {
    if (location.pathname === "/admin/listings") {
      return "Manage all listing records in one place";
    }
    if (location.pathname === "/admin/maintenance") {
      return "Review all maintenance requests and statuses";
    }
    if (location.pathname === "/admin/users") {
      return "Manage user accounts and admin access";
    }
    return "Overview of users, listings, maintenance, orders, carts, and owner revenue";
  }, [location.pathname]);

  const openCreateListing = () => {
    setEditingListing(null);
    setListingForm({
      title: "",
      description: "",
      price: "",
      category: "",
      location: "",
      image_url: "",
      status: "active",
      user_id: users[0]?.id || "",
    });
    setListingModalOpen(true);
  };

  const openEditListing = (item) => {
    setEditingListing(item);
    setListingForm({
      title: item?.title || "",
      description: item?.description || "",
      price: item?.price || "",
      category: item?.category || "",
      location: item?.location || "",
      image_url: item?.image_url || "",
      status: item?.status || "active",
      user_id: item?.user_id || "",
    });
    setListingModalOpen(true);
  };

  const submitListing = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setActionMessage("");

      if (editingListing) {
        await api.put(`/listings/${editingListing.id}`, {
          ...listingForm,
          price: Number(listingForm.price),
          user_id: Number(listingForm.user_id),
        });
        setActionMessage("Listing updated successfully.");
      } else {
        await api.post("/admin/listings", {
          ...listingForm,
          price: Number(listingForm.price),
          user_id: Number(listingForm.user_id),
        });
        setActionMessage("Listing created successfully.");
      }

      setListingModalOpen(false);
      await fetchDashboardData(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save listing.");
    }
  };

  const deleteListing = async (item) => {
    const confirmed = window.confirm(`Delete listing "${item?.title}"?`);
    if (!confirmed) return;

    try {
      setError("");
      await api.delete(`/listings/${item.id}`);
      setActionMessage("Listing deleted successfully.");
      await fetchDashboardData(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete listing.");
    }
  };

  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      username: "",
      email: "",
      password: "",
      phone_number: "",
      role: "user",
      is_verified: true,
    });
    setUserModalOpen(true);
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user?.username || "",
      email: user?.email || "",
      password: "",
      phone_number: user?.phone_number || "",
      role: getUserRole(user),
      is_verified: !!user?.is_verified,
    });
    setUserModalOpen(true);
  };

  const submitUser = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setActionMessage("");

      if (editingUser) {
        const payload = {
          username: userForm.username,
          email: userForm.email,
          phone_number: userForm.phone_number,
          role: userForm.role,
          is_verified: userForm.is_verified,
        };

        if (userForm.password.trim()) payload.password = userForm.password.trim();

        await api.put(`/users/${editingUser.id}`, payload);
        setActionMessage("User updated successfully.");
      } else {
        await api.post("/users", {
          ...userForm,
          password: userForm.password,
        });
        setActionMessage("User created successfully.");
      }

      setUserModalOpen(false);
      await fetchDashboardData(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save user.");
    }
  };

  const deleteUser = async (user) => {
    const confirmed = window.confirm(`Delete user "${user?.username}"?`);
    if (!confirmed) return;

    try {
      setError("");
      await api.delete(`/users/${user.id}`);
      setActionMessage("User deleted successfully.");
      await fetchDashboardData(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete user.");
    }
  };

  const sidebar = (
    <>
      <div className="flex items-center justify-between border-b border-blue-950/50 px-5 py-5">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-600 p-2 text-white shadow-lg shadow-blue-900/40">
            <Shield size={20} />
          </div>
          {sidebarOpen && (
            <div>
              <h2 className="text-lg font-bold text-white">TalaLink Admin</h2>
              <p className="text-xs text-slate-400">Control Center</p>
            </div>
          )}
        </Link>

        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="hidden rounded-xl p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white lg:block"
        >
          <Menu size={18} />
        </button>

        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="rounded-xl p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        <SidebarLink to="/admin" icon={LayoutDashboard} label="Dashboard" />
        <SidebarLink to="/admin/listings" icon={ClipboardList} label="Listings" />
        <SidebarLink to="/admin/maintenance" icon={Wrench} label="Maintenance" />
        <SidebarLink to="/admin/users" icon={Users} label="Users" />
      </nav>

      <div className="border-t border-blue-950/50 p-4">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-500/10 p-4">
          <p className="text-sm font-semibold text-white">System Overview</p>
          <p className="mt-2 text-xs text-slate-400">
            Listings, maintenance, orders, carts, and revenue in one admin space.
          </p>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen w-full bg-[#020817] text-slate-200">
      <div className="flex min-h-screen w-full">
        <aside
          className={`${
            sidebarOpen ? "w-72" : "w-24"
          } hidden border-r border-blue-950/50 bg-[#06101f] transition-all duration-300 lg:flex lg:flex-col`}
        >
          {sidebar}
        </aside>

        {mobileSidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-blue-950/50 bg-[#06101f] lg:hidden">
              {sidebar}
            </aside>
          </>
        )}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-blue-950/50 bg-[#081120]/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="rounded-xl border border-blue-900/50 bg-slate-900 p-2 text-slate-300 transition hover:text-white lg:hidden"
                  >
                    <Menu size={18} />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
                    <p className="text-sm text-slate-400">{pageSubtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchDashboardData(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-800/60 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-blue-500 hover:text-white"
                  >
                    <RefreshCw
                      size={16}
                      className={refreshing ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>

                  <button className="rounded-xl border border-blue-900/50 bg-slate-900 p-2 text-slate-300 transition hover:text-white">
                    <Bell size={18} />
                  </button>

                  <div className="flex items-center gap-3 rounded-xl border border-blue-900/50 bg-slate-900 px-3 py-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                      A
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-semibold text-white">Admin</p>
                      <p className="text-xs text-slate-400">Administrator</p>
                    </div>
                    <ChevronDown size={16} className="text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="relative max-w-xl">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Search recent activity, users, listings, orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl border border-blue-900/50 bg-[#0b1220] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
            </div>
          </header>

          <div className="px-4 py-6 md:px-6 lg:px-8">
            {error && (
              <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {error}
              </div>
            )}

            {actionMessage && (
              <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {actionMessage}
              </div>
            )}

            {location.pathname === "/admin" && (
              <DashboardOverview
                loading={loading}
                totalUsers={totalUsers}
                verifiedUsers={verifiedUsers}
                totalListings={totalListings}
                activeListings={activeListings}
                pendingListings={pendingListings}
                totalMaintenance={totalMaintenance}
                pendingMaintenance={pendingMaintenance}
                completedMaintenance={completedMaintenance}
                adminCount={adminCount}
                totalOrders={totalOrders}
                pendingOrders={pendingOrders}
                completedOrders={completedOrders}
                cancelledOrders={cancelledOrders}
                totalCartItems={totalCartItems}
                grossOrderValue={grossOrderValue}
                totalOrderCommission={totalOrderCommission}
                totalMaintenanceCommission={totalMaintenanceCommission}
                totalPlatformRevenue={totalPlatformRevenue}
                chartData={chartData}
                listingStatusData={listingStatusData}
                recentActivity={recentActivity}
                maintenanceStatusData={maintenanceStatusData}
                orderStatusData={orderStatusData}
                revenueChartData={revenueChartData}
                topUsers={topUsers}
              />
            )}

            {location.pathname === "/admin/listings" && (
              <ListingsPanel
                listings={listings}
                onCreate={openCreateListing}
                onEdit={openEditListing}
                onDelete={deleteListing}
              />
            )}

            {location.pathname === "/admin/maintenance" && (
              <MaintenancePanel maintenance={maintenance} />
            )}

            {location.pathname === "/admin/users" && (
              <UsersPanel
                users={users}
                onCreate={openCreateUser}
                onEdit={openEditUser}
                onDelete={deleteUser}
              />
            )}
          </div>
        </main>
      </div>

      <Modal
        open={listingModalOpen}
        title={editingListing ? "Edit Listing" : "Create Listing"}
        onClose={() => setListingModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={submitListing}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="Title"
              value={listingForm.title}
              onChange={(e) =>
                setListingForm((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
            <InputField
              label="Price"
              type="number"
              value={listingForm.price}
              onChange={(e) =>
                setListingForm((prev) => ({ ...prev, price: e.target.value }))
              }
              required
            />
          </div>

          <TextAreaField
            label="Description"
            value={listingForm.description}
            onChange={(e) =>
              setListingForm((prev) => ({ ...prev, description: e.target.value }))
            }
            required
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="Category"
              value={listingForm.category}
              onChange={(e) =>
                setListingForm((prev) => ({ ...prev, category: e.target.value }))
              }
              required
            />
            <InputField
              label="Location"
              value={listingForm.location}
              onChange={(e) =>
                setListingForm((prev) => ({ ...prev, location: e.target.value }))
              }
            />
          </div>

          <InputField
            label="Image URL"
            value={listingForm.image_url}
            onChange={(e) =>
              setListingForm((prev) => ({ ...prev, image_url: e.target.value }))
            }
            placeholder="http://127.0.0.1:5000/static/uploads/item.jpg"
          />

          {listingForm.image_url && (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <img
                src={listingForm.image_url}
                alt="Preview"
                className="h-56 w-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label="Status"
              value={listingForm.status}
              onChange={(e) =>
                setListingForm((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option value="active">active</option>
              <option value="pending">pending</option>
              <option value="sold">sold</option>
              <option value="rejected">rejected</option>
            </SelectField>

            <SelectField
              label="Owner User"
              value={listingForm.user_id}
              onChange={(e) =>
                setListingForm((prev) => ({ ...prev, user_id: e.target.value }))
              }
              required
            >
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </SelectField>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Save size={16} />
              {editingListing ? "Save Changes" : "Create Listing"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={userModalOpen}
        title={editingUser ? "Edit User" : "Create User"}
        onClose={() => setUserModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={submitUser}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label="Username"
              value={userForm.username}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, username: e.target.value }))
              }
              required
            />
            <InputField
              label="Email"
              type="email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              label={editingUser ? "Password (optional for update)" : "Password"}
              type="password"
              value={userForm.password}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, password: e.target.value }))
              }
              required={!editingUser}
            />
            <InputField
              label="Phone Number"
              value={userForm.phone_number}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, phone_number: e.target.value }))
              }
              placeholder="0712345678"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label="Role"
              value={userForm.role}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, role: e.target.value }))
              }
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </SelectField>

            <SelectField
              label="Verified"
              value={String(userForm.is_verified)}
              onChange={(e) =>
                setUserForm((prev) => ({
                  ...prev,
                  is_verified: e.target.value === "true",
                }))
              }
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </SelectField>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Save size={16} />
              {editingUser ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}