// src/pages/LoginSuccess.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const LoginSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      navigate('/StudydDashboard'); // Ou selon le rôle
    }
  }, [searchParams, navigate]);

  return <div>Connexion réussie, redirection...</div>;
};