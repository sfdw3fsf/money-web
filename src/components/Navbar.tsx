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
          ? "bg-[#1a1510]/90 backdrop-blur-xl border-b border-[#c4956a]/10 shadow-lg shadow-black/30"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="p-4 flex items-center justify-between h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" id="nav-logo">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#c4956a] to-[#8b7355] flex items-center justify-center shadow-lg shadow-[#c4956a]/20 group-hover:shadow-[#c4956a]/30 transition-shadow duration-300 border border-[#c4956a]/30">
              <span className="text-lg" role="img" aria-label="wheat">🌾</span>
            </div>
            <span className="text-xl font-bold text-[#e8dcc8] tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              The Old <span className="gradient-text">Post</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {isLanding && (
            <div className="hidden md:flex items-center gap-8" id="nav-links">
              {["Provisions", "The Method", "Rates", "Testimonials"].map(
                (item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sm text-[#a0947e] hover:text-[#e8dcc8] transition-colors duration-300 relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-gradient-to-r after:from-[#c4956a] after:to-[#8b7355] hover:after:w-full after:transition-all after:duration-300"
                    style={{ fontFamily: "'Lora', serif" }}
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
              className="text-sm text-[#a0947e] hover:text-[#e8dcc8] transition-colors duration-300 px-4 py-2"
              style={{ fontFamily: "'Lora', serif" }}
            >
              Trading Floor
            </Link>
            <Link
              to="/login"
              className="text-sm text-[#a0947e] hover:text-[#e8dcc8] transition-colors duration-300 px-4 py-2"
              style={{ fontFamily: "'Lora', serif" }}
            >
              Sign In
            </Link>
            <Link
              to="/dashboard"
              className="btn-primary !py-2.5 !px-6 !text-sm !rounded-lg"
            >
              Enter the Post
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
              className={`block w-6 h-0.5 bg-[#c4956a] transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block w-6 h-0.5 bg-[#c4956a] transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-6 h-0.5 bg-[#c4956a] transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`}
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
        <div className="px-6 py-4 bg-[#231f18]/95 backdrop-blur-xl border-t border-[#c4956a]/10 space-y-3">
          {isLanding &&
            ["Provisions", "The Method", "Rates", "Testimonials"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className="block text-[#a0947e] hover:text-[#e8dcc8] transition-colors py-2"
                  onClick={() => setMobileOpen(false)}
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {item}
                </a>
              ),
            )}
          <div className="pt-3 border-t border-[#c4956a]/10 flex flex-col gap-3">
            <Link to="/dashboard" className="text-[#e8dcc8] text-center py-2" onClick={() => setMobileOpen(false)}>
              Trading Floor
            </Link>
            <Link to="/login" className="text-[#e8dcc8] text-center py-2" onClick={() => setMobileOpen(false)}>
              Sign In
            </Link>
            <Link to="/dashboard" className="btn-primary text-center !py-2.5" onClick={() => setMobileOpen(false)}>
              Enter the Post
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
