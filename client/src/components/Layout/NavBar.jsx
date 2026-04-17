import { useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  Drawer,
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  PersonAddAlt1,
  Login as LoginIcon,
  Logout as LogoutIcon,
  ShoppingCart,
  Menu as MenuIcon,
  Close as CloseIcon,
  Home,
  Dashboard,
  Build,
  AddBusiness,
  AdminPanelSettings,
} from '@mui/icons-material';

const drawerWidth = 280;

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('adminToken');

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const isAdmin = user?.role === 'admin' || user?.is_admin === true;

  const userInitial = useMemo(() => {
    return user?.username?.charAt(0)?.toUpperCase() || 'U';
  }, [user]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
    closeSidebar();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    sessionStorage.clear();
    closeSidebar();
    navigate('/', { replace: true });
  };

  const menuItems = [
    { text: 'Marketplace', icon: <Home />, path: '/home' },
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', protected: true },
    { text: 'Cart', icon: <ShoppingCart />, path: '/cart', protected: true },
    { text: 'Maintenance Log', icon: <Build />, path: '/maintenance', protected: true },
    { text: 'Create Listing', icon: <AddBusiness />, path: '/create-listing', protected: true },
  ];

  const visibleMenuItems = menuItems.filter((item) => {
    if (item.protected && !token) return false;
    return true;
  });

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#112240',
        color: 'white',
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="h5"
          fontWeight={900}
          color="primary"
          sx={{ letterSpacing: 1 }}
        >
          TALALINK
        </Typography>

        <IconButton onClick={closeSidebar} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

      {token && (
        <Box
          sx={{
            px: 3,
            py: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'primary.main',
              color: '#000',
              fontWeight: 800,
            }}
          >
            {userInitial}
          </Avatar>

          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {user?.username || 'User'}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {isAdmin ? 'Administrator' : 'Member'}
            </Typography>
          </Box>
        </Box>
      )}

      <List sx={{ px: 2, py: 2 }}>
        {visibleMenuItems.map((item) => {
          const selected =
            location.pathname === item.path ||
            (item.path !== '/home' && location.pathname.startsWith(item.path));

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                selected={selected}
                sx={{
                  borderRadius: 2.5,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(25, 118, 210, 0.18)',
                    color: '#2f80ff',
                    '& .MuiListItemIcon-root': {
                      color: '#2f80ff',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'rgba(255,255,255,0.75)',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        {token && isAdmin && (
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleNavigate('/admin')}
              selected={location.pathname.startsWith('/admin')}
              sx={{
                borderRadius: 2.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(25, 118, 210, 0.18)',
                  color: '#2f80ff',
                  '& .MuiListItemIcon-root': {
                    color: '#2f80ff',
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'rgba(255,255,255,0.75)',
                  minWidth: 40,
                }}
              >
                <AdminPanelSettings />
              </ListItemIcon>
              <ListItemText
                primary="Admin Dashboard"
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                }}
              />
            </ListItemButton>
          </ListItem>
        )}
      </List>

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />

        {token ? (
          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              borderColor: 'rgba(211, 47, 47, 0.5)',
            }}
          >
            Logout
          </Button>
        ) : (
          <Stack spacing={1.5}>
            <Button
              variant="text"
              color="inherit"
              component={Link}
              to="/login"
              startIcon={<LoginIcon />}
              onClick={closeSidebar}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 700 }}
            >
              Login
            </Button>

            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/signup"
              startIcon={<PersonAddAlt1 />}
              onClick={closeSidebar}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 700 }}
            >
              Sign Up
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'rgba(10, 25, 47, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Tooltip title="Open menu">
                <IconButton color="inherit" onClick={toggleSidebar}>
                  <MenuIcon />
                </IconButton>
              </Tooltip>

              <Typography
                variant="h6"
                fontWeight={900}
                color="primary"
                component={Link}
                to="/"
                sx={{ textDecoration: 'none', letterSpacing: 1 }}
              >
                TALALINK
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                color="inherit"
                component={Link}
                to="/home"
                sx={{ fontWeight: 600, textTransform: 'none', mr: 1, display: { xs: 'none', md: 'inline-flex' } }}
              >
                Marketplace
              </Button>

              {token ? (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Tooltip title="View Cart">
                    <IconButton color="inherit" component={Link} to="/cart">
                      <ShoppingCart />
                    </IconButton>
                  </Tooltip>

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: 'primary.light',
                      display: { xs: 'none', sm: 'block' },
                    }}
                  >
                    Hi, {user?.username || 'User'}
                  </Typography>

                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'primary.main',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: '#000',
                    }}
                  >
                    {userInitial}
                  </Avatar>

                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleLogout}
                    startIcon={<LogoutIcon />}
                    sx={{
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: '8px',
                      borderColor: 'rgba(211, 47, 47, 0.5)',
                      display: { xs: 'none', md: 'inline-flex' },
                    }}
                  >
                    Logout
                  </Button>
                </Stack>
              ) : (
                <>
                  <Button
                    variant="text"
                    color="inherit"
                    component={Link}
                    to="/login"
                    startIcon={<LoginIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      fontWeight: 700,
                      textTransform: 'none',
                      display: { xs: 'none', sm: 'inline-flex' },
                    }}
                  >
                    Login
                  </Button>

                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to="/signup"
                    startIcon={<PersonAddAlt1 />}
                    sx={{
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: '8px',
                      ml: 1,
                      display: { xs: 'none', sm: 'inline-flex' },
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={closeSidebar}
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#112240',
            color: 'white',
            borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default NavBar;