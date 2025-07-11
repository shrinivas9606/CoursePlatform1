// frontend/src/CreateCoursePage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

// Import MUI components
import { Button, TextField, Container, Typography, Box, Paper } from '@mui/material';

function CreateCoursePage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const navigate = useNavigate();
    // 1. Add new state to hold validation errors
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Clear previous errors
        setErrors({});

        try {
            const response = await api.post('/courses/', {
                title,
                description,
            });
            navigate(`/course/${response.data.id}`);
        } catch (error) {
            if (error.response && error.response.status === 400) {
                // 2. If it's a validation error, set the errors state
                console.error('Validation errors:', error.response.data);
                setErrors(error.response.data);
            } else {
                // 3. For any other error, show the generic alert
                console.error('Failed to create course', error);
                alert('Failed to create course. Are you logged in as an instructor?');
            }
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 } }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Create a New Course
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="title"
                        label="Course Title"
                        name="title"
                        autoFocus
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        // 4. Add error and helperText props
                        error={!!errors.title}
                        helperText={errors.title ? errors.title[0] : ''}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="description"
                        label="Course Description"
                        name="description"
                        multiline
                        rows={4}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        // 5. Add error and helperText props
                        error={!!errors.description}
                        helperText={errors.description ? errors.description[0] : ''}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Create Course
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}

export default CreateCoursePage;