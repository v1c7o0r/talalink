import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Stack,
  Chip,
  Button,
  Avatar,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  CallReceived,
  Outbox,
  WhatsApp,
  AccessTime,
  LocationOn,
  ShoppingBag,
  Inventory2,
  Payments,
  Person,
  Chat
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SideBar from '../components/Layout/SideBar';

const API_BASE = 'http://127.0.0.1:5000';

const Orders = () => {
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [anchorEl, setAnchorEl] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);

  const [currentUser, setCurrentUser] = useState({
    id: null,
    username: 'Guest',
    email: '',
    phone_number: '',
    role: 'user'
  });

  const token = localStorage.getItem('token');

  const normalizePhone = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '');

    if (!digits) return '';

    if (digits.startsWith('0') && digits.length === 10) {
      return `254${digits.slice(1)}`;
    }

    if (digits.startsWith('254') && digits.length === 12) {
      return digits;
    }

    if (digits.length >= 10 && digits.length <= 15) {
      return digits;
    }

    return '';
  };

  const getWhatsAppLink = (phone, item) => {
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      return '';
    }

    const message = encodeURIComponent(
      `Hello, I'm contacting you regarding the order for: ${item || 'your listing'}`
    );

    return `https://wa.me/${normalizedPhone}?text=${message}`;
  };

  const loadCurrentUser = useCallback(async () => {
    if (!token) {
      setCurrentUser({
        id: null,
        username: 'Guest',
        email: '',
        phone_number: '',
        role: 'user'
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load profile');
      }

      const userData = {
        id: data.id,
        username: data.username,
        email: data.email,
        phone_number: data.phone_number || '',
        role: data.role || 'user'
      };

      setCurrentUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Load profile error:', error);

      try {
        const savedUser = JSON.parse(localStorage.getItem('user'));
        if (savedUser) {
          setCurrentUser({
            id: savedUser.id ?? null,
            username: savedUser.username || 'Guest',
            email: savedUser.email || '',
            phone_number: savedUser.phone_number || '',
            role: savedUser.role || 'user'
          });
          return;
        }
      } catch (parseError) {
        console.error('Saved user parse error:', parseError);
      }

      setCurrentUser({
        id: null,
        username: 'Guest',
        email: '',
        phone_number: '',
        role: 'user'
      });
    }
  }, [token]);

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      setPageError('You are not logged in.');
      return;
    }

    setLoading(true);
    setPageError('');

    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      let data = [];
      try {
        data = await response.json();
      } catch {
        throw new Error('Backend did not return valid JSON.');
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `Failed with status ${response.status}`);
      }

      const normalizedOrders = Array.isArray(data)
        ? data.map((order) => ({
            ...order,
            phone: normalizePhone(order.phone)
          }))
        : [];

      setOrders(normalizedOrders);
    } catch (err) {
      console.error('Fetch orders error:', err);
      setOrders([]);
      setPageError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCurrentUser();
    fetchOrders();
  }, [loadCurrentUser, fetchOrders]);

  const handleUpdateClick = (event, id) => {
    setAnchorEl(event.currentTarget);
    setActiveOrderId(id);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setActiveOrderId(null);
  };

  const updateStatus = async (newStatus) => {
    if (!activeOrderId || !token) return;

    try {
      const response = await fetch(`${API_BASE}/orders/${activeOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error('Backend did not return valid JSON.');
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update order status');
      }

      setSuccessMessage(`Order status updated to "${newStatus}"`);
      setPageError('');
      handleCloseMenu();
      fetchOrders();
    } catch (err) {
      console.error('Update order status error:', err);
      setPageError(err.message || 'Network error during update');
      handleCloseMenu();
    }
  };

  const createOrOpenChat = async (order) => {
    if (!token || !currentUser?.id) {
      setPageError('You must be logged in to open chat.');
      return;
    }

    try {
      setPageError('');
      setSuccessMessage('');

      const payload = {
        buyer_id: Number(order.buyer_id),
        artisan_id: Number(order.seller_id),
        order_id: Number(order.id)
      };

      const response = await fetch(`${API_BASE}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error('Backend did not return valid JSON.');
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to open chat');
      }

      navigate(`/chat?chatId=${data.id}`);
    } catch (error) {
      console.error('Open order chat error:', error);
      setPageError(error.message || 'Failed to open local chat');
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
        return {
          color: '#4caf50',
          bg: 'rgba(76, 175, 80, 0.12)',
          border: 'rgba(76, 175, 80, 0.35)'
        };
      case 'Confirmed':
        return {
          color: '#29b6f6',
          bg: 'rgba(41, 182, 246, 0.12)',
          border: 'rgba(41, 182, 246, 0.35)'
        };
      case 'Cancelled':
        return {
          color: '#f44336',
          bg: 'rgba(244, 67, 54, 0.12)',
          border: 'rgba(244, 67, 54, 0.35)'
        };
      default:
        return {
          color: '#ff9800',
          bg: 'rgba(255, 152, 0, 0.12)',
          border: 'rgba(255, 152, 0, 0.35)'
        };
    }
  };

  const incomingOrders = useMemo(() => {
    return orders.filter(
      (order) => Number(order.seller_id) === Number(currentUser.id)
    );
  }, [orders, currentUser.id]);

  const outgoingOrders = useMemo(() => {
    return orders.filter(
      (order) => Number(order.buyer_id) === Number(currentUser.id)
    );
  }, [orders, currentUser.id]);

  const visibleOrders = tabValue === 0 ? incomingOrders : outgoingOrders;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0a1929' }}>
      <SideBar isLoggedIn={true} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          mt: 2,
          color: 'white'
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              mb: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight={900} sx={{ mb: 1 }}>
                Orders Hub
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Logged in as{' '}
                <strong style={{ color: '#3399ff' }}>
                  {currentUser.username || 'Guest'}
                </strong>
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mt: 0.5 }}>
                Orders created from checkout appear here with quantity and pricing details.
              </Typography>
            </Box>
          </Box>

          {pageError && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                bgcolor: 'rgba(211, 47, 47, 0.12)',
                color: '#fff',
                border: '1px solid rgba(244,67,54,0.3)',
                '& .MuiAlert-icon': { color: '#ff6b6b' }
              }}
            >
              {pageError}
            </Alert>
          )}

          {successMessage && (
            <Alert
              severity="success"
              sx={{
                mb: 3,
                bgcolor: 'rgba(46, 125, 50, 0.12)',
                color: '#fff',
                border: '1px solid rgba(76,175,80,0.3)',
                '& .MuiAlert-icon': { color: '#81c784' }
              }}
            >
              {successMessage}
            </Alert>
          )}

          <Paper
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              bgcolor: '#132f4c',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(e, val) => setTabValue(val)}
              variant="fullWidth"
              sx={{
                bgcolor: '#173a5e',
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.5)',
                  fontWeight: 700
                },
                '& .Mui-selected': {
                  color: '#3399ff !important'
                },
                '& .MuiTabs-indicator': {
                  bgcolor: '#3399ff'
                }
              }}
            >
              <Tab
                icon={<CallReceived />}
                label={`INCOMING ORDERS (${incomingOrders.length})`}
              />
              <Tab
                icon={<Outbox />}
                label={`OUTGOING ORDERS (${outgoingOrders.length})`}
              />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : visibleOrders.length > 0 ? (
                visibleOrders.map((order) => {
                  const statusStyles = getStatusStyles(order.status);
                  const whatsappLink = getWhatsAppLink(order.phone, order.item);
                  const hasWhatsApp = Boolean(whatsappLink);
                  const canUpdateStatus =
                    tabValue === 0 &&
                    (Number(order.seller_id) === Number(currentUser.id) || isAdmin);

                  const quantity = Number(order.quantity || 0);
                  const unitPrice = Number(order.unit_price || 0);
                  const totalPrice = Number(order.total_price || 0);

                  const participantName =
                    tabValue === 0
                      ? order.buyer || 'Unknown Buyer'
                      : order.seller || 'Unknown Seller';

                  return (
                    <Paper
                      key={order.id}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        mb: 2,
                        borderRadius: 3,
                        bgcolor: 'rgba(10, 25, 41, 0.7)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        '&:hover': { border: '1px solid #3399ff' }
                      }}
                    >
                      <Stack spacing={2}>
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          justifyContent="space-between"
                          alignItems={{ xs: 'flex-start', md: 'center' }}
                          spacing={2}
                        >
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                              onClick={() => createOrOpenChat(order)}
                              sx={{
                                bgcolor: '#007fff',
                                width: 52,
                                height: 52,
                                fontWeight: 800,
                                cursor: 'pointer',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                  boxShadow: '0 0 0 2px rgba(51,153,255,0.35)'
                                }
                              }}
                            >
                              {order.item ? order.item[0].toUpperCase() : 'O'}
                            </Avatar>

                            <Box>
                              <Typography variant="subtitle1" fontWeight={700}>
                                {order.item}
                              </Typography>

                              {!!order.description && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'rgba(255,255,255,0.65)',
                                    mt: 0.5
                                  }}
                                >
                                  {order.description}
                                </Typography>
                              )}
                            </Box>
                          </Stack>

                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1.5}
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            sx={{ width: { xs: '100%', md: 'auto' } }}
                          >
                            <Chip
                              label={order.status}
                              size="small"
                              sx={{
                                bgcolor: statusStyles.bg,
                                color: statusStyles.color,
                                fontWeight: 800,
                                border: `1px solid ${statusStyles.border}`
                              }}
                            />

                            <Button
                              startIcon={<WhatsApp />}
                              href={hasWhatsApp ? whatsappLink : undefined}
                              target={hasWhatsApp ? '_blank' : undefined}
                              rel={hasWhatsApp ? 'noopener noreferrer' : undefined}
                              disabled={!hasWhatsApp}
                              size="small"
                              sx={{
                                color: hasWhatsApp ? '#25D366' : 'rgba(255,255,255,0.3)',
                                textTransform: 'none',
                                fontWeight: 700
                              }}
                            >
                              {hasWhatsApp ? 'Discuss on WhatsApp' : 'No WhatsApp Number'}
                            </Button>

                            <Button
                              startIcon={<Chat />}
                              onClick={() => createOrOpenChat(order)}
                              size="small"
                              sx={{
                                color: '#66b2ff',
                                textTransform: 'none',
                                fontWeight: 700
                              }}
                            >
                              Chat Here
                            </Button>

                            {canUpdateStatus && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={(e) => handleUpdateClick(e, order.id)}
                                sx={{
                                  color: 'white',
                                  borderColor: 'rgba(255,255,255,0.2)',
                                  textTransform: 'none',
                                  '&:hover': {
                                    borderColor: '#3399ff',
                                    color: '#3399ff'
                                  }
                                }}
                              >
                                Update Status
                              </Button>
                            )}
                          </Stack>
                        </Stack>

                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Person sx={{ fontSize: 14, color: '#3399ff' }} />
                            <Typography
                              variant="caption"
                              onClick={() => createOrOpenChat(order)}
                              sx={{
                                color: '#66b2ff',
                                cursor: 'pointer',
                                fontWeight: 700,
                                '&:hover': {
                                  textDecoration: 'underline'
                                }
                              }}
                            >
                              {tabValue === 0 ? 'Buyer: ' : 'Seller: '}
                              {participantName}
                            </Typography>
                          </Stack>

                          <Chat sx={{ fontSize: 14, color: '#66b2ff' }} />

                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              bgcolor: 'rgba(255,255,255,0.2)'
                            }}
                          />

                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <AccessTime sx={{ fontSize: 12, color: '#3399ff' }} />
                            <Typography
                              variant="caption"
                              sx={{ color: '#3399ff', fontWeight: 600 }}
                            >
                              Qty: {quantity}
                            </Typography>
                          </Stack>

                          {!!order.location && (
                            <>
                              <Box
                                sx={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: '50%',
                                  bgcolor: 'rgba(255,255,255,0.2)'
                                }}
                              />
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <LocationOn sx={{ fontSize: 12, color: '#3399ff' }} />
                                <Typography
                                  variant="caption"
                                  sx={{ color: 'rgba(255,255,255,0.6)' }}
                                >
                                  {order.location}
                                </Typography>
                              </Stack>
                            </>
                          )}

                          {!!order.phone && (
                            <>
                              <Box
                                sx={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: '50%',
                                  bgcolor: 'rgba(255,255,255,0.2)'
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ color: 'rgba(255,255,255,0.55)' }}
                              >
                                WhatsApp: {order.phone}
                              </Typography>
                            </>
                          )}
                        </Stack>

                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={2}
                          sx={{ pt: 0.5 }}
                        >
                          <Paper
                            elevation={0}
                            sx={{
                              flex: 1,
                              p: 2,
                              borderRadius: 3,
                              bgcolor: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)'
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              <Inventory2 sx={{ fontSize: 16, color: '#3399ff' }} />
                              <Typography variant="body2" fontWeight={700}>
                                Quantity
                              </Typography>
                            </Stack>
                            <Typography variant="h6" fontWeight={900} sx={{ color: '#90caf9' }}>
                              {quantity}
                            </Typography>
                          </Paper>

                          <Paper
                            elevation={0}
                            sx={{
                              flex: 1,
                              p: 2,
                              borderRadius: 3,
                              bgcolor: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)'
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              <ShoppingBag sx={{ fontSize: 16, color: '#3399ff' }} />
                              <Typography variant="body2" fontWeight={700}>
                                Unit Price
                              </Typography>
                            </Stack>
                            <Typography variant="h6" fontWeight={900} sx={{ color: '#90caf9' }}>
                              KES {unitPrice.toLocaleString()}
                            </Typography>
                          </Paper>

                          <Paper
                            elevation={0}
                            sx={{
                              flex: 1,
                              p: 2,
                              borderRadius: 3,
                              bgcolor: 'rgba(51,153,255,0.09)',
                              border: '1px solid rgba(51,153,255,0.18)'
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              <Payments sx={{ fontSize: 16, color: '#66b2ff' }} />
                              <Typography variant="body2" fontWeight={700}>
                                Total Price
                              </Typography>
                            </Stack>
                            <Typography variant="h6" fontWeight={900} sx={{ color: '#66b2ff' }}>
                              KES {totalPrice.toLocaleString()}
                            </Typography>
                          </Paper>
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })
              ) : (
                <Box textAlign="center" py={5}>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                    {tabValue === 0
                      ? 'No incoming orders found.'
                      : 'No outgoing orders found.'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            bgcolor: '#173a5e',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
            '& .MuiMenuItem-root:hover': {
              bgcolor: 'rgba(51, 153, 255, 0.2)'
            }
          }
        }}
      >
        <MenuItem onClick={() => updateStatus('Pending')}>Pending</MenuItem>
        <MenuItem onClick={() => updateStatus('Confirmed')}>Confirmed</MenuItem>
        <MenuItem onClick={() => updateStatus('Delivered')}>Delivered</MenuItem>
        <MenuItem onClick={() => updateStatus('Completed')}>Completed</MenuItem>
        <MenuItem onClick={() => updateStatus('Cancelled')}>Cancelled</MenuItem>
      </Menu>
    </Box>
  );
};

export default Orders;