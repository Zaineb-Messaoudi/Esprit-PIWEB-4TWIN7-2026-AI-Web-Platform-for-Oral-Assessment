import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActionArea,
  CardActions,
  Grid,
  CircularProgress,
  Tooltip,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
} from '@mui/material';
import { Plus, ChevronRight, AlignJustify, SquarePen, Trash2, Type, Text, Image } from 'lucide-react';
import AnimatedBackground from "../Components/Background";
import { useTheme } from '../context/ThemeContect.jsx';

/* ─────────────────────────────────────────────
   Shared token map – keeps colours consistent
───────────────────────────────────────────── */
const tokens = {
  dark: {
    cardBg:         'linear-gradient(145deg, #1e2535 0%, #252d42 60%, #1e2535 100%)',
    cardBorder:     '#f56565',
    cardHoverShadow:'rgba(245,101,101,0.45)',
    titleColor:     '#fc8181',
    dateColor:      '#94a3b8',
    placeholderBg:  '#1a2030',
    modalBg:        '#171e2e',
    modalBorder:    'rgba(245,101,101,0.35)',
    modalHeading:   '#fc8181',
    modalText:      '#e2e8f0',
    inputBg:        '#0f1623',
    inputBorder:    '#374151',
    inputFocus:     '#f56565',
    labelText:      '#94a3b8',
    cancelBg:       '#1e293b',
    cancelHover:    '#263347',
    cancelText:     '#cbd5e1',
    overlay:        'rgba(0,0,0,0.72)',
    btnBg:          '#f56565',
    btnHover:       '#e53e3e',
    deleteBg:       '#dc2626',
    deleteHover:    '#b91c1c',
  },
  light: {
    cardBg:         'linear-gradient(145deg, #fff5f5 0%, #ffffff 55%, #fff1f1 100%)',
    cardBorder:     '#fca5a5',
    cardHoverShadow:'rgba(239,68,68,0.25)',
    titleColor:     '#dc2626',
    dateColor:      '#6b7280',
    placeholderBg:  '#fff1f1',
    modalBg:        'linear-gradient(150deg, #fff5f5 0%, #fff1f1 100%)',
    modalBorder:    '#fecaca',
    modalHeading:   '#dc2626',
    modalText:      '#1f2937',
    inputBg:        '#ffffff',
    inputBorder:    '#fca5a5',
    inputFocus:     '#ef4444',
    labelText:      '#6b7280',
    cancelBg:       '#f9fafb',
    cancelHover:    '#f3f4f6',
    cancelText:     '#374151',
    overlay:        'rgba(30,0,0,0.25)',
    btnBg:          '#f56565',
    btnHover:       '#e53e3e',
    deleteBg:       '#dc2626',
    deleteHover:    '#b91c1c',
  },
};

