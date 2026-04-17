import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Add,
  Inventory2Rounded,
  EngineeringRounded,
  ShoppingCartRounded,
  OutboxRounded,
  CallReceivedRounded,
  MonetizationOnRounded,
  PendingActionsRounded,
  CheckCircleRounded,
  StorefrontRounded,
  TimelineRounded,
  AdminPanelSettingsRounded,
  LocalShippingRounded,
  InsightsRounded,
  BuildRounded,
  PersonRounded
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

import SideBar from '../components/Layout/SideBar';
import ListingForms from '../components/Forms/ListingForms';
import LocationPicker from '../components/Map/LocationPicker';

const API_BASE = 'http://127.0.0.1:5000';

const chartColors = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#22c55e',
];

const paperStyle = {
  bgcolor: '#10243b',
  color: '#e5eef8',
  borderRadius: 4,
  border: '1px solid rgba(255,255,255,0.06)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
};

const sectionTitleStyle = {
  color: '#ffffff',
  fontWeight: 800,
  mb: 2,
};

const getToken = () =>
  localStorage.getItem('token') ||
  localStorage.getItem('accessToken') ||
  localStorage.getItem('talalink_token') ||
  '';

const getAuthHeaders = () => {
  const token = getToken();
  return token
    ? {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    : {
        'Content-Type': 'application/json',
      };
};

const normalizeStatus = (value = '') => value.toString().trim().toLowerCase();

const safeArray = (value) => (Array.isArray(value) ? value : []);

const formatKES = (value = 0) =>
  `KES ${Number(value || 0).toLocaleString()}`;

const shortDate = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString();
};

const monthKey = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString('en-US', { month: 'short' });
};

