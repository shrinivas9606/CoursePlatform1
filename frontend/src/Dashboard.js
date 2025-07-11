// frontend/src/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from './api';

// Import MUI Components
import { Container, Typography, List, ListItem, ListItemButton, ListItemText, Divider, Paper } from '@mui/material';

function Dashboard() {
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        api.get('/my-courses/')
            .then(response => {
                setCourses(response.data);
            })
            .catch(error => {
                console.error('Failed to fetch enrolled courses', error);
            });
    }, []);

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                My Courses
            </Typography>
            {courses.length > 0 ? (
                <Paper>
                    <List>
                        {courses.map((course, index) => (
                            <React.Fragment key={course.id}>
                                <ListItem disablePadding>
                                    <ListItemButton component={Link} to={`/course/${course.id}`}>
                                        <ListItemText primary={course.title} />
                                    </ListItemButton>
                                </ListItem>
                                {index < courses.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            ) : (
                <Typography>You are not enrolled in any courses yet.</Typography>
            )}
        </Container>
    );
}

export default Dashboard;