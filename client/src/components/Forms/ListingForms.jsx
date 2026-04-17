import { useState, useEffect, useMemo } from "react";
import {
  Box,
  TextField,
  MenuItem,
  InputAdornment,
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup
} from "@mui/material";
import {
  CloudUpload,
  Label,
  AttachMoney,
  Link as LinkIcon,
  Image as ImageIcon,
  LocationOn,
  WhatsApp
} from "@mui/icons-material";

const ListingForm = ({ formData, setFormData, setFile }) => {
  const [imageMode, setImageMode] = useState("upload");

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

  const phonePreview = useMemo(() => {
    return normalizePhone(formData.phone_number);
  }, [formData.phone_number]);

  useEffect(() => {
    return () => {
      if (formData.image_url && formData.image_url.startsWith("blob:")) {
        URL.revokeObjectURL(formData.image_url);
      }
    };
  }, [formData.image_url]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone_number") {
      const cleaned = value.replace(/[^\d+ ]/g, "");
      setFormData((prev) => ({
        ...prev,
        phone_number: cleaned
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneBlur = () => {
    const normalized = normalizePhone(formData.phone_number);

    setFormData((prev) => ({
      ...prev,
      phone_number: normalized || prev.phone_number
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const previewUrl = URL.createObjectURL(selectedFile);
    setFormData((prev) => ({
      ...prev,
      image_url: previewUrl
    }));
  };

  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      color: "white",
      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.1)" },
      "&:hover fieldset": { borderColor: "#3399ff" },
      "&.Mui-focused fieldset": { borderColor: "#3399ff" }
    },
    "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.7)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#3399ff" }
  };

  return (
    <Box component="form" noValidate sx={{ color: "white" }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: "#3399ff" }}>
        Listing Details
      </Typography>

      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Title"
          name="title"
          value={formData.title || ""}
          onChange={handleChange}
          placeholder="e.g. Professional Laptop Repair"
          sx={inputStyles}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Label sx={{ color: "#3399ff" }} />
              </InputAdornment>
            )
          }}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            select
            fullWidth
            label="Category"
            name="category"
            value={formData.category || ""}
            onChange={handleChange}
            sx={inputStyles}
          >
            <MenuItem value="Product">Physical Product</MenuItem>
            <MenuItem value="Service">Technical Service</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Price"
            name="price"
            type="number"
            value={formData.price || ""}
            onChange={handleChange}
            sx={inputStyles}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney sx={{ color: "#3399ff" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.5)", ml: 1 }}
                >
                  KES
                </Typography>
              )
            }}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={formData.location || ""}
            onChange={handleChange}
            placeholder="e.g. Thika Section 9"
            sx={inputStyles}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOn sx={{ color: "#3399ff" }} />
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            required
            label="WhatsApp Number"
            name="phone_number"
            value={formData.phone_number || ""}
            onChange={handleChange}
            onBlur={handlePhoneBlur}
            placeholder="e.g. 254720977299 or 0720977299"
            helperText={
              phonePreview
                ? `Saved format: ${phonePreview}`
                : "Required. Use 254720977299 or 0720977299."
            }
            sx={{
              ...inputStyles,
              "& .MuiFormHelperText-root": {
                color: phonePreview ? "#7bd389" : "rgba(255,255,255,0.5)"
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <WhatsApp color="success" />
                </InputAdornment>
              )
            }}
          />
        </Stack>

        <TextField
          fullWidth
          label="Description"
          name="description"
          multiline
          rows={4}
          value={formData.description || ""}
          onChange={handleChange}
          placeholder="Describe what you are offering in detail..."
          sx={inputStyles}
        />

        <Box>
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ mb: 1, color: "rgba(255,255,255,0.7)" }}
          >
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
              "& .MuiToggleButton-root": {
                color: "white",
                borderColor: "rgba(255,255,255,0.1)"
              },
              "& .Mui-selected": {
                bgcolor: "#3399ff !important",
                color: "white !important"
              }
            }}
          >
            <ToggleButton value="upload">
              <CloudUpload sx={{ mr: 1, fontSize: 18 }} />
              Upload
            </ToggleButton>
            <ToggleButton value="url">
              <LinkIcon sx={{ mr: 1, fontSize: 18 }} />
              URL
            </ToggleButton>
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
                  borderColor: "#3399ff"
                }
              }}
            >
              <input
                type="file"
                hidden
                onChange={handleFileChange}
                accept="image/*"
              />

              {formData.image_url ? (
                <Box>
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    style={{
                      maxHeight: "120px",
                      maxWidth: "100%",
                      borderRadius: "8px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 1, color: "#3399ff" }}
                  >
                    Click to replace photo
                  </Typography>
                </Box>
              ) : (
                <>
                  <ImageIcon
                    sx={{
                      fontSize: 40,
                      color: "rgba(255,255,255,0.3)",
                      mb: 1
                    }}
                  />
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    Tap to upload from device
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            <TextField
              fullWidth
              label="Paste Image URL"
              name="image_url"
              value={formData.image_url || ""}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              sx={inputStyles}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon sx={{ color: "#3399ff" }} />
                  </InputAdornment>
                )
              }}
            />
          )}
        </Box>
      </Stack>
    </Box>
  );
};

export default ListingForm;