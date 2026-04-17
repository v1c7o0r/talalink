import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  MenuItem,
  InputAdornment,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  AddPhotoAlternate,
  Sell,
  LocationOn,
  Description,
  CloudUpload,
  Link as LinkIcon,
  DeleteForever,
  Save,
  Build,
  ShoppingBag,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "http://127.0.0.1:5000";

const CreateListing = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageMode, setImageMode] = useState("url");
  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "Product",
    image_url: "",
    location: "Thika Town",
    phone_number: "",
  });

  useEffect(() => {
    if (!isEditMode) return;

    const fetchItem = async () => {
      try {
        const response = await fetch(`${API_BASE}/listings/${id}`);
        if (!response.ok) throw new Error("Failed to fetch item");

        const data = await response.json();

        setFormData({
          title: data.title || "",
          description: data.description || "",
          price: data.price || "",
          category: data.category || "Product",
          image_url: data.image_url || "",
          location: data.location || "Thika Town",
          phone_number: data.phone_number || "",
        });
      } catch {
        setError("Could not fetch item details. Ensure the server is online.");
      } finally {
        setFetching(false);
      }
    };

    fetchItem();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) return "Listing title is required.";
    if (!formData.description.trim()) return "Description is required.";
    if (!formData.price || Number(formData.price) <= 0) return "Price must be greater than 0.";
    if (!formData.category.trim()) return "Category is required.";
    if (!formData.location.trim()) return "Location is required.";
    if (!formData.phone_number.trim()) return "WhatsApp number is required.";

    if (imageMode === "url" && formData.image_url && !/^https?:\/\//i.test(formData.image_url)) {
      return "Image URL must start with http:// or https://";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    const data = new FormData();

    data.append("title", formData.title.trim());
    data.append("description", formData.description.trim());
    data.append("price", formData.price);
    data.append("category", formData.category);
    data.append("location", formData.location.trim());
    data.append("phone_number", formData.phone_number.trim());

    if (imageMode === "file" && selectedFile) {
      data.append("file", selectedFile);
    } else {
      data.append("image_url", formData.image_url.trim());
    }

    const url = isEditMode
      ? `${API_BASE}/listings/${id}`
      : `${API_BASE}/listings`;

    const method = isEditMode ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(isEditMode ? "Listing updated successfully." : "Listing published successfully.");
        setTimeout(() => navigate("/home"), 1000);
      } else {
        setError(result.error || "The operation failed. Please check your inputs.");
      }
    } catch {
      setError("Connection error. Is the Flask server running on port 5000?");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this listing?")) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE}/listings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setSuccess("Listing deleted successfully.");
        setTimeout(() => navigate("/home"), 800);
      } else {
        setError("Failed to delete item.");
      }
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#0a1929",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const isService = formData.category === "Service";
  const priceValue = Number(formData.price || 0);
  const maintenanceFee = Number((priceValue * 0.05).toFixed(2));
  const estimatedMaintenanceTotal = Number((priceValue + maintenanceFee).toFixed(2));

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0a1929", pt: 12, pb: 6 }}>
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: "#132f4c",
            color: "white",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          elevation={0}
        >
          <Typography
            variant="h5"
            fontWeight={800}
            gutterBottom
            sx={{ color: "#3399ff" }}
          >
            {isEditMode ? "Update Your Listing" : "Share a New Item"}
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, color: "rgba(255,255,255,0.72)" }}>
            Product listings can be bought directly or added to cart. Service listings create maintenance requests with a 5% maintenance fee added on the backend.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                select
                label="Category Type"
                name="category"
                value={formData.category}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="Product">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ShoppingBag fontSize="small" />
                    <span>Product (Physical Good)</span>
                  </Stack>
                </MenuItem>
                <MenuItem value="Service">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Build fontSize="small" />
                    <span>Service (Technical Repair)</span>
                  </Stack>
                </MenuItem>
              </TextField>

              <TextField
                label="Listing Title"
                name="title"
                required
                fullWidth
                value={formData.title}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Description sx={{ color: "#3399ff" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Price (KES)"
                name="price"
                type="number"
                required
                fullWidth
                value={formData.price}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography sx={{ color: "#3399ff", fontWeight: 700 }}>
                        KES
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />

              {isService && (
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "#173a5e",
                    borderRadius: 3,
                    border: "1px solid rgba(51, 153, 255, 0.2)",
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#90caf9", mb: 1 }}>
                    Maintenance Pricing Preview
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                    Item Price: KES {priceValue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                    Maintenance Fee (5%): KES {maintenanceFee.toLocaleString()}
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#fff", fontWeight: 800, mt: 1 }}>
                    Estimated Total: KES {estimatedMaintenanceTotal.toLocaleString()}
                  </Typography>
                </Paper>
              )}

              <TextField
                label="Detailed Description"
                name="description"
                multiline
                rows={3}
                required
                fullWidth
                value={formData.description}
                onChange={handleChange}
              />

              <TextField
                label="WhatsApp Number"
                name="phone_number"
                required
                fullWidth
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="2547XXXXXXXX"
              />

              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}
                >
                  Visual Presentation
                </Typography>

                <ToggleButtonGroup
                  value={imageMode}
                  exclusive
                  onChange={(e, val) => val && setImageMode(val)}
                  fullWidth
                  size="small"
                  sx={{ mb: 2, bgcolor: "rgba(255,255,255,0.05)" }}
                >
                  <ToggleButton value="url" sx={{ color: "white" }}>
                    <LinkIcon sx={{ mr: 1 }} />
                    Use URL
                  </ToggleButton>
                  <ToggleButton value="file" sx={{ color: "white" }}>
                    <CloudUpload sx={{ mr: 1 }} />
                    Upload
                  </ToggleButton>
                </ToggleButtonGroup>

                {imageMode === "url" ? (
                  <TextField
                    label="Image Link"
                    name="image_url"
                    fullWidth
                    value={formData.image_url}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AddPhotoAlternate sx={{ color: "#3399ff" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                ) : (
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<CloudUpload />}
                    sx={{
                      py: 2,
                      borderStyle: "dashed",
                      color: "#3399ff",
                      borderColor: "#3399ff",
                    }}
                  >
                    {selectedFile ? selectedFile.name : "Select Item Photo"}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </Button>
                )}
              </Box>

              <TextField
                label="Location"
                name="location"
                required
                fullWidth
                value={formData.location}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn sx={{ color: "#3399ff" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.1)" }} />

              <Stack direction="row" spacing={2}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : isEditMode ? (
                      <Save />
                    ) : (
                      <Sell />
                    )
                  }
                  sx={{ fontWeight: 700, textTransform: "none" }}
                >
                  {loading
                    ? "Processing..."
                    : isEditMode
                    ? "Save Changes"
                    : "Publish Listing"}
                </Button>

                {isEditMode && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDelete}
                    disabled={loading}
                    sx={{ minWidth: "56px" }}
                  >
                    <DeleteForever />
                  </Button>
                )}
              </Stack>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default CreateListing;