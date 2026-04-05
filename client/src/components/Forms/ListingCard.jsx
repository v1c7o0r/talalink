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
  WhatsApp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://127.0.0.1:5000';

const ListingCard = ({ item }) => {
  const navigate = useNavigate();

  const [openRequest, setOpenRequest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const isOwner = Number(currentUser?.id) === Number(item.user_id);

  const handleOpenDetails = () => {
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
          artisan_id: Number(item.user_id)
        })
      });

      const data = await response.json();

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
      console.error(error);
      alert(error.message || 'Something went wrong while sending request');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappLink = item?.phone_number
    ? `https://wa.me/${String(item.phone_number).replace(/\D/g, '')}`
    : null;

  return (
    <>
      <Card
        onClick={handleOpenDetails}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          position: 'relative',
          bgcolor: 'background.paper',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.12)'
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="220"
            image={item.image_url || 'https://via.placeholder.com/400x220?text=No+Image'}
            alt={item.title}
          />

          <Chip
            label={item.category}
            color={item.category === 'Service' ? 'primary' : 'secondary'}
            size="small"
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
                  navigate(`/edit-listing/${item.id}`);
                }}
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  bgcolor: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' }
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1 }}>
          <Stack spacing={1.2}>
            <Typography variant="h6" fontWeight={800} noWrap>
              {item.title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                minHeight: 44,
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {item.description}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {item.category === 'Service' ? (
                <Build fontSize="small" color="primary" />
              ) : (
                <ShoppingBag fontSize="small" color="primary" />
              )}

              <Typography variant="body2" color="text.secondary">
                {item.author_username || 'Unknown seller'}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <LocationOn fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {item.location || 'No location'}
              </Typography>
            </Stack>

            <Typography variant="h6" fontWeight={900} color="primary.main">
              KES {Number(item.price || 0).toLocaleString()}
            </Typography>
          </Stack>
        </CardContent>

        <Box sx={{ p: 2, pt: 0 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              fullWidth
              variant="contained"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetails();
              }}
              sx={{ fontWeight: 700 }}
            >
              View Details
            </Button>

            {!isOwner && (
              <Button
                fullWidth
                variant="outlined"
                onClick={handleOpenRequest}
                sx={{ fontWeight: 700 }}
              >
                Request Maintenance
              </Button>
            )}

            {whatsappLink && (
              <Button
                fullWidth
                variant="text"
                startIcon={<WhatsApp />}
                href={whatsappLink}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                sx={{ fontWeight: 700 }}
              >
                Contact
              </Button>
            )}
          </Stack>
        </Box>
      </Card>

      <Dialog open={openRequest} onClose={handleCloseRequest} fullWidth maxWidth="sm">
        <DialogTitle>Send Maintenance Request</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Item"
              name="item"
              fullWidth
              value={requestForm.item}
              onChange={handleChange}
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
            />

            <TextField
              label="Location"
              name="location"
              fullWidth
              value={requestForm.location}
              onChange={handleChange}
              placeholder="Where should the repair be done?"
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseRequest} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitRequest}
            disabled={submitting}
          >
            {submitting ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ListingCard;