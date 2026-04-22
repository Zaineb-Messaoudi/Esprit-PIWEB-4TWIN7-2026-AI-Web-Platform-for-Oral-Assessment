import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';
import axios from 'axios';
import parse from 'html-react-parser';
import { htmlToText } from 'html-to-text';
import "../App.css";
import RichTextEditor from "../Components/RichTextEditor.jsx";
import { useTheme } from '../context/ThemeContect.jsx';

const CourseDetails = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedChapterId, setExpandedChapterId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editData, setEditData] = useState({ title: '', description: '' });
  const [showPopup, setShowPopup] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDescription, setNewChapterDescription] = useState('');
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  const isTeacher = userType === 'teacher';
  const [showContentPopup, setShowContentPopup] = useState(false);
  const [contentType, setContentType] = useState('TEXT');
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [contentForm, setContentForm] = useState({
    title: '',
    text: '',
    url: '',
    file: null,
  });
  const [editingContentId, setEditingContentId] = useState(null);
  const [editContentData, setEditContentData] = useState({
    title: '',
    content_kind: 'TEXT',
    text: '',
    url: '',
    file: null,
  });
  const [chapterContents, setChapterContents] = useState({});
  const [showReorderPopup, setShowReorderPopup] = useState(false);
  const [reorderedChapters, setReorderedChapters] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [subtitleError, setSubtitleError] = useState(null);
  const [subtitleSuccess, setSubtitleSuccess] = useState(null);

  const [showContentReorderPopup, setShowContentReorderPopup] = useState(false);
  const [reorderedContents, setReorderedContents] = useState([]);
  const [selectedReorderChapterId, setSelectedReorderChapterId] = useState(null);

  const MAX_LENGTH = 100;

  // ── theme ─────────────────────────────────────────────────────────────────
  const { theme } = useTheme();
  const isDark = theme === 'dark';

// ── theme-aware class tokens (accessible + structured light theme) ──────
  const pageClass = isDark
      ? 'text-white bg-gray-950'
      : 'text-slate-900 bg-slate-100';

  const titleGradient = isDark
      ? 'from-red-400 to-gray-400'
      : 'from-red-700 to-red-500';

  const sectionLabelColor = isDark ? '#d1d5db' : '#334155';

  const searchWrapColor = isDark ? 'text-gray-400' : 'text-slate-500';

  const searchInputClass = isDark
      ? 'rounded-md bg-gray-900 text-white placeholder-gray-500 px-4 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500'
      : 'rounded-md bg-white text-slate-900 placeholder-slate-400 px-4 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition';

  const cardClass = isDark
      ? 'p-6 rounded-xl border border-gray-800 bg-gray-900 shadow-sm'
      : 'p-6 rounded-xl bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition-shadow';

  const chapterIconClass = isDark ? 'text-red-400' : 'text-red-600';

  const inlineInputClass = isDark
      ? 'bg-gray-800 rounded px-3 py-2 text-white border border-gray-700'
      : 'bg-white rounded px-3 py-2 text-slate-900 border border-slate-300 focus:ring-2 focus:ring-red-600';

  const chapterTitleClass = isDark
      ? 'text-xl font-semibold'
      : 'text-xl font-semibold text-slate-900';

  const chapterDescClass = isDark
      ? 'text-gray-400'
      : 'text-slate-600';

  const iconBtnClass = isDark
      ? 'text-gray-300 hover:text-white transition-colors'
      : 'text-slate-500 hover:text-slate-900 transition-colors';

  const chevronBtnClass = isDark
      ? 'text-gray-300 hover:text-white'
      : 'text-slate-500 hover:text-slate-900';

  const expandedTextClass = isDark
      ? 'mt-4 space-y-3 text-gray-400'
      : 'mt-4 space-y-3 text-slate-700';

  const subCardClass = isDark
      ? 'p-4 rounded-lg bg-gray-800 border border-gray-700 shadow-sm'
      : 'p-4 rounded-lg bg-white border border-slate-200 shadow-sm';

  const contentTitleClass = isDark
      ? 'font-semibold text-white'
      : 'font-semibold text-slate-900';

  const editInputClass = isDark
      ? 'w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700'
      : 'w-full px-3 py-2 rounded bg-white text-slate-900 border border-slate-300 focus:ring-2 focus:ring-red-600';

  const fileInputClass = isDark
      ? 'w-full text-gray-300'
      : 'w-full text-slate-700';

  const emptyTextClass = isDark
      ? 'text-center text-gray-500 italic'
      : 'text-center text-slate-500 italic';

  const noContentClass = isDark
      ? 'text-gray-500'
      : 'text-slate-500';

  const modalBgClass = isDark
      ? 'bg-gray-900 text-white p-8 rounded-xl shadow-xl border border-gray-800'
      : 'bg-white text-slate-900 p-8 rounded-xl shadow-xl border border-slate-200';

  const modalInputClass = isDark
      ? 'w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white'
      : 'w-full px-3 py-2 rounded bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-red-600';

  const modalTitleClass = isDark
      ? 'text-xl font-semibold text-center'
      : 'text-xl font-semibold text-center text-slate-900';

  const inactiveTypeBtnClass = isDark
      ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
      : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100';

  const fileUploadLabelClass = isDark
      ? 'block text-sm text-gray-400 mb-1'
      : 'block text-sm text-slate-600 mb-1';

  const fileSelectedClass = isDark
      ? 'mt-1 text-sm text-gray-400'
      : 'mt-1 text-sm text-slate-600';

  const quizTextClass = isDark
      ? 'text-sm text-gray-400'
      : 'text-sm text-slate-600';

  const dragItemClass = isDark
      ? 'p-3 rounded bg-gray-800 border border-gray-700 cursor-move'
      : 'p-3 rounded bg-white border border-slate-300 cursor-move hover:bg-slate-50 transition';

  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const handleToggleContentReordering = (chapterId) => {
    setSelectedReorderChapterId(chapterId);
    setReorderedContents(chapterContents[chapterId] || []);
    setShowContentReorderPopup(true);
  };

  const handleContentDragStart = (e, content) => {
    setDraggedItem(content);
    e.dataTransfer.setData('text/plain', content.id);
  };

  const handleContentDrop = (e, targetContent) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetContent.id) return;
    const newOrder = [...reorderedContents];
    const draggedIndex = newOrder.findIndex(c => c.id === draggedItem.id);
    const targetIndex = newOrder.findIndex(c => c.id === targetContent.id);
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);
    setReorderedContents(newOrder);
    setDraggedItem(null);
  };

  const handleSaveContentOrder = async () => {
    try {
      const csrfToken = getCookie('csrftoken');
      const item_ids = reorderedContents.map(content => content.id);
      const response = await axios.post(
          `http://localhost:3000/courses/${courseId}/chapters/${selectedReorderChapterId}/contents/reorder/`,
          { item_ids },
          {
            headers: {
              'X-CSRFToken': csrfToken,
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
      );
      setChapterContents(prev => ({ ...prev, [selectedReorderChapterId]: reorderedContents }));
      setShowContentReorderPopup(false);
      alert(response.data.detail);
    } catch (err) {
      console.error("Erreur lors de la réorganisation :", err);
      alert(err.response?.data?.detail || "Échec de l'enregistrement de l'ordre");
    }
  };

  const handleCancelContentReordering = () => {
    setShowContentReorderPopup(false);
    setReorderedContents(chapterContents[selectedReorderChapterId] || []);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetchCourse = axios.get(`http://localhost:3000/courses/${courseId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const fetchChapters = axios.get(`http://localhost:3000/courses/${courseId}/chapters/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    Promise.all([fetchCourse, fetchChapters])
        .then(([courseRes, chaptersRes]) => {
          setCourse(courseRes.data);
          setChapters(chaptersRes.data);
          setReorderedChapters(chaptersRes.data);
        })
        .catch(err => {
          console.error(err);
          setError("Erreur lors du chargement des données.");
        })
        .finally(() => setLoading(false));
  }, [courseId]);

  const toggleChapter = (id) => {
    if (expandedChapterId === id) {
      setExpandedChapterId(null);
    } else {
      setExpandedChapterId(id);
      fetchContentsForChapter(id);
    }
  };

  const fetchContentsForChapter = async (chapterId) => {
    try {
      const res = await axios.get(
          `http://localhost:3000/courses/${courseId}/chapters/${chapterId}/contents/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
      );
      // Sort contents by order
      const sortedContents = res.data.sort((a, b) => a.order - b.order);
      setChapterContents(prev => ({ ...prev, [chapterId]: sortedContents }));
    } catch (error) {
      console.error("Erreur fetch contenus :", error);
      setChapterContents(prev => ({ ...prev, [chapterId]: [] }));
    }
  };

  const handleAddChapter = () => {
    setShowPopup(true);
  };

  const handleEditChapter = (chapter) => {
    setEditingChapterId(chapter.id);
    setEditData({ title: chapter.title, description: chapter.description });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (chapterId) => {
    try {
      const csrfToken = getCookie('csrftoken');
      const res = await axios.put(
          `http://localhost:3000/courses/${courseId}/chapters/${chapterId}/`,
          editData,
          {
            headers: {
              'X-CSRFToken': csrfToken,
              Authorization: `Bearer ${token}`,
            },
          }
      );

      const updated = chapters.map(chap =>
          chap.id === chapterId ? res.data : chap
      );
      setChapters(updated);
      setReorderedChapters(updated);
      setEditingChapterId(null);
    } catch (err) {
      console.error("Erreur de mise à jour :", err);
      alert("Échec de la mise à jour");
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!window.confirm("Confirm deletion of this chapter ?")) return;
    try {
      const csrfToken = getCookie('csrftoken');
      await axios.delete(`http://localhost:3000/courses/${courseId}/chapters/${chapterId}/`, {
        headers: {
          'X-CSRFToken': csrfToken,
          Authorization: `Bearer ${token}`,
        },
      });
      setChapters(prev => prev.filter(c => c.id !== chapterId));
      setReorderedChapters(prev => prev.filter(c => c.id !== chapterId));
    } catch (err) {
      console.error("Erreur de suppression :", err);
      alert("Échec de la suppression");
    }
  };

  const handleAddContent = (chapterId) => {
    setSelectedChapterId(chapterId);
    setShowContentPopup(true);
    setContentType('TEXT');
    setContentForm({ title: '', text: '', url: '', file: null });
  };

  const submitNewChapter = async () => {
    if (!newChapterTitle || !newChapterDescription) {
      alert("Title and description are required.");
      return;
    }

    try {
      const csrfToken = getCookie('csrftoken');
      const res = await axios.post(
          `http://localhost:3000/courses/${courseId}/chapters/`,
          {
            title: newChapterTitle,
            description: newChapterDescription,
          },
          {
            headers: {
              'X-CSRFToken': csrfToken,
              Authorization: `Bearer ${token}`,
            },
          }
      );
      setChapters([...chapters, res.data]);
      setReorderedChapters([...chapters, res.data]);
      setShowPopup(false);
      setNewChapterTitle('');
      setNewChapterDescription('');
    } catch (err) {
      console.error("Erreur d'ajout :", err);
      alert("Erreur lors de l'ajout du chapitre");
    }
  };

  const handleEditContent = (content) => {
    setEditingContentId(content.id);
    setEditContentData({
      title: content.title,
      content_kind: content.content_kind,
      text: content.content_kind === 'TEXT' ? content.text : '',
      url: content.content_kind === 'LINK' ? content.url : '',
      file: null,
    });
  };

  const handleEditContentChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setEditContentData(prev => ({ ...prev, file: files[0] }));
    } else {
      setEditContentData(prev => ({ ...prev, [name]: value }));
    }
  };

  const submitContent = async () => {
    if (!contentForm.title) {
      alert("Title is required.");
      return;
    }

    if (contentType === 'TEXT' && !contentForm.text) {
      alert("Text content is required.");
      return;
    }

    if (contentType === 'LINK' && !contentForm.url) {
      alert("URL is required.");
      return;
    }

    if (contentType === 'FILE' && !contentForm.file) {
      alert("File is required.");
      return;
    }

    if (contentType === 'QUIZ') {
      alert("Quiz creation is not yet implemented.");
      return;
    }

    try {
      const csrfToken = getCookie('csrftoken');
      const formData = new FormData();
      formData.append('title', contentForm.title);
      formData.append('content_kind', contentType);

      if (contentType === 'TEXT') {
        formData.append('text', contentForm.text);
      } else if (contentType === 'LINK') {
        formData.append('url', contentForm.url);
      } else if (contentType === 'FILE') {
        formData.append('file', contentForm.file);
      }

      const res = await axios.post(
          `http://localhost:3000/courses/${courseId}/chapters/${selectedChapterId}/contents/`,
          formData,
          {
            headers: {
              'X-CSRFToken': csrfToken,
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
      );

      setChapterContents((prev) => ({
        ...prev,
        [selectedChapterId]: [...(prev[selectedChapterId] || []), res.data],
      }));

      setShowContentPopup(false);
      setContentForm({ title: '', text: '', url: '', file: null });
      setContentType('TEXT');
    } catch (err) {
      console.error("Error adding content:", err);
      alert("Failed to add content.");
    }
  };

  const submitEditContent = async (chapterId, contentId) => {
    try {
      const csrfToken = getCookie('csrftoken');
      const formData = new FormData();
      formData.append('title', editContentData.title);
      formData.append('content_kind', editContentData.content_kind);

      if (editContentData.content_kind === 'TEXT') {
        formData.append('text', editContentData.text);
      } else if (editContentData.content_kind === 'LINK') {
        formData.append('url', editContentData.url);
      } else if (editContentData.content_kind === 'FILE') {
        if (editContentData.file) formData.append('file', editContentData.file);
        else {
          alert("Please select a file.");
          return;
        }
      }

      const res = await axios.put(
          `http://localhost:3000/courses/${courseId}/chapters/${chapterId}/contents/${contentId}/`,
          formData,
          {
            headers: {
              'X-CSRFToken': csrfToken,
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
      );

      setChapterContents(prev => ({
        ...prev,
        [chapterId]: prev[chapterId].map(c =>
            c.id === contentId ? res.data : c
        ),
      }));

      setEditingContentId(null);
    } catch (err) {
      console.error("Erreur de mise à jour du contenu :", err);
      alert("Erreur lors de la mise à jour.");
    }
  };

  const handleDeleteContent = async (chapterId, contentId) => {
    if (!window.confirm('Confirm deletion of this content?')) return;

    try {
      await axios.delete(
          `http://localhost:3000/courses/${courseId}/chapters/${chapterId}/contents/${contentId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );

      setChapterContents(prev => ({
        ...prev,
        [chapterId]: prev[chapterId].filter(c => c.id !== contentId),
      }));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('La suppression a échoué. Veuillez réessayer.');
    }
  };

  const handleUploadSubtitle = async (chapterId, contentId, file) => {
    if (!file) {
      setSubtitleError('No file selected.');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.vtt')) {
      setSubtitleError('Please upload a valid .vtt file.');
      return;
    }

    try {
      const res = await axios.patchForm(
          `http://localhost:3000/courses/${courseId}/chapters/${chapterId}/contents/${contentId}/`,
          { subtitle_file: file },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );
      setChapterContents(prev => ({
        ...prev,
        [chapterId]: prev[chapterId].map(c =>
            c.id === contentId ? res.data : c
        ),
      }));
      setSubtitleSuccess('Subtitle uploaded successfully!');
      setSubtitleError(null);
    } catch (err) {
      setSubtitleError(err.response?.data?.error || 'Failed to upload subtitle.');
      setSubtitleSuccess(null);
    }
  };

  const handleDeleteSubtitle = async (chapterId, contentId) => {
    if (!window.confirm('Confirm deletion of subtitle?')) return;

    try {
      await axios.patchForm(
          `http://localhost:3000/courses/${courseId}/chapters/${chapterId}/contents/${contentId}/`,
          { subtitle_file: '' },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );
      setChapterContents(prev => ({
        ...prev,
        [chapterId]: prev[chapterId].map(c =>
            c.id === contentId ? { ...c, subtitle_file: null, transcript_text: '' } : c
        ),
      }));
      setSubtitleSuccess('Subtitle deleted successfully!');
      setSubtitleError(null);
    } catch (err) {
      setSubtitleError(err.response?.data?.error || 'Failed to delete subtitle.');
      setSubtitleSuccess(null);
    }
  };

  const handleDragStart = (e, chapter) => {
    setDraggedItem(chapter);
    e.dataTransfer.setData('text/plain', chapter.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetChapter) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetChapter.id) return;

    const newOrder = [...reorderedChapters];
    const draggedIndex = newOrder.findIndex(c => c.id === draggedItem.id);
    const targetIndex = newOrder.findIndex(c => c.id === targetChapter.id);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    setReorderedChapters(newOrder);
    setDraggedItem(null);
  };

  const handleToggleReordering = () => {
    setShowReorderPopup(true);
    setReorderedChapters(chapters);
  };

  const handleSaveOrder = async () => {
    try {
      const csrfToken = getCookie('csrftoken');
      const item_ids = reorderedChapters.map(chapter => chapter.id);

      const response = await axios.post(
          `http://localhost:3000/courses/${courseId}/chapters/reorder/`,
          { item_ids },
          {
            headers: {
              'X-CSRFToken': csrfToken,
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
      );

      setChapters(reorderedChapters);
      setShowReorderPopup(false);
      alert(response.data.detail);
    } catch (err) {
      console.error("Erreur lors de la réorganisation :", err);
      alert(err.response?.data?.detail || "Échec de l'enregistrement de l'ordre");
    }
  };

  const handleCancelReordering = () => {
    setShowReorderPopup(false);
    setReorderedChapters(chapters);
  };

  const filteredChapters = chapters.filter(chap =>
      chap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chap.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className="text-gray-400">Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
      <div className={`${pageClass} max-w-5xl mx-auto space-y-12 p-10 min-h-screen`}>
        <h1 className={`text-5xl font-extrabold tracking-tight bg-gradient-to-r ${titleGradient} text-transparent bg-clip-text mb-4`}>
          {course?.title || "Titre indisponible"}
        </h1>

        <h3 className="text-2xl font-semibold mb-6 text-slate-800 flex justify-between items-center">
          <span style={{ color: sectionLabelColor }}>Course content</span>
          <div className={`relative ${searchWrapColor}`}>
            <input
                type="text"
                placeholder="Search for a chapter..."
                className={searchInputClass}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </h3>

        {isTeacher && (
            <div className="flex justify-end mb-6 space-x-2">
              <button
                  onClick={handleAddChapter}
                  className="btn-gradient-red flex items-center space-x-2 px-4 py-2 rounded font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#f3f4f6" strokeWidth={3} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add a chapter</span>
              </button>
              <button
                  onClick={handleToggleReordering}
                  className="btn-gradient-blue flex items-center space-x-2 px-4 py-2 rounded font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#f3f4f6" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m-12 6h12m-12 0l4 4m-4-4l4-4" />
                </svg>
                <span>Reorder Chapters</span>
              </button>
            </div>
        )}

        <div className="space-y-4">
          {filteredChapters.length > 0 ? (
              filteredChapters.map((chap) => (
                  <div
                      key={chap.id}
                      className={cardClass}
                  >
                    <div className="flex justify-between items-center">
                      <div className="cursor-pointer flex items-center space-x-3" onClick={() => toggleChapter(chap.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={`w-6 h-6 ${chapterIconClass}`}>
                          <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
                          <line x1="7" y1="9" x2="17" y2="9" />
                          <line x1="7" y1="13" x2="17" y2="13" />
                          <line x1="7" y1="17" x2="13" y2="17" />
                        </svg>

                        {editingChapterId === chap.id ? (
                            <div className="flex flex-col gap-2">
                              <input
                                  name="title"
                                  value={editData.title}
                                  onChange={handleEditChange}
                                  className={inlineInputClass}
                              />
                              <input
                                  name="description"
                                  value={editData.description}
                                  onChange={handleEditChange}
                                  className={inlineInputClass}
                              />
                              <div className="flex space-x-2">
                                <button
                                    onClick={() => handleEditSubmit(chap.id)}
                                    className="btn-gradient-green text-sm px-3 py-1 rounded"
                                >
                                  Save
                                </button>
                                <button
                                    onClick={() => setEditingChapterId(null)}
                                    className="btn-gradient-gray text-sm px-3 py-1 rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                        ) : (
                            <div>
                              <h2 className={chapterTitleClass}>{chap.title}</h2>
                              <p className={chapterDescClass}>{chap.description}</p>
                            </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">

                        {isTeacher && (
                            <div className="flex justify-end">
                              <button
                                  onClick={() => handleToggleContentReordering(chap.id)}
                                  className="btn-gradient-blue flex items-center space-x-2 px-4 py-2 rounded font-semibold"
                              >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="#f3f4f6"
                                    strokeWidth={2}
                                    className="w-5 h-5"
                                >
                                  <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M8 7h12m0 0l-4-4m4 4l-4 4m-12 6h12m-12 0l4 4m-4-4l4-4"
                                  />
                                </svg>
                                <span>Reorder Contents</span>
                              </button>
                            </div>
                        )}

                        <button onClick={() => toggleChapter(chap.id)} aria-label="Toggle chapitre" className={chevronBtnClass}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 transition-transform duration-300 ${expandedChapterId === chap.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {isTeacher && (
                            <>
                              <button onClick={() => handleEditChapter(chap)} title="Edit chapter" aria-label="Modifier" className={iconBtnClass}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                                </svg>
                              </button>
                              <button onClick={() => handleDeleteChapter(chap.id)} title="Delete chapter" aria-label="Supprimer" className={iconBtnClass}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1m-4 0h4" />
                                </svg>
                              </button>
                              <button onClick={() => handleAddContent(chap.id)} title="Add content" aria-label="Ajouter contenu" className={iconBtnClass}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </>
                        )}
                      </div>
                    </div>

                    {expandedChapterId === chap.id && (
                        <div className={expandedTextClass}>

                          {chapterContents[chap.id] && chapterContents[chap.id].length > 0 ? (
                              chapterContents[chap.id].map(content => (
                                  <div key={content.id} className={subCardClass}>
                                    <div className="flex items-center justify-between">

                                      <div className="flex items-center space-x-2">
                                        {!isTeacher && (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill={content.is_viewed ? '#3b82f6' : 'none'}
                                                viewBox="0 0 24 24"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                className="w-6 h-6"
                                            >
                                              <circle cx="12" cy="12" r="10" />
                                            </svg>
                                        )}
                                        <h4 className={contentTitleClass}>{content.title}</h4>
                                      </div>


                                      <div className="flex flex-col items-end space-y-1">
                                        {isTeacher && (
                                            <div className="flex space-x-2">
                                              <button
                                                  onClick={() => handleEditContent(content)}
                                                  title="Edit content"
                                                  className="text-yellow-400 hover:text-yellow-300 text-lg"
                                              >
                                                ✏️
                                              </button>
                                              <button
                                                  onClick={() => handleDeleteContent(chap.id, content.id)}
                                                  title="Delete content"
                                                  className="text-red-500 hover:text-red-400 text-lg"
                                              >
                                                🗑️
                                              </button>
                                              {content.content_kind === 'FILE' && content.file_mime_type?.startsWith('video/') && (
                                                  <>
                                                    <button
                                                        title="Upload subtitle"
                                                        className="text-blue-400 hover:text-blue-300 text-lg"
                                                    >
                                                      <label htmlFor={`subtitle-upload-${content.id}`} style={{ cursor: 'pointer' }}>
                                                        📜
                                                      </label>
                                                      <input
                                                          id={`subtitle-upload-${content.id}`}
                                                          type="file"
                                                          accept=".vtt"
                                                          style={{ display: 'none' }}
                                                          onChange={(e) => handleUploadSubtitle(chap.id, content.id, e.target.files[0])}
                                                      />
                                                    </button>
                                                    {content.subtitle_file && (
                                                        <button
                                                            onClick={() => handleDeleteSubtitle(chap.id, content.id)}
                                                            title="Delete subtitle"
                                                            className="text-red-400 hover:text-red-300 text-lg"
                                                        >
                                                          🗑️
                                                        </button>
                                                    )}
                                                  </>
                                              )}
                                            </div>
                                        )}
                                        <Link
                                            to={`/courses/${courseId}/chapters/${chap.id}/contents/${content.id}`}
                                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                                        >
                                          View More
                                        </Link>
                                      </div>
                                    </div>

                                    {editingContentId === content.id ? (
                                        <div className="space-y-2">
                                          <input
                                              name="title"
                                              value={editContentData.title}
                                              onChange={handleEditContentChange}
                                              className={editInputClass}
                                              placeholder="Title"
                                          />
                                          {editContentData.content_kind === 'TEXT' && (
                                              <div className="max-h-[400px] overflow-y-auto">
                                                <RichTextEditor
                                                    content={editContentData.text}
                                                    onChange={(html) => setEditContentData((prev) => ({ ...prev, text: html }))}
                                                />
                                              </div>
                                          )}
                                          {editContentData.content_kind === 'LINK' && (
                                              <input
                                                  name="url"
                                                  type="url"
                                                  value={editContentData.url}
                                                  onChange={handleEditContentChange}
                                                  className={editInputClass}
                                                  placeholder="URL"
                                              />
                                          )}
                                          {editContentData.content_kind === 'FILE' && (
                                              <input
                                                  name="file"
                                                  type="file"
                                                  onChange={handleEditContentChange}
                                                  className={fileInputClass}
                                              />
                                          )}
                                          <div className="flex space-x-2">
                                            <button
                                                onClick={() => submitEditContent(chap.id, content.id)}
                                                className="btn-gradient-green text-sm px-3 py-1 rounded"
                                            >
                                              Save
                                            </button>
                                            <button
                                                onClick={() => setEditingContentId(null)}
                                                className="btn-gradient-gray text-sm px-3 py-1 rounded"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                    ) : (
                                        <div className="text-base leading-relaxed mt-2">
                                          {(content.content_kind === 'LINK' && content.url) || (content.content_kind === 'FILE' && content.file) ? (
                                              <div className="flex flex-col space-y-2">
                                                {(() => {
                                                  const url =
                                                      content.content_kind === 'LINK'
                                                          ? content.url
                                                          : content.content_kind === 'FILE'
                                                              ? content.file
                                                              : null;

                                                  if (!url) {
                                                    return <p className={noContentClass}>No content available.</p>;
                                                  }

                                                  const lowerUrl = url.toLowerCase();
                                                  const getFileName = (fullUrl) => fullUrl.split('/').pop();
                                                  const isYouTube = lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be');

                                                  const YouTubeIcon = () => (
                                                      <svg
                                                          xmlns="http://www.w3.org/2000/svg"
                                                          fill="red"
                                                          viewBox="0 0 24 24"
                                                          stroke="none"
                                                          className="inline w-6 h-6"
                                                          aria-hidden="true"
                                                      >
                                                        <path d="M23.499 6.203a2.97 2.97 0 00-2.09-2.095C19.706 3.5 12 3.5 12 3.5s-7.706 0-9.41.608a2.97 2.97 0 00-2.09 2.095A31.14 31.14 0 000 12a31.14 31.14 0 00.5 5.797 2.97 2.97 0 002.09 2.095c1.704.608 9.41.608 9.41.608s7.706 0 9.41-.608a2.97 2.97 0 002.09-2.095A31.14 31.14 0 0024 12a31.14 31.14 0 00-.501-5.797zM9.75 15.021V8.979l6 3.02-6 3.022z" />
                                                      </svg>
                                                  );

                                                  const PdfIcon = () => (
                                                      <span
                                                          role="img"
                                                          aria-label="PDF file"
                                                          className="inline text-blue-600 text-lg"
                                                      >
                                      📄
                                    </span>
                                                  );

                                                  const ImageIcon = () => (
                                                      <span
                                                          role="img"
                                                          aria-label="Image file"
                                                          className="inline text-blue-600 text-lg"
                                                      >
                                      🖼️
                                    </span>
                                                  );

                                                  const VideoIcon = () => (
                                                      <span
                                                          role="img"
                                                          aria-label="Video file"
                                                          className="inline text-blue-600 text-lg"
                                                      >
                                      🎥
                                    </span>
                                                  );

                                                  let icon = null;
                                                  let linkComponent = null;
                                                  let preview = null;
                                                  if (isYouTube) {
                                                    icon = <YouTubeIcon />;
                                                    linkComponent = (
                                                        <a
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                          {getFileName(url)}
                                                        </a>
                                                    );
                                                    let embedUrl = url;
                                                    if (url.includes('watch?v=')) {
                                                      embedUrl = url.replace('watch?v=', 'embed/');
                                                    } else if (url.includes('youtu.be/')) {
                                                      embedUrl = url.replace('youtu.be/', 'www.youtube.com/embed/');
                                                    }
                                                    preview = (
                                                        <div className="aspect-w-16 aspect-h-9">
                                                          <iframe
                                                              src={embedUrl}
                                                              title="YouTube video player"
                                                              frameBorder="0"
                                                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                              allowFullScreen
                                                              className="w-full h-64 rounded"
                                                          />
                                                        </div>
                                                    );
                                                  } else if (content.file_kind === "PDF") {
                                                    icon = <PdfIcon />;
                                                    linkComponent = (
                                                        <Link
                                                            to={`/courses/${courseId}/chapters/${chap.id}/contents/${content.id}`}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                          {getFileName(url)}
                                                        </Link>
                                                    );
                                                  } else if (content.file_kind === "IMAGE") {
                                                    icon = <ImageIcon />;
                                                    linkComponent = (
                                                        <Link
                                                            to={`/courses/${courseId}/chapters/${chap.id}/contents/${content.id}`}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                          {getFileName(url)}
                                                        </Link>
                                                    );
                                                    console.log(
                                                        'Image Alt Description for content ' + content.id + ':',
                                                        content.image_alt_text || 'No description'
                                                    );
                                                    preview = (
                                                        <div className="flex justify-center">
                                                          <img
                                                              src={url}
                                                              alt={content.image_alt_text || content.title}
                                                              className="max-w-full h-64 rounded shadow"
                                                          />
                                                        </div>
                                                    );
                                                  } else if (content.file_kind === "VIDEO") {
                                                    icon = <VideoIcon />;
                                                    linkComponent = (
                                                        <Link
                                                            to={`/courses/${courseId}/chapters/${chap.id}/contents/${content.id}`}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                          {getFileName(url)}
                                                        </Link>
                                                    );
                                                  } else {
                                                    icon = <span className="text-blue-600">🔗</span>;
                                                    linkComponent = (
                                                        <a
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                          {getFileName(url)}
                                                        </a>
                                                    );
                                                  }

                                                  return (
                                                      <>
                                                        <div className="flex items-center space-x-1">
                                                          {icon}
                                                          {linkComponent}
                                                        </div>
                                                        {preview}
                                                      </>
                                                  );
                                                })()}
                                              </div>
                                          ) : content.text ? (
                                              <div className="flex flex-col space-y-2 content-detail-rendered">
                                                {parse(
                                                    content.text.length > MAX_LENGTH
                                                        ? htmlToText(content.text, { wordwrap: MAX_LENGTH }).slice(
                                                        0,
                                                        MAX_LENGTH
                                                    ) + "..."
                                                        : content.text
                                                )}
                                              </div>
                                          ) : (
                                              <p className={emptyTextClass}>This folder is empty.</p>
                                          )}
                                        </div>
                                    )}
                                    {subtitleSuccess && (
                                        <Alert color="success" className="mt-2">
                                          {subtitleSuccess}
                                        </Alert>
                                    )}
                                    {subtitleError && (
                                        <Alert color="danger" className="mt-2">
                                          {subtitleError}
                                        </Alert>
                                    )}
                                  </div>
                              ))
                          ) : (
                              <p className={emptyTextClass}>This folder is empty.</p>
                          )}
                        </div>
                    )}
                  </div>
              ))
          ) : (
              <p className={`${noContentClass} italic text-center`}>No chapters available.</p>
          )}
        </div>

        {showPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`${modalBgClass} max-w-md w-full space-y-4`}>
                <h2 className={modalTitleClass}>Add New Chapter</h2>
                <input
                    type="text"
                    placeholder="Chapter Title *"
                    className={modalInputClass}
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Chapter Description *"
                    className={modalInputClass}
                    value={newChapterDescription}
                    onChange={(e) => setNewChapterDescription(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                  <button
                      onClick={() => setShowPopup(false)}
                      className="btn-gradient-gray px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                      onClick={submitNewChapter}
                      className="btn-gradient-green px-4 py-2 rounded"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
        )}

        {showContentPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`${modalBgClass} w-full ${contentType === 'TEXT' ? 'max-w-3xl' : 'max-w-md'} max-h-[80vh] ${contentType === 'TEXT' ? 'overflow-y-auto' : ''} space-y-4`}>
                <h2 className={modalTitleClass}>Add New Content</h2>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { type: 'TEXT', label: 'Text', icon: '📝' },
                    { type: 'LINK', label: 'Link', icon: '🔗' },
                    { type: 'FILE', label: 'File', icon: '📁' },
                    { type: 'QUIZ', label: 'Quiz', icon: '❓' },
                  ].map(({ type, label, icon }) => (
                      <button
                          key={type}
                          onClick={() => setContentType(type)}
                          className={`flex flex-col items-center justify-center py-2 px-1 text-sm font-medium rounded transition text-white ${
                              contentType === type
                                  ? 'btn-gradient-red'
                                  : inactiveTypeBtnClass
                          }`}
                      >
                        <div className="text-2xl">{icon}</div>
                        <div>{label}</div>
                      </button>
                  ))}
                </div>
                <input
                    type="text"
                    placeholder="Title *"
                    className={modalInputClass}
                    value={contentForm.title}
                    onChange={(e) =>
                        setContentForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                />
                {contentType === 'TEXT' && (
                    <div className="max-h-[400px] overflow-y-auto">
                      <RichTextEditor
                          content={contentForm.text}
                          onChange={(html) => setContentForm((prev) => ({ ...prev, text: html }))}
                      />
                    </div>
                )}
                {contentType === 'LINK' && (
                    <input
                        type="url"
                        placeholder="Enter URL"
                        className={modalInputClass}
                        value={contentForm.url}
                        onChange={(e) =>
                            setContentForm((prev) => ({ ...prev, url: e.target.value }))
                        }
                    />
                )}
                {contentType === 'FILE' && (
                    <div>
                      <label className={fileUploadLabelClass}>Upload a file</label>
                      <div className="relative w-full">
                        <input
                            type="file"
                            id="fileUpload"
                            className="absolute left-0 top-0 opacity-0 w-full h-full cursor-pointer"
                            onChange={(e) =>
                                setContentForm((prev) => ({
                                  ...prev,
                                  file: e.target.files[0],
                                }))
                            }
                        />
                        <label
                            htmlFor="fileUpload"
                            className="btn-gradient-red inline-block text-sm px-4 py-2 text-center cursor-pointer"
                        >
                          Choose file
                        </label>
                        {contentForm.file && (
                            <p className={fileSelectedClass}>
                              Selected: {contentForm.file.name}
                            </p>
                        )}
                      </div>
                    </div>
                )}
                {contentType === 'QUIZ' && (
                    <p className={quizTextClass}>Quiz creation coming soon...</p>
                )}
                <div className="flex justify-end space-x-2">
                  <button
                      onClick={() => setShowContentPopup(false)}
                      className="btn-gradient-gray px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                      onClick={submitContent}
                      className="btn-gradient-green px-4 py-2 rounded"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
        )}

        {showReorderPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`${modalBgClass} max-w-md w-full space-y-4`}>
                <h2 className={modalTitleClass}>Reorder Chapters</h2>
                <div className="space-y-2">
                  {reorderedChapters.map((chapter) => (
                      <div
                          key={chapter.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, chapter)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, chapter)}
                          className={dragItemClass}
                      >
                        {chapter.title}
                      </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                      onClick={handleCancelReordering}
                      className="btn-gradient-gray px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                      onClick={handleSaveOrder}
                      className="btn-gradient-green px-4 py-2 rounded"
                  >
                    Save Order
                  </button>
                </div>
              </div>
            </div>
        )}

        {showContentReorderPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`${modalBgClass} max-w-md w-full space-y-4`}>
                <h2 className={modalTitleClass}>Reorder Contents</h2>
                <div className="space-y-2">
                  {reorderedContents.map((content) => (
                      <div
                          key={content.id}
                          draggable
                          onDragStart={(e) => handleContentDragStart(e, content)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleContentDrop(e, content)}
                          className={dragItemClass}
                      >
                        {content.title}
                      </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                      onClick={handleCancelContentReordering}
                      className="btn-gradient-gray px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                      onClick={handleSaveContentOrder}
                      className="btn-gradient-green px-4 py-2 rounded"
                  >
                    Save Order
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default CourseDetails;
