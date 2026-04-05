import React, { useState, useMemo } from 'react';
import { Box, Container, Grid, Paper, Typography, Button, Stack } from '@mui/material';
import { Add, Inventory, Engineering, BarChart } from '@mui/icons-material';
import SideBar from '../components/Layout/SideBar';
import ListingForms from '../components/Forms/ListingForms';
import LocationPicker from '../components/Map/LocationPicker';

const Dashboard = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({ title: '', category: '', description: '', price: 0 });
  const [coords, setCoords] = useState(null);

  // MOCK DATA (In a real app, these would come from your Backend/Context)
  const [myListings] = useState([
    { id: 1, title: 'Solar Inverter', price: 5000 },
    { id: 2, title: 'Water Pump', price: 12000 },
  ]);

  const [myRepairs] = useState([
    { id: 1, item: 'Solar Inverter', status: 'Pending', price: 1500 },
    { id: 2, item: 'Water Pump', status: 'In Progress', price: 3000 },
    { id: 3, item: 'Laptop Battery', status: 'Completed', price: 45000 },
  ]);

  // DYNAMIC CALCULATIONS
  const stats = useMemo(() => {
    const activeListingsCount = myListings.length;
    
    // Only count repairs that are NOT completed
    const pendingRepairsCount = myRepairs.filter(r => r.status !== 'Completed').length;
    
    // Only sum earnings from Completed repairs
    const totalEarnings = myRepairs
      .filter(r => r.status === 'Completed')
      .reduce((sum, current) => sum + current.price, 0);

    return [
      { label: 'Active Listings', value: activeListingsCount, icon: <Inventory />, color: '#196ee6' },
      { label: 'Pending Repairs', value: pendingRepairsCount, icon: <Engineering />, color: '#f59e0b' },
      { label: 'Total Earnings', value: `KES ${totalEarnings.toLocaleString()}`, icon: <BarChart />, color: '#10b981' },
    ];
  }, [myListings, myRepairs]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0a1929' }}> {/* Deep Blue/Black BG */}
      <SideBar isLoggedIn={true} />
      
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, mt: 2 }}>
        <Container maxWidth="lg">
          
          {/* Header Section */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Box>
              <Typography variant="h4" fontWeight={900} color="white">Artisan Console</Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Manage your Thika-based goods and services
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              startIcon={<Add />} 
              onClick={() => setShowUpload(!showUpload)}
              sx={{ borderRadius: 2, px: 3, bgcolor: '#007fff', '&:hover': { bgcolor: '#0059b2' } }}
            >
              {showUpload ? "View Analytics" : "New Listing"}
            </Button>
          </Stack>

          {showUpload ? (
            /* Upload Workflow Section */
            <Grid container spacing={4}>
              <Grid item xs={12} md={7}>
                <Paper sx={{ p: 4, borderRadius: 4, bgcolor: '#132f4c', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                  <ListingForms formData={formData} setFormData={setFormData} />
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={5}>
                <Paper sx={{ p: 4, borderRadius: 4, height: '100%', bgcolor: '#132f4c', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Verify Origin</Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.6)' }}>
                    Pin your workshop location in Thika to earn the "Eco-Trace" badge.
                  </Typography>
                  
                  <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <LocationPicker coords={coords} setCoords={setCoords} />
                  </Box>
                  
                  <Button 
                    fullWidth 
                    variant="contained" 
                    size="large" 
                    disabled={!coords || !formData.title}
                    sx={{ mt: 4, py: 2, borderRadius: 3, bgcolor: '#007fff', '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' } }}
                  >
                    Publish to Marketplace
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            /* Dashboard Overview Stats */
            <Grid container spacing={3}>
              {stats.map((stat, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Paper sx={{ 
                    p: 3, 
                    borderRadius: 4, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    bgcolor: '#132f4c', // Navy Blue
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    transition: '0.3s',
                    '&:hover': { transform: 'translateY(-5px)', borderColor: stat.color }
                  }}>
                    <Box sx={{ bgcolor: `${stat.color}20`, p: 2, borderRadius: 3, color: stat.color }}>
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="h5" fontWeight={900}>{stat.value}</Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;