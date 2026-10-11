import React, { useEffect, useState } from "react";
import AdminNavbar from '../../Component/AdminNavbar';
import { api, productsApi, ordersApi } from '../../api';

// Dashboard KPIs. Real data only, from the EXISTING APIs (no backend changes):
//   Total Sales     -> sum of net_total across all orders (admin orders API, paged)
//   Total Orders    -> order count + how many are still 'pending'
//   Active Products -> products with status === 'active' + how many aren't
//   Total Users     -> /auth/users count + accounts created today
const PAGE_LIMIT = 100; // backend caps limit at 100
const MAX_PAGES = 50; // safety cap so the paging loop can never run away

const formatMoney = (value) =>
  `$${Math.round(Number(value) || 0).toLocaleString('en-US')}`;

// MySQL DATETIME strings ("YYYY-MM-DD HH:MM:SS") parse after a space->T swap.
const parseDate = (value) => {
  if (!value) return NaN;
  return new Date(String(value).replace(' ', 'T')).getTime();
};

async function fetchAllOrders() {
  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const data = await ordersApi.getAdminOrders({ page, limit: PAGE_LIMIT });
    const batch = Array.isArray(data?.orders) ? data.orders : [];
    all.push(...batch);
    totalPages = Number(data?.totalPages) || 1;
    page += 1;
  } while (page <= totalPages && page <= MAX_PAGES);
  return all;
}

// Product rows for the KPI cards. The contract endpoint /products maps rows
// through backend mapProduct, which does NOT include `status`, so we read the
// live legacy endpoint (same one api/products.js falls back to) which returns
// raw rows including status. If that ever disappears we degrade to the
// contract endpoint; every product it returns is shown in the storefront, so
// we report it as active rather than miscounting it as inactive.
async function fetchProductsForKpis() {
  try {
    const { data } = await api.get('/product/fetch-product');
    if (Array.isArray(data)) return data;
  } catch {
    /* fall through to the contract endpoint */
  }
  const fallback = await productsApi.listProducts();
  return fallback.map((p) => p.raw ?? {});
}

const AdminDash = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const [orders, products, usersResponse] = await Promise.all([
          fetchAllOrders(),
          fetchProductsForKpis(),
          api.get('/auth/users'),
        ]);
        if (cancelled) return;

        // ---- orders: sales total, pending count, week-over-week trend
        const now = Date.now();
        const WEEK = 7 * 24 * 60 * 60 * 1000;
        let totalSales = 0;
        let pendingOrders = 0;
        let salesThisWeek = 0;
        let salesLastWeek = 0;
        orders.forEach((order) => {
          const amount = Number(order.net_total ?? order.totalAmount) || 0;
          totalSales += amount;
          if (String(order.status || '').toLowerCase() === 'pending') {
            pendingOrders += 1;
          }
          const time = parseDate(order.createdAt ?? order.date);
          if (Number.isFinite(time)) {
            if (time >= now - WEEK) salesThisWeek += amount;
            else if (time >= now - 2 * WEEK) salesLastWeek += amount;
          }
        });

        // ---- products: the table has no stock column, so "inactive" is the
        // accurate sub-stat (equivalent of the mock's out-of-stock line).
        // These rows come from the legacy endpoint with `status` set directly;
        // only an explicit "inactive" counts as inactive, because a blank or
        // NULL status still shows in the storefront (treat it as active).
        const activeProducts = products.filter(
          (p) => String(p.status ?? '').trim().toLowerCase() !== 'inactive'
        ).length;

        // ---- users: total + accounts created today
        const users = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
        const todayKey = new Date().toDateString();
        const newToday = users.filter((u) => {
          const time = parseDate(u.created_at);
          return Number.isFinite(time) && new Date(time).toDateString() === todayKey;
        }).length;

        setStats({
          totalSales,
          orderCount: orders.length,
          pendingOrders,
          salesThisWeek,
          salesLastWeek,
          productCount: products.length,
          activeProducts,
          inactiveProducts: products.length - activeProducts,
          userCount: users.length,
          newUsersToday: newToday,
        });
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load dashboard stats');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Sub-line for Total Sales: % change vs the previous 7 days when we have a
  // baseline; otherwise the raw "this week" amount; otherwise an honest zero state.
  const salesSub = (() => {
    if (!stats) return null;
    const { salesThisWeek, salesLastWeek } = stats;
    if (salesLastWeek > 0) {
      const pct = Math.round(((salesThisWeek - salesLastWeek) / salesLastWeek) * 100);
      return {
        tone: pct >= 0 ? 'up' : 'down',
        text: `${pct >= 0 ? '+' : ''}${pct}% this week`,
      };
    }
    if (salesThisWeek > 0) {
      return { tone: 'up', text: `${formatMoney(salesThisWeek)} this week` };
    }
    return { tone: 'muted', text: 'No sales in the last 7 days' };
  })();

  return (
    <div className='adm-page'>
      <AdminNavbar />
      <div className='adm-content'>
        <h1>Welcome to Admin</h1>

        {error && <p className='adm-error'>Could not load dashboard stats: {error}</p>}

        <div className='adm-kpi-grid'>
          <div className='adm-kpi-card adm-kpi-card--featured'>
            <span className='adm-kpi-label'>Total Sales</span>
            <span className='adm-kpi-value'>
              {loading || !stats ? '…' : formatMoney(stats.totalSales)}
            </span>
            {stats && salesSub && (
              <span className={`adm-kpi-sub adm-kpi-sub--${salesSub.tone}`}>{salesSub.text}</span>
            )}
          </div>

          <div className='adm-kpi-card'>
            <span className='adm-kpi-label'>Total Orders</span>
            <span className='adm-kpi-value'>
              {loading || !stats ? '…' : stats.orderCount.toLocaleString()}
            </span>
            {stats && (
              stats.pendingOrders > 0 ? (
                <span className='adm-kpi-sub adm-kpi-sub--warn'>
                  {stats.pendingOrders} pending
                </span>
              ) : (
                <span className='adm-kpi-sub adm-kpi-sub--up'>No pending orders</span>
              )
            )}
          </div>

          <div className='adm-kpi-card'>
            <span className='adm-kpi-label'>Active Products</span>
            <span className='adm-kpi-value'>
              {loading || !stats ? '…' : stats.activeProducts.toLocaleString()}
            </span>
            {stats && (
              stats.inactiveProducts > 0 ? (
                <span className='adm-kpi-sub adm-kpi-sub--down'>
                  {stats.inactiveProducts} inactive
                </span>
              ) : (
                <span className='adm-kpi-sub adm-kpi-sub--up'>
                  All {stats.productCount} products active
                </span>
              )
            )}
          </div>

          <div className='adm-kpi-card'>
            <span className='adm-kpi-label'>Total Users</span>
            <span className='adm-kpi-value'>
              {loading || !stats ? '…' : stats.userCount.toLocaleString()}
            </span>
            {stats && (
              stats.newUsersToday > 0 ? (
                <span className='adm-kpi-sub adm-kpi-sub--up'>
                  +{stats.newUsersToday} new today
                </span>
              ) : (
                <span className='adm-kpi-sub adm-kpi-sub--muted'>No new users today</span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDash;