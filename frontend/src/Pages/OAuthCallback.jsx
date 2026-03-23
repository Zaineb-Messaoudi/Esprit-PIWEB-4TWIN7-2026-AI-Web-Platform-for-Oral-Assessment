import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const handled = useRef(false); // ← guard against double run

  useEffect(() => {
    if (handled.current) return; // ← skip second run
    handled.current = true;

    const params  = new URLSearchParams(window.location.search);
    const access  = params.get('access');
    const refresh = params.get('refresh');

    console.log('OAuthCallback hit, params:', { access, refresh });

    if (access && refresh) {
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);

      try {
        const decoded = jwtDecode(access);
        const role = decoded.role;
        localStorage.setItem('userType', role);

        const routes = {
          student:    '/StudydDashboard',
          instructor: '/teacherdashboard',
          admin:      '/AdminDashboard',
        };
        navigate(routes[role] || '/StudydDashboard', { replace: true });
      } catch {
        navigate('/StudydDashboard', { replace: true });
      }
    } else {
      navigate('/auth', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">
      Logging you in...
    </div>
  );
}