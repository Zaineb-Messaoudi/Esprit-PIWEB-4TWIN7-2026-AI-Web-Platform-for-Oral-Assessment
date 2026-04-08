import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    CardActionArea,
    CardActions,
    Grid,
    CircularProgress,
    IconButton,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    Button,
} from '@mui/material';
import { ChevronRight, StarOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';

const MyCourses = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unfollowCourseId, setUnfollowCourseId] = useState(null);
    const [unfollowDialogOpen, setUnfollowDialogOpen] = useState(false);

    const fetchEnrolledCourses = async () => {
        try {
            const { data: allCourses } = await axios.get('http://localhost:3000/courses/followed-courses/', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
            });
            setEnrolledCourses(allCourses);
        } catch (error) {
            console.error('Failed to fetch courses', error.response?.status || error.message);
            setError('Failed to load courses. Please check your authentication or server status.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEnrolledCourses();
    }, []);

    const handleUnenroll = async (courseId) => {
        try {
            const token = localStorage.getItem('token') || '';
            const response = await axios.delete(`http://localhost:3000/StudydDashboard/courses/${course.id}/follow/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 204) {
                setEnrolledCourses(prev => prev.filter(course => course.id !== courseId));
            }
        } catch (error) {
            console.error('Failed to unenroll from course', error.message);
            setError('Failed to unenroll from course. Please try again.');
        }
    };

    const handleUnenrollClick = (courseId) => {
        setUnfollowCourseId(courseId);
        setUnfollowDialogOpen(true);
    };

    const handleUnfollowConfirm = () => {
        if (unfollowCourseId) handleUnenroll(unfollowCourseId);
        setUnfollowDialogOpen(false);
        setUnfollowCourseId(null);
    };

    const handleUnfollowCancel = () => {
        setUnfollowDialogOpen(false);
        setUnfollowCourseId(null);
    };

    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && unfollowDialogOpen) handleUnfollowCancel();
        };
        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [unfollowDialogOpen]);

    const cardSx = isDark
        ? {
            background: 'linear-gradient(135deg, #1A202C 0%, #2D3748 100%)',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            color: '#E2E8F0',
            border: '2px solid #f7e7bc',
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 6px 20px rgba(251, 191, 36, 0.5)',
            },
            animation: 'pulse 2s infinite',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        }
        : {
            background: 'linear-gradient(145deg, #ffffff 0%, #fff8f8 100%)',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.10), 0 2px 6px rgba(0, 0, 0, 0.05)',
            color: '#1A202C',
            border: '1px solid #fca5a5',
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': {
                transform: 'scale(1.03)',
                boxShadow: '0 8px 28px rgba(239, 68, 68, 0.18), 0 2px 8px rgba(0, 0, 0, 0.07)',
            },
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        };

    const titleSx   = isDark ? { color: '#FBBF24' }              : { color: '#dc2626' };
    const teacherSx = isDark ? { color: '#CBD5E0', pt: 1 }       : { color: '#6B7280', pt: 1 };
    const placeholderBg = isDark ? '#2D3748' : '#ffe4e6';

    const dialogSx = isDark
        ? {
            backgroundColor: '#2D3748',
            color: '#E2E8F0',
            border: '2px solid #F56565',
            borderRadius: '16px',
        }
        : {
            background: 'linear-gradient(135deg, #ffffff 0%, #fff8f8 100%)',
            color: '#1A202C',
            border: '1px solid #fca5a5',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.12)',
        };

    const dialogTextSx   = isDark ? { color: '#E2E8F0' } : { color: '#374151' };
    const dialogNoBtnSx  = isDark
        ? { color: '#CBD5E0', '&:hover': { color: '#F56565' } }
        : { color: '#6B7280', '&:hover': { color: '#dc2626' } };
    const dialogYesBtnSx = isDark
        ? { color: '#F56565', '&:hover': { color: '#E53E3E' } }
        : { color: '#dc2626', fontWeight: 600, '&:hover': { color: '#b91c1c' } };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
                <CircularProgress sx={{ color: isDark ? '#F87171' : '#dc2626' }} />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
                <Typography variant="body1" color="error">{error}</Typography>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h2 className={`text-4xl md:text-5xl font-bold text-transparent bg-clip-text mb-4 ${
                    isDark
                        ? 'bg-gradient-to-r from-red-400 to-gray-400'
                        : 'bg-gradient-to-r from-red-600 to-gray-700'
                }`}>
                    My Courses
                </h2>
                <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Explore your enrolled courses
                </p>
            </div>

            <div className={`backdrop-blur-md rounded-xl p-8 border ${
                isDark ? 'bg-white/10 border-white/20' : 'bg-white/60 border-gray-200 shadow-lg'
            }`}>
                <div className="mb-4">
                    <Grid container spacing={2}>
                        {enrolledCourses.length === 0 ? (
                            <Typography variant="body1" style={{
                                padding: '2rem',
                                color: isDark ? '#9CA3AF' : '#6B7280',
                            }}>
                                No courses enrolled.
                            </Typography>
                        ) : (
                            enrolledCourses.map((course) => (
                                <Grid item xs={12} sm={6} md={4} key={course.id}>
                                    <Card sx={cardSx}>
                                        <CardActionArea sx={{ flexGrow: 1 }}>
                                            {course.cover_photo ? (
                                                <CardMedia
                                                    component="img"
                                                    height="140"
                                                    image={course.cover_photo}
                                                    sx={{
                                                        borderTopLeftRadius: '14px',
                                                        borderTopRightRadius: '14px',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    height: '140px',
                                                    backgroundColor: placeholderBg,
                                                    borderTopLeftRadius: '14px',
                                                    borderTopRightRadius: '14px',
                                                }} />
                                            )}
                                            <CardContent>
                                                <Typography gutterBottom variant="h5" component="div" sx={titleSx}>
                                                    {course.title}
                                                </Typography>
                                                <Typography variant="body1" sx={teacherSx}>
                                                    Teacher: {course.teacher}
                                                </Typography>
                                            </CardContent>
                                        </CardActionArea>

                                        <CardActions sx={{ padding: '0 16px 16px', justifyContent: 'space-between' }}>
                                            <Tooltip title="View" placement="top" slotProps={{ tooltip: { sx: { backgroundColor: '#2D3748', color: '#FFFFFF', border: '1px solid #F56565' } } }}>
                                                <IconButton
                                                    component={Link}
                                                    // ✅ CHANGED: now opens inside Student Dashboard
                                                    to={`/StudydDashboard/courses/${course.id}`}
                                                    sx={{
                                                        backgroundColor: '#F56565',
                                                        color: '#FFFFFF',
                                                        '&:hover': { backgroundColor: '#E53E3E' },
                                                        minWidth: '40px',
                                                        padding: '8px',
                                                        borderRadius: '50%',
                                                    }}
                                                >
                                                    <ChevronRight size={20} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Unenroll" placement="top" slotProps={{ tooltip: { sx: { backgroundColor: '#2D3748', color: '#FFFFFF', border: '1px solid #F56565' } } }}>
                                                <IconButton
                                                    onClick={() => handleUnenrollClick(course.id)}
                                                    sx={{
                                                        backgroundColor: '#F56565',
                                                        borderRadius: '50%',
                                                        width: '40px',
                                                        height: '40px',
                                                        '&:hover': { backgroundColor: '#E53E3E' },
                                                    }}
                                                >
                                                    <StarOff color="white" size={20} />
                                                </IconButton>
                                            </Tooltip>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))
                        )}
                    </Grid>
                </div>
            </div>

            <Dialog
                open={unfollowDialogOpen}
                onClose={handleUnfollowCancel}
                PaperProps={{ sx: dialogSx }}
            >
                <DialogContent>
                    <DialogContentText sx={dialogTextSx}>
                        Are you sure you want to unfollow from this course?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleUnfollowCancel} sx={dialogNoBtnSx}>No</Button>
                    <Button onClick={handleUnfollowConfirm} sx={dialogYesBtnSx}>Yes</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default MyCourses;