import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // ← NEW: added useSearchParams
import {
  User, Mail, Lock, Phone, MapPin, CreditCard,
  Eye, EyeOff, ArrowRight, UserPlus, LogIn, Users, AlertCircle, KeyRound, ShieldCheck,
  ScanFace,
} from 'lucide-react';
import ThemeToggle from "../context/ThemeToggle.jsx";
import { useTheme } from "../context/ThemeContect.jsx";
import FaceCapture from "./FaceCapture.jsx";
import FaceLoginModal from "./FaceLoginModal.jsx";


// ─── Password Strength ───────────────────────────────────────────────────────
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '', checks: {} };

  const checks = {
    length:     password.length >= 8,
    longLength: password.length >= 12,
    lowercase:  /[a-z]/.test(password),
    uppercase:  /[A-Z]/.test(password),
    number:     /[0-9]/.test(password),
    symbol:     /[^a-zA-Z0-9]/.test(password),
  };

  let score = 0;
  if (checks.length)     score++;
  if (checks.longLength) score++;
  if (checks.lowercase)  score++;
  if (checks.uppercase)  score++;
  if (checks.number)     score++;
  if (checks.symbol)     score++;

  const level = score <= 1 ? 0 : score <= 2 ? 1 : score <= 3 ? 2 : score <= 4 ? 3 : 4;

  const levels = [
    { label: 'Weak',        color: 'bg-red-500'    },
    { label: 'Fair',        color: 'bg-orange-400' },
    { label: 'Good',        color: 'bg-yellow-400' },
    { label: 'Strong',      color: 'bg-lime-500'   },
    { label: 'Very Strong', color: 'bg-green-500'  },
  ];

  return { score: level, label: levels[level].label, color: levels[level].color, checks };
};

