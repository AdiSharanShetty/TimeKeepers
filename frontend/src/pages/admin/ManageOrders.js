import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import AdminNavbar from '../../Component/AdminNavbar';
import { getAdminOrders, getAdminOrder, updateOrderStatus } from '../../api/orders';
import { useToast } from '../../context/ToastContext';

// Admin Orders panel (auth + admin role required on the server; else 403).
// Lists all orders with a detail view and status update, built against the
// Section 5 admin endpoints:
//   GET   /admin/orders?status=&page=&limit=
//   GET   /admin/orders/:id
//   PATCH /admin/orders/:id/status  { status }

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS = {
  pending: 'default',
  paid: 'info',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'error',
};

const PAGE_SIZE = 20;

const ManageOrders = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminOrders({ status: statusFilter || undefined, page, limit: PAGE_SIZE });
      const list = Array.isArray(data?.orders) ? data.orders : Array.isArray(data) ? data : [];
      setOrders(list);
      const pages =
        data?.totalPages ||
        data?.pages ||
        Math.max(1, Math.ceil((data?.total || list.length) / PAGE_SIZE));
      setTotalPages(pages || 1);
    } catch (err) {
      setOrders([]);
      setError(
        err?.status === 403
          ? 'You are not authorized to view orders.'
          : err?.message || 'Failed to load orders.'
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (orderId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    setNewStatus('');
    try {
      const data = await getAdminOrder(orderId);
      setDetail(data);
      setNewStatus(String(data?.status || '').toLowerCase());
    } catch (err) {
      toast.error(err?.message || 'Failed to load order details.');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetail(null);
    setNewStatus('');
  };

  const handleStatusSave = async () => {
    if (!detail || !newStatus) return;
    setSaving(true);
    try {
      await updateOrderStatus(detail.id, newStatus);
      toast.success(`Order #${detail.id} updated to "${newStatus}".`);
      closeDetail();
      load();
    } catch (err) {
      toast.error(err?.message || 'Failed to update order status.');
    } finally {
      setSaving(false);
    }
  };

  const itemsOf = (order) => order.items || order.ordered_product || [];

  return (
    <>
      <div className='adm-page'>
        <AdminNavbar />
        <div className='adm-content'>
          <Box p={3}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={2}>
              <Typography variant="h4" gutterBottom className="adm-heading">
                Manage Orders
              </Typography>
              <FormControl size="small" style={{ minWidth: 180 }}>
                <InputLabel id="status-filter-label">Filter by status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  label="Filter by status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {loading && (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            )}

            {!loading && error && <Typography color="error" p={2}>{error}</Typography>}

            {!loading && !error && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ color: 'rgba(244, 239, 227, 0.55)' }}>
                          No orders found.
                        </TableCell>
                      </TableRow>
                    )}
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>
                          {order.user_name || order.username || order.customer_name || `User #${order.user_id ?? ''}`}
                        </TableCell>
                        <TableCell>
                          {itemsOf(order).length > 0
                            ? itemsOf(order)
                                .map((it) => it.name || it.product_name || `#${it.product_id ?? it.productId ?? ''}`)
                                .join(', ')
                            : '—'}
                        </TableCell>
                        <TableCell>${Number(order.net_total ?? order.total ?? 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={String(order.status || 'pending')}
                            color={STATUS_COLORS[String(order.status || '').toLowerCase()] || 'default'}
                          />
                        </TableCell>
                        <TableCell>{order.date ? new Date(order.date).toLocaleDateString() : '—'}</TableCell>
                        <TableCell align="right">
                          <IconButton color="primary" onClick={() => openDetail(order.id)} aria-label="View order">
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {!loading && !error && totalPages > 1 && (
              <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={2}>
                <Button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <Typography>Page {page} of {totalPages}</Typography>
                <Button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </Box>
            )}
          </Box>
        </div>
      </div>


      <Dialog open={detailOpen} onClose={closeDetail} fullWidth maxWidth="sm">
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent dividers>
          {detailLoading && (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          )}

          {!detailLoading && detail && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>Order #{detail.id}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {detail.user_name || detail.username || `User #${detail.user_id ?? ''}`} ·{' '}
                {detail.date ? new Date(detail.date).toLocaleString() : ''}
              </Typography>

              {detail.shipping_address && (
                <Typography variant="body2" gutterBottom>
                  <strong>Ship to:</strong> {detail.shipping_address}
                  {detail.contact_phone ? ` · ${detail.contact_phone}` : ''}
                </Typography>
              )}

              <Box mt={2}>
                {itemsOf(detail).map((it, idx) => (
                  <Box key={idx} display="flex" justifyContent="space-between" py={0.5}>
                    <span>{it.name || it.product_name} × {it.quantity ?? 1}</span>
                    <span>${Number((it.price ?? 0) * (it.quantity ?? 1)).toLocaleString()}</span>
                  </Box>
                ))}
              </Box>

              <Box display="flex" justifyContent="space-between" mt={2} pt={1} sx={{ borderTop: '1px solid rgba(224, 181, 99, 0.25)' }}>
                <strong>Total</strong>
                <strong>${Number(detail.net_total ?? detail.total ?? 0).toLocaleString()}</strong>
              </Box>

              <FormControl fullWidth margin="normal">
                <InputLabel id="detail-status-label">Status</InputLabel>
                <Select
                  labelId="detail-status-label"
                  label="Status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetail}>Close</Button>
          <Button onClick={handleStatusSave} variant="contained" color="primary" disabled={saving || detailLoading || !detail}>
            {saving ? 'Saving…' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ManageOrders;

