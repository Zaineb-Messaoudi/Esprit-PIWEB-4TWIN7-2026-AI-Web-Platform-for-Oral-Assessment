import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useTheme } from "../context/ThemeContect.jsx";
import ThemeToggle from "../context/ThemeToggle.jsx"; 

const TypewriterEffect = ({ text }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else clearInterval(timer);
    }, 260);
    return () => clearInterval(timer);
  }, [text]);

  return (
      <span className="inline-block">
      {displayText}
        <span className="animate-pulse">|</span>
    </span>
  );
};

const BackgroundEffect = ({ theme }) => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0 blur-3xl animate-pulse"
      style={{
        background: theme === "dark"
          ? "linear-gradient(90deg, rgba(79,70,229,0.2), rgba(239,68,68,0.2))"
          : "linear-gradient(90deg, rgba(79,70,229,0.05), rgba(239,68,68,0.05))"
      }}
    />
    <div
      className="absolute inset-0 blur-2xl animate-float"
      style={{
        background: theme === "dark"
          ? "linear-gradient(45deg, rgba(79,70,229,0.1), transparent, rgba(239,68,68,0.1))"
          : "linear-gradient(45deg, rgba(79,70,229,0.02), transparent, rgba(239,68,68,0.02))"
      }}
    />
  </div>
);

const WelcomeScreen = ({ onLoadingComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {

  AOS.init({
    duration: 1000,
    once: false,
    mirror: false,
  });

  let cancelled = false;

  const timer = setTimeout(() => {

    if (cancelled) return;

    setIsLoading(false);

    if (!cancelled) onLoadingComplete?.();

}, 4000);

  return () => {
    cancelled = true;
    clearTimeout(timer);
  };

}, []);

  const containerVariants = {
  exit: {
    opacity: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: "easeInOut" }
  }
};

  const childVariants = {
    exit: { y: -20, opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }
  };
  const backgroundColor = theme === "dark" ? "#030014" : "#f1f5f9";

  return (
      <>
          {isLoading && (
              <motion.div
                  className="fixed inset-0 z-[9999]"
                  style={{ backgroundColor, transition: "background-color 0.4s" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit="exit"
                  variants={containerVariants}
              >
              <BackgroundEffect theme={theme} />
                <div className="relative min-h-screen flex items-center justify-center px-4">
                  <div className="w-full max-w-4xl mx-auto">
                    <motion.div className="text-center mb-6 sm:mb-8 md:mb-12" variants={childVariants}>
                      <div>
                        <img data-aos="fade-in"
                             data-aos-delay="800"
                             className="inline-block px-2 bg-gradient-to-r from-indigo-600 to-red-600 bg-clip-text text-transparent"
                             src="src\\assets\\media\\Welcome to.png"
                             alt="Welcome to"
                             loading="lazy" />
                      </div>
                      <div>
                        <img data-aos="fade-up"
                             data-aos-delay="800"
                             className="inline-block px-2 bg-gradient-to-r from-indigo-600 to-red-600 bg-clip-text text-transparent"
                             src="src\\assets\\media\\side logo.png"
                             alt="Hikma Learn Logo"
                             loading="lazy" />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
          )}
        <ThemeToggle /> {/* toggle on screen */}
      </>
  );
};

export default WelcomeScreen;