const PasswordStrength = ({ password }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { score, label, color, checks } = getPasswordStrength(password);

  if (!password) return null;

  const hints = [
    { met: checks.length,    text: '8+ characters'     },
    { met: checks.uppercase, text: 'Uppercase letter'  },
    { met: checks.lowercase, text: 'Lowercase letter'  },
    { met: checks.number,    text: 'Number'            },
    { met: checks.symbol,    text: 'Special character' },
  ];

  const labelColor =
    score === 0 ? 'text-red-500'
    : score === 1 ? 'text-orange-400'
    : score === 2 ? 'text-yellow-400'
    : score === 3 ? 'text-lime-500'
    : 'text-green-500';

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-1.5">
        <div className="flex gap-1 flex-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= score ? color : isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium w-20 text-right transition-colors duration-300 ${labelColor}`}>
          {label}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {hints.map(({ met, text }) => (
          <span
            key={text}
            className={`text-xs transition-colors duration-200 ${
              met ? 'text-green-500' : isDark ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            {met ? '✓' : '○'} {text}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── Animated Background ────────────────────────────────────────────────────
const AnimatedBackground = () => {
  const blobRefs = useRef([]);

  useEffect(() => {
    const initialPositions = [
      { x: -4, y: 0 },
      { x: -4, y: 0 },
      { x: 20, y: -8 },
      { x: 20, y: -8 },
    ];
    let requestId;

    const handleScroll = () => {
      const newScroll = window.pageYOffset;
      blobRefs.current.forEach((blob, index) => {
        if (blob) {
          const initialPos = initialPositions[index];
          const xOffset = Math.sin(newScroll / 100 + index * 0.5) * 340;
          const yOffset = Math.cos(newScroll / 100 + index * 0.5) * 40;
          blob.style.transform = `translate(${initialPos.x + xOffset}px, ${initialPos.y + yOffset}px)`;
          blob.style.transition = "transform 1.4s ease-out";
        }
      });
      requestId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(requestId);
    };
  }, []);

  return (
    <div className="fixed inset-0 animated-bg">
      <div className="absolute inset-0">
        <div
          ref={(ref) => (blobRefs.current[0] = ref)}
          className="absolute top-0 -left-4 md:w-96 md:h-96 w-72 h-72 bg-red-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 md:opacity-15"
        />
        <div
          ref={(ref) => (blobRefs.current[1] = ref)}
          className="absolute top-0 -right-4 w-96 h-96 bg-rose-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 md:opacity-15 hidden sm:block"
        />
        <div
          ref={(ref) => (blobRefs.current[2] = ref)}
          className="absolute -bottom-8 left-[-40%] md:left-20 w-96 h-96 bg-red-700 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 md:opacity-15"
        />
        <div
          ref={(ref) => (blobRefs.current[3] = ref)}
          className="absolute -bottom-10 right-20 w-96 h-96 bg-gray-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 md:opacity-10 hidden sm:block"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-[size:24px_24px]" />
    </div>
  );
};

// ─── Field Error ─────────────────────────────────────────────────────────────
const FieldError = ({ message }) => {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
      <p className="text-xs text-red-400">{message}</p>
    </div>
  );
};

// ─── Input Field ────────────────────────────────────────────────────────────
const InputField = ({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  required = false,
  options = null,
  error = null,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused]       = useState(false);
  const { theme } = useTheme();
  const isDark   = theme === "dark";
  const hasError = !!error;

  const baseSelect = `w-full pl-10 pr-4 py-3 rounded-lg backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 ${
    hasError
      ? isDark
        ? "bg-gray-800/50 border border-red-500/70 text-white focus:ring-red-500/50"
        : "bg-white/80 border border-red-400 text-gray-900 focus:ring-red-500/40"
      : isDark
        ? "bg-gray-800/50 border border-gray-600/50 text-white focus:ring-red-500/50 focus:border-red-500/50 hover:border-red-400/30"
        : "bg-white/80 border border-gray-300 text-gray-900 focus:ring-red-500/40 focus:border-red-500/40 hover:border-red-400/40"
  }`;

  const baseInput = `w-full pl-10 pr-12 py-3 rounded-lg backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 ${
    hasError
      ? isDark
        ? "bg-gray-800/50 border border-red-500/70 text-white placeholder-gray-400 focus:ring-red-500/50"
        : "bg-white/80 border border-red-400 text-gray-900 placeholder-gray-500 focus:ring-red-500/40"
      : isDark
        ? "bg-gray-800/50 border border-gray-600/50 text-white placeholder-gray-400 hover:border-red-400/30 focus:ring-red-500/50 focus:border-red-500/50"
        : "bg-white/80 border border-gray-300 text-gray-900 placeholder-gray-500 hover:border-red-400/40 focus:ring-red-500/40 focus:border-red-500/40"
  }`;

  const focusRing = `absolute inset-0 rounded-lg border-2 transition-all duration-300 pointer-events-none ${
    isFocused ? 'border-red-400/50 shadow-lg shadow-red-500/20' : 'border-transparent'
  }`;

  if (options) {
    return (
      <div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-red-400 transition-colors duration-300" />
          </div>
          <select
            value={value}
            onChange={onChange}
            required={required}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={baseSelect}
          >
            <option value="" disabled className={isDark ? "bg-gray-800 text-gray-400" : "bg-white text-gray-400"}>
              {placeholder}
            </option>
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className={isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}
              >
                {opt.label}
              </option>
            ))}
          </select>
          <div className={focusRing} />
        </div>
        <FieldError message={error} />
      </div>
    );
  }

  return (
    <div>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-red-400 transition-colors duration-300" />
        </div>
        <input
          type={type === 'password' && showPassword ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={baseInput}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-400 transition-colors duration-300"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
        <div className={focusRing} />
      </div>
      <FieldError message={error} />
    </div>
  );
};


// ─── Country Data ─────────────────────────────────────────────────────────────
const COUNTRIES = [
  { code: 'TN', name: 'Tunisia',                    dial: '+216', flag: '🇹🇳' },
  { code: 'AF', name: 'Afghanistan',                dial: '+93',  flag: '🇦🇫' },
  { code: 'AL', name: 'Albania',                    dial: '+355', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria',                    dial: '+213', flag: '🇩🇿' },
  { code: 'AD', name: 'Andorra',                    dial: '+376', flag: '🇦🇩' },
  { code: 'AO', name: 'Angola',                     dial: '+244', flag: '🇦🇴' },
  { code: 'AG', name: 'Antigua and Barbuda',        dial: '+1268',flag: '🇦🇬' },
  { code: 'AR', name: 'Argentina',                  dial: '+54',  flag: '🇦🇷' },
  { code: 'AM', name: 'Armenia',                    dial: '+374', flag: '🇦🇲' },
  { code: 'AU', name: 'Australia',                  dial: '+61',  flag: '🇦🇺' },
  { code: 'AT', name: 'Austria',                    dial: '+43',  flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaijan',                 dial: '+994', flag: '🇦🇿' },
  { code: 'BS', name: 'Bahamas',                    dial: '+1242',flag: '🇧🇸' },
  { code: 'BH', name: 'Bahrain',                    dial: '+973', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh',                 dial: '+880', flag: '🇧🇩' },
  { code: 'BB', name: 'Barbados',                   dial: '+1246',flag: '🇧🇧' },
  { code: 'BY', name: 'Belarus',                    dial: '+375', flag: '🇧🇾' },
  { code: 'BE', name: 'Belgium',                    dial: '+32',  flag: '🇧🇪' },
  { code: 'BZ', name: 'Belize',                     dial: '+501', flag: '🇧🇿' },
  { code: 'BJ', name: 'Benin',                      dial: '+229', flag: '🇧🇯' },
  { code: 'BT', name: 'Bhutan',                     dial: '+975', flag: '🇧🇹' },
  { code: 'BO', name: 'Bolivia',                    dial: '+591', flag: '🇧🇴' },
  { code: 'BA', name: 'Bosnia and Herzegovina',     dial: '+387', flag: '🇧🇦' },
  { code: 'BW', name: 'Botswana',                   dial: '+267', flag: '🇧🇼' },
  { code: 'BR', name: 'Brazil',                     dial: '+55',  flag: '🇧🇷' },
  { code: 'BN', name: 'Brunei',                     dial: '+673', flag: '🇧🇳' },
  { code: 'BG', name: 'Bulgaria',                   dial: '+359', flag: '🇧🇬' },
  { code: 'BF', name: 'Burkina Faso',               dial: '+226', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi',                    dial: '+257', flag: '🇧🇮' },
  { code: 'CV', name: 'Cabo Verde',                 dial: '+238', flag: '🇨🇻' },
  { code: 'KH', name: 'Cambodia',                   dial: '+855', flag: '🇰🇭' },
  { code: 'CM', name: 'Cameroon',                   dial: '+237', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada',                     dial: '+1',   flag: '🇨🇦' },
  { code: 'CF', name: 'Central African Republic',   dial: '+236', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad',                       dial: '+235', flag: '🇹🇩' },
  { code: 'CL', name: 'Chile',                      dial: '+56',  flag: '🇨🇱' },
  { code: 'CN', name: 'China',                      dial: '+86',  flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia',                   dial: '+57',  flag: '🇨🇴' },
  { code: 'KM', name: 'Comoros',                    dial: '+269', flag: '🇰🇲' },
  { code: 'CG', name: 'Congo',                      dial: '+242', flag: '🇨🇬' },
  { code: 'CD', name: 'Congo (DRC)',                dial: '+243', flag: '🇨🇩' },
  { code: 'CR', name: 'Costa Rica',                 dial: '+506', flag: '🇨🇷' },
  { code: 'HR', name: 'Croatia',                    dial: '+385', flag: '🇭🇷' },
  { code: 'CU', name: 'Cuba',                       dial: '+53',  flag: '🇨🇺' },
  { code: 'CY', name: 'Cyprus',                     dial: '+357', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic',             dial: '+420', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark',                    dial: '+45',  flag: '🇩🇰' },
  { code: 'DJ', name: 'Djibouti',                   dial: '+253', flag: '🇩🇯' },
  { code: 'DM', name: 'Dominica',                   dial: '+1767',flag: '🇩🇲' },
  { code: 'DO', name: 'Dominican Republic',         dial: '+1809',flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador',                    dial: '+593', flag: '🇪🇨' },
  { code: 'EG', name: 'Egypt',                      dial: '+20',  flag: '🇪🇬' },
  { code: 'SV', name: 'El Salvador',                dial: '+503', flag: '🇸🇻' },
  { code: 'GQ', name: 'Equatorial Guinea',          dial: '+240', flag: '🇬🇶' },
  { code: 'ER', name: 'Eritrea',                    dial: '+291', flag: '🇪🇷' },
  { code: 'EE', name: 'Estonia',                    dial: '+372', flag: '🇪🇪' },
  { code: 'SZ', name: 'Eswatini',                   dial: '+268', flag: '🇸🇿' },
  { code: 'ET', name: 'Ethiopia',                   dial: '+251', flag: '🇪🇹' },
  { code: 'FJ', name: 'Fiji',                       dial: '+679', flag: '🇫🇯' },
  { code: 'FI', name: 'Finland',                    dial: '+358', flag: '🇫🇮' },
  { code: 'FR', name: 'France',                     dial: '+33',  flag: '🇫🇷' },
  { code: 'GA', name: 'Gabon',                      dial: '+241', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia',                     dial: '+220', flag: '🇬🇲' },
  { code: 'GE', name: 'Georgia',                    dial: '+995', flag: '🇬🇪' },
  { code: 'DE', name: 'Germany',                    dial: '+49',  flag: '🇩🇪' },
  { code: 'GH', name: 'Ghana',                      dial: '+233', flag: '🇬🇭' },
  { code: 'GR', name: 'Greece',                     dial: '+30',  flag: '🇬🇷' },
  { code: 'GD', name: 'Grenada',                    dial: '+1473',flag: '🇬🇩' },
  { code: 'GT', name: 'Guatemala',                  dial: '+502', flag: '🇬🇹' },
  { code: 'GN', name: 'Guinea',                     dial: '+224', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinea-Bissau',              dial: '+245', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana',                     dial: '+592', flag: '🇬🇾' },
  { code: 'HT', name: 'Haiti',                      dial: '+509', flag: '🇭🇹' },
  { code: 'HN', name: 'Honduras',                   dial: '+504', flag: '🇭🇳' },
  { code: 'HU', name: 'Hungary',                    dial: '+36',  flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland',                    dial: '+354', flag: '🇮🇸' },
  { code: 'IN', name: 'India',                      dial: '+91',  flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia',                  dial: '+62',  flag: '🇮🇩' },
  { code: 'IR', name: 'Iran',                       dial: '+98',  flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq',                       dial: '+964', flag: '🇮🇶' },
  { code: 'IE', name: 'Ireland',                    dial: '+353', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel',                     dial: '+972', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy',                      dial: '+39',  flag: '🇮🇹' },
  { code: 'CI', name: 'Ivory Coast',                dial: '+225', flag: '🇨🇮' },
  { code: 'JM', name: 'Jamaica',                    dial: '+1876',flag: '🇯🇲' },
  { code: 'JP', name: 'Japan',                      dial: '+81',  flag: '🇯🇵' },
  { code: 'JO', name: 'Jordan',                     dial: '+962', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan',                 dial: '+7',   flag: '🇰🇿' },
  { code: 'KE', name: 'Kenya',                      dial: '+254', flag: '🇰🇪' },
  { code: 'KI', name: 'Kiribati',                   dial: '+686', flag: '🇰🇮' },
  { code: 'KP', name: 'North Korea',                dial: '+850', flag: '🇰🇵' },
  { code: 'KR', name: 'South Korea',                dial: '+82',  flag: '🇰🇷' },
  { code: 'KW', name: 'Kuwait',                     dial: '+965', flag: '🇰🇼' },
  { code: 'KG', name: 'Kyrgyzstan',                 dial: '+996', flag: '🇰🇬' },
  { code: 'LA', name: 'Laos',                       dial: '+856', flag: '🇱🇦' },
  { code: 'LV', name: 'Latvia',                     dial: '+371', flag: '🇱🇻' },
  { code: 'LB', name: 'Lebanon',                    dial: '+961', flag: '🇱🇧' },
  { code: 'LS', name: 'Lesotho',                    dial: '+266', flag: '🇱🇸' },
  { code: 'LR', name: 'Liberia',                    dial: '+231', flag: '🇱🇷' },
  { code: 'LY', name: 'Libya',                      dial: '+218', flag: '🇱🇾' },
  { code: 'LI', name: 'Liechtenstein',              dial: '+423', flag: '🇱🇮' },
  { code: 'LT', name: 'Lithuania',                  dial: '+370', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg',                 dial: '+352', flag: '🇱🇺' },
  { code: 'MG', name: 'Madagascar',                 dial: '+261', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi',                     dial: '+265', flag: '🇲🇼' },
  { code: 'MY', name: 'Malaysia',                   dial: '+60',  flag: '🇲🇾' },
  { code: 'MV', name: 'Maldives',                   dial: '+960', flag: '🇲🇻' },
  { code: 'ML', name: 'Mali',                       dial: '+223', flag: '🇲🇱' },
  { code: 'MT', name: 'Malta',                      dial: '+356', flag: '🇲🇹' },
  { code: 'MH', name: 'Marshall Islands',           dial: '+692', flag: '🇲🇭' },
  { code: 'MR', name: 'Mauritania',                 dial: '+222', flag: '🇲🇷' },
  { code: 'MU', name: 'Mauritius',                  dial: '+230', flag: '🇲🇺' },
  { code: 'MX', name: 'Mexico',                     dial: '+52',  flag: '🇲🇽' },
  { code: 'FM', name: 'Micronesia',                 dial: '+691', flag: '🇫🇲' },
  { code: 'MD', name: 'Moldova',                    dial: '+373', flag: '🇲🇩' },
  { code: 'MC', name: 'Monaco',                     dial: '+377', flag: '🇲🇨' },
  { code: 'MN', name: 'Mongolia',                   dial: '+976', flag: '🇲🇳' },
  { code: 'ME', name: 'Montenegro',                 dial: '+382', flag: '🇲🇪' },
  { code: 'MA', name: 'Morocco',                    dial: '+212', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique',                 dial: '+258', flag: '🇲🇿' },
  { code: 'MM', name: 'Myanmar',                    dial: '+95',  flag: '🇲🇲' },
  { code: 'NA', name: 'Namibia',                    dial: '+264', flag: '🇳🇦' },
  { code: 'NR', name: 'Nauru',                      dial: '+674', flag: '🇳🇷' },
  { code: 'NP', name: 'Nepal',                      dial: '+977', flag: '🇳🇵' },
  { code: 'NL', name: 'Netherlands',                dial: '+31',  flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand',                dial: '+64',  flag: '🇳🇿' },
  { code: 'NI', name: 'Nicaragua',                  dial: '+505', flag: '🇳🇮' },
  { code: 'NE', name: 'Niger',                      dial: '+227', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria',                    dial: '+234', flag: '🇳🇬' },
  { code: 'MK', name: 'North Macedonia',            dial: '+389', flag: '🇲🇰' },
  { code: 'NO', name: 'Norway',                     dial: '+47',  flag: '🇳🇴' },
  { code: 'OM', name: 'Oman',                       dial: '+968', flag: '🇴🇲' },
  { code: 'PK', name: 'Pakistan',                   dial: '+92',  flag: '🇵🇰' },
  { code: 'PW', name: 'Palau',                      dial: '+680', flag: '🇵🇼' },
  { code: 'PA', name: 'Panama',                     dial: '+507', flag: '🇵🇦' },
  { code: 'PG', name: 'Papua New Guinea',           dial: '+675', flag: '🇵🇬' },
  { code: 'PY', name: 'Paraguay',                   dial: '+595', flag: '🇵🇾' },
  { code: 'PE', name: 'Peru',                       dial: '+51',  flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines',                dial: '+63',  flag: '🇵🇭' },
  { code: 'PL', name: 'Poland',                     dial: '+48',  flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal',                   dial: '+351', flag: '🇵🇹' },
  { code: 'QA', name: 'Qatar',                      dial: '+974', flag: '🇶🇦' },
  { code: 'RO', name: 'Romania',                    dial: '+40',  flag: '🇷🇴' },
  { code: 'RU', name: 'Russia',                     dial: '+7',   flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda',                     dial: '+250', flag: '🇷🇼' },
  { code: 'KN', name: 'Saint Kitts and Nevis',      dial: '+1869',flag: '🇰🇳' },
  { code: 'LC', name: 'Saint Lucia',                dial: '+1758',flag: '🇱🇨' },
  { code: 'VC', name: 'Saint Vincent',              dial: '+1784',flag: '🇻🇨' },
  { code: 'WS', name: 'Samoa',                      dial: '+685', flag: '🇼🇸' },
  { code: 'SM', name: 'San Marino',                 dial: '+378', flag: '🇸🇲' },
  { code: 'ST', name: 'Sao Tome and Principe',      dial: '+239', flag: '🇸🇹' },
  { code: 'SA', name: 'Saudi Arabia',               dial: '+966', flag: '🇸🇦' },
  { code: 'SN', name: 'Senegal',                    dial: '+221', flag: '🇸🇳' },
  { code: 'RS', name: 'Serbia',                     dial: '+381', flag: '🇷🇸' },
  { code: 'SC', name: 'Seychelles',                 dial: '+248', flag: '🇸🇨' },
  { code: 'SL', name: 'Sierra Leone',               dial: '+232', flag: '🇸🇱' },
  { code: 'SG', name: 'Singapore',                  dial: '+65',  flag: '🇸🇬' },
  { code: 'SK', name: 'Slovakia',                   dial: '+421', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia',                   dial: '+386', flag: '🇸🇮' },
  { code: 'SB', name: 'Solomon Islands',            dial: '+677', flag: '🇸🇧' },
  { code: 'SO', name: 'Somalia',                    dial: '+252', flag: '🇸🇴' },
  { code: 'ZA', name: 'South Africa',               dial: '+27',  flag: '🇿🇦' },
  { code: 'SS', name: 'South Sudan',                dial: '+211', flag: '🇸🇸' },
  { code: 'ES', name: 'Spain',                      dial: '+34',  flag: '🇪🇸' },
  { code: 'LK', name: 'Sri Lanka',                  dial: '+94',  flag: '🇱🇰' },
  { code: 'SD', name: 'Sudan',                      dial: '+249', flag: '🇸🇩' },
  { code: 'SR', name: 'Suriname',                   dial: '+597', flag: '🇸🇷' },
  { code: 'SE', name: 'Sweden',                     dial: '+46',  flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland',                dial: '+41',  flag: '🇨🇭' },
  { code: 'SY', name: 'Syria',                      dial: '+963', flag: '🇸🇾' },
  { code: 'TW', name: 'Taiwan',                     dial: '+886', flag: '🇹🇼' },
  { code: 'TJ', name: 'Tajikistan',                 dial: '+992', flag: '🇹🇯' },
  { code: 'TZ', name: 'Tanzania',                   dial: '+255', flag: '🇹🇿' },
  { code: 'TH', name: 'Thailand',                   dial: '+66',  flag: '🇹🇭' },
  { code: 'TL', name: 'Timor-Leste',                dial: '+670', flag: '🇹🇱' },
  { code: 'TG', name: 'Togo',                       dial: '+228', flag: '🇹🇬' },
  { code: 'TO', name: 'Tonga',                      dial: '+676', flag: '🇹🇴' },
  { code: 'TT', name: 'Trinidad and Tobago',        dial: '+1868',flag: '🇹🇹' },
  { code: 'TR', name: 'Turkey',                     dial: '+90',  flag: '🇹🇷' },
  { code: 'TM', name: 'Turkmenistan',               dial: '+993', flag: '🇹🇲' },
  { code: 'TV', name: 'Tuvalu',                     dial: '+688', flag: '🇹🇻' },
  { code: 'UG', name: 'Uganda',                     dial: '+256', flag: '🇺🇬' },
  { code: 'UA', name: 'Ukraine',                    dial: '+380', flag: '🇺🇦' },
  { code: 'AE', name: 'United Arab Emirates',       dial: '+971', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom',             dial: '+44',  flag: '🇬🇧' },
  { code: 'US', name: 'United States',              dial: '+1',   flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay',                    dial: '+598', flag: '🇺🇾' },
  { code: 'UZ', name: 'Uzbekistan',                 dial: '+998', flag: '🇺🇿' },
  { code: 'VU', name: 'Vanuatu',                    dial: '+678', flag: '🇻🇺' },
  { code: 'VE', name: 'Venezuela',                  dial: '+58',  flag: '🇻🇪' },
  { code: 'VN', name: 'Vietnam',                    dial: '+84',  flag: '🇻🇳' },
  { code: 'YE', name: 'Yemen',                      dial: '+967', flag: '🇾🇪' },
  { code: 'ZM', name: 'Zambia',                     dial: '+260', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe',                   dial: '+263', flag: '🇿🇼' },
];

// ─── Phone Input ──────────────────────────────────────────────────────────────
const PhoneInput = ({ value, onChange, error = null }) => {
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find(c => c.code === 'TN')
  );
  const [localNumber, setLocalNumber]   = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch]             = useState('');
  const [isFocused, setIsFocused]       = useState(false);
  const dropdownRef = useRef(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const full = localNumber ? `${selectedCountry.dial}${localNumber}` : '';
    onChange(full);
  }, [selectedCountry, localNumber]);

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search)
  );

  const hasError = !!error;

  const inputClass = `w-full pl-3 pr-4 py-3 rounded-r-lg backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 ${
    hasError
      ? isDark
        ? 'bg-gray-800/50 border border-red-500/70 border-l-0 text-white placeholder-gray-400 focus:ring-red-500/50'
        : 'bg-white/80 border border-red-400 border-l-0 text-gray-900 placeholder-gray-500 focus:ring-red-500/40'
      : isDark
        ? 'bg-gray-800/50 border border-gray-600/50 border-l-0 text-white placeholder-gray-400 hover:border-red-400/30 focus:ring-red-500/50 focus:border-red-500/50'
        : 'bg-white/80 border border-gray-300 border-l-0 text-gray-900 placeholder-gray-500 hover:border-red-400/40 focus:ring-red-500/40 focus:border-red-500/40'
  }`;

  const triggerClass = `flex items-center gap-1.5 px-3 py-3 rounded-l-lg border-r-0 transition-all duration-300 cursor-pointer ${
    hasError
      ? isDark
        ? 'bg-gray-800/50 border border-red-500/70 text-white'
        : 'bg-white/80 border border-red-400 text-gray-900'
      : isDark
        ? 'bg-gray-800/50 border border-gray-600/50 text-white hover:border-red-400/30'
        : 'bg-white/80 border border-gray-300 text-gray-900 hover:border-red-400/40'
  }`;

  return (
    <div>
      <div className="relative" ref={dropdownRef}>
        <div className={`flex rounded-lg ${isFocused ? 'ring-2 ring-red-500/30' : ''}`}>
          <button
            type="button"
            onClick={() => { setDropdownOpen(prev => !prev); setSearch(''); }}
            className={triggerClass}
          >
            <span className="text-lg leading-none">{selectedCountry.flag}</span>
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {selectedCountry.dial}
            </span>
            <svg className={`w-3 h-3 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <input
            type="tel"
            placeholder="Phone number"
            value={localNumber}
            onChange={e => setLocalNumber(e.target.value.replace(/\D/g, ''))}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={inputClass}
          />
        </div>

        {dropdownOpen && (
          <div className={`absolute z-50 top-full left-0 mt-1 w-72 rounded-lg shadow-xl border overflow-hidden ${
            isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <input
                type="text"
                placeholder="Search country or code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-red-400 ${
                  isDark ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-50 text-gray-900 placeholder-gray-400'
                }`}
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className={`px-4 py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No results</p>
              ) : (
                filtered.map(country => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => { setSelectedCountry(country); setDropdownOpen(false); setSearch(''); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors duration-150 ${
                      selectedCountry.code === country.code
                        ? isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'
                        : isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg leading-none">{country.flag}</span>
                    <span className="flex-1 font-medium">{country.name}</span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>{country.dial}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <FieldError message={error} />
    </div>
  );
};

// ─── OAuth Buttons ───────────────────────────────────────────────────────────
const OAuthButtons = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleGoogle   = () => { window.location.href = 'http://localhost:3000/auth/google'; };
  const handleFacebook = () => { window.location.href = 'http://localhost:3000/auth/facebook'; };

  const btnBase = `w-full py-2.5 rounded-lg flex items-center justify-center gap-3 text-sm font-medium border transition-all duration-300`;

  return (
    <>
      <div className="relative flex items-center my-1">
        <div className={`flex-grow border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`} />
        <span className={`mx-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>or continue with</span>
        <div className={`flex-grow border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleGoogle}
          className={`${btnBase} ${isDark ? 'border-gray-600/60 hover:border-red-400/40 hover:bg-gray-800/60 text-gray-300' : 'border-gray-300 hover:border-red-400/40 hover:bg-gray-50 text-gray-600'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
        <button
          type="button"
          onClick={handleFacebook}
          className={`${btnBase} ${isDark ? 'border-blue-700/50 hover:border-blue-500/60 hover:bg-blue-900/20 text-blue-400' : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50 text-blue-600'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </button>
      </div>
    </>
  );
};

// ─── OTP Component ───────────────────────────────────────────────────────────
const OtpComponent = ({ email, username, otpToken: initialOtpToken, onVerified, onBack }) => {
  const [otp, setOtp]             = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken]   = useState(initialOtpToken);
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError]         = useState(null);
  const inputRefs = useRef([]);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Please enter all 6 digits'); return; }
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('http://127.0.0.1:3000/api/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code, otp_token: otpToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');
      onVerified();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const res  = await fetch('http://127.0.0.1:3000/api/resend-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend');
      setOtpToken(data.otp_token);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center">
          <Mail className="w-7 h-7 text-red-400" />
        </div>
      </div>
      <div>
        <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Check your email</h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>We sent a 6-digit code to</p>
        <p className="text-red-400 font-medium text-sm mt-1">{email}</p>
        {username && (
          <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${
            isDark ? 'bg-gray-800/60 border-gray-600/50 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'
          }`}>
            <User className="w-3.5 h-3.5 text-red-400" />
            Your username: <span className="font-semibold text-red-400">{username}</span>
          </div>
        )}
      </div>
      <div className="flex justify-center gap-3" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className={`w-12 h-14 text-center text-xl font-bold rounded-lg border-2 transition-all duration-300 focus:outline-none ${
              isDark
                ? `bg-gray-800/50 text-white ${digit ? 'border-red-500/70' : 'border-gray-600/50'} focus:border-red-400 focus:shadow-lg focus:shadow-red-500/20`
                : `bg-white text-gray-900 ${digit ? 'border-red-500/70' : 'border-gray-300'} focus:border-red-400`
            }`}
          />
        ))}
      </div>
      {error && (
        <div className="flex items-center justify-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      <button
        onClick={handleVerify}
        disabled={loading || otp.join('').length !== 6}
        className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Verifying…' : <> Verify Email <ArrowRight className="w-4 h-4" /> </>}
      </button>
      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Didn't receive the code?{' '}
        {countdown > 0 ? (
          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Resend in {countdown}s</span>
        ) : (
          <button onClick={handleResend} disabled={resending} className="text-red-400 font-semibold hover:text-red-300 transition-colors">
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </div>
      <button
        onClick={onBack}
        className={`text-sm ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
      >
        ← Back to sign up
      </button>
    </div>
  );
};

// ─── Forgot Password Component ───────────────────────────────────────────────
// Step 1: User enters email → receives reset_token + OTP email
const ForgotPasswordComponent = ({ onCodeSent, onBack }) => {
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return; }

    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('http://127.0.0.1:3000/api/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      // Always call onCodeSent — backend never reveals if email exists (anti-enumeration)
      onCodeSent({ email, reset_token: data.reset_token });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center">
          <KeyRound className="w-7 h-7 text-red-400" />
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Forgot your password?
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Enter your email and we'll send you a reset code.
        </p>
      </div>

      {/* Email field */}
      <InputField
        icon={Mail}
        type="email"
        placeholder="Email address"
        value={email}
        onChange={e => { setEmail(e.target.value); setError(null); }}
        required
        error={error}
      />

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending…' : <> Send Reset Code <ArrowRight className="w-4 h-4" /> </>}
      </button>

      {/* Back */}
      <button
        onClick={onBack}
        className={`w-full text-sm text-center ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
      >
        ← Back to sign in
      </button>
    </div>
  );
};

// ─── Reset OTP Component ───────────────────────────────────────────────────────
// Step 2a: Verify the 6-digit reset code — no password fields yet
const ResetOtpComponent = ({ email, resetToken: initialResetToken, onVerified, onBack }) => {
  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [loading, setLoading]       = useState(false);
  const [resending, setResending]   = useState(false);
  const [countdown, setCountdown]   = useState(60);
  const [error, setError]           = useState(null);
  const inputRefs = useRef([]);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Please enter all 6 digits'); return; }
    // Pass the verified OTP and current resetToken to the next step
    onVerified({ otp: code, resetToken });
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const res  = await fetch('http://127.0.0.1:3000/api/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend');
      if (data.reset_token) setResetToken(data.reset_token);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-red-400" />
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Enter reset code
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          We sent a 6-digit code to
        </p>
        <p className="text-red-400 font-medium text-sm mt-0.5">{email}</p>
      </div>

      {/* OTP boxes */}
      <div className="flex justify-center gap-3" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleOtpKeyDown(i, e)}
            className={`w-12 h-14 text-center text-xl font-bold rounded-lg border-2 transition-all duration-300 focus:outline-none ${
              isDark
                ? `bg-gray-800/50 text-white ${digit ? 'border-red-500/70' : 'border-gray-600/50'} focus:border-red-400 focus:shadow-lg focus:shadow-red-500/20`
                : `bg-white text-gray-900 ${digit ? 'border-red-500/70' : 'border-gray-300'} focus:border-red-400`
            }`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Verify button */}
      <button
        onClick={handleVerify}
        disabled={loading || otp.join('').length !== 6}
        className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Verifying…' : <> Verify Code <ArrowRight className="w-4 h-4" /> </>}
      </button>

      {/* Resend */}
      <div className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Didn't receive the code?{' '}
        {countdown > 0 ? (
          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Resend in {countdown}s</span>
        ) : (
          <button onClick={handleResend} disabled={resending} className="text-red-400 font-semibold hover:text-red-300 transition-colors">
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </div>

      {/* Back */}
      <button
        onClick={onBack}
        className={`w-full text-sm text-center ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
      >
        ← Back
      </button>
    </div>
  );
};

// ─── Reset New Password Component ─────────────────────────────────────────────
// Step 2b: OTP already verified — now set the new password
const ResetNewPasswordComponent = ({ email, otp, resetToken, onSuccess, onBack }) => {
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [errors, setErrors]                   = useState({});
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const validate = () => {
    const e = {};
    if (!newPassword)                         e.newPassword     = 'New password is required';
    else if (newPassword.length < 6)          e.newPassword     = 'Password must be at least 6 characters';
    if (!confirmPassword)                     e.confirmPassword = 'Please confirm your password';
    else if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    setErrors({});
    try {
      const res = await fetch('http://127.0.0.1:3000/api/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          reset_token:      resetToken,
          new_password:     newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      onSuccess();
    } catch (err) {
      // If the backend rejects the OTP (expired/wrong), send user back to OTP step
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center">
          <Lock className="w-7 h-7 text-red-400" />
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Set new password
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Choose a strong password for your account.
        </p>
      </div>

      {/* New password */}
      <InputField
        icon={Lock}
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={e => { setNewPassword(e.target.value); setErrors(prev => ({ ...prev, newPassword: null })); }}
        required
        error={errors.newPassword}
      />
      <PasswordStrength password={newPassword} />

      {/* Confirm password */}
      <InputField
        icon={Lock}
        type="password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={e => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: null })); }}
        required
        error={errors.confirmPassword}
      />
      {confirmPassword && !errors.confirmPassword && (
        <div className="flex items-center gap-1.5 -mt-2">
          {newPassword === confirmPassword
            ? <span className="text-xs text-green-500">✓ Passwords match</span>
            : <><AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /><span className="text-xs text-red-400">Passwords do not match</span></>
          }
        </div>
      )}

      {/* General error */}
      {errors.general && (
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{errors.general}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving…' : <> Save New Password <ArrowRight className="w-4 h-4" /> </>}
      </button>

      {/* Back to OTP step */}
      <button
        onClick={onBack}
        className={`w-full text-sm text-center ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
      >
        ← Back
      </button>
    </div>
  );
};

// ─── Reset Success Component ──────────────────────────────────────────────────
// Brief success screen shown after password is reset — auto-dismissed or clickable
const ResetSuccessComponent = ({ onContinue }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-green-400" />
        </div>
      </div>
      <div>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Password reset!
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Your password has been updated successfully. You can now sign in with your new password.
        </p>
      </div>
      <button
        onClick={onContinue}
        className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
      >
        Back to Sign In <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ─── Complete Profile Screen ──────────────────────────────────────────────────
// Shown after a brand-new OAuth sign-up to collect the missing required info.
const CompleteProfileScreen = ({ accessToken, prefilledImage, onComplete }) => {
  const [formData, setFormData] = useState({
    user_type:  '',
    first_name: '',
    last_name:  '',
    cin:        '',
    phone_num:  '',
    birth_date: '',
  });
  const [faceImage, setFaceImage] = useState(null);
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null, general: null }));
  };

  const validate = () => {
    const e = {};
    if (!formData.user_type)         e.user_type  = 'Please select a role';
    if (!formData.first_name.trim()) e.first_name = 'First name is required';
    if (!formData.last_name.trim())  e.last_name  = 'Last name is required';
    if (!formData.phone_num.trim())  e.phone_num  = 'Phone number is required';
    if (!formData.birth_date)        e.birth_date = 'Date of birth is required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:3000/api/complete-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ...formData, face_image: faceImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save profile');

      // Refresh all stored identity values with the new ones from the backend
      localStorage.setItem('token',        data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('username',     data.username);
      localStorage.setItem('userType',     data.user_type);
      localStorage.setItem('userId',       data.user_id);

      onComplete(data.user_type);
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center pb-1">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Complete your profile
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          A few more details to finish setting up your account.
        </p>
      </div>

      {/* Google profile photo preview */}
      {prefilledImage && (
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={prefilledImage}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-red-500/40 shadow-lg"
            />
            <div className={`absolute -bottom-1 -right-1 text-xs px-1.5 py-0.5 rounded-full border ${isDark ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
              Google
            </div>
          </div>
        </div>
      )}

      {/* Face capture — optional for OAuth users */}
      <FaceCapture
        onCapture={(base64) => {
          setFaceImage(base64);
          setErrors(prev => ({ ...prev, face: null }));
        }}
        onClear={() => setFaceImage(null)}
        error={errors.face}
        disabled={loading}
      />

      {/* Subtle divider */}
      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-gray-700/30" />
      </div>

      {/* Role */}
      <InputField
        icon={Users}
        options={[{ value: 'student', label: '🎓 Student' }, { value: 'instructor', label: '🏫 Instructor' }]}
        placeholder="Select your role"
        value={formData.user_type}
        onChange={e => handleChange('user_type', e.target.value)}
        required
        error={errors.user_type}
      />

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <InputField icon={User} type="text" placeholder="First Name" value={formData.first_name} onChange={e => handleChange('first_name', e.target.value)} required error={errors.first_name} />
        <InputField icon={User} type="text" placeholder="Last Name"  value={formData.last_name}  onChange={e => handleChange('last_name',  e.target.value)} required error={errors.last_name}  />
      </div>

      {/* CIN — optional for OAuth */}
      <InputField
        icon={CreditCard}
        type="text"
        placeholder="CIN (optional)"
        value={formData.cin}
        onChange={e => handleChange('cin', e.target.value)}
        error={errors.cin}
      />

      {/* Phone */}
      <PhoneInput
        value={formData.phone_num}
        onChange={val => handleChange('phone_num', val)}
        error={errors.phone_num}
      />

      {/* Birth date */}
      <InputField
        icon={MapPin}
        type="date"
        placeholder="Date of Birth"
        value={formData.birth_date}
        onChange={e => handleChange('birth_date', e.target.value)}
        required
        error={errors.birth_date}
      />

      {/* General error */}
      {errors.general && (
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{errors.general}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving…' : <> Finish Setup <ArrowRight className="w-4 h-4" /> </>}
      </button>
    </div>
  );
};

// ─── OAuth Callback Screen ────────────────────────────────────────────────────
const OAuthCallbackScreen = ({ onSuccess, onError, onNeedsProfile }) => {
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const access       = searchParams.get('access');
    const refresh      = searchParams.get('refresh');
    const needsProfile = searchParams.get('profile_incomplete') === 'true';

    if (!access || !refresh) { onError('Authentication failed — missing tokens.'); return; }
    try {
      const payload = JSON.parse(atob(access.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      localStorage.setItem('token',        access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('username',     payload.username ?? '');
      localStorage.setItem('userType',     payload.role     ?? '');
      localStorage.setItem('userId',       payload.sub      ?? '');

      if (needsProfile) {
        onNeedsProfile({ token: access, profileImage: payload.profileImage ?? null });
      } else {
        onSuccess(payload.role);
      }
    } catch {
      onError('Authentication failed — could not read token.');
    }
  }, []);

  return (
    <div className="py-12 flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Signing you in…</p>
    </div>
  );
};

// ─── Sign In ────────────────────────────────────────────────────────────────
const SignInComponent = ({ onSubmit, onForgotPassword, prefillUsername = '' }) => {
  const [formData, setFormData]           = useState({ username: prefillUsername, password: '' });
  const [errors, setErrors]               = useState({});
  const [loading, setLoading]             = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if (prefillUsername) setFormData(prev => ({ ...prev, username: prefillUsername }));
  }, [prefillUsername]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null, general: null }));
  };

  const validate = () => {
    const e = {};
    if (!formData.username.trim()) e.username = 'Username is required';
    if (!formData.password)        e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:3000/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Login failed');

      localStorage.setItem('token',        data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('username',     data.username);
      localStorage.setItem('userType',     data.user_type);
      if (data.user_id) localStorage.setItem('userId', data.user_id);

      onSubmit(data);
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <InputField
          icon={User} type="text" placeholder="Username"
          value={formData.username} onChange={e => handleInputChange('username', e.target.value)}
          required error={errors.username}
        />
        <InputField
          icon={Lock} type="password" placeholder="Password"
          value={formData.password} onChange={e => handleInputChange('password', e.target.value)}
          required error={errors.password}
        />

        {/* Forgot password link */}
        <div className="flex justify-end -mt-1">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
          >
            Forgot password?
          </button>
        </div>

        {errors.general && (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{errors.general}</p>
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in…' : <> Sign In <ArrowRight className="w-4 h-4" /> </>}
        </button>
        <OAuthButtons />

        {/* Face login separator */}
        <div className="relative flex items-center my-1">
          <div className={`flex-grow border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`} />
          <span className={`mx-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>or</span>
          <div className={`flex-grow border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`} />
        </div>

        {/* Face login button */}
        <button
          type="button"
          onClick={() => setShowFaceModal(true)}
          className={`w-full py-2.5 rounded-lg border flex items-center justify-center gap-2.5 text-sm font-medium transition-all duration-300 ${
            isDark
              ? 'border-gray-600/60 hover:border-red-400/40 hover:bg-gray-800/60 text-gray-300'
              : 'border-gray-300 hover:border-red-400/40 hover:bg-gray-50 text-gray-600'
          }`}
        >
          <ScanFace className="w-4 h-4 text-red-400" />
          Sign in with Face Recognition
        </button>
      </div>

      {/* Face Login Modal */}
      {showFaceModal && (
        <FaceLoginModal
          onSuccess={(data) => { setShowFaceModal(false); onSubmit(data); }}
          onClose={() => setShowFaceModal(false)}
        />
      )}
    </>
  );
};

// ─── Sign Up ────────────────────────────────────────────────────────────────

const SignUpComponent = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    user_type: '', first_name: '', last_name: '', cin: '',
    email: '', phone_num: '', birth_date: '', password: '', confirm_password: '',
  });
  const [faceImage, setFaceImage] = useState(null);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null, general: null }));
  };

  const validate = () => {
    const e = {};
    if (!formData.user_type)                                    e.user_type        = 'Please select a role';
    if (!formData.first_name.trim())                            e.first_name       = 'First name is required';
    if (!formData.last_name.trim())                             e.last_name        = 'Last name is required';
    if (!formData.cin.trim())                                   e.cin              = 'CIN is required';
    if (!formData.email.trim())                                 e.email            = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))             e.email            = 'Enter a valid email';
    if (!formData.phone_num.trim())                             e.phone_num        = 'Phone number is required';
    if (!formData.birth_date)                                   e.birth_date       = 'Date of birth is required';
    if (!formData.password)                                     e.password         = 'Password is required';
    else if (formData.password.length < 6)                      e.password         = 'Password must be at least 6 characters';
    if (!formData.confirm_password)                             e.confirm_password = 'Please confirm your password';
    else if (formData.password !== formData.confirm_password)   e.confirm_password = 'Passwords do not match';
    if (!faceImage)                                             e.face             = 'A face photo is required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:3000/api/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, face_image: faceImage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || JSON.stringify(data));
      onSubmit({ email: data.email, username: data.username, otp_token: data.otp_token });
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* ── Face Photo — FIRST, centered at top like a profile avatar ── */}
      <FaceCapture
        onCapture={(base64) => {
          setFaceImage(base64);
          setErrors(prev => ({ ...prev, face: null }));
        }}
        onClear={() => setFaceImage(null)}
        error={errors.face}
        disabled={loading}
      />

      {/* ── Subtle divider ── */}
      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-gray-700/30" />
      </div>

      {/* ── Rest of the form fields ── */}
      <InputField
        icon={Users} options={[{ value: 'student', label: '🎓 Student' }, { value: 'instructor', label: '🏫 Instructor' }]}
        placeholder="Select your role" value={formData.user_type}
        onChange={e => handleInputChange('user_type', e.target.value)} required error={errors.user_type}
      />
      <div className="grid grid-cols-2 gap-4">
        <InputField icon={User} type="text" placeholder="First Name" value={formData.first_name} onChange={e => handleInputChange('first_name', e.target.value)} required error={errors.first_name} />
        <InputField icon={User} type="text" placeholder="Last Name"  value={formData.last_name}  onChange={e => handleInputChange('last_name',  e.target.value)} required error={errors.last_name}  />
      </div>
      <InputField icon={CreditCard} type="text"  placeholder="CIN"   value={formData.cin}        onChange={e => handleInputChange('cin',        e.target.value)} required error={errors.cin}       />
      <InputField icon={Mail}       type="email" placeholder="Email"  value={formData.email}      onChange={e => handleInputChange('email',      e.target.value)} required error={errors.email}     />
      <PhoneInput value={formData.phone_num} onChange={val => handleInputChange('phone_num', val)} error={errors.phone_num} />
      <InputField icon={MapPin} type="date" placeholder="Birth Date"  value={formData.birth_date} onChange={e => handleInputChange('birth_date', e.target.value)} required error={errors.birth_date} />
      <InputField icon={Lock} type="password" placeholder="Password"  value={formData.password}   onChange={e => handleInputChange('password',   e.target.value)} required error={errors.password}  />
      <PasswordStrength password={formData.password} />
      <InputField icon={Lock} type="password" placeholder="Confirm Password" value={formData.confirm_password} onChange={e => handleInputChange('confirm_password', e.target.value)} required error={errors.confirm_password} />
      {formData.confirm_password && !errors.confirm_password && (
        <div className="flex items-center gap-1.5 -mt-2">
          {formData.password === formData.confirm_password
            ? <span className="text-xs text-green-500">✓ Passwords match</span>
            : <><AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /><span className="text-xs text-red-400">Passwords do not match</span></>
          }
        </div>
      )}
      {errors.general && (
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{errors.general}</p>
        </div>
      )}
      <button
        onClick={handleSubmit} disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating account…' : <> Create Account <ArrowRight className="w-4 h-4" /> </>}
      </button>
      <OAuthButtons />
    </div>
  );
};

