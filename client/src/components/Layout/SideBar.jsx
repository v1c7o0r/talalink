import React, { useMemo, useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Avatar,
  IconButton,
  AppBar,
  Toolbar,
  Tooltip
} from '@mui/material';
import {
  Home,
  Dashboard,
  Build,
  Chat,
  Settings,
  Logout,
  Verified,
  Menu as MenuIcon,
  Close as CloseIcon,
  Storefront,
  Person,
  ShoppingCart,
  ReceiptLong
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  }, []);

  const userInitial =
    storedUser?.username?.charAt(0)?.toUpperCase() ||
    storedUser?.email?.charAt(0)?.toUpperCase() ||
    'U';

  const userName = storedUser?.username || 'User';
  const userRole =
    storedUser?.role === 'admin' || storedUser?.is_admin
      ? 'Administrator'
      : 'Thika Artisan';

  const toggleDrawer = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    sessionStorage.clear();
    navigate('/login', { replace: true });
    setMobileOpen(false);
  };

  const menuItems = [
    { text: 'Marketplace', icon: <Storefront />, path: '/home' },
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Profile', icon: <Person />, path: '/profile' },
    { text: 'Maintenance Log', icon: <Build />, path: '/maintenance' },
    { text: 'Cart', icon: <ShoppingCart />, path: '/cart' },
    { text: 'Orders', icon: <ReceiptLong />, path: '/orders' },
    { text: 'Create Listing', icon: <Home />, path: '/create-listing' },
    { text: 'Discussions', icon: <Chat />, path: '/chat' },
  ];

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
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="h4"
            fontWeight={900}
            color="primary"
            sx={{ letterSpacing: 1 }}
          >
            TALALINK
          </Typography>
          <Verified sx={{ fontSize: 20, color: '#10b981' }} />
        </Box>

        <IconButton
          onClick={toggleDrawer}
          sx={{ color: 'white', display: { xs: 'inline-flex', md: 'none' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />

      <Box
        sx={{
          px: 3,
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            fontWeight: 'bold',
            width: 56,
            height: 56,
            color: '#000',
          }}
        >
          {userInitial}
        </Avatar>

        <Box>
          <Typography variant="h6" fontWeight={700}>
            {userName}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {userRole}
          </Typography>
        </Box>
      </Box>

      <List sx={{ px: 2 }}>
        {menuItems.map((item) => {
          const selected =
            location.pathname === item.path ||
            (item.path !== '/home' && location.pathname.startsWith(item.path));

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                selected={selected}
                sx={{
                  borderRadius: 3,
                  py: 1.4,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(25, 110, 230, 0.22)',
                    color: '#2f80ff',
                    '& .MuiListItemIcon-root': {
                      color: '#2f80ff',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.06)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'rgba(255,255,255,0.75)',
                    minWidth: 42,
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '1rem',
                    fontWeight: 700,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />

        <List>
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleNavigate('/settings')}
              sx={{ borderRadius: 3 }}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.75)' }}>
                <Settings />
              </ListItemIcon>
              <ListItemText
                primary="Settings"
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 3,
                color: '#ff5a5f',
                '&:hover': {
                  bgcolor: 'rgba(255, 90, 95, 0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ color: '#ff5a5f' }}>
                <Logout />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ fontWeight: 700 }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: '#0b1f3a',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: 72 }}>
          <Tooltip title="Open menu">
            <IconButton onClick={toggleDrawer} sx={{ color: 'white', mr: 2 }}>
              <MenuIcon />
            </IconButton>
          </Tooltip>

          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: 0.5 }}>
            TALALINK
          </Typography>
        </Toolbar>
      </AppBar>

      <Toolbar sx={{ minHeight: 72 }} />

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={toggleDrawer}
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

export default SideBar;