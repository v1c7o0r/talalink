import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Container, Grid, Typography, Button, Chip,
  Stack, Divider, Paper, CircularProgress, Alert,
} from "@mui/material";
import {
  ArrowBack, LocationOn, WhatsApp, Phone,
  Build, ShoppingBag, Engineering,
} from "@mui/icons-material";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`http://localhost:5000/listings/${id}`);
        const data = await res.json();
        setItem(data);
      } catch (err) {
        console.error("Error fetching listing:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handleMaintenanceRequest = async () => {
    if (!item) return;
    setRequesting(true);

    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem('token');

    const maintenanceData = {
      item: item.title,
      client: currentUser?.username || "Guest",
      phone: item.phone_number || "N/A",
      status: "Pending",
      artisan_id: item.user_id, // Links to the creator of the listing
      price: item.price,
    };

    try {
      const response = await fetch("http://localhost:5000/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(maintenanceData),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate("/maintenance"), 2000);
      }
    } catch (err) {
      console.error("Failed to send request:", err);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ bgcolor: "#0a1929" }}>
        <CircularProgress sx={{ color: '#3399ff' }} />
      </Box>
    );
  }

  const isService = item?.category === "Service";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0a1929", color: "white" }}>
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8 }}>
        
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 4, textTransform: "none", fontWeight: 700, color: "#3399ff", "&:hover": { bgcolor: "rgba(51, 153, 255, 0.1)" } }}
        >
          Back to Marketplace
        </Button>

        {success && (
          <Alert severity="success" sx={{ mb: 4, bgcolor: '#132f4c', color: '#4caf50', border: '1px solid #4caf50' }}>
            Request successfully sent to the Maintenance Hub!
          </Alert>
        )}

        <Grid container spacing={6}>
          {/* Image Section */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.05)",
                bgcolor: "#132f4c", // Dark Blue
              }}
            >
              <img
                src={item.image_url || "https://via.placeholder.com/600x400"}
                alt={item.title}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Paper>
          </Grid>

          {/* Details Section */}
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              <Box>
                <Chip
                  label={item.category}
                  icon={isService ? <Build sx={{ color: 'white !important' }} /> : <ShoppingBag sx={{ color: 'white !important' }} />}
                  sx={{ mb: 2, fontWeight: 700, bgcolor: "#3399ff", color: "white" }}
                />
                <Typography variant="h3" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
                  {item.title}
                </Typography>
                <Typography variant="h4" sx={{ color: "#3399ff" }} fontWeight={900}>
                  KES {Number(item.price || 0).toLocaleString()}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "rgba(255,255,255,0.5)" }}>
                <LocationOn sx={{ color: "#3399ff" }} />
                <Typography variant="body1" fontWeight={600}>
                  {item.location || "Thika, Kenya"}
                </Typography>
              </Stack>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />

              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: '#3399ff' }}>Description</Typography>
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>
                  {item.description}
                </Typography>
              </Box>

              {/* Action Card */}
              <Paper
                sx={{
                  p: 3,
                  bgcolor: "#173a5e", // Slightly lighter navy for contrast
                  color: "white",
                  borderRadius: 4,
                  border: "1px solid rgba(51, 153, 255, 0.2)",
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Interested in this {item.category.toLowerCase()}?
                </Typography>

                <Stack spacing={2} sx={{ mt: 2 }}>
                  
                  {/* SEND TO MAINTENANCE BUTTON */}
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={requesting ? <CircularProgress size={20} color="inherit" /> : <Engineering />}
                    onClick={handleMaintenanceRequest}
                    disabled={requesting || success}
                    sx={{
                      bgcolor: "#3399ff",
                      "&:hover": { bgcolor: "#007fff" },
                      fontWeight: 800,
                      py: 2,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1rem'
                    }}
                  >
                    {requesting ? "Sending Request..." : isService ? "Book Professional Service" : "Request Maintenance/Repair"}
                  </Button>

                  <Typography variant="caption" align="center" sx={{ color: 'rgba(255,255,255,0.4)', px: 2 }}>
                    This will log the item in your Maintenance Hub and notify the artisan.
                  </Typography>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<WhatsApp />}
                      href={`https://wa.me/${item.phone_number?.replace(/\D/g, '')}`}
                      target="_blank"
                      sx={{ borderColor: "#25D366", color: "#25D366", fontWeight: 700, borderRadius: 2, "&:hover": { borderColor: "#25D366", bgcolor: "rgba(37, 211, 102, 0.1)" } }}
                    >
                      WhatsApp
                    </Button>

                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Phone />}
                      href={`tel:${item.phone_number}`}
                      sx={{ borderColor: "rgba(25, 25, 26, 0.3)", color: "white", fontWeight: 700, borderRadius: 2, "&:hover": { borderColor: "white" } }}
                    >
                      Call
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProductDetail;