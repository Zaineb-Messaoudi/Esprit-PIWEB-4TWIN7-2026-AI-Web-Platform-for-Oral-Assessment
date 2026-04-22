import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    username: '', phone_num: '', password: '', confirm_password: '',
    user_type: 'student', birth_date: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur inscription');

      navigate(`/verify-otp?email=${form.email}&token=${data.otp_token}`);
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
        <h2 className="text-center fw-bold mb-4">Create an account</h2>

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
            <label className="form-label text-white">Email</label>
            <input type="email" className={inputClass}
              placeholder="email@exemple.com"
              value={form.email} onChange={set('email')} required />
          </div>

          <div className="mb-3">
            <label className="form-label text-white">Personal ID (username)</label>
            <input className={inputClass} placeholder="identifiant"
              value={form.username} onChange={set('username')} required minLength={5} />
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

          <div className="mb-3">
            <label className="form-label text-white">Password</label>
            <input type="password" className={inputClass} placeholder="••••••••"
              value={form.password} onChange={set('password')} required minLength={6} />
          </div>

          <div className="mb-4">
            <label className="form-label text-white">Confirm Password</label>
            <input type="password" className={inputClass} placeholder="••••••••"
              value={form.confirm_password} onChange={set('confirm_password')} required />
          </div>

          <button className="btn btn-outline-light w-100 fw-semibold mb-3"
            type="submit" disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm me-2" />}
            Sign up
          </button>

          <div className="text-center text-white-50 mb-2" style={{ fontSize: 13 }}>
            — ou s'inscrire avec —
          </div>

          <a href={`${API}/auth/google`} className="btn w-100 mb-2 fw-semibold"
            style={{ background: '#fff', color: '#444' }}>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg"
              width={20} className="me-2" alt="Google" />
            Continuer avec Google
          </a>

          <a href={`${API}/auth/facebook`} className="btn w-100 fw-semibold"
            style={{ background: '#1877F2', color: '#fff' }}>
            <img src="https://www.svgrepo.com/show/475647/facebook-color.svg"
              width={20} className="me-2" alt="Facebook" />
            Continuer avec Facebook
          </a>
        </form>
      </div>
    </div>
  );
}