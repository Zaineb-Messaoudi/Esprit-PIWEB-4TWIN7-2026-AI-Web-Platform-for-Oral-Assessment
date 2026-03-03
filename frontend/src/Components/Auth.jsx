import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Phone, GraduationCap, MapPin, CreditCard,
  Eye, EyeOff, Sparkles, ArrowRight, UserPlus, LogIn, School, Users, Facebook
} from 'lucide-react';
import ThemeToggle from "../context/ThemeToggle.jsx";
import { useTheme } from "../context/ThemeContect.jsx";

// --- Garder AnimatedBackground tel quel ---
const AnimatedBackground = () => {
  const blobRefs = useRef([]);
  useEffect(() => {
    const initialPositions = [{ x: -4, y: 0 }, { x: -4, y: 0 }, { x: 20, y: -8 }, { x: 20, y: -8 }];
    let requestId;
    const handleScroll = () => {
      const newScroll = window.pageYOffset;
      blobRefs.current.forEach((blob, index) => {
        if (blob) {
          const initialPos = initialPositions[index];
          const xOffset = Math.sin(newScroll / 100 + index * 0.5) * 340;
          const yOffset = Math.cos(newScroll / 100 + index * 0.5) * 40;
          const x = initialPos.x + xOffset;
          const y = initialPos.y + yOffset;
          blob.style.transform = `translate(${x}px, ${y}px)`;
          blob.style.transition = "transform 1.4s ease-out";
        }
      });
      requestId = requestAnimationFrame(handleScroll);
    };
    window.addEventListener("scroll", handleScroll);
    return () => { window.removeEventListener("scroll", handleScroll); cancelAnimationFrame(requestId); };
  }, []);
  return (
    <div className="fixed inset-0 animated-bg">
      <div className="absolute inset-0">
        <div ref={(ref) => (blobRefs.current[0] = ref)} className="absolute top-0 -left-4 w-96 h-96 bg-red-600 rounded-full filter blur-[128px] opacity-15" />
        <div ref={(ref) => (blobRefs.current[2] = ref)} className="absolute -bottom-8 left-20 w-96 h-96 bg-red-700 rounded-full filter blur-[128px] opacity-15" />
      </div>
    </div>
  );
};

// --- Garder InputField tel quel ---
const InputField = ({ icon: Icon, type, placeholder, value, onChange, required = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type={type === 'password' && showPassword ? 'text' : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full pl-10 pr-12 py-3 rounded-lg backdrop-blur-sm transition-all duration-300 ${isDark ? "bg-gray-800/50 border border-gray-600/50 text-white" : "bg-white/80 border border-gray-300 text-gray-900"}`}
      />
      {type === 'password' && (
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      )}
    </div>
  );
};

// --- 1. SIGN IN COMPONENT (MODIFIÉ) ---
const SignInComponent = ({ onSubmit }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // URL de ton backend NestJS
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Stocker le token JWT
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Envoyer l'utilisateur au parent pour la redirection
      onSubmit(data.user);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <InputField icon={User} type="text" placeholder="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
      <InputField icon={Lock} type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
      <button onClick={handleSubmit} className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg flex items-center justify-center gap-2">
        Sign In <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- 2. SIGN UP COMPONENT (MODIFIÉ) ---
const SignUpComponent = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    username: '', first_name: '', last_name: '', email: '', phone: '', dateOfBirth: '', password: '', role: 'student'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            firstName: formData.first_name, // Mapping pour correspondre au backend
            lastName: formData.last_name
        })
      });

      if (!response.ok) throw new Error('Registration failed');

      alert("Inscription réussie ! Connectez-vous.");
      onSubmit(); // Basculer vers l'écran login
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <InputField icon={User} type="text" placeholder="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
      <div className="grid grid-cols-2 gap-4">
        <InputField icon={User} type="text" placeholder="First Name" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required />
        <InputField icon={User} type="text" placeholder="Last Name" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required />
      </div>
      <InputField icon={Mail} type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
      <InputField icon={Phone} type="text" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
      <InputField icon={MapPin} type="date" placeholder="Birth Date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} required />
      <InputField icon={Lock} type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
      <button onClick={handleSubmit} className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg flex items-center justify-center gap-2">
        Create Account <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- 3. MAIN AUTH PAGE ---
const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleSignInSubmit = (user) => {
    // Redirection selon le rôle défini dans ton backend
    if (user.role === 'admin') navigate('/AdminDashboard');
    else if (user.role === 'instructor') navigate('/teacherdashboard');
    else navigate('/StudydDashboard');
  };

  const handleSocialLogin = (provider) => {
    window.location.href = `http://localhost:3000/auth/${provider}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: theme === "dark" ? "#020617" : "#f1f5f9" }}>
      <AnimatedBackground />
      <div className="z-10 relative w-full max-w-md">
        <div className="text-center mb-8">
            <img className="inline-block px-2" src="src/assets/media/text.png" alt="Hikma Learn" />
        </div>
        <div className={`backdrop-blur-sm rounded-2xl shadow-lg ${theme === "dark" ? "bg-gray-900/60 border border-gray-700/50" : "bg-zinc-50/80 border border-gray-200"}`}>
          <div className={`flex rounded-t-2xl overflow-hidden ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-100"}`}>
            <button onClick={() => setIsSignUp(false)} className={`flex-1 py-4 px-6 ${!isSignUp ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 'text-gray-500'}`}> <LogIn className="w-4 h-4 inline mr-2" /> Sign In </button>
            <button onClick={() => setIsSignUp(true)} className={`flex-1 py-4 px-6 ${isSignUp ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 'text-gray-500'}`}> <UserPlus className="w-4 h-4 inline mr-2" /> Sign Up </button>
          </div>
          <div className="p-8">
            {isSignUp ? <SignUpComponent onSubmit={() => setIsSignUp(false)} /> : <SignInComponent onSubmit={handleSignInSubmit} />}
            
            {/* SEPARATEUR SOCIAL */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-600/30"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="px-2 bg-transparent text-gray-500">Or continue with</span></div>
            </div>

            {/* BOUTONS SOCIAUX */}
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleSocialLogin('google')} className="flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-600/30 hover:bg-gray-500/10 transition-colors">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="google" />
                <span className={theme === "dark" ? "text-white" : "text-gray-700"}>Google</span>
              </button>
              <button onClick={() => handleSocialLogin('facebook')} className="flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-600/30 hover:bg-gray-500/10 transition-colors">
                <Facebook className="w-5 h-5 text-blue-600" />
                <span className={theme === "dark" ? "text-white" : "text-gray-700"}>Facebook</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <ThemeToggle />
    </div>
  );
};
export default AuthPage;