const tooltipSx = {
  tooltip: { sx: { backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #f56565', fontSize: '0.72rem' } },
};

const roundBtnSx = (t) => ({
  backgroundColor: t.btnBg,
  color: '#fff',
  '&:hover': { backgroundColor: t.btnHover },
  minWidth: '38px',
  width: '38px',
  height: '38px',
  padding: 0,
  borderRadius: '50%',
  boxShadow: `0 2px 8px ${t.cardHoverShadow}`,
});

const deleteBtnSx = (t) => ({
  ...roundBtnSx(t),
  backgroundColor: t.deleteBg,
  '&:hover': { backgroundColor: t.deleteHover },
});

const MyCoursesTeacher = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const t = isDark ? tokens.dark : tokens.light;

  const [teacherCourses, setTeacherCourses]   = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [anchorEl, setAnchorEl]               = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [editOpen, setEditOpen]               = useState(false);
  const [deleteOpen, setDeleteOpen]           = useState(false);
  const [addOpen, setAddOpen]                 = useState(false);
  const [editForm, setEditForm]               = useState({ title: '', description: '', cover_photo: null });
  const [addForm, setAddForm]                 = useState({ title: '', description: '', cover_photo: null });
  const [selectedCourse, setSelectedCourse]   = useState(null);

  const fetchTeacherCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const { data } = await axios.get('http://localhost:3000/courses/my-courses/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeacherCourses(data);
    } catch (err) {
      setError('Failed to load courses. Please ensure you are logged in or check server status.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ds) => {
    const d = new Date(ds);
    if (isNaN(d.getTime())) return 'Invalid date';
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  useEffect(() => { fetchTeacherCourses(); }, []);

  const handleMenuOpen  = (e, id) => { setAnchorEl(e.currentTarget); setSelectedCourseId(id); };
  const handleMenuClose = ()      => { setAnchorEl(null); setSelectedCourseId(null); };

  const handleEditOpen  = (c) => { setSelectedCourse(c); setEditForm({ title: c.title, description: c.description, cover_photo: c.cover_photo||null }); setEditOpen(true); handleMenuClose(); };
  const handleEditClose = ()  => { setEditOpen(false); setEditForm({ title:'', description:'', cover_photo:null }); setSelectedCourse(null); };
  const handleEditSave  = async () => {
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('title', editForm.title);
      fd.append('description', editForm.description);
      if (editForm.cover_photo && typeof editForm.cover_photo !== 'string') fd.append('cover_photo', editForm.cover_photo);
      await axios.put(`http://localhost:3000/courses/${selectedCourse.id}/`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      const updated = { ...selectedCourse, ...editForm };
      if (editForm.cover_photo && typeof editForm.cover_photo !== 'string') updated.cover_photo = URL.createObjectURL(editForm.cover_photo);
      setTeacherCourses(teacherCourses.map(c => c.id === selectedCourse.id ? updated : c));
      handleEditClose();
    } catch { setError('Failed to update course.'); }
  };

  const handleAddOpen  = ()  => { setAddForm({ title:'', description:'', cover_photo:null }); setAddOpen(true); };
  const handleAddClose = ()  => { setAddOpen(false); setAddForm({ title:'', description:'', cover_photo:null }); };
  const handleAddSave  = async () => {
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('title', addForm.title);
      fd.append('description', addForm.description);
      if (addForm.cover_photo) fd.append('cover_photo', addForm.cover_photo);
      const { data } = await axios.post('http://localhost:3000/courses/', fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setTeacherCourses([...teacherCourses, data]);
      handleAddClose();
    } catch { setError('Failed to add course.'); }
  };

  const handleDeleteOpen    = (c) => { setSelectedCourse(c); setDeleteOpen(true); handleMenuClose(); };
  const handleDeleteClose   = ()  => { setDeleteOpen(false); setSelectedCourse(null); };
  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/courses/${selectedCourse.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeacherCourses(teacherCourses.filter(c => c.id !== selectedCourse.id));
      handleDeleteClose();
    } catch { setError('Failed to delete course.'); }
  };

  useEffect(() => {
    const fn = (e) => {
      if (e.key !== 'Escape') return;
      if (editOpen) handleEditClose();
      else if (addOpen) handleAddClose();
      else if (deleteOpen) handleDeleteClose();
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [editOpen, addOpen, deleteOpen]);

  const cardSx = {
    width: '100%',
    maxWidth: 300,
    margin: '0 auto',
    background: t.cardBg,
    borderRadius: '18px',
    boxShadow: isDark
        ? '0 4px 18px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)'
        : '0 4px 18px rgba(0,0,0,0.09), inset 0 1px 0 rgba(255,255,255,0.8)',
    color: isDark ? '#e2e8f0' : '#292524',
    border: `1.5px solid ${t.cardBorder}`,
    transition: 'transform 0.28s ease, box-shadow 0.28s ease',
    '&:hover': {
      transform: 'translateY(-4px) scale(1.025)',
      boxShadow: `0 12px 32px ${t.cardHoverShadow}, 0 2px 8px rgba(0,0,0,0.12)`,
    },
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'visible',
  };

  const inputCls = `w-full rounded-xl px-5 py-3 text-sm focus:outline-none transition-all`;
  const inputStyle = {
    background: t.inputBg,
    color: t.modalText,
    border: `1.5px solid ${t.inputBorder}`,
  };

  const ModalShell = ({ children, narrow }) => (
      <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: t.overlay, backdropFilter: 'blur(3px)' }}
      >
        <div
            style={{
              background: t.modalBg,
              border: `1.5px solid ${t.modalBorder}`,
              boxShadow: isDark
                  ? '0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(217,119,6,0.1)'
                  : '0 24px 64px rgba(100,30,0,0.14), 0 0 0 1px rgba(251,146,60,0.2)',
              color: t.modalText,
            }}
            className={`rounded-2xl p-8 w-full ${narrow ? 'max-w-sm' : 'max-w-2xl'} relative`}
        >
          {children}
        </div>
      </div>
  );

  const FieldRow = ({ icon, children }) => (
      <div className="flex items-start gap-3">
        <span className="mt-3 shrink-0 opacity-70">{icon}</span>
        <div className="flex-1">{children}</div>
      </div>
  );

  const FieldLabel = ({ children }) => (
      <span
          className="block text-xs font-semibold uppercase tracking-widest mb-1.5 ml-1"
          style={{ color: t.labelText }}
      >
      {children}
    </span>
  );

  const SaveBtn = ({ onClick, label, danger }) => (
      <button
          onClick={onClick}
          className="px-7 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 hover:brightness-110 active:scale-95"
          style={{
            background: danger
                ? `linear-gradient(135deg, ${t.deleteBg}, ${t.deleteHover})`
                : `linear-gradient(135deg, ${t.btnBg}, ${t.btnHover})`,
            boxShadow: danger
                ? '0 4px 14px rgba(220,38,38,0.45)'
                : `0 4px 14px ${t.cardHoverShadow}`,
          }}
      >
        {label}
      </button>
  );

  const CancelBtn = ({ onClick }) => (
      <button
          onClick={onClick}
          className="px-7 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
          style={{ background: t.cancelBg, color: t.cancelText, border: `1px solid ${t.inputBorder}` }}
      >
        Cancel
      </button>
  );

  if (loading) return <div style={{ textAlign:'center', paddingTop:'2rem' }}><CircularProgress /></div>;
  if (error)   return <div style={{ textAlign:'center', paddingTop:'2rem' }}><Typography variant="body1" color="error">{error}</Typography></div>;

  return (
      <div className={`space-y-8 relative ${isDark ? '' : 'bg-white/60'}`}>
        <AnimatedBackground />

        <div className="text-center mb-8 relative">
          <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-rose-500 mb-4">
            My Courses
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Manage your teaching courses</p>

          <Tooltip title="Add Course" placement="top" arrow slotProps={tooltipSx}>
            <Button
                variant="contained"
                sx={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: `linear-gradient(135deg, ${t.btnBg}, ${t.btnHover})`,
                  color: '#fff',
                  '&:hover': { filter: 'brightness(1.1)' },
                  minWidth: '42px', width: '42px', height: '42px',
                  padding: 0, borderRadius: '50%',
                  boxShadow: `0 4px 14px ${t.cardHoverShadow}`,
                }}
                onClick={handleAddOpen}
            >
              <Plus size={20} />
            </Button>
          </Tooltip>
        </div>

        <div className={`backdrop-blur-md rounded-xl p-8 border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-red-50/40 border-red-100 shadow-lg'}`}>
          <Grid container spacing={3}>
            {teacherCourses.length === 0 ? (
                <Typography variant="body1" style={{ padding: '2rem', opacity: 0.6 }}>No courses assigned.</Typography>
            ) : (
                teacherCourses.map((course) => (
                    <Grid item xs={12} sm={6} md={4} key={course.id}>
                      <Card sx={cardSx}>
                        <CardActionArea sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

                          <Box sx={{ width:'100%', height:180, overflow:'hidden', borderTopLeftRadius:'16px', borderTopRightRadius:'16px', display:'flex', justifyContent:'center', alignItems:'center', position:'relative' }}>
                            {course.cover_photo ? (
                                <img
                                    src={course.cover_photo}
                                    alt={course.title}
                                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                                />
                            ) : (
                                <Box sx={{
                                  width:'100%', height:'100%',
                                  background: isDark
                                      ? 'linear-gradient(135deg, #1a2030 0%, #252d42 100%)'
                                      : 'linear-gradient(135deg, #fff5f5 0%, #ffe4e4 100%)',
                                  display:'flex', alignItems:'center', justifyContent:'center',
                                }}>
                                  <Image size={36} color={isDark ? '#f56565' : '#fca5a5'} opacity={0.4} />
                                </Box>
                            )}
                            <Box sx={{ position:'absolute', top:0, left:0, right:0, height:3, background: `linear-gradient(90deg, ${t.cardBorder}, transparent)`, opacity: 0.7 }} />
                          </Box>

                          <CardContent sx={{ flexGrow:1, width:'100%', pb: 1 }}>
                            <Typography gutterBottom variant="h6" component="div" sx={{ color: t.titleColor, fontWeight: 700, lineHeight: 1.3 }}>
                              {course.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: t.dateColor, display:'block', mt: 0.5 }}>
                              Created: {formatDate(course.creation_date)}
                            </Typography>
                          </CardContent>
                        </CardActionArea>

                        <CardActions sx={{ padding:'0 16px 16px', justifyContent:'flex-end', gap: 1 }}>
                          <Tooltip title="View" placement="top" arrow slotProps={tooltipSx}>
                            {/* ✅ CHANGED: now opens inside Teacher Dashboard */}
                            <Link to={`/teacherdashboard/courses/${course.id}`}>
                              <Button size="small" sx={roundBtnSx(t)}>
                                <ChevronRight size={18} />
                              </Button>
                            </Link>
                          </Tooltip>
                          <Tooltip title="More" placement="top" arrow slotProps={tooltipSx}>
                            <IconButton size="small" sx={roundBtnSx(t)} onClick={(e) => handleMenuOpen(e, course.id)}>
                              <AlignJustify size={18} />
                            </IconButton>
                          </Tooltip>
                        </CardActions>
                      </Card>

                      <Menu
                          anchorEl={anchorEl}
                          open={Boolean(anchorEl) && selectedCourseId === course.id}
                          onClose={handleMenuClose}
                          anchorOrigin={{ vertical:'bottom', horizontal:'center' }}
                          transformOrigin={{ vertical:'top', horizontal:'center' }}
                          PaperProps={{ sx: { backgroundColor:'transparent', boxShadow:'none', padding:0 } }}
                      >
                        <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1, mt:1 }}>
                          <Tooltip title="Edit" placement="right" arrow slotProps={tooltipSx}>
                            <Button size="small" sx={roundBtnSx(t)} onClick={() => handleEditOpen(course)}>
                              <SquarePen size={18} />
                            </Button>
                          </Tooltip>
                          <Tooltip title="Delete" placement="right" arrow slotProps={tooltipSx}>
                            <Button size="small" sx={deleteBtnSx(t)} onClick={() => handleDeleteOpen(course)}>
                              <Trash2 size={18} />
                            </Button>
                          </Tooltip>
                        </Box>
                      </Menu>
                    </Grid>
                ))
            )}
          </Grid>
        </div>

        {/* ══════════════ EDIT MODAL ══════════════ */}
        {editOpen && (
            <ModalShell>
              <div className="flex items-center gap-3 mb-6">
            <span className="p-2 rounded-lg" style={{ background: isDark ? 'rgba(217,119,6,0.15)' : 'rgba(234,88,12,0.1)' }}>
              <SquarePen size={18} color={t.modalHeading} />
            </span>
                <h2 className="text-xl font-bold" style={{ color: t.modalHeading }}>Edit Course</h2>
              </div>
              <div className="mb-6 h-px rounded-full" style={{ background: `linear-gradient(90deg, ${t.cardBorder}, transparent)` }} />
              <div className="space-y-5">
                <FieldRow icon={<Type size={16} color={t.cardBorder} />}>
                  <FieldLabel>Title</FieldLabel>
                  <input
                      type="text" placeholder="Course title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className={inputCls}
                      style={inputStyle}
                  />
                </FieldRow>
                <FieldRow icon={<Text size={16} color={t.cardBorder} />}>
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                      rows={4} placeholder="Course description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className={inputCls}
                      style={{ ...inputStyle, resize:'vertical' }}
                  />
                </FieldRow>
                <FieldRow icon={<Image size={16} color={t.cardBorder} />}>
                  <FieldLabel>Cover Photo</FieldLabel>
                  <input
                      type="file" accept="image/*"
                      onChange={(e) => setEditForm({ ...editForm, cover_photo: e.target.files[0] })}
                      className={inputCls}
                      style={inputStyle}
                  />
                </FieldRow>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <SaveBtn onClick={handleEditSave} label="Save Changes" />
                <CancelBtn onClick={handleEditClose} />
              </div>
            </ModalShell>
        )}

        {/* ══════════════ ADD MODAL ══════════════ */}
        {addOpen && (
            <ModalShell>
              <div className="flex items-center gap-3 mb-6">
            <span className="p-2 rounded-lg" style={{ background: isDark ? 'rgba(217,119,6,0.15)' : 'rgba(234,88,12,0.1)' }}>
              <Plus size={18} color={t.modalHeading} />
            </span>
                <h2 className="text-xl font-bold" style={{ color: t.modalHeading }}>Add New Course</h2>
              </div>
              <div className="mb-6 h-px rounded-full" style={{ background: `linear-gradient(90deg, ${t.cardBorder}, transparent)` }} />
              <div className="space-y-5">
                <FieldRow icon={<Type size={16} color={t.cardBorder} />}>
                  <FieldLabel>Title</FieldLabel>
                  <input
                      type="text" placeholder="Course title"
                      value={addForm.title}
                      onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                      className={inputCls}
                      style={inputStyle}
                  />
                </FieldRow>
                <FieldRow icon={<Text size={16} color={t.cardBorder} />}>
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                      rows={4} placeholder="Course description"
                      value={addForm.description}
                      onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                      className={inputCls}
                      style={{ ...inputStyle, resize:'vertical' }}
                  />
                </FieldRow>
                <FieldRow icon={<Image size={16} color={t.cardBorder} />}>
                  <FieldLabel>Cover Photo</FieldLabel>
                  <input
                      type="file" accept="image/*"
                      onChange={(e) => setAddForm({ ...addForm, cover_photo: e.target.files[0] })}
                      className={inputCls}
                      style={inputStyle}
                  />
                </FieldRow>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <SaveBtn onClick={handleAddSave} label="Add Course" />
                <CancelBtn onClick={handleAddClose} />
              </div>
            </ModalShell>
        )}

        {/* ══════════════ DELETE MODAL ══════════════ */}
        {deleteOpen && (
            <ModalShell narrow>
              <div className="flex flex-col items-center text-center">
            <span className="p-3 rounded-full mb-4" style={{ background: 'rgba(220,38,38,0.12)' }}>
              <Trash2 size={22} color="#f87171" />
            </span>
                <h2 className="text-lg font-bold mb-2" style={{ color: '#f87171' }}>Delete Course</h2>
                <div className="mb-1 h-px w-2/3 rounded-full mx-auto" style={{ background: 'linear-gradient(90deg, transparent, rgba(248,113,113,0.4), transparent)' }} />
                <p className="text-sm mt-4 mb-1" style={{ color: t.labelText }}>You're about to permanently delete</p>
                <p className="font-semibold text-base mb-6" style={{ color: isDark ? '#fca5a5' : '#dc2626' }}>"{selectedCourse?.title}"</p>
                <p className="text-xs mb-6" style={{ color: t.labelText }}>This action cannot be undone.</p>
              </div>
              <div className="flex justify-center gap-3">
                <SaveBtn onClick={handleDeleteConfirm} label="Yes, Delete" danger />
                <CancelBtn onClick={handleDeleteClose} />
              </div>
            </ModalShell>
        )}
      </div>
  );
};

export default MyCoursesTeacher;