// frontend/src/CourseList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from './api'; // Use the custom api client

// Import MUI components
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Box } from '@mui/material';

function CourseList() {
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        // Fetch data using the api client
        api.get('/courses/')
            .then(response => {
                setCourses(response.data);
            })
            .catch(error => {
                console.error('There was an error fetching the courses!', error);
            });
    }, []);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Available Courses
            </Typography>
            {courses.length > 0 ? (
                <Grid container spacing={4}>
                    {courses.map(course => (
                        <Grid item key={course.id} xs={12} sm={6} md={4}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography gutterBottom variant="h5" component="h2">
                                        {course.title}
                                    </Typography>
                                    <Typography>
                                        {course.description}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <Button
                                        size="small"
                                        component={Link}
                                        to={`/course/${course.id}`}
                                    >
                                        View Course
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Typography>
                    No courses available at the moment.
                </Typography>
            )}
        </Container>
    );
}

export default CourseList;