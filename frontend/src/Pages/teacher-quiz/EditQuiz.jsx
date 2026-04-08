import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QuizForm from "../../Components/teacherQuiz/QuizForm";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../teacher-quiz/CreateQuiz.css';
import { useTheme } from '../../context/ThemeContect.jsx';

const EditQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState('');
  const [initialQuestions, setInitialQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to edit a quiz');
      navigate('/login');
      return;
    }

    fetch(`http://127.0.0.1:3000/quizzes/${id}/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
        .then(res => res.json())
        .then(data => {
          console.log('Fetched quiz data:', data);
          setQuizTitle(data.title || '');
          setInitialQuestions(data.questions.map((q, index) => ({
            text: q.text || '',
            score: q.points || 0,
            correctAnswers: q.answers.filter(a => a.is_correct).map(a => a.text),
            options: q.answers.map(a => a.text),
            id: q.id || Date.now() + index,
          })));
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching quiz:', error);
          setLoading(false);
        });
  }, [id, navigate]);

  const handleSave = async (quizData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to update a quiz');
      return;
    }

    const formattedQuizData = {
      title: quizData.name,
      description: '',
      time_limit: null,
      is_published: false,
      questions: quizData.questions.map((q) => ({
        text: q.text,
        question_type: 'MCQ',
        points: q.score,
        difficulty_level: 'EASY',
        answers: q.options.map((opt) => ({
          text: opt,
          is_correct: q.correctAnswers.includes(opt),
        })),
      })),
    };

    console.log('Updating quiz:', JSON.stringify(formattedQuizData, null, 2));

    try {
      const response = await fetch(`http://127.0.0.1:3000/quizzes/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formattedQuizData),
      });

      if (response.ok) {
        alert('Quiz updated successfully');
        navigate('/teacherdashboard/quizzes');
      } else {
        const errorData = await response.json();
        console.error('Error updating quiz:', errorData);
        alert('Failed to update quiz: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error while updating quiz');
    }
  };

  if (loading) {
    return (
        <div className={`text-center py-8 ${isDark ? 'text-white' : 'text-gray-700'}`}>
          Loading quiz...
        </div>
    );
  }

  return (
      <div className={`min-h-screen relative overflow-hidden ${isDark ? 'text-gray-200' : 'text-gray-800 light'}`}>
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
          <h1 className={`text-4xl font-bold text-transparent bg-clip-text mb-6 center ${
              isDark
                  ? 'bg-gradient-to-r from-red-400 to-gray-400'
                  : 'bg-gradient-to-r from-red-600 to-gray-700'
          }`}>
            Edit Quiz
          </h1>
          <QuizForm
              name={quizTitle}
              onSave={handleSave}
              initialQuestions={initialQuestions}
          />
        </div>
      </div>
  );
};

export default EditQuiz;