import { useState, useEffect, useMemo } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContect.jsx";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("Home");
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const navItems = useMemo(
        () => [
            { href: "#Home", label: "Home" },
            { href: "#About", label: "About" },
            { href: "#Inspiration", label: "Inspiration" },
            { href: "#Courses", label: "Courses" },
            { href: "/auth", label: "Sign In", isAuth: true },
        ],
        []
    );

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);

            const sectionPositions = navItems
                .filter((item) => item.href.startsWith("#"))
                .map((item) => {
                    const section = document.querySelector(item.href);
                    if (section) {
                        return {
                            id: item.href.slice(1),
                            top: section.offsetTop,
                            bottom: section.offsetTop + section.offsetHeight,
                        };
                    }
                    return null;
                })
                .filter(Boolean);

            const scrollPosition = window.scrollY + 100;
            const currentSection = sectionPositions.find(
                (section) =>
                    scrollPosition >= section.top && scrollPosition < section.bottom
            );

            if (currentSection) {
                setActiveSection(currentSection.id);
            }
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, [navItems]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "unset";
    }, [isOpen]);

    const scrollToSection = (e, href, isAuth = false) => {
        e.preventDefault();
        if (isAuth || href.startsWith("/")) {
            navigate(href);
            setIsOpen(false);
            return;
        }
        if (href === "#Home") {
            if (location.pathname !== "/") {
                navigate("/");
                return;
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            const section = document.querySelector(href);
            if (section) {
                window.scrollTo({
                    top: section.offsetTop - 80,
                    behavior: "smooth",
                });
            }
        }
        setIsOpen(false);
    };

    const bgColor = "var(--nav-bg)";
    const textColor = theme === "dark" ? "#e2d3fd" : "#7f1d1d";

    return (
        <nav
            className="fixed w-full top-0 z-50 transition-all duration-500"
            style={{
                background: isOpen
                    ? bgColor
                    : scrolled
                        ? `${bgColor} / 90%`
                        : "transparent",
                backdropFilter: scrolled ? "blur(20px)" : "none",
            }}
        >
            <div className="mx-auto px-4 sm:px-6 lg:px-[10%]">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <a
                            href="#Home"
                            onClick={(e) => scrollToSection(e, "#Home")}
                            className="flex items-center"
                        >
                            <img
                                src="src\\assets\\media\\side logo.png"
                                alt="Hikma Learn Logo"
                                className="h-10 w-auto"
                                loading="lazy"
                            />
                        </a>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex ml-8 items-center space-x-8">
                        {navItems.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                onClick={(e) => scrollToSection(e, item.href, item.isAuth)}
                                className="group relative px-1 py-2 text-sm font-medium"
                                style={{ color: textColor }}
                            >
								<span
                                    className={`relative z-10 transition-colors duration-300 ${
                                        activeSection === item.href.slice(1)
                                            ? "bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent font-semibold"
                                            : ""
                                    }`}
                                >
									{item.label}
								</span>

                                <span
                                    className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-400 to-red-600 transform origin-left transition-transform duration-300 ${
                                        activeSection === item.href.slice(1)
                                            ? "scale-x-100"
                                            : "scale-x-0 group-hover:scale-x-100"
                                    }`}
                                />
                            </a>
                        ))}

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="ml-4 p-2 rounded-full transition-all duration-300 hover:scale-110"
                        >
                            {theme === "dark" ? (
                                <Sun className="w-5 h-5 text-yellow-400" />
                            ) : (
                                <Moon className="w-5 h-5 text-red-500" />
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`relative p-2 transition-transform duration-300 ease-in-out transform ${
                                isOpen ? "rotate-90 scale-125" : "rotate-0 scale-100"
                            }`}
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div
                className={`md:hidden fixed inset-0 transition-all duration-300 ease-in-out ${
                    isOpen
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-full pointer-events-none"
                }`}
                style={{ top: "64px", height: "calc(100vh - 64px)", background: bgColor }}
            >
                <div className="flex flex-col h-full px-4 py-6 space-y-4">
                    {navItems.map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            onClick={(e) => scrollToSection(e, item.href, item.isAuth)}
                            className={`block px-4 py-3 text-lg font-medium ${
                                activeSection === item.href.slice(1)
                                    ? "bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent font-semibold"
                                    : ""
                            }`}
                            style={{ color: textColor }}
                        >
                            {item.label}
                        </a>
                    ))}

                    {/* Theme Toggle for Mobile */}
                    <button
                        onClick={toggleTheme}
                        className="mt-4 p-2 rounded-full transition-all duration-300 hover:scale-110"
                    >
                        {theme === "dark" ? (
                            <Sun className="w-5 h-5 text-yellow-400" />
                        ) : (
                            <Moon className="w-5 h-5 text-red-500" />
                        )}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;