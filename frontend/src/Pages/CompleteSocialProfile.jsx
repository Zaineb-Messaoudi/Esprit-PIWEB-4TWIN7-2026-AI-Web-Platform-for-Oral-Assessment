// src/pages/CompleteSocialProfile.jsx
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const CompleteSocialProfile = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const socialData = JSON.parse(decodeURIComponent(searchParams.get('data')));

  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const handleSubmit = async () => {
    const response = await fetch('http://localhost:3000/auth/social-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...socialData, // email, firstName, lastName, socialId, provider
        phone,
        dateOfBirth: birthDate,
      })
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.access_token);
      navigate('/StudydDashboard');
    }
  };

  return (
    <div className="p-10 text-white bg-slate-900 min-h-screen">
      <h1>Presque fini !</h1>
      <p>Bienvenue {socialData.firstName}, complétez votre profil :</p>
      <input type="text" placeholder="Téléphone" onChange={e => setPhone(e.target.value)} className="block mb-4 p-2 text-black"/>
      <input type="date" onChange={e => setBirthDate(e.target.value)} className="block mb-4 p-2 text-black"/>
      <button onClick={handleSubmit} className="bg-red-600 px-4 py-2 rounded">Finaliser l'inscription</button>
    </div>
  );
};