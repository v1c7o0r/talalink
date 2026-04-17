import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Chip,
  Stack,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  TextField,
} from "@mui/material";
import {
  ArrowBack,
  LocationOn,
  WhatsApp,
  Phone,
  Build,
  ShoppingBag,
  Engineering,
  AddShoppingCart,
  Payments,
} from "@mui/icons-material";

const API_BASE = "http://127.0.0.1:5000";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState("");
  const [pageError, setPageError] = useState("");
  const [quantity, setQuantity] = useState(1);

  const normalizePhone = (phone) => {
    const digits = String(phone || "").replace(/\D/g, "");

    if (!digits) return "";

    if (digits.startsWith("0") && digits.length === 10) {
      return `254${digits.slice(1)}`;
    }

    if (digits.startsWith("254") && digits.length === 12) {
      return digits;
    }

    if (digits.length >= 10 && digits.length <= 15) {
      return digits;
    }

    return "";
  };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setPageError("");

        const res = await fetch(`${API_BASE}/listings/${id}`);

        let data = {};
        try {
          data = await res.json();
        } catch {
          throw new Error("Server returned an invalid listing response.");
        }

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch listing details.");
        }

        setItem(data);
      } catch (err) {
        console.error("Error fetching listing:", err);
        setPageError(err.message || "Failed to load listing.");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const token = localStorage.getItem("token");
  const isService = item?.category === "Service";
  const isOwner = Number(currentUser?.id) === Number(item?.user_id);

  const listingPhone = normalizePhone(item?.phone_number || item?.phone);

  const whatsappMessage = encodeURIComponent(
    `Hello, I am interested in "${item?.title || "this listing"}".`
  );

  const whatsappLink = listingPhone
    ? `https://wa.me/${listingPhone}?text=${whatsappMessage}`
    : "";

  const callLink = listingPhone ? `tel:+${listingPhone}` : "";

  const itemPrice = Number(item?.price || 0);
  const maintenanceFee = Number((itemPrice * 0.05).toFixed(2));
  const maintenanceTotal = Number((itemPrice + maintenanceFee).toFixed(2));
  const orderTotal = Number((itemPrice * Number(quantity || 1)).toFixed(2));

  const handleMaintenanceRequest = async () => {
    if (!item) return;

    if (!token) {
      alert("Please log in first to send a maintenance request.");
      navigate("/login");
      return;
    }

    if (isOwner) {
      alert("You cannot send a maintenance request to your own listing.");
      return;
    }

    if (!item?.user_id) {
      alert("This listing does not have a valid artisan owner.");
      return;
    }

    if (!listingPhone) {
      alert("This listing does not have a valid phone number.");
      return;
    }

    setRequesting(true);
    setPageError("");
    setSuccess("");

    const maintenanceData = {
      item: item.title || "",
      description: item.description || "",
      location: item.location || "",
      artisan_id: Number(item.user_id),
      phone: listingPhone,
      listing_id: item.id,
      item_price: item.price,
    };

    try {
      const response = await fetch(`${API_BASE}/maintenance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(maintenanceData),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to send request.");
      }

      setSuccess("Maintenance request sent successfully.");
      sessionStorage.setItem(
        "maintenance_success",
        "Maintenance request sent successfully."
      );

      setTimeout(() => navigate("/maintenance"), 1200);
    } catch (err) {
      console.error("Failed to send request:", err);
      setPageError(err.message || "Failed to send request.");
    } finally {
      setRequesting(false);
    }
  };

  const handleAddToCart = async () => {
    if (!item) return;

    if (!token) {
      alert("Please log in first to add items to cart.");
      navigate("/login");
      return;
    }

    if (isOwner) {
      alert("You cannot add your own listing to cart.");
      return;
    }

    if (isService) {
      alert("Services cannot be added to cart. Use maintenance request instead.");
      return;
    }

    setCartLoading(true);
    setPageError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listing_id: item.id,
          quantity: Number(quantity),
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to add item to cart.");
      }

      setSuccess("Item added to cart successfully.");
    } catch (err) {
      console.error("Add to cart error:", err);
      setPageError(err.message || "Failed to add item to cart.");
    } finally {
      setCartLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!item) return;

    if (!token) {
      alert("Please log in first to place an order.");
      navigate("/login");
      return;
    }

    if (isOwner) {
      alert("You cannot buy your own listing.");
      return;
    }

    if (isService) {
      alert("Services should be requested through maintenance.");
      return;
    }

    setBuying(true);
    setPageError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listing_id: item.id,
          quantity: Number(quantity),
          location: item.location || "",
          phone: listingPhone || "",
          description: `Order for ${item.title}`,
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order.");
      }

      setSuccess("Order placed successfully.");
      setTimeout(() => navigate("/orders"), 1200);
    } catch (err) {
      console.error("Order error:", err);
      setPageError(err.message || "Failed to create order.");
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ bgcolor: "#0a1929" }}
      >
        <CircularProgress sx={{ color: "#3399ff" }} />
      </Box>
    );
  }

  if (!item) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#0a1929", color: "white", py: 10 }}>
        <Container maxWidth="md">
          <Alert severity="error" sx={{ bgcolor: "#132f4c", color: "white" }}>
            {pageError || "Listing not found."}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0a1929", color: "white" }}>
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{
            mb: 4,
            textTransform: "none",
            fontWeight: 700,
            color: "#3399ff",
            "&:hover": { bgcolor: "rgba(51, 153, 255, 0.1)" }
          }}
        >
          Back to Marketplace
        </Button>

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 4,
              bgcolor: "#132f4c",
              color: "#4caf50",
              border: "1px solid #4caf50"
            }}
          >
            {success}
          </Alert>
        )}

        {pageError && (
          <Alert
            severity="error"
            sx={{
              mb: 4,
              bgcolor: "#132f4c",
              color: "#ff8a80",
              border: "1px solid rgba(244,67,54,0.35)"
            }}
          >
            {pageError}
          </Alert>
        )}

        <Grid container spacing={6}>
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.05)",
                bgcolor: "#132f4c",
              }}
            >
              <img
                src={item.image_url || "https://via.placeholder.com/600x400?text=No+Image"}
                alt={item.title || "Listing"}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              <Box>
                <Chip
                  label={item.category || "Listing"}
                  icon={
                    isService
                      ? <Build sx={{ color: "white !important" }} />
                      : <ShoppingBag sx={{ color: "white !important" }} />
                  }
                  sx={{ mb: 2, fontWeight: 700, bgcolor: "#3399ff", color: "white" }}
                />

                <Typography
                  variant="h3"
                  fontWeight={800}
                  gutterBottom
                  sx={{ letterSpacing: -1 }}
                >
                  {item.title}
                </Typography>

                <Typography variant="h4" sx={{ color: "#3399ff" }} fontWeight={900}>
                  KES {itemPrice.toLocaleString()}
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ color: "rgba(255,255,255,0.5)" }}
              >
                <LocationOn sx={{ color: "#3399ff" }} />
                <Typography variant="body1" fontWeight={600}>
                  {item.location || "Thika, Kenya"}
                </Typography>
              </Stack>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />

              <Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  gutterBottom
                  sx={{ color: "#3399ff" }}
                >
                  Description
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}
                >
                  {item.description || "No description available."}
                </Typography>
              </Box>

              {!isOwner && (
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: "#173a5e",
                    color: "white",
                    borderRadius: 4,
                    border: "1px solid rgba(51, 153, 255, 0.2)",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    {isService ? "Maintenance Charges" : "Purchase & Maintenance Options"}
                  </Typography>

                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {!isService && (
                      <>
                        <TextField
                          type="number"
                          label="Quantity"
                          value={quantity}
                          onChange={(e) =>
                            setQuantity(Math.max(1, Number(e.target.value || 1)))
                          }
                          inputProps={{ min: 1 }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              color: "white",
                              "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                              "&:hover fieldset": { borderColor: "#3399ff" },
                            },
                            "& .MuiInputLabel-root": {
                              color: "rgba(255,255,255,0.7)"
                            }
                          }}
                        />

                        <Typography
                          variant="body2"
                          sx={{ color: "rgba(255,255,255,0.75)" }}
                        >
                          Order Total: <strong>KES {orderTotal.toLocaleString()}</strong>
                        </Typography>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                          <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={
                              cartLoading ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : (
                                <AddShoppingCart />
                              )
                            }
                            onClick={handleAddToCart}
                            disabled={cartLoading || buying}
                            sx={{
                              borderColor: "#3399ff",
                              color: "#3399ff",
                              fontWeight: 800,
                              py: 1.8,
                              borderRadius: 3,
                              textTransform: "none",
                            }}
                          >
                            {cartLoading ? "Adding..." : "Add to Cart"}
                          </Button>

                          <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={
                              buying ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : (
                                <Payments />
                              )
                            }
                            onClick={handleBuyNow}
                            disabled={buying || cartLoading}
                            sx={{
                              bgcolor: "#3399ff",
                              "&:hover": { bgcolor: "#007fff" },
                              fontWeight: 800,
                              py: 1.8,
                              borderRadius: 3,
                              textTransform: "none",
                            }}
                          >
                            {buying ? "Placing Order..." : "Order"}
                          </Button>
                        </Stack>

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
                      </>
                    )}

                    <Stack spacing={1.2}>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.75)" }}
                      >
                        Item Price: <strong>KES {itemPrice.toLocaleString()}</strong>
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.75)" }}
                      >
                        Maintenance Fee (5%):{" "}
                        <strong>KES {maintenanceFee.toLocaleString()}</strong>
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: "#90caf9", fontWeight: 800 }}
                      >
                        Estimated Maintenance Total: KES {maintenanceTotal.toLocaleString()}
                      </Typography>
                    </Stack>

                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={
                        requesting ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <Engineering />
                        )
                      }
                      onClick={handleMaintenanceRequest}
                      disabled={requesting}
                      sx={{
                        bgcolor: "#3399ff",
                        "&:hover": { bgcolor: "#007fff" },
                        fontWeight: 800,
                        py: 2,
                        borderRadius: 3,
                        textTransform: "none",
                        fontSize: "1rem"
                      }}
                    >
                      {requesting ? "Sending Request..." : "Request Maintenance"}
                    </Button>

                    <Typography
                      variant="caption"
                      align="center"
                      sx={{ color: "rgba(255,255,255,0.4)", px: 2 }}
                    >
                      The backend calculates maintenance fee as 5% of the item price.
                    </Typography>
                  </Stack>
                </Paper>
              )}

              <Paper
                sx={{
                  p: 3,
                  bgcolor: "#173a5e",
                  color: "white",
                  borderRadius: 4,
                  border: "1px solid rgba(51, 153, 255, 0.2)",
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Contact Seller / Artisan
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<WhatsApp />}
                    href={whatsappLink || undefined}
                    target={whatsappLink ? "_blank" : undefined}
                    rel={whatsappLink ? "noopener noreferrer" : undefined}
                    disabled={!whatsappLink}
                    sx={{
                      borderColor: "#25D366",
                      color: whatsappLink ? "#25D366" : "rgba(255,255,255,0.35)",
                      fontWeight: 700,
                      borderRadius: 2,
                      "&:hover": {
                        borderColor: "#25D366",
                        bgcolor: whatsappLink ? "rgba(37, 211, 102, 0.1)" : "transparent"
                      }
                    }}
                  >
                    {whatsappLink ? "WhatsApp" : "No WhatsApp"}
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Phone />}
                    href={callLink || undefined}
                    disabled={!callLink}
                    sx={{
                      borderColor: "rgba(255,255,255,0.25)",
                      color: callLink ? "white" : "rgba(255,255,255,0.35)",
                      fontWeight: 700,
                      borderRadius: 2,
                      "&:hover": {
                        borderColor: "white"
                      }
                    }}
                  >
                    {callLink ? "Call" : "No Number"}
                  </Button>
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