const Dashboard = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: 0,
  });
  const [coords, setCoords] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [profile, setProfile] = useState(null);
  const [allListings, setAllListings] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [cart, setCart] = useState({ items: [], subtotal: 0, count: 0 });
  const [orders, setOrders] = useState([]);
  const [adminStats, setAdminStats] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');

      try {
        const headers = getAuthHeaders();

        const requests = [
          fetch(`${API_BASE}/profile`, { headers }),
          fetch(`${API_BASE}/listings`, { headers }),
          fetch(`${API_BASE}/maintenance`, { headers }),
          fetch(`${API_BASE}/cart`, { headers }),
          fetch(`${API_BASE}/orders`, { headers }),
        ];

        const results = await Promise.all(requests);
        const parsed = await Promise.all(results.map((res) => res.json()));

        const [profileData, listingsData, maintenanceData, cartData, ordersData] = parsed;

        if (!results[0].ok) {
          throw new Error(profileData?.error || 'Failed to load profile');
        }

        setProfile(profileData);
        setAllListings(safeArray(listingsData));
        setMaintenance(safeArray(maintenanceData));
        setCart({
          items: safeArray(cartData?.items),
          subtotal: Number(cartData?.subtotal || 0),
          count: Number(cartData?.count || 0),
        });
        setOrders(safeArray(ordersData));

        if (profileData?.is_admin) {
          const adminRes = await fetch(`${API_BASE}/admin/stats`, { headers });
          const adminData = await adminRes.json();
          if (adminRes.ok) {
            setAdminStats(adminData);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const analytics = useMemo(() => {
    const userId = profile?.id;
    const isAdmin = !!profile?.is_admin;

    const myListings = isAdmin
      ? allListings
      : allListings.filter((item) => item.user_id === userId);

    const activeListings = myListings.filter(
      (item) => normalizeStatus(item.status) === 'active'
    );
    const pendingListings = myListings.filter(
      (item) => normalizeStatus(item.status) === 'pending'
    );

    const maintenanceAsClient = maintenance.filter(
      (item) => item.client_id === userId
    );
    const maintenanceAsArtisan = maintenance.filter(
      (item) => item.artisan_id === userId
    );

    const pendingMaintenance = maintenance.filter((item) =>
      ['pending', 'open', 'in progress'].includes(normalizeStatus(item.status))
    );
    const completedMaintenance = maintenance.filter((item) =>
      ['completed', 'resolved'].includes(normalizeStatus(item.status))
    );

    const incomingOrders = orders.filter((item) => item.seller_id === userId);
    const outgoingOrders = orders.filter((item) => item.buyer_id === userId);

    const pendingOrders = orders.filter((item) =>
      ['pending', 'confirmed'].includes(normalizeStatus(item.status))
    );
    const completedOrders = orders.filter((item) =>
      ['completed', 'delivered'].includes(normalizeStatus(item.status))
    );
    const cancelledOrders = orders.filter((item) =>
      normalizeStatus(item.status) === 'cancelled'
    );

    const revenue = incomingOrders
      .filter((item) =>
        ['confirmed', 'delivered', 'completed'].includes(normalizeStatus(item.status))
      )
      .reduce((sum, item) => sum + Number(item.total_price || 0), 0);

    const spending = outgoingOrders.reduce(
      (sum, item) => sum + Number(item.total_price || 0),
      0
    );

    const maintenanceRevenue = maintenanceAsArtisan
      .filter((item) =>
        ['completed', 'resolved'].includes(normalizeStatus(item.status))
      )
      .reduce((sum, item) => sum + Number(item.maintenance_fee || 0), 0);

    const orderStatusData = [
      { name: 'Pending', value: pendingOrders.length },
      { name: 'Completed', value: completedOrders.length },
      { name: 'Cancelled', value: cancelledOrders.length },
    ].filter((item) => item.value > 0);

    const maintenanceStatusData = [
      {
        name: 'Pending',
        value: maintenance.filter((item) =>
          ['pending', 'open'].includes(normalizeStatus(item.status))
        ).length,
      },
      {
        name: 'In Progress',
        value: maintenance.filter(
          (item) => normalizeStatus(item.status) === 'in progress'
        ).length,
      },
      {
        name: 'Completed',
        value: completedMaintenance.length,
      },
    ].filter((item) => item.value > 0);

    const listingCategoryMap = {};
    myListings.forEach((item) => {
      const key = item.category || 'Other';
      listingCategoryMap[key] = (listingCategoryMap[key] || 0) + 1;
    });

    const listingCategoryData = Object.entries(listingCategoryMap).map(
      ([name, value]) => ({ name, value })
    );

    const monthlyMap = {};
    [...orders, ...maintenance].forEach((item) => {
      const key = monthKey(item.created_at);
      if (!monthlyMap[key]) {
        monthlyMap[key] = { name: key, orders: 0, maintenance: 0 };
      }

      if ('quantity' in item) monthlyMap[key].orders += 1;
      if ('maintenance_fee' in item) monthlyMap[key].maintenance += 1;
    });

    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const activityTrendData = Object.values(monthlyMap).sort(
      (a, b) => monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name)
    );

    const locationMap = {};
    [...orders, ...maintenance].forEach((item) => {
      const location = (item.location || 'Unspecified').trim() || 'Unspecified';
      locationMap[location] = (locationMap[location] || 0) + 1;
    });

    const logisticsData = Object.entries(locationMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const recentActivity = [...orders, ...maintenance, ...myListings]
      .map((item) => {
        if ('quantity' in item) {
          return {
            type: 'Order',
            title: item.item,
            status: item.status,
            amount: item.total_price,
            date: item.created_at,
          };
        }
        if ('maintenance_fee' in item) {
          return {
            type: 'Maintenance',
            title: item.item,
            status: item.status,
            amount: item.total_price,
            date: item.created_at,
          };
        }
        return {
          type: 'Listing',
          title: item.title,
          status: item.status,
          amount: item.price,
          date: item.created_at,
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);

    const fulfillmentRate =
      orders.length > 0
        ? Math.round((completedOrders.length / orders.length) * 100)
        : 0;

    const maintenanceCompletionRate =
      maintenance.length > 0
        ? Math.round((completedMaintenance.length / maintenance.length) * 100)
        : 0;

    const statsCards = [
      {
        label: 'My Listings',
        value: myListings.length,
        icon: <StorefrontRounded />,
        color: '#3b82f6',
        helper: `${activeListings.length} active`,
      },
      {
        label: 'Cart Items',
        value: cart.count,
        icon: <ShoppingCartRounded />,
        color: '#8b5cf6',
        helper: formatKES(cart.subtotal),
      },
      {
        label: 'Incoming Orders',
        value: incomingOrders.length,
        icon: <CallReceivedRounded />,
        color: '#06b6d4',
        helper: 'Sales received',
      },
      {
        label: 'Outgoing Orders',
        value: outgoingOrders.length,
        icon: <OutboxRounded />,
        color: '#f59e0b',
        helper: 'Purchases made',
      },
      {
        label: 'Maintenance Jobs',
        value: maintenance.length,
        icon: <EngineeringRounded />,
        color: '#ef4444',
        helper: `${completedMaintenance.length} completed`,
      },
      {
        label: 'Sales Revenue',
        value: formatKES(revenue),
        icon: <MonetizationOnRounded />,
        color: '#22c55e',
        helper: 'From incoming orders',
      },
      {
        label: 'Maintenance Earnings',
        value: formatKES(maintenanceRevenue),
        icon: <BuildRounded />,
        color: '#14b8a6',
        helper: 'Completed jobs only',
      },
      {
        label: 'Total Spending',
        value: formatKES(spending),
        icon: <PendingActionsRounded />,
        color: '#f97316',
        helper: 'Orders you placed',
      },
    ];

    const insights = [
      revenue > spending
        ? 'Your sales revenue is currently higher than your purchase spending.'
        : 'Your purchase spending is currently higher than your sales revenue.',
      pendingOrders.length > 0
        ? `${pendingOrders.length} order(s) still need action or fulfillment.`
        : 'All visible orders are cleared or completed.',
      pendingMaintenance.length > 0
        ? `${pendingMaintenance.length} maintenance task(s) still require attention.`
        : 'No pending maintenance tasks at the moment.',
      logisticsData.length > 0
        ? `Top activity area: ${logisticsData[0].name} with ${logisticsData[0].value} transaction(s).`
        : 'No logistics location data yet.',
      cart.count > 0
        ? `There are ${cart.count} item(s) sitting in cart worth ${formatKES(cart.subtotal)}.`
        : 'The cart is currently empty.',
      pendingListings.length > 0
        ? `${pendingListings.length} listing(s) are pending and may need review or activation.`
        : 'Your listings are mostly active.',
    ];

    return {
      isAdmin,
      myListings,
      activeListings,
      pendingListings,
      maintenanceAsClient,
      maintenanceAsArtisan,
      pendingMaintenance,
      completedMaintenance,
      incomingOrders,
      outgoingOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      revenue,
      spending,
      maintenanceRevenue,
      orderStatusData,
      maintenanceStatusData,
      listingCategoryData,
      activityTrendData,
      logisticsData,
      recentActivity,
      fulfillmentRate,
      maintenanceCompletionRate,
      statsCards,
      insights,
    };
  }, [profile, allListings, maintenance, cart, orders]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#08111f' }}>
        <SideBar isLoggedIn={true} />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography sx={{ color: '#c9d4e5' }}>
              Loading your dashboard...
            </Typography>
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#08111f' }}>
      <SideBar isLoggedIn={true} />

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, mt: 1 }}>
        <Container maxWidth="xl">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
            sx={{ mb: 4 }}
          >
            <Box>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Typography variant="h4" fontWeight={900} color="white">
                  Dashboard
                </Typography>
                {profile?.is_admin ? (
                  <Chip
                    icon={<AdminPanelSettingsRounded />}
                    label="Admin"
                    sx={{
                      bgcolor: 'rgba(59,130,246,0.18)',
                      color: '#60a5fa',
                      fontWeight: 700,
                    }}
                  />
                ) : (
                  <Chip
                    icon={<PersonRounded />}
                    label="User"
                    sx={{
                      bgcolor: 'rgba(34,197,94,0.18)',
                      color: '#4ade80',
                      fontWeight: 700,
                    }}
                  />
                )}
              </Stack>

              <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                Welcome back{profile?.username ? `, ${profile.username}` : ''}. Here is your marketplace performance, operations flow, and logistics overview.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowUpload(!showUpload)}
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1.2,
                bgcolor: '#2563eb',
                fontWeight: 700,
                '&:hover': { bgcolor: '#1d4ed8' },
              }}
            >
              {showUpload ? 'Back to Dashboard' : 'New Listing'}
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {showUpload ? (
            <Grid container spacing={4}>
              <Grid item xs={12} md={7}>
                <Paper sx={{ ...paperStyle, p: 4 }}>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
                    Create Listing
                  </Typography>
                  <ListingForms formData={formData} setFormData={setFormData} />
                </Paper>
              </Grid>

              <Grid item xs={12} md={5}>
                <Paper sx={{ ...paperStyle, p: 4 }}>
                  <Typography variant="h6" fontWeight={800}>
                    Verify Location
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <LocationPicker coords={coords} setCoords={setCoords} />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {analytics.statsCards.map((stat, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Paper
                      sx={{
                        ...paperStyle,
                        p: 2.5,
                        height: '100%',
                        transition: '0.25s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: stat.color,
                        },
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: `${stat.color}20`,
                            color: stat.color,
                          }}
                        >
                          {stat.icon}
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{ color: 'rgba(255,255,255,0.65)' }}
                          >
                            {stat.label}
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 900,
                              color: '#fff',
                              lineHeight: 1.2,
                              wordBreak: 'break-word',
                            }}
                          >
                            {stat.value}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'rgba(255,255,255,0.5)' }}
                          >
                            {stat.helper}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {analytics.isAdmin && adminStats && (
                <Paper sx={{ ...paperStyle, p: 3, mb: 4 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <AdminPanelSettingsRounded sx={{ color: '#60a5fa' }} />
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      Admin Platform Summary
                    </Typography>
                  </Stack>

                  <Grid container spacing={2}>
                    {[
                      ['Total Users', adminStats.total_users],
                      ['Verified Users', adminStats.verified_users],
                      ['Total Listings', adminStats.total_listings],
                      ['Active Listings', adminStats.active_listings],
                      ['Total Maintenance', adminStats.total_maintenance],
                      ['Total Orders', adminStats.total_orders],
                      ['Pending Orders', adminStats.pending_orders],
                      ['Completed Orders', adminStats.completed_orders],
                    ].map(([label, value], idx) => (
                      <Grid item xs={12} sm={6} md={3} key={idx}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: 'rgba(255,255,255,0.6)' }}
                          >
                            {label}
                          </Typography>
                          <Typography variant="h5" fontWeight={900}>
                            {value}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                  <Paper sx={{ ...paperStyle, p: 3, height: 380 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <TimelineRounded sx={{ color: '#22c55e' }} />
                      <Typography variant="h6" sx={sectionTitleStyle}>
                        Activity Trend
                      </Typography>
                    </Stack>

                    <ResponsiveContainer width="100%" height="85%">
                      <LineChart data={analytics.activityTrendData}>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="name" stroke="#9fb2c7" />
                        <YAxis stroke="#9fb2c7" allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f1b2d',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 12,
                            color: '#fff',
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="orders"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          name="Orders"
                        />
                        <Line
                          type="monotone"
                          dataKey="maintenance"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          name="Maintenance"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12} lg={4}>
                  <Paper sx={{ ...paperStyle, p: 3, height: 380 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <InsightsRounded sx={{ color: '#f59e0b' }} />
                      <Typography variant="h6" sx={sectionTitleStyle}>
                        Order Status
                      </Typography>
                    </Stack>

                    <ResponsiveContainer width="100%" height="85%">
                      <PieChart>
                        <Pie
                          data={analytics.orderStatusData}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={110}
                          innerRadius={55}
                          paddingAngle={4}
                        >
                          {analytics.orderStatusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={chartColors[index % chartColors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f1b2d',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 12,
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ ...paperStyle, p: 3, height: 360 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <Inventory2Rounded sx={{ color: '#60a5fa' }} />
                      <Typography variant="h6" sx={sectionTitleStyle}>
                        Listing Categories
                      </Typography>
                    </Stack>

                    <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={analytics.listingCategoryData}>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="name" stroke="#9fb2c7" />
                        <YAxis stroke="#9fb2c7" allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f1b2d',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 12,
                          }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {analytics.listingCategoryData.map((entry, index) => (
                            <Cell
                              key={`cat-${index}`}
                              fill={chartColors[index % chartColors.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ ...paperStyle, p: 3, height: 360 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <EngineeringRounded sx={{ color: '#f87171' }} />
                      <Typography variant="h6" sx={sectionTitleStyle}>
                        Maintenance Status
                      </Typography>
                    </Stack>

                    <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={analytics.maintenanceStatusData}>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="name" stroke="#9fb2c7" />
                        <YAxis stroke="#9fb2c7" allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f1b2d',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 12,
                          }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {analytics.maintenanceStatusData.map((entry, index) => (
                            <Cell
                              key={`main-${index}`}
                              fill={chartColors[index % chartColors.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12} lg={5}>
                  <Paper sx={{ ...paperStyle, p: 3, height: '100%' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <LocalShippingRounded sx={{ color: '#22c55e' }} />
                      <Typography variant="h6" sx={sectionTitleStyle}>
                        Logistics Analysis
                      </Typography>
                    </Stack>

                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                      Top activity areas based on orders and maintenance locations.
                    </Typography>

                    <Stack spacing={2}>
                      {analytics.logisticsData.length > 0 ? (
                        analytics.logisticsData.map((item, index) => {
                          const maxValue = analytics.logisticsData[0]?.value || 1;
                          const progress = Math.round((item.value / maxValue) * 100);

                          return (
                            <Box key={item.name}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ mb: 0.8 }}
                              >
                                <Typography sx={{ color: '#fff', fontWeight: 700 }}>
                                  {item.name}
                                </Typography>
                                <Typography sx={{ color: 'rgba(255,255,255,0.75)' }}>
                                  {item.value}
                                </Typography>
                              </Stack>
                              <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                  height: 10,
                                  borderRadius: 10,
                                  bgcolor: 'rgba(255,255,255,0.08)',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 10,
                                    bgcolor: chartColors[index % chartColors.length],
                                  },
                                }}
                              />
                            </Box>
                          );
                        })
                      ) : (
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          No location records available yet.
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} lg={7}>
                  <Paper sx={{ ...paperStyle, p: 3, height: '100%' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <CheckCircleRounded sx={{ color: '#60a5fa' }} />
                      <Typography variant="h6" sx={sectionTitleStyle}>
                        Fulfillment Performance
                      </Typography>
                    </Stack>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.03)',
                          }}
                        >
                          <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                            Order Fulfillment Rate
                          </Typography>
                          <Typography variant="h3" fontWeight={900} color="#fff">
                            {analytics.fulfillmentRate}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={analytics.fulfillmentRate}
                            sx={{
                              mt: 2,
                              height: 10,
                              borderRadius: 10,
                              bgcolor: 'rgba(255,255,255,0.08)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: '#3b82f6',
                                borderRadius: 10,
                              },
                            }}
                          />
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.03)',
                          }}
                        >
                          <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                            Maintenance Completion Rate
                          </Typography>
                          <Typography variant="h3" fontWeight={900} color="#fff">
                            {analytics.maintenanceCompletionRate}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={analytics.maintenanceCompletionRate}
                            sx={{
                              mt: 2,
                              height: 10,
                              borderRadius: 10,
                              bgcolor: 'rgba(255,255,255,0.08)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: '#10b981',
                                borderRadius: 10,
                              },
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

                    <Stack spacing={1.4}>
                      {analytics.insights.map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 1.5,
                            borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.03)',
                            color: '#dbe7f5',
                            border: '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          {item}
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ ...paperStyle, p: 3 }}>
                    <Typography variant="h6" sx={sectionTitleStyle}>
                      Recent Activity
                    </Typography>

                    <Grid container spacing={2}>
                      {analytics.recentActivity.length > 0 ? (
                        analytics.recentActivity.map((item, index) => (
                          <Grid item xs={12} md={6} lg={4} key={index}>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 3,
                                bgcolor: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                height: '100%',
                              }}
                            >
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ mb: 1 }}
                              >
                                <Chip
                                  size="small"
                                  label={item.type}
                                  sx={{
                                    bgcolor: 'rgba(59,130,246,0.16)',
                                    color: '#93c5fd',
                                    fontWeight: 700,
                                  }}
                                />
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                  {shortDate(item.date)}
                                </Typography>
                              </Stack>

                              <Typography variant="h6" fontWeight={800} color="#fff">
                                {item.title}
                              </Typography>

                              <Typography sx={{ color: 'rgba(255,255,255,0.65)', mt: 0.6 }}>
                                Status: {item.status || 'N/A'}
                              </Typography>

                              <Typography sx={{ color: '#4ade80', fontWeight: 800, mt: 1 }}>
                                {formatKES(item.amount || 0)}
                              </Typography>
                            </Box>
                          </Grid>
                        ))
                      ) : (
                        <Grid item xs={12}>
                          <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            No recent activity found.
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;