import { useState, useEffect } from "react";
import {
  Box, TextField, MenuItem, InputAdornment, 
  Typography, Stack, ToggleButton, ToggleButtonGroup 
} from "@mui/material";
import {
  CloudUpload, Label, AttachMoney, 
  Link as LinkIcon, Image as ImageIcon, 
  LocationOn, WhatsApp 
} from "@mui/icons-material";

const ListingForm = ({ formData, setFormData, setFile }) => {
  const [imageMode, setImageMode] = useState("upload");

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (formData.image_url && formData.image_url.startsWith('blob:')) {
        URL.revokeObjectURL(formData.image_url);
      }
    };
  }, [formData.image_url]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Create preview and update state
    const previewUrl = URL.createObjectURL(selectedFile);
    setFormData((prev) => ({
      ...prev,
      image_url: previewUrl,
    }));
  };

  // Shared Dark Input Styles
  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      color: "white",
      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.1)" },
      "&:hover fieldset": { borderColor: "#3399ff" },
    },
    "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.7)" },
  };

  return (
    <Box component="form" noValidate sx={{ color: "white" }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: "#3399ff" }}>
        Listing Details
      </Typography>

      <Stack spacing={3}>
        {/* Title Field */}
        <TextField
          fullWidth label="Title" name="title"
          value={formData.title} onChange={handleChange}
          placeholder="e.g. Professional Laptop Repair"
          sx={inputStyles}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Label sx={{ color: "#3399ff" }} />
              </InputAdornment>
            ),
          }}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            select fullWidth label="Category" name="category"
            value={formData.category} onChange={handleChange}
            sx={inputStyles}
          >
            <MenuItem value="Product">Physical Product</MenuItem>
            <MenuItem value="Service">Technical Service</MenuItem>
          </TextField>

          <TextField
            fullWidth label="Price" name="price" type="number"
            value={formData.price} onChange={handleChange}
            sx={inputStyles}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney sx={{ color: "#3399ff" }} />
                </InputAdornment>
              ),
              endAdornment: <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>KES</Typography>,
            }}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth label="Location" name="location"
            value={formData.location} onChange={handleChange}
            placeholder="e.g. Thika Section 9"
            sx={inputStyles}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOn sx={{ color: "#3399ff" }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth label="WhatsApp Number" name="phone_number"
            value={formData.phone_number} onChange={handleChange}
            placeholder="254..."
            helperText="Include country code e.g. 254..."
            sx={{ ...inputStyles, "& .MuiFormHelperText-root": { color: "rgba(255,255,255,0.5)" } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <WhatsApp color="success" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <TextField
          fullWidth label="Description" name="description" multiline rows={4}
          value={formData.description} onChange={handleChange}
          placeholder="Describe what you are offering in detail..."
          sx={inputStyles}
        />

        {/* Image Selection Section */}
        <Box>
          <Typography variant="body2" fontWeight={700} sx={{ mb: 1, color: "rgba(255,255,255,0.7)" }}>
            Visual Presentation
          </Typography>

          <ToggleButtonGroup
            value={imageMode}
            exclusive
            onChange={(e, mode) => mode && setImageMode(mode)}
            size="small"
            sx={{ 
                mb: 2, 
                bgcolor: "rgba(255,255,255,0.05)",
                "& .MuiToggleButton-root": { color: "white", borderColor: "rgba(255,255,255,0.1)" },
                "& .Mui-selected": { bgcolor: "#3399ff !important", color: "white !important" }
            }}
          >
            <ToggleButton value="upload"><CloudUpload sx={{ mr: 1, fontSize: 18 }} /> Upload</ToggleButton>
            <ToggleButton value="url"><LinkIcon sx={{ mr: 1, fontSize: 18 }} /> URL</ToggleButton>
          </ToggleButtonGroup>

          {imageMode === "upload" ? (
            <Box
              component="label"
              sx={{
                border: "2px dashed rgba(51, 153, 255, 0.3)",
                borderRadius: 3,
                p: 3,
                textAlign: "center",
                bgcolor: "rgba(51, 153, 255, 0.05)",
                cursor: "pointer",
                transition: "0.3s",
                display: "block",
                "&:hover": {
                  bgcolor: "rgba(51, 153, 255, 0.1)",
                  borderColor: "#3399ff",
                },
              }}
            >
              <input type="file" hidden onChange={handleFileChange} accept="image/*" />

              {formData.image_url ? (
                <Box>
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    style={{
                      maxHeight: "120px",
                      borderRadius: "8px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                    }}
                  />
                  <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#3399ff" }}>
                    Click to replace photo
                  </Typography>
                </Box>
              ) : (
                <>
                  <ImageIcon sx={{ fontSize: 40, color: "rgba(255,255,255,0.3)", mb: 1 }} />
                  <Typography variant="body2" fontWeight={600} sx={{ color: "rgba(255,255,255,0.7)" }}>
                    Tap to upload from device
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            <TextField
              fullWidth label="Paste Image URL" name="image_url"
              value={formData.image_url} onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              sx={inputStyles}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon sx={{ color: "#3399ff" }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
        </Box>
      </Stack>
    </Box>
  );
};

export default ListingForm;