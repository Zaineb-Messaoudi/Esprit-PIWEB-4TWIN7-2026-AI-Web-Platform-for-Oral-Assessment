import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const access = params.get('access');
    const refresh = params.get('refresh');
    const profileIncomplete = params.get('profile_incomplete');

    if (access && refresh) {
      login(access, refresh);
      if (profileIncomplete === 'true') {
        navigate('/complete-profile');
      } else {
        navigate('/study');
      }
    } else {
      navigate('/auth');
    }
  }, []);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100"
      style={{ background: 'linear-gradient(135deg, #7e0c0c, #5a5a5a, #ffffff)' }}>
      <div className="text-white text-center">
        <div className="spinner-border mb-3" role="status" />
        <p>Connexion en cours...</p>
      </div>
    </div>
  );
}