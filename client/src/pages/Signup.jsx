import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Person, Lock } from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import NavBar from '../components/Layout/NavBar';

const API_BASE = 'http://127.0.0.1:5000';

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username.trim()) {
      setError('Username is required.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error('Server returned an invalid response.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed.');
      }

      setSuccess('Account created successfully. Redirecting to login...');

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Connection refused. Ensure the Flask server is running at port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 10 }}>
      <NavBar />

      <Container maxWidth="xs">
        <Paper elevation={4} sx={{ p: 4, borderRadius: 3, mt: 4 }}>
          <Typography variant="h5" fontWeight={800} textAlign="center" gutterBottom>
            Join TalaLink
          </Typography>

          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            Create an account to start using the platform
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Username"
                fullWidth
                required
                autoComplete="username"
                value={formData.username}
                onChange={handleChange('username')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange('email')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                required
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange('password')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ py: 1.5, fontWeight: 700, mt: 2 }}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </Stack>
          </form>

          <Box textAlign="center" mt={3}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link
                to="/login"
                style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 700 }}
              >
                Log In
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;