// ─── Auth Page ───────────────────────────────────────────────────────────────
// Screen state machine:
//   'signin'           → Sign In form
//   'signup'           → Sign Up form
//   'verifyEmail'      → OTP verification after registration
//   'forgotPassword'   → Enter email to receive reset code
//   'resetOtp'         → Enter & verify the 6-digit reset code
//   'resetNewPassword' → Set new password (OTP already verified)
//   'resetSuccess'     → Success confirmation
//   'oauthCallback'    → Handles Google/Facebook redirect
//   'completeProfile'  → New OAuth user fills in missing info
const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Derive initial screen directly — no effect needed, avoids cascading render
  const [screen, setScreen]                   = useState(() =>
    searchParams.get('access') && searchParams.get('refresh') ? 'oauthCallback' : 'signin'
  );
  const [otpEmail, setOtpEmail]               = useState(null);
  const [otpUsername, setOtpUsername]         = useState(null);
  const [otpToken, setOtpToken]               = useState(null);
  const [resetEmail, setResetEmail]           = useState(null);
  const [resetToken, setResetToken]           = useState(null);
  const [resetOtp, setResetOtp]               = useState(null); // verified OTP passed to password step
  const [prefillUsername, setPrefillUsername] = useState('');
  const [oauthError, setOauthError]           = useState(null);
  const [oauthAccessToken, setOauthAccessToken]   = useState(null);
  const [oauthProfileImage, setOauthProfileImage] = useState(null);

  const isSignUp  = screen === 'signup';
  const showTabs  = screen === 'signin' || screen === 'signup';
  const showFooter = showTabs;

  const handleToggle = () => {
    setScreen(prev => prev === 'signup' ? 'signin' : 'signup');
  };

  const handleSignInSubmit = (data) => {
    const routes = { student: '/StudydDashboard', instructor: '/teacherdashboard', admin: '/AdminDashboard' };
    const route = routes[data.user_type];
    if (route) navigate(route);
    else alert('Unknown user type: ' + data.user_type);
  };

  const handleSignUpSubmit = (data) => {
    setOtpEmail(data.email);
    setOtpUsername(data.username);
    setOtpToken(data.otp_token);
    setScreen('verifyEmail');
  };

  const handleOtpVerified = () => {
    setPrefillUsername(otpUsername || '');
    setOtpEmail(null);
    setOtpUsername(null);
    setOtpToken(null);
    setScreen('signin');
  };

  // Forgot password → step 1 done: email submitted, reset_token received
  const handleForgotCodeSent = ({ email, reset_token }) => {
    setResetEmail(email);
    setResetToken(reset_token);
    setScreen('resetOtp');
  };

  // Reset OTP step → code verified, now show password form
  const handleResetOtpVerified = ({ otp, resetToken: token }) => {
    setResetOtp(otp);
    setResetToken(token); // may have been refreshed on resend
    setScreen('resetNewPassword');
  };

  // Reset password → done
  const handleResetSuccess = () => {
    setScreen('resetSuccess');
  };

  const handleResetSuccessContinue = () => {
    setResetEmail(null);
    setResetToken(null);
    setScreen('signin');
  };

  // OAuth handlers
  const handleOAuthSuccess = (role) => {
    const routes = { student: '/StudydDashboard', instructor: '/teacherdashboard', admin: '/AdminDashboard' };
    const route = routes[role];
    if (route) navigate(route, { replace: true });
    else setOauthError(`Unknown role "${role}".`);
  };

  const handleOAuthError = (msg) => setOauthError(msg);

  // Called when a brand-new OAuth user needs to complete their profile
  const handleNeedsProfile = ({ token, profileImage }) => {
    setOauthAccessToken(token);
    setOauthProfileImage(profileImage);
    setScreen('completeProfile');
  };

  const renderForm = () => {
    switch (screen) {
      case 'oauthCallback':
        return oauthError ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-red-400">{oauthError}</p>
            <button
              onClick={() => { setOauthError(null); setScreen('signin'); }}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <OAuthCallbackScreen
            onSuccess={handleOAuthSuccess}
            onError={handleOAuthError}
            onNeedsProfile={handleNeedsProfile}
          />
        );
      case 'completeProfile':
        return (
          <CompleteProfileScreen
            accessToken={oauthAccessToken}
            prefilledImage={oauthProfileImage}
            onComplete={(role) => {
              setOauthAccessToken(null);
              setOauthProfileImage(null);
              handleSignInSubmit({ user_type: role });
            }}
          />
        );
      case 'verifyEmail':
        return (
          <OtpComponent
            email={otpEmail}
            username={otpUsername}
            otpToken={otpToken}
            onVerified={handleOtpVerified}
            onBack={() => setScreen('signup')}
          />
        );
      case 'forgotPassword':
        return (
          <ForgotPasswordComponent
            onCodeSent={handleForgotCodeSent}
            onBack={() => setScreen('signin')}
          />
        );
      case 'resetOtp':
        return (
          <ResetOtpComponent
            email={resetEmail}
            resetToken={resetToken}
            onVerified={handleResetOtpVerified}
            onBack={() => setScreen('forgotPassword')}
          />
        );
      case 'resetNewPassword':
        return (
          <ResetNewPasswordComponent
            email={resetEmail}
            otp={resetOtp}
            resetToken={resetToken}
            onSuccess={handleResetSuccess}
            onBack={() => setScreen('resetOtp')}
          />
        );
      case 'resetSuccess':
        return <ResetSuccessComponent onContinue={handleResetSuccessContinue} />;
      case 'signup':
        return <SignUpComponent onSubmit={handleSignUpSubmit} />;
      case 'signin':
      default:
        return (
          <SignInComponent
            onSubmit={handleSignInSubmit}
            onForgotPassword={() => setScreen('forgotPassword')}
            prefillUsername={prefillUsername}
          />
        );
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: isDark ? "#020617" : "#f1f5f9" }}
    >
      <AnimatedBackground />

      <div className="z-10 relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            data-aos="fade-in" data-aos-delay="100"
            className="inline-block px-2"
            src="src/assets/media/text.png"
            alt="Welcome"
            loading="lazy"
          />
        </div>

        {/* Card */}
        <div className={`backdrop-blur-sm rounded-2xl shadow-lg transition-colors duration-500 ${
          isDark ? "bg-gray-900/60 border border-gray-700/50" : "bg-zinc-50/80 border border-gray-200"
        }`}>

          {/* Tabs — only on signin/signup */}
          {showTabs && (
            <div className={`flex rounded-t-2xl overflow-hidden transition-colors duration-500 ${
              isDark ? "bg-gray-800/50" : "bg-gray-100"
            }`}>
              <button
                onClick={() => isSignUp && handleToggle()}
                className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 font-medium transition-all duration-300 ${
                  !isSignUp
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
              <button
                onClick={() => !isSignUp && handleToggle()}
                className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 font-medium transition-all duration-300 ${
                  isSignUp
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserPlus className="w-4 h-4" /> Sign Up
              </button>
            </div>
          )}

          {/* Form */}
          <div className="p-8">
            {renderForm()}
          </div>
        </div>

        {/* Footer link — only on signin/signup */}
        {showFooter && (
          <div className={`text-center mt-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            <p>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button onClick={handleToggle} className="text-red-400 font-semibold hover:text-red-300 transition-colors">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        )}
      </div>

      <ThemeToggle />
    </div>
  );
};

export default AuthPage;