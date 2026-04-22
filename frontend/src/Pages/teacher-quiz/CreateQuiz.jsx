import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizForm from "../../Components/teacherQuiz/QuizForm";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../teacher-quiz/CreateQuiz.css';
import { useTheme } from '../../context/ThemeContect.jsx';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState('New Quiz');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleSave = async (quizData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to create a quiz');
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
        answers: q.options.map((opt, index) => ({
          text: opt,
          is_correct: q.correctAnswers.includes(opt),
        })),
      })),
    };

    console.log('Sending quiz data:', JSON.stringify(formattedQuizData, null, 2));

    try {
      const response = await fetch('http://localhost:3000/quizzes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formattedQuizData),
      });

      if (response.ok) {
        console.log('Quiz created successfully');
        navigate('/teacherdashboard/quizzes');
      } else {
        const errorData = await response.json();
        console.error('Error creating quiz:', errorData);
        alert('Failed to create quiz: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error while creating quiz');
    }
  };

  return (
      <div className={`min-h-screen relative overflow-hidden ${isDark ? 'text-gray-200' : 'text-gray-800 light'}`}>
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
          <h1 className={`text-4xl font-bold text-transparent bg-clip-text mb-6 center ${
              isDark
                  ? 'bg-gradient-to-r from-red-400 to-gray-400'
                  : 'bg-gradient-to-r from-red-600 to-gray-700'
          }`}>
            Create Quiz
          </h1>
          <QuizForm quizTitle={quizTitle} onSave={handleSave} />
        </div>
      </div>
  );
};

export default CreateQuiz;