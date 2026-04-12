import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isLanding = location.pathname === "/";

  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="p-4 flex items-center justify-between h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" id="nav-logo">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow duration-300">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Money<span className="gradient-text">Web</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {isLanding && (
            <div className="hidden md:flex items-center gap-8" id="nav-links">
              {["Features", "How it Works", "Pricing", "Testimonials"].map(
                (item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sm text-[#8b8b9e] hover:text-white transition-colors duration-300 relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500 hover:after:w-full after:transition-all after:duration-300"
                  >
                    {item}
                  </a>
                ),
              )}
            </div>
          )}

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4" id="nav-cta">
            <Link
              to="/dashboard"
              className="text-sm text-[#8b8b9e] hover:text-white transition-colors duration-300 px-4 py-2"
            >
              Dashboard
            </Link>
            <Link
              to="/login"
              className="text-sm text-[#8b8b9e] hover:text-white transition-colors duration-300 px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/dashboard"
              className="btn-primary !py-2.5 !px-6 !text-sm !rounded-lg"
            >
              Launch App
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            id="mobile-menu-btn"
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-4 bg-[#12121a]/95 backdrop-blur-xl border-t border-white/[0.06] space-y-3">
          {isLanding &&
            ["Features", "How it Works", "Pricing", "Testimonials"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className="block text-[#8b8b9e] hover:text-white transition-colors py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {item}
                </a>
              ),
            )}
          <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-3">
            <Link to="/dashboard" className="text-white text-center py-2" onClick={() => setMobileOpen(false)}>
              Dashboard
            </Link>
            <Link to="/login" className="text-white text-center py-2" onClick={() => setMobileOpen(false)}>
              Sign In
            </Link>
            <Link to="/dashboard" className="btn-primary text-center !py-2.5" onClick={() => setMobileOpen(false)}>
              Launch App
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
