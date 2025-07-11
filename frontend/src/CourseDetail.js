// frontend/src/CourseDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from './api';
import { useAuth } from './AuthContext';

// Import MUI Components
import { Container, Typography, Button, Box, TextField, Divider, Stack,
         Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, IconButton, Paper } from '@mui/material';

// Import MUI Icons
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function CourseDetail() {
    // --- STATE MANAGEMENT ---
    const [course, setCourse] = useState(null);
    const { id } = useParams();
    const { user } = useAuth();

    // State for adding content
    const [newModuleTitle, setNewModuleTitle] = useState("");
    const [newLessonTitle, setNewLessonTitle] = useState("");

    // State for editing content
    const [editingModule, setEditingModule] = useState(null);
    const [editingModuleTitle, setEditingModuleTitle] = useState("");
    const [editingLesson, setEditingLesson] = useState(null);
    const [editingLessonTitle, setEditingLessonTitle] = useState("");

    // --- NEW STATE FOR PRICE EDITING ---
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [editedPrice, setEditedPrice] = useState("");

    // --- DATA FETCHING ---
    const fetchCourse = () => {
        api.get(`courses/${id}/`).then(response => {
            setCourse(response.data);
        }).catch(error => console.error('Error fetching course:', error));
    };

    useEffect(() => { fetchCourse(); }, [id]);

    // --- HANDLER FUNCTIONS ---

    // --- NEW PRICE HANDLER ---
    const handleUpdatePrice = (e) => {
        e.preventDefault();
        api.patch(`/courses/${course.id}/`, { price: editedPrice })
           .then(() => {
                setIsEditingPrice(false);
                fetchCourse();
           })
           .catch(error => {
                console.error("Error updating price:", error);
                alert("Failed to update price.");
           });
    };

    // Payment Handler
    const handlePayment = async () => {
        if (!user) {
            alert("Please log in to purchase a course.");
            return;
        }
        try {
            const orderResponse = await api.post(`/courses/${id}/create-order/`);
            const orderData = orderResponse.data;

            const options = {
                key: 'rzp_test_EfbvsurNwfsHZQ', // Replace with your actual Key ID
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Your Course Platform",
                description: `Purchase of ${course.title}`,
                order_id: orderData.id,
                handler: async function (response) {
                    try {
                        const verifyPayload = {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        };
                        await api.post(`/courses/${id}/verify-payment/`, verifyPayload);
                        alert("Payment successful! You are now enrolled.");
                        fetchCourse(); 
                    } catch (error) {
                        console.error("Payment verification failed", error);
                        alert("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    email: user.email,
                },
                theme: { color: "#3399cc" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Failed to create payment order", error);
            alert("Could not initiate payment. Please try again.");
        }
    };

    // Module & Lesson Handlers (These are all correct from your version)
    const handleAddModule = (e) => { e.preventDefault(); api.post('/modules/', { title: newModuleTitle, course: course.id, order: course.modules.length + 1 }).then(() => { setNewModuleTitle(""); fetchCourse(); }).catch(error => console.error('Error adding module:', error)); };
    const handleDeleteModule = (moduleId) => { if (window.confirm("Delete this module?")) { api.delete(`/modules/${moduleId}/`).then(() => fetchCourse()); } };
    const handleEditModule = (module) => { setEditingModule(module); setEditingModuleTitle(module.title); };
    const handleUpdateModule = (e) => { e.preventDefault(); api.patch(`/modules/${editingModule.id}/`, { title: editingModuleTitle }).then(() => { setEditingModule(null); fetchCourse(); }); };
    const handleAddLesson = (e, moduleId) => { e.preventDefault(); const module = course.modules.find(m => m.id === moduleId); api.post('/lessons/', { title: newLessonTitle, module: moduleId, order: module.lessons.length + 1 }).then(() => { setNewLessonTitle(""); fetchCourse(); }).catch(error => console.error('Error adding lesson:', error)); };
    const handleDeleteLesson = (lessonId) => { if (window.confirm("Delete this lesson?")) { api.delete(`/lessons/${lessonId}/`).then(() => fetchCourse()); } };
    const handleEditLesson = (lesson) => { setEditingLesson(lesson); setEditingLessonTitle(lesson.title); };
    const handleUpdateLesson = (e) => { e.preventDefault(); api.patch(`/lessons/${editingLesson.id}/`, { title: editingLessonTitle }).then(() => { setEditingLesson(null); fetchCourse(); }); };

    // --- FREE ENROLL HANDLER ---
    const handleFreeEnroll = () => {
        if (!user) {
            alert("Please log in to enroll.");
            return;
        }
        api.post(`/courses/${id}/free-enroll/`)
           .then(response => {
                alert("Successfully enrolled!");
                fetchCourse(); // Refresh the data to show the "Go to Course" button
           })
           .catch(error => {
                console.error("Free enrollment failed", error);
                alert("Could not enroll in this course.");
           });
    };

    if (!course) return <Typography>Loading...</Typography>;

    const isOwner = user && user.pk === course.instructor;

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography variant="h3" component="h1" gutterBottom>{course.title}</Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>{course.description}</Typography>
                    </Box>
                    {/* --- NEW PRICE DISPLAY & EDIT FORM --- */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2, whiteSpace: 'nowrap' }}>
                        {isOwner && isEditingPrice ? (
                            <Box component="form" onSubmit={handleUpdatePrice} sx={{display: 'flex', gap: 1}}>
                                <TextField type="number" label="Price" size="small" value={editedPrice} onChange={e => setEditedPrice(e.target.value)} />
                                <Button type="submit" variant="contained" size="small">Save</Button>
                                <Button type="button" size="small" onClick={() => setIsEditingPrice(false)}>Cancel</Button>
                            </Box>
                                ) : (
                                    <Typography variant="h4" component="p">₹{course.price}</Typography>
                                )}
                                {isOwner && !isEditingPrice && (
                                    <IconButton size="small" onClick={() => setIsEditingPrice(true)}><EditIcon fontSize="small" /></IconButton>
                                )}
                            </Box>
                    </Box>

                {/* --- PAYMENT/ENROLLMENT BUTTON LOGIC --- */}
                {course.is_enrolled ? (
                    <Button variant="contained" color="success" size="large" component={Link} to={`/lesson/${course.modules[0]?.lessons[0]?.id || ''}`}>
                        Go to Course
                    </Button>
                ) : parseFloat(course.price) > 0 ? (
                    <Button variant="contained" color="primary" size="large" onClick={handlePayment} sx={{ mb: 2 }}>
                        Buy Now
                    </Button>
                ) : (
                    <Button variant="contained" color="secondary" size="large" onClick={handleFreeEnroll}  sx={{ mb: 2 }}>
                        Enroll for Free
                    </Button>
                )}

                <Divider sx={{ my: 4 }} />

                <Typography variant="h4" component="h2" gutterBottom>Curriculum</Typography>

                {/* --- INSTRUCTOR CONTROLS --- */}
                {isOwner && (
                    <Box component="form" onSubmit={handleAddModule} sx={{ mb: 4, p: 2, border: '1px dashed grey' }}>
                        <Typography variant="h6">Add New Module</Typography>
                        <TextField fullWidth margin="normal" label="New module title" value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} required />
                        <Button type="submit" variant="contained">Add Module</Button>
                    </Box>
                )}

                {/* --- MODULES AND LESSONS LIST --- */}
                {course.modules.map(module => (
                    <Accordion key={module.id} defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            {editingModule && editingModule.id === module.id ? (
                                <Box component="form" onSubmit={handleUpdateModule} sx={{ width: '100%', display: 'flex', gap: 1 }}>
                                    <TextField size="small" fullWidth value={editingModuleTitle} onChange={e => setEditingModuleTitle(e.target.value)} required />
                                    <Button type="submit" variant="contained">Save</Button>
                                    <Button type="button" onClick={() => setEditingModule(null)}>Cancel</Button>
                                </Box>
                            ) : (
                                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="h6">{module.title}</Typography>
                                    {isOwner && (
                                        <Stack direction="row" spacing={1}>
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditModule(module); }}><EditIcon /></IconButton>
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }}><DeleteIcon /></IconButton>
                                        </Stack>
                                    )}
                                </Box>
                            )}
                        </AccordionSummary>
                        <AccordionDetails>
                            <List>
                                {module.lessons.map(lesson => (
                                    <ListItem key={lesson.id} secondaryAction={isOwner && (
                                        <Stack direction="row" spacing={1}>
                                            <IconButton size="small" onClick={() => handleEditLesson(lesson)}><EditIcon /></IconButton>
                                            <IconButton size="small" onClick={() => handleDeleteLesson(lesson.id)}><DeleteIcon /></IconButton>
                                        </Stack>
                                    )}>
                                        {editingLesson && editingLesson.id === lesson.id ? (
                                            <Box component="form" onSubmit={handleUpdateLesson} sx={{ width: '100%', display: 'flex', gap: 1 }}>
                                                <TextField size="small" fullWidth value={editingLessonTitle} onChange={e => setEditingLessonTitle(e.target.value)} required />
                                                <Button type="submit" variant="contained" size="small">Save</Button>
                                                <Button type="button" size="small" onClick={() => setEditingLesson(null)}>Cancel</Button>
                                            </Box>
                                        ) : (
                                            <ListItemText primary={<Link to={`/lesson/${lesson.id}`}>{lesson.title}</Link>} secondary={lesson.is_completed ? '✓ Completed' : null} />
                                        )}
                                    </ListItem>
                                ))}
                            </List>
                            {isOwner && (
                                <Box component="form" onSubmit={(e) => handleAddLesson(e, module.id)} sx={{ mt: 2, ml: 2 }}>
                                    <TextField size="small" label="New lesson title" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} required />
                                    <Button type="submit" variant="outlined" size="small" sx={{ ml: 1 }}>Add Lesson</Button>
                                </Box>
                            )}
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Paper>
        </Container>
    );
}

export default CourseDetail;
