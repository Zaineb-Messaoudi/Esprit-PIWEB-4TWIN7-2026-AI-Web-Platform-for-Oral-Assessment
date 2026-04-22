import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { accessToken, login } = useAuth();
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone_num: '',
    birth_date: '', user_type: 'student', cin: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Envoi:', form);        // ← ici
    console.log('Token:', accessToken);

      const payload = {
    first_name: form.first_name,
    last_name: form.last_name,
    phone_num: form.phone_num,
    birth_date: form.birth_date,
    user_type: form.user_type,
    ...(form.cin ? { cin: form.cin } : {}),
  };

    try {
      const res = await fetch(`${API}/api/complete-profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur');

      // Met à jour les tokens avec le nouveau rôle/username
      login(data.access, data.refresh);
      navigate(data.user_type === 'instructor' ? '/teacherdashboard' : '/StudydDashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "form-control bg-transparent border-white text-white";

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 py-4"
      style={{ background: 'linear-gradient(135deg, #7e0c0c, #5a5a5a, #ffffff)' }}>
      <div className="p-5 rounded-4 shadow-lg text-white"
        style={{
          width: '100%', maxWidth: '420px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
        <h2 className="text-center fw-bold mb-2">Complete your profile</h2>
        <p className="text-center text-white-50 mb-4" style={{ fontSize: 13 }}>
          Quelques infos supplémentaires pour finaliser ton compte
        </p>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col">
              <label className="form-label text-white">First Name</label>
              <input className={inputClass} placeholder="Prénom"
                value={form.first_name} onChange={set('first_name')} required minLength={2} />
            </div>
            <div className="col">
              <label className="form-label text-white">Last Name</label>
              <input className={inputClass} placeholder="Nom"
                value={form.last_name} onChange={set('last_name')} required minLength={2} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-white">Phone</label>
            <input type="tel" className={inputClass} placeholder="+216..."
              value={form.phone_num} onChange={set('phone_num')} required />
          </div>

          <div className="mb-3">
            <label className="form-label text-white">Date of birth</label>
            <input type="date" className={inputClass}
              value={form.birth_date} onChange={set('birth_date')} required />
          </div>

          <div className="mb-3">
            <label className="form-label text-white">Role</label>
            <select className={inputClass} value={form.user_type} onChange={set('user_type')}>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label text-white">CIN (optionnel)</label>
            <input className={inputClass} placeholder="ex: 12345678"
              value={form.cin} onChange={set('cin')} />
          </div>

          <button className="btn btn-outline-light w-100 fw-semibold"
            type="submit" disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm me-2" />}
            Finaliser mon profil
          </button>
        </form>
      </div>
    </div>
  );
}