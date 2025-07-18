// frontend/src/RegistrationPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Import MUI components
import { Button, TextField, Container, Typography, Box } from '@mui/material';

function RegistrationPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password1, setPassword1] = useState('');
    const [password2, setPassword2] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://127.0.0.1:8000/api/auth/registration/', {
                username,
                email,
                password1,
                password2
            });
            navigate('/login');
        } catch (error) {
            if (error.response) {
            // The server responded with an error (e.g., username taken)
                console.error('Registration failed with server error:', error.response.data);
                alert('Registration failed. Please check your details.');
            } else if (error.request) {
                // The request was made but no response was received (Network Error)
                console.error('Network Error:', error.request);
                alert('Cannot connect to the server. Please make sure the backend is running and accessible.');
            } else {
                // Something else went wrong
                console.error('Error:', error.message);
                alert('An unexpected error occurred.');
            }
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    Sign up
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoFocus
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        value={password1}
                        onChange={e => setPassword1(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password2"
                        label="Confirm Password"
                        type="password"
                        id="password2"
                        value={password2}
                        onChange={e => setPassword2(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Sign Up
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default RegistrationPage;