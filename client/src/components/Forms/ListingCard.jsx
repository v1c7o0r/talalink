import React, { useMemo, useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Edit,
  LocationOn,
  Build,
  ShoppingBag,
  WhatsApp,
  AddShoppingCart,
  Payments,
  Engineering
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://127.0.0.1:5000';

const ListingCard = ({ item }) => {
  const navigate = useNavigate();

  const [openRequest, setOpenRequest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const [requestForm, setRequestForm] = useState({
    item: item?.title || '',
    description: '',
    location: item?.location || ''
  });

  const token = localStorage.getItem('token');

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  }, []);

  const isOwner = Number(currentUser?.id) === Number(item?.user_id);
  const isService = item?.category === 'Service';

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

  const listingPhone = normalizePhone(item?.phone_number || item?.phone);

  const whatsappMessage = encodeURIComponent(
    `Hello, I am interested in "${item?.title || 'this listing'}".`
  );

  const whatsappLink = listingPhone
    ? `https://wa.me/${listingPhone}?text=${whatsappMessage}`
    : '';

  const handleOpenDetails = () => {
    if (!item?.id) return;
    navigate(`/product/${item.id}`);
  };

  const handleOpenRequest = (e) => {
    e.stopPropagation();

    if (!token) {
      alert('Please log in first to send a maintenance request.');
      navigate('/login');
      return;
    }

    if (isOwner) {
      alert('You cannot send a maintenance request to your own listing.');
      return;
    }

    if (!item?.user_id) {
      alert('This listing does not have a valid artisan owner.');
      return;
    }

    setOpenRequest(true);
  };

  const handleCloseRequest = () => {
    if (!submitting) {
      setOpenRequest(false);
    }
  };

  const handleChange = (e) => {
    setRequestForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.item.trim()) {
      alert('Please enter the item name.');
      return;
    }

    if (!item?.user_id) {
      alert('This listing does not have a valid artisan owner.');
      return;
    }

    if (!listingPhone) {
      alert('This listing does not have a valid phone number.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          item: requestForm.item.trim(),
          description: requestForm.description.trim(),
          location: requestForm.location.trim(),
          artisan_id: Number(item.user_id),
          phone: listingPhone,
          listing_id: item.id,
          item_price: item.price
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error('Server returned an invalid response.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create maintenance request');
      }

      sessionStorage.setItem(
        'maintenance_success',
        'Maintenance request sent successfully.'
      );

      setOpenRequest(false);
      setRequestForm({
        item: item?.title || '',
        description: '',
        location: item?.location || ''
      });

      navigate('/maintenance');
    } catch (error) {
      console.error('Maintenance request error:', error);
      alert(error.message || 'Something went wrong while sending request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();

    if (!token) {
      alert('Please log in first to add items to cart.');
      navigate('/login');
      return;
    }

    if (isOwner) {
      alert('You cannot add your own listing to cart.');
      return;
    }

    if (isService) {
      alert('Services cannot be added to cart.');
      return;
    }

    try {
      setCartLoading(true);

      const response = await fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          listing_id: Number(item.id),
          quantity: Number(quantity)
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error('Server returned an invalid response.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item to cart');
      }

      alert('Item added to cart successfully.');
    } catch (error) {
      console.error('Cart error:', error);
      alert(error.message || 'Failed to add item to cart');
    } finally {
      setCartLoading(false);
    }
  };

  const handleBuyNow = async (e) => {
    e.stopPropagation();

    if (!token) {
      alert('Please log in first to place an order.');
      navigate('/login');
      return;
    }

    if (isOwner) {
      alert('You cannot buy your own listing.');
      return;
    }

    if (isService) {
      alert('Services should be requested via maintenance.');
      return;
    }

    try {
      setBuying(true);

      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          listing_id: Number(item.id),
          quantity: Number(quantity),
          location: item?.location || '',
          phone: listingPhone || '',
          description: `Order for ${item?.title || 'listing'}`
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error('Server returned an invalid response.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      alert('Order placed successfully.');
      navigate('/orders');
    } catch (error) {
      console.error('Order error:', error);
      alert(error.message || 'Failed to place order');
    } finally {
      setBuying(false);
    }
  };

  const maintenanceFee = Number((Number(item?.price || 0) * 0.05).toFixed(2));
  const maintenanceTotal = Number((Number(item?.price || 0) + maintenanceFee).toFixed(2));

  return (
    <>
      <Card
        onClick={handleOpenDetails}
        sx={{
          width: '100%',
          maxWidth: 360,
          minWidth: 260,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          overflow: 'hidden',
          cursor: 'pointer',
          backgroundColor: '#132f4c',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.06)',
          transition: '0.25s ease',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 14px 30px rgba(0,0,0,0.22)'
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="200"
            image={item?.image_url || 'https://via.placeholder.com/400x220?text=No+Image'}
            alt={item?.title || 'Listing image'}
            sx={{ objectFit: 'cover' }}
          />

          <Chip
            label={item?.category || 'Listing'}
            size="small"
            color={item?.category === 'Service' ? 'primary' : 'secondary'}
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              fontWeight: 700
            }}
          />

          {isOwner && (
            <Tooltip title="Edit listing">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/create-listing/${item.id}`);
                }}
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  bgcolor: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.75)'
                  }
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, pb: 1.5 }}>
          <Stack spacing={1.2}>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {item?.title || 'Untitled Listing'}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.72)',
                minHeight: 42,
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {item?.description || 'No description available.'}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {item?.category === 'Service' ? (
                <Build fontSize="small" color="primary" />
              ) : (
                <ShoppingBag fontSize="small" color="primary" />
              )}

              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                {item?.author_username || 'Unknown seller'}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <LocationOn fontSize="small" color="action" />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                {item?.location || 'No location'}
              </Typography>
            </Stack>

            <Typography variant="h6" fontWeight={900} color="primary.main">
              KES {Number(item?.price || 0).toLocaleString()}
            </Typography>

            {!isOwner && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.62)' }}>
                Maintenance fee: KES {maintenanceFee.toLocaleString()} | Total: KES {maintenanceTotal.toLocaleString()}
              </Typography>
            )}
          </Stack>
        </CardContent>

        <Box sx={{ px: 2, pb: 2 }}>
          <Stack spacing={1.2}>
            <Button
              variant="contained"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetails();
              }}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              View Details
            </Button>

            {!isOwner && !isService && (
              <>
                <TextField
                  type="number"
                  size="small"
                  label="Qty"
                  value={quantity}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))}
                  inputProps={{ min: 1 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.7)'
                    }
                  }}
                />

                <Button
                  variant="outlined"
                  startIcon={<AddShoppingCart />}
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  {cartLoading ? 'Adding...' : 'Add to Cart'}
                </Button>

                <Button
                  variant="contained"
                  startIcon={<Payments />}
                  onClick={handleBuyNow}
                  disabled={buying}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: 'none',
                    bgcolor: '#3399ff',
                    '&:hover': {
                      bgcolor: '#007fff'
                    }
                  }}
                >
                  {buying ? 'Processing...' : 'Order'}
                </Button>
              </>
            )}

            {!isOwner && (
              <Button
                variant="outlined"
                startIcon={<Engineering />}
                onClick={handleOpenRequest}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': {
                    borderColor: '#3399ff',
                    color: '#3399ff'
                  }
                }}
              >
                Request Maintenance
              </Button>
            )}

            {!isOwner && (
              <Button
                variant="text"
                startIcon={<WhatsApp />}
                href={whatsappLink || undefined}
                target={whatsappLink ? '_blank' : undefined}
                rel={whatsappLink ? 'noopener noreferrer' : undefined}
                disabled={!whatsappLink}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  fontWeight: 700,
                  textTransform: 'none'
                }}
              >
                {whatsappLink ? 'Contact on WhatsApp' : 'No Phone Available'}
              </Button>
            )}
          </Stack>
        </Box>
      </Card>

      <Dialog
        open={openRequest}
        onClose={handleCloseRequest}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: '#132f4c',
            color: 'white',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ color: '#66b2ff', fontWeight: 800 }}>
          Send Maintenance Request
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Item"
              name="item"
              fullWidth
              value={requestForm.item}
              onChange={handleChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)'
                }
              }}
            />

            <TextField
              label="Problem Description"
              name="description"
              fullWidth
              multiline
              minRows={4}
              value={requestForm.description}
              onChange={handleChange}
              placeholder="Describe the issue clearly..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)'
                }
              }}
            />

            <TextField
              label="Location"
              name="location"
              fullWidth
              value={requestForm.location}
              onChange={handleChange}
              placeholder="Where should the repair be done?"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)'
                }
              }}
            />

            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Item Price: KES {Number(item?.price || 0).toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Maintenance Fee (5%): KES {maintenanceFee.toLocaleString()}
            </Typography>
            <Typography variant="body1" fontWeight={800} sx={{ color: '#90caf9' }}>
              Estimated Total: KES {maintenanceTotal.toLocaleString()}
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseRequest}
            disabled={submitting}
            sx={{ color: 'rgba(255,255,255,0.75)' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitRequest}
            disabled={submitting}
            sx={{
              bgcolor: '#3399ff',
              '&:hover': { bgcolor: '#007fff' }
            }}
          >
            {submitting ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ListingCard;