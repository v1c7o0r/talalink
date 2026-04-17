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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Engineering,
  AssignmentReturn,
  WhatsApp,
  AccessTime,
  LocationOn,
  Add,
  Chat
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SideBar from '../components/Layout/SideBar';

const API_BASE = 'http://127.0.0.1:5000';

const Maintenance = () => {
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [anchorEl, setAnchorEl] = useState(null);
  const [activeRepairId, setActiveRepairId] = useState(null);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  const [currentUser, setCurrentUser] = useState({
    id: null,
    username: 'Guest',
    email: '',
    phone_number: ''
  });

  const [form, setForm] = useState({
    item: '',
    description: '',
    location: '',
    artisan_id: '',
    listing_id: '',
    phone: ''
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
      `Hello, I'm contacting you regarding the maintenance of: ${item || 'your listing'}`
    );

    return `https://wa.me/${normalizedPhone}?text=${message}`;
  };

  const loadCurrentUser = useCallback(async () => {
    if (!token) {
      setCurrentUser({
        id: null,
        username: 'Guest',
        email: '',
        phone_number: ''
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
        phone_number: data.phone_number || ''
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
            phone_number: savedUser.phone_number || ''
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
        phone_number: ''
      });
    }
  }, [token]);

  const fetchRepairs = useCallback(async () => {
    if (!token) {
      setRepairs([]);
      setLoading(false);
      setPageError('You are not logged in.');
      return;
    }

    setLoading(true);
    setPageError('');

    try {
      const response = await fetch(`${API_BASE}/maintenance`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      let data = [];
      try {
        data = await response.json();
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        throw new Error('Backend did not return valid JSON.');
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `Failed with status ${response.status}`);
      }

      const normalizedRepairs = Array.isArray(data)
        ? data.map((repair) => ({
            ...repair,
            phone: normalizePhone(repair.phone)
          }))
        : [];

      setRepairs(normalizedRepairs);
    } catch (err) {
      console.error('Fetch maintenance error:', err);
      setRepairs([]);
      setPageError(err.message || 'Failed to fetch maintenance tasks');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCurrentUser();
    fetchRepairs();
  }, [loadCurrentUser, fetchRepairs]);

  const handleUpdateClick = (event, id) => {
    setAnchorEl(event.currentTarget);
    setActiveRepairId(id);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setActiveRepairId(null);
  };

  const updateStatus = async (newStatus) => {
    if (!activeRepairId || !token) return;

    try {
      const response = await fetch(`${API_BASE}/maintenance/${activeRepairId}/status`, {
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
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        throw new Error('Backend did not return valid JSON.');
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update status');
      }

      setSuccessMessage(`Status updated to "${newStatus}"`);
      setPageError('');
      handleCloseMenu();
      fetchRepairs();
    } catch (err) {
      console.error('Update status error:', err);
      setPageError(err.message || 'Network error during update');
      handleCloseMenu();
    }
  };

  const handleOpenCreateDialog = () => {
    setSuccessMessage('');
    setPageError('');
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    if (creating) return;

    setOpenCreateDialog(false);
    setForm({
      item: '',
      description: '',
      location: '',
      artisan_id: '',
      listing_id: '',
      phone: ''
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const submitMaintenanceRequest = async () => {
    if (!token) {
      setPageError('You are not logged in.');
      return;
    }

    if (!form.item.trim()) {
      setPageError('Item is required.');
      return;
    }

    if (!form.artisan_id.trim()) {
      setPageError('Artisan ID is required.');
      return;
    }

    const normalizedManualPhone = normalizePhone(form.phone);

    try {
      setCreating(true);
      setPageError('');
      setSuccessMessage('');

      const payload = {
        item: form.item.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        artisan_id: Number(form.artisan_id),
        phone: normalizedManualPhone,
        listing_id: form.listing_id.trim() ? Number(form.listing_id) : null
      };

      const response = await fetch(`${API_BASE}/maintenance`, {
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
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        throw new Error('Backend did not return valid JSON.');
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create maintenance request');
      }

      setSuccessMessage('Maintenance request created successfully.');
      setOpenCreateDialog(false);
      setForm({
        item: '',
        description: '',
        location: '',
        artisan_id: '',
        listing_id: '',
        phone: ''
      });
      setTabValue(1);
      fetchRepairs();
    } catch (err) {
      console.error('Create maintenance error:', err);
      setPageError(err.message || 'Failed to create maintenance request');
    } finally {
      setCreating(false);
    }
  };

  const createOrOpenChat = async (repair) => {
    if (!token || !currentUser?.id) {
      setPageError('You must be logged in to open chat.');
      return;
    }

    const otherUserId =
      Number(currentUser.id) === Number(repair.client_id)
        ? Number(repair.artisan_id)
        : Number(repair.client_id);

    if (!otherUserId) {
      setPageError('Could not determine chat participant.');
      return;
    }

    try {
      setPageError('');
      setSuccessMessage('');

      const payload = {
        buyer_id: Number(repair.client_id),
        artisan_id: Number(repair.artisan_id),
        maintenance_id: Number(repair.id)
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
      console.error('Open chat error:', error);
      setPageError(error.message || 'Failed to open local chat');
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Completed':
        return {
          color: '#4caf50',
          bg: 'rgba(76, 175, 80, 0.12)',
          border: 'rgba(76, 175, 80, 0.35)'
        };
      case 'In Progress':
        return {
          color: '#ff9800',
          bg: 'rgba(255, 152, 0, 0.12)',
          border: 'rgba(255, 152, 0, 0.35)'
        };
      default:
        return {
          color: '#f44336',
          bg: 'rgba(244, 67, 54, 0.12)',
          border: 'rgba(244, 67, 54, 0.35)'
        };
    }
  };

  const incomingTasks = useMemo(() => {
    return repairs.filter(
      (repair) => Number(repair.artisan_id) === Number(currentUser.id)
    );
  }, [repairs, currentUser.id]);

  const outgoingTasks = useMemo(() => {
    return repairs.filter(
      (repair) => Number(repair.client_id) === Number(currentUser.id)
    );
  }, [repairs, currentUser.id]);

  const visibleRepairs = tabValue === 0 ? incomingTasks : outgoingTasks;

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
                Maintenance Hub
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Logged in as{' '}
                <strong style={{ color: '#3399ff' }}>
                  {currentUser.username || 'Guest'}
                </strong>
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenCreateDialog}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              New Request
            </Button>
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
                icon={<Engineering />}
                label={`INCOMING TASKS (${incomingTasks.length})`}
              />
              <Tab
                icon={<AssignmentReturn />}
                label={`OUTGOING REQUESTS (${outgoingTasks.length})`}
              />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : visibleRepairs.length > 0 ? (
                visibleRepairs.map((repair) => {
                  const statusStyles = getStatusStyles(repair.status);
                  const whatsappLink = getWhatsAppLink(repair.phone, repair.item);
                  const hasWhatsApp = Boolean(whatsappLink);
                  const participantName =
                    tabValue === 0
                      ? repair.client || 'Unknown Client'
                      : repair.artisan || `Artisan #${repair.artisan_id}`;

                  return (
                    <Paper
                      key={repair.id}
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
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        spacing={2}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            onClick={() => createOrOpenChat(repair)}
                            sx={{
                              bgcolor: '#007fff',
                              width: 48,
                              height: 48,
                              fontWeight: 800,
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: '0 0 0 2px rgba(51,153,255,0.35)'
                              }
                            }}
                          >
                            {repair.item ? repair.item[0].toUpperCase() : 'M'}
                          </Avatar>

                          <Box>
                            <Typography variant="subtitle1" fontWeight={700}>
                              {repair.item}
                            </Typography>

                            {!!repair.description && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'rgba(255,255,255,0.65)',
                                  mt: 0.5
                                }}
                              >
                                {repair.description}
                              </Typography>
                            )}

                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              flexWrap="wrap"
                              useFlexGap
                              sx={{ mt: 1 }}
                            >
                              <Typography
                                variant="caption"
                                onClick={() => createOrOpenChat(repair)}
                                sx={{
                                  color: '#66b2ff',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  '&:hover': {
                                    textDecoration: 'underline'
                                  }
                                }}
                              >
                                {tabValue === 0 ? 'From: ' : 'Assigned to: '}
                                {participantName}
                              </Typography>

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
                                  {repair.status === 'Completed' ? 'Closed' : 'Active'}
                                </Typography>
                              </Stack>

                              {!!repair.location && (
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
                                      {repair.location}
                                    </Typography>
                                  </Stack>
                                </>
                              )}

                              {!!repair.phone && (
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
                                    WhatsApp: {repair.phone}
                                  </Typography>
                                </>
                              )}
                            </Stack>
                          </Box>
                        </Stack>

                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1.5}
                          alignItems={{ xs: 'stretch', sm: 'center' }}
                          sx={{ width: { xs: '100%', md: 'auto' } }}
                        >
                          <Chip
                            label={repair.status}
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
                            onClick={() => createOrOpenChat(repair)}
                            size="small"
                            sx={{
                              color: '#66b2ff',
                              textTransform: 'none',
                              fontWeight: 700
                            }}
                          >
                            Chat Here
                          </Button>

                          {tabValue === 0 && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={(e) => handleUpdateClick(e, repair.id)}
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
                    </Paper>
                  );
                })
              ) : (
                <Box textAlign="center" py={5}>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                    {tabValue === 0
                      ? 'No incoming maintenance tasks found.'
                      : 'No outgoing maintenance requests found.'}
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
        <MenuItem onClick={() => updateStatus('In Progress')}>In Progress</MenuItem>
        <MenuItem onClick={() => updateStatus('Completed')}>Completed</MenuItem>
      </Menu>

      <Dialog
        open={openCreateDialog}
        onClose={handleCloseCreateDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create Maintenance Request</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Item"
              name="item"
              value={form.item}
              onChange={handleFormChange}
              fullWidth
              required
            />

            <TextField
              label="Description"
              name="description"
              value={form.description}
              onChange={handleFormChange}
              multiline
              minRows={3}
              fullWidth
            />

            <TextField
              label="Location"
              name="location"
              value={form.location}
              onChange={handleFormChange}
              fullWidth
            />

            <TextField
              label="Artisan ID"
              name="artisan_id"
              value={form.artisan_id}
              onChange={handleFormChange}
              type="number"
              fullWidth
              required
              helperText="Enter the user ID of the artisan receiving this request"
            />

            <TextField
              label="Listing ID"
              name="listing_id"
              value={form.listing_id}
              onChange={handleFormChange}
              type="number"
              fullWidth
              helperText="Optional when creating manually, but recommended for correct phone resolution"
            />

            <TextField
              label="WhatsApp Number"
              name="phone"
              value={form.phone}
              onChange={handleFormChange}
              fullWidth
              helperText="Optional manual fallback. Use format like 0712345678 or 254712345678"
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseCreateDialog} disabled={creating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitMaintenanceRequest}
            disabled={creating}
          >
            {creating ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Maintenance;