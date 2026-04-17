import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Link,
  IconButton,
  InputAdornment,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import NavBar from '../components/Layout/NavBar';

const API_BASE = 'http://127.0.0.1:5000';

const Login = ({ setUser }) => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      if (!data.token || !data.user) {
        throw new Error('Login succeeded but token or user data is missing.');
      }

      const normalizedUser = {
        id: data.user.id,
        username: data.user.username || '',
        email: data.user.email || '',
        phone_number: data.user.phone_number || '',
        role: data.user.role || 'user'
      };

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));

      if (setUser) {
        setUser(normalizedUser);
      }

      if (normalizedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(err.message || 'Could not connect to the server. Is the Flask app running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <NavBar />

      <Container maxWidth="sm" sx={{ mt: 15, mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 4,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box textAlign="center" sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={900} color="primary">
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access your Talalink account
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <form onSubmit={handleLogin}>
            <Stack spacing={3}>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                variant="outlined"
                value={formData.email}
                onChange={handleChange('email')}
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="primary" sx={{ fontSize: 20 }} />
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                required
                variant="outlined"
                value={formData.password}
                onChange={handleChange('password')}
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="primary" sx={{ fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Box textAlign="right">
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  variant="caption"
                  sx={{ color: 'primary.main', fontWeight: 600 }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: '1rem' }}
              >
                {loading ? 'Authenticating...' : 'Login to Dashboard'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{' '}
              <Link
                component={RouterLink}
                to="/signup"
                sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none' }}
              >
                Create Account
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;