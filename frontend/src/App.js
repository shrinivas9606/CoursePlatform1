// frontend/src/App.js
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import CourseList from './CourseList';
import CourseDetail from './CourseDetail';
import LoginPage from './LoginPage';
import RegistrationPage from './RegistrationPage';
import Dashboard from './Dashboard'; // Import Dashboard
import LessonPage from './LessonPage';
import CreateCoursePage from './CreateCoursePage';
import './App.css';
import { AuthProvider } from './AuthContext';
import { useAuth } from './AuthContext';

// A new component for the navigation bar
function Navigation() {
    const navigate = useNavigate();
    const { user, setUser } = useAuth();
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    const isInstructor = user && user.groups.includes('Instructors');

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Course Platform</Link>
                </Typography>

                {token && user ? (
                    <>
                        <Button color="inherit" component={Link} to="/dashboard">My Dashboard</Button>
                        {isInstructor && (
                            <Button color="inherit" component={Link} to="/create-course">Create Course</Button>
                        )}
                        <Button color="inherit" onClick={handleLogout}>Logout</Button>
                    </>
                ) : (
                    <>
                        <Button color="inherit" component={Link} to="/login">Login</Button>
                        <Button color="inherit" component={Link} to="/register">Register</Button>
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
}

function App() {
    return (
      <AuthProvider>
          <Router>
              <div className="App">
                  <Navigation />
                  <header className="App-header">
                      <Routes>
                          <Route path="/" element={<CourseList />} />
                          <Route path="/course/:id" element={<CourseDetail />} />
                          <Route path="/login" element={<LoginPage />} />
                          <Route path="/register" element={<RegistrationPage />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/lesson/:id" element={<LessonPage />} />
                          <Route path="/create-course" element={<CreateCoursePage />} />
                      </Routes>
                  </header>
              </div>
          </Router>
        </AuthProvider>
    );
}

export default App;