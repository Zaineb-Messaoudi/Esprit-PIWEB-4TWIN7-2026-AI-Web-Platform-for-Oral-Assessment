import React from 'react';
import '../teacherQuiz/QuestionForm.css';
import { useTheme } from '../../context/ThemeContect.jsx';

const QuestionForm = ({ question, questions, setQuestions, onDelete }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const updateQuestion = (field, value) => {
    setQuestions(questions.map(q =>
        q.id === question.id ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (optIndex, value) => {
    setQuestions(questions.map(q =>
        q.id === question.id ? {
          ...q,
          options: q.options.map((opt, i) => i === optIndex ? value : opt)
        } : q
    ));
  };

  const deleteOption = (optIndex) => {
    const optionToDelete = question.options[optIndex];
    setQuestions(questions.map(q =>
        q.id === question.id ? {
          ...q,
          options: q.options.filter((_, i) => i !== optIndex),
          correctAnswers: q.correctAnswers.filter(ans => ans !== optionToDelete)
        } : q
    ));
  };

  const addOption = () => {
    setQuestions(questions.map(q =>
        q.id === question.id ? {
          ...q,
          options: [...q.options, '']
        } : q
    ));
  };

  const toggleCorrectAnswer = (optIndex) => {
    const option = question.options[optIndex];
    const currentQuestion = { ...question };
    const newCorrectAnswers = [...currentQuestion.correctAnswers];
    if (newCorrectAnswers.includes(option)) {
      newCorrectAnswers.splice(newCorrectAnswers.indexOf(option), 1);
    } else {
      newCorrectAnswers.push(option);
    }
    updateQuestion('correctAnswers', newCorrectAnswers);
  };

  const updateScore = (value) => {
    updateQuestion('score', parseInt(value) || 0);
  };

  const inputClass = isDark
      ? 'bg-gray-700 text-white border-none'
      : 'bg-gray-100 text-gray-900 border border-gray-300';

  return (
      <div className={`question-card ${isDark ? '' : 'question-card-light'}`}>
        <div className="question-header">
          <input
              id={`question-text-${question.id}`}
              type="text"
              value={question.text}
              onChange={(e) => updateQuestion('text', e.target.value)}
              placeholder="Enter question"
              className={`flex-grow p-2 rounded-lg-input ${inputClass}`}
          />
          <div className="score-container">
            <label
                htmlFor={`question-score-${question.id}`}
                className={isDark ? 'text-gray-300' : 'text-gray-700'}
            >
              Score:
            </label>
            <input
                id={`question-score-${question.id}`}
                type="number"
                value={question.score}
                onChange={(e) => updateScore(e.target.value)}
                className={`w-16 p-[0.4rem] rounded-lg ${inputClass}`}
                min="0"
            />
          </div>
        </div>

        {question.options.map((opt, index) => (
            <div key={index} className="option-row">
              <button
                  onClick={() => deleteOption(index)}
                  className="option-delete"
              >
                ❌
              </button>
              <input
                  id={`option-${question.id}-${index}`}
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className={`flex-grow p-2 rounded-lg mr-2 ${inputClass}`}
              />
              <input
                  id={`correct-${question.id}-opt-${index}`}
                  type="checkbox"
                  checked={question.correctAnswers.includes(opt)}
                  onChange={() => toggleCorrectAnswer(index)}
                  className="checkbox"
              />
            </div>
        ))}

        <div className="button-row">
          <button onClick={addOption} className="icon-button add">
            ➕
          </button>
          <button onClick={onDelete} className="icon-button delete">
            🗑️
          </button>
        </div>
      </div>
  );
};

export default QuestionForm;