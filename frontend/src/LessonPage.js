// frontend/src/LessonPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from './api';
import { useAuth } from './AuthContext';

// Import MUI components
import { Container, Typography, Button, Box, Paper, CircularProgress, Chip, Divider, TextField, Stack, Alert, AlertTitle } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// A helper function to get the YouTube video ID from a URL
function getYouTubeID(url) {
    try {
        if (!url) return null;
        const urlObj = new URL(url);
        return urlObj.searchParams.get('v');
    } catch (e) {
        console.error("Invalid URL for YouTube video", e);
        return null;
    }
}

function LessonPage() {
    // --- STATE MANAGEMENT ---
    const [lesson, setLesson] = useState(null);
    const [error, setError] = useState(''); // State to hold error messages
    const { id } = useParams();
    const { user } = useAuth();

    // State for editing content
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [editedVideoUrl, setEditedVideoUrl] = useState('');

    // --- DATA FETCHING & HANDLERS ---
    const fetchLesson = () => {
        api.get(`/lessons/${id}/`)
            .then(response => {
                setLesson(response.data);
                // Pre-fill edit fields when data is fetched
                setEditedContent(response.data.content || '');
                setEditedVideoUrl(response.data.video_url || '');
            })
            .catch(err => {
                // Check if the error is a 403 Forbidden (Access Denied)
                if (err.response && err.response.status === 403) {
                    setError('You must be enrolled in this course to view this lesson.');
                } else {
                    setError('Failed to load the lesson. It may not exist.');
                }
                console.error('Failed to fetch lesson', err);
            });
    };

    useEffect(() => {
        fetchLesson();
    }, [id]);

    const handleMarkAsComplete = () => {
        api.post(`/lessons/${id}/complete/`)
            .then(() => {
                alert('Lesson marked as complete!');
                setLesson(prevLesson => ({ ...prevLesson, is_completed: true }));
            })
            .catch(err => {
                console.error('Failed to mark lesson as complete', err);
                alert('Could not mark lesson as complete.');
            });
    };

    const handleUpdateLessonContent = (e) => {
        e.preventDefault();
        api.patch(`/lessons/${id}/`, {
            content: editedContent,
            video_url: editedVideoUrl
        }).then(() => {
            setIsEditing(false); // Exit edit mode
            fetchLesson(); // Refresh the lesson data
        }).catch(err => {
            console.error("Failed to update lesson content", err);
            alert("Failed to update lesson.");
        });
    };

    // --- RENDER LOGIC ---

    // 1. Show an error message if the API call failed
    if (error) {
        return (
            <Container maxWidth="sm" sx={{ mt: 4 }}>
                <Alert severity="error">
                    <AlertTitle>Access Denied</AlertTitle>
                    {error}
                    <br />
                    <Button component={Link} to="/" sx={{ mt: 2 }} variant="outlined">
                        Back to Courses
                    </Button>
                </Alert>
            </Container>
        );
    }

    // 2. Show a loading spinner while fetching
    if (!lesson) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    // 3. If everything is fine, show the lesson content
    const isOwner = user && user.pk === lesson.instructor_id;
    const videoId = lesson.video_url ? getYouTubeID(lesson.video_url) : null;

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" component="h1">{lesson.title}</Typography>
                    {isOwner && !isEditing && (
                        <Button variant="outlined" onClick={() => setIsEditing(true)}>Edit Lesson</Button>
                    )}
                </Box>
                <Divider sx={{ mb: 4 }} />

                {isEditing ? (
                    // --- EDITING FORM (for instructor) ---
                    <Box component="form" onSubmit={handleUpdateLessonContent}>
                        <TextField fullWidth margin="normal" label="Video URL (YouTube)" value={editedVideoUrl} onChange={(e) => setEditedVideoUrl(e.target.value)} />
                        <TextField fullWidth margin="normal" label="Lesson Text Content" multiline rows={10} value={editedContent} onChange={(e) => setEditedContent(e.target.value)} />
                        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                            <Button type="submit" variant="contained">Save Changes</Button>
                            <Button type="button" variant="text" onClick={() => setIsEditing(false)}>Cancel</Button>
                        </Stack>
                    </Box>
                ) : (
                    // --- DISPLAY CONTENT (for enrolled student or instructor) ---
                    <>
                        {videoId && (
                            <Box sx={{ position: 'relative', paddingTop: '56.25%', mb: 4 }}>
                                <iframe style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} src={`https://www.youtube.com/embed/${videoId}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                            </Box>
                        )}
                        {lesson.content && (
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{lesson.content}</Typography>
                        )}
                        <Divider sx={{ my: 4 }} />
                        {lesson.is_completed ? (
                            <Chip icon={<CheckCircleIcon />} label="Completed" color="success" />
                        ) : (
                            <Button variant="contained" onClick={handleMarkAsComplete}>Mark as Complete</Button>
                        )}
                    </>
                )}
            </Paper>
        </Container>
    );
}

export default LessonPage;
