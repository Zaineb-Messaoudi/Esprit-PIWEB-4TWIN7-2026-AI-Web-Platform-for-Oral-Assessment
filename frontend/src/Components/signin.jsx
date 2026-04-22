import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export default function Sign() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur de connexion');

      login(data.access, data.refresh);
      navigate(data.user_type === 'instructor' ? '/teacher' : '/study');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100"
      style={{ background: 'linear-gradient(135deg, #7e0c0c, #5a5a5a, #ffffff)' }}>
      <div className="p-5 rounded-4 shadow-lg text-white"
        style={{
          width: '100%', maxWidth: '400px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
        <h2 className="text-center fw-bold mb-4">Welcome Back</h2>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-white">Personal ID</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-white text-white">
                <i className="bi bi-person"></i>
              </span>
              <input
                className="form-control bg-transparent border-white text-white"
                placeholder="Enter your ID"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label text-white">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-white text-white">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type="password"
                className="form-control bg-transparent border-white text-white"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button className="btn btn-outline-light w-100 fw-semibold mb-3"
            type="submit" disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm me-2" />}
            Login
          </button>

          <div className="text-center text-white-50 mb-2" style={{ fontSize: 13 }}>
            — ou continuer avec —
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