import React from "react";
import { GlobeIcon } from "@radix-ui/react-icons";
import { BsFacebook, BsGithub, BsInstagram, BsLinkedin } from "react-icons/bs";
import { useTheme } from "../context/ThemeContect.jsx";

const Footer = () => {
  const { theme } = useTheme();
  return (
    <footer
className={`
relative w-full px-6 py-12 md:px-16 md:py-16 mt-24

${theme === "dark"
 ? "bg-black/30 backdrop-blur-sm text-gray-300 border-t border-gray-800"
 : "bg-white/40 backdrop-blur-sm text-gray-700 border-t border-gray-200 shadow-inner"}
`}
>
      {/* Top Section */}
        {/* Logo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
        <div className="lg:col-span-2 flex justify-center lg:justify-start items-center">
          <img
            src="/src/assets/media/logo.png"
            alt="Hikma Learn Logo"
            className="
              w-36 h-36
              sm:w-44 sm:h-44
              md:w-56 md:h-56
              lg:w-64 lg:h-64
              object-contain
              "
          />
        </div>

        {/* Features Section */}
        <div className="flex flex-col">
          <h4
          className={`
          font-semibold mb-4 text-lg
          ${theme === "dark" ? "text-white" : "text-gray-900"}
          `}
          >
              Features</h4>
          <ul className="space-y-3 text-gray-400">
            <li className="hover:text-white transition-colors cursor-pointer">Personalized Quizzes</li>
            <li className="hover:text-white transition-colors cursor-pointer">Progress Analytics</li>
            <li className="hover:text-white transition-colors cursor-pointer">Inclusive Learning</li>
          </ul>
        </div>

        {/* Our Vision & Connect Combined */}
        <div className="flex flex-col space-y-8">
          <div>
          <h4
          className={`
          font-semibold mb-4 text-lg
          ${theme === "dark" ? "text-white" : "text-gray-900"}
          `}
          >              Our Vision</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="hover:text-white transition-colors cursor-pointer">About Us</li>
              <li className="hover:text-white transition-colors cursor-pointer">Success Stories</li>
              <li className="hover:text-white transition-colors cursor-pointer">Partners</li>
            </ul>
          </div>
          
          <div>
          <h4
          className={`
          font-semibold mb-4 text-lg
          ${theme === "dark" ? "text-white" : "text-gray-900"}
          `}
          >              Connect</h4>
            <div className="flex space-x-4 text-white">
              <a
                href=""
                aria-label="Facebook"
                className="hover:text-blue-400 transition-colors p-2 rounded-full hover:bg-blue-400/10"
              >
                <BsFacebook className="w-5 h-5" />
              </a>
              <a
                href=""
                aria-label="Instagram"
                className="hover:text-pink-500 transition-colors p-2 rounded-full hover:bg-pink-500/10"
              >
                <BsInstagram className="w-5 h-5" />
              </a>
              <a
                href=""
                aria-label="LinkedIn"
                className="hover:text-blue-300 transition-colors p-2 rounded-full hover:bg-blue-300/10"
              >
                <BsLinkedin className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                aria-label="GitHub" 
                className="hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-300/10"
              >
                <BsGithub className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-700 pt-6 mt-10 flex flex-col lg:flex-row justify-between items-center text-sm text-gray-400 gap-6">
        {/* Legal Info */}
        <div className="text-center md:text-left">
          © {new Date().getFullYear()} Hikma Learn ·{" "}
          <a href="#" className="underline hover:text-white transition-colors">
            Privacy
          </a>{" "}
          ·{" "}
          <a href="#" className="underline hover:text-white transition-colors">
            Terms
          </a>{" "}
          ·{" "}
          <a href="#" className="underline hover:text-white transition-colors">
            Sitemap
          </a>
        </div>

      
      </div>
    </footer>
  );
};

export default Footer;