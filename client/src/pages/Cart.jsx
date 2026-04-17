import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  Divider
} from '@mui/material';
import {
  ShoppingCart,
  Delete,
  Add,
  Remove,
  Payments,
  Refresh
} from '@mui/icons-material';
import SideBar from '../components/Layout/SideBar';

const API_BASE = 'http://127.0.0.1:5000';

const Cart = () => {
  const token = localStorage.getItem('token');

  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  }, []);

  const fetchCart = useCallback(async () => {
    if (!token) {
      setPageError('You are not logged in.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError('');

    try {
      const response = await fetch(`${API_BASE}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error('Backend did not return valid JSON.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cart.');
      }

      setCartItems(Array.isArray(data.items) ? data.items : []);
      setSubtotal(Number(data.subtotal || 0));
    } catch (error) {
      console.error('Fetch cart error:', error);
      setPageError(error.message || 'Failed to fetch cart.');
      setCartItems([]);
      setSubtotal(0);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;

    try {
      setProcessingId(itemId);
      setPageError('');
      setSuccessMessage('');

      const response = await fetch(`${API_BASE}/cart/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update quantity.');
      }

      setSuccessMessage('Cart updated successfully.');
      fetchCart();
    } catch (error) {
      console.error('Update quantity error:', error);
      setPageError(error.message || 'Failed to update quantity.');
    } finally {
      setProcessingId(null);
    }
  };

  const removeItem = async (itemId) => {
    try {
      setProcessingId(itemId);
      setPageError('');
      setSuccessMessage('');

      const response = await fetch(`${API_BASE}/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove item.');
      }

      setSuccessMessage('Item removed from cart.');
      fetchCart();
    } catch (error) {
      console.error('Remove item error:', error);
      setPageError(error.message || 'Failed to remove item.');
    } finally {
      setProcessingId(null);
    }
  };

  const clearCart = async () => {
    try {
      setClearLoading(true);
      setPageError('');
      setSuccessMessage('');

      const response = await fetch(`${API_BASE}/cart/clear`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear cart.');
      }

      setSuccessMessage('Cart cleared successfully.');
      fetchCart();
    } catch (error) {
      console.error('Clear cart error:', error);
      setPageError(error.message || 'Failed to clear cart.');
    } finally {
      setClearLoading(false);
    }
  };

  const checkoutCart = async () => {
    try {
      setCheckoutLoading(true);
      setPageError('');
      setSuccessMessage('');

      const response = await fetch(`${API_BASE}/orders/from-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error('Backend did not return valid JSON.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to checkout cart.');
      }

      const createdOrders = Array.isArray(data.orders) ? data.orders : [];

      setSuccessMessage(
        createdOrders.length > 0
          ? `${createdOrders.length} order(s) created successfully. Your goods have been sent to the Orders page with their details.`
          : 'Checkout completed successfully. Your goods have been sent to the Orders page.'
      );

      setTimeout(() => {
        window.location.href = '/orders';
      }, 1200);
    } catch (error) {
      console.error('Checkout error:', error);
      setPageError(error.message || 'Failed to checkout cart.');
    } finally {
      setCheckoutLoading(false);
    }
  };

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
                Cart
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Logged in as{' '}
                <strong style={{ color: '#3399ff' }}>
                  {currentUser?.username || 'Guest'}
                </strong>
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mt: 0.5 }}>
                Checking out sends each cart item to Orders with its quantity, seller, and pricing details.
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchCart}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.2)',
                  textTransform: 'none',
                  fontWeight: 700
                }}
              >
                Refresh
              </Button>

              <Button
                variant="outlined"
                color="error"
                onClick={clearCart}
                disabled={clearLoading || cartItems.length === 0}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700
                }}
              >
                {clearLoading ? 'Clearing...' : 'Clear Cart'}
              </Button>

              <Button
                variant="contained"
                startIcon={<Payments />}
                onClick={checkoutCart}
                disabled={checkoutLoading || cartItems.length === 0}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                {checkoutLoading ? 'Sending to Orders...' : 'Checkout to Orders'}
              </Button>
            </Stack>
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
            <Box sx={{ p: 3 }}>
              {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : cartItems.length > 0 ? (
                <>
                  {cartItems.map((item) => (
                    <Paper
                      key={item.id}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        mb: 2,
                        borderRadius: 3,
                        bgcolor: 'rgba(10, 25, 41, 0.7)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        spacing={2}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            src={item.listing_image_url || ''}
                            sx={{
                              bgcolor: '#007fff',
                              width: 56,
                              height: 56,
                              fontWeight: 800
                            }}
                          >
                            {item.listing_title ? item.listing_title[0].toUpperCase() : 'C'}
                          </Avatar>

                          <Box>
                            <Typography variant="subtitle1" fontWeight={700}>
                              {item.listing_title || 'Cart Item'}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: 'rgba(255,255,255,0.65)', mt: 0.5 }}
                            >
                              Seller: {item.seller_username || 'Unknown seller'}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: '#3399ff', mt: 0.5, fontWeight: 700 }}
                            >
                              KES {Number(item.unit_price || 0).toLocaleString()} each
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1.5}
                          alignItems={{ xs: 'stretch', sm: 'center' }}
                          sx={{ width: { xs: '100%', md: 'auto' } }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <IconButton
                              onClick={() => updateQuantity(item.id, Number(item.quantity) - 1)}
                              disabled={processingId === item.id || Number(item.quantity) <= 1}
                              sx={{
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 2
                              }}
                            >
                              <Remove />
                            </IconButton>

                            <TextField
                              value={item.quantity}
                              size="small"
                              disabled
                              sx={{
                                width: 72,
                                '& .MuiOutlinedInput-root': {
                                  color: 'white',
                                  bgcolor: 'rgba(255,255,255,0.03)',
                                  '& fieldset': {
                                    borderColor: 'rgba(255,255,255,0.12)'
                                  }
                                }
                              }}
                            />

                            <IconButton
                              onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                              disabled={processingId === item.id}
                              sx={{
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 2
                              }}
                            >
                              <Add />
                            </IconButton>
                          </Stack>

                          <Typography
                            variant="subtitle1"
                            sx={{ color: '#90caf9', fontWeight: 800, minWidth: 120 }}
                          >
                            KES {Number(item.total_price || 0).toLocaleString()}
                          </Typography>

                          <IconButton
                            onClick={() => removeItem(item.id)}
                            disabled={processingId === item.id}
                            sx={{
                              color: '#ff6b6b',
                              border: '1px solid rgba(255,107,107,0.2)',
                              borderRadius: 2
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}

                  <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    spacing={2}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <ShoppingCart sx={{ color: '#3399ff' }} />
                      <Typography variant="h6" fontWeight={800}>
                        {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart
                      </Typography>
                    </Stack>

                    <Typography variant="h5" fontWeight={900} sx={{ color: '#3399ff' }}>
                      Subtotal: KES {Number(subtotal || 0).toLocaleString()}
                    </Typography>
                  </Stack>
                </>
              ) : (
                <Box textAlign="center" py={6}>
                  <ShoppingCart sx={{ fontSize: 44, color: 'rgba(255,255,255,0.2)', mb: 1 }} />
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                    Your cart is empty.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Cart;