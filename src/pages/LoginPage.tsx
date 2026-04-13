import { useState } from "react";
import { Link } from "react-router-dom";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder — will connect to backend later
    alert(`${isLogin ? "Login" : "Sign up"} submitted for: ${email}`);
  };

  return (
    <div className="relative grid lg:grid-cols-2 min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden">
      {/* Left Side — Decorative */}
      <div className="hidden lg:grid relative overflow-hidden bg-[#1a1510] place-items-center">
        {/* Warm Gradient Orbs */}
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-[#c4956a]/[0.08] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#8b7355]/[0.06] rounded-full blur-[100px]" />

        {/* Subtle Grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(196, 149, 106, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(196, 149, 106, 0.2) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 px-12 xl:px-16 max-w-xl">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-10 group">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#c4956a] to-[#8b7355] flex items-center justify-center shadow-lg shadow-[#c4956a]/20 border border-[#c4956a]/30">
              <span className="text-lg">🌾</span>
            </div>
            <span className="text-xl font-bold text-[#e8dcc8]" style={{ fontFamily: "'Playfair Display', serif" }}>
              The Old <span className="gradient-text">Post</span>
            </span>
          </Link>

          <h2 className="text-3xl xl:text-4xl font-bold text-[#e8dcc8] leading-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Step inside the
            <br />
            <span className="gradient-text italic">trading post</span>
          </h2>
          <p className="text-[#a0947e] text-base leading-relaxed mb-8 max-w-md" style={{ fontFamily: "'Lora', serif" }}>
            Join traders who chose patience over haste, wisdom over noise, and good harvests over quick gambles.
          </p>

          {/* Social Proof */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {["TG", "ML", "JW", "AK"].map((initials, i) => {
                const colors = [
                  "from-[#7d9b6f] to-[#5a7a4c]",
                  "from-[#c4956a] to-[#8b7355]",
                  "from-[#b5594e] to-[#8b3e36]",
                  "from-[#6d6354] to-[#4a4338]",
                ];
                return (
                  <div
                    key={initials}
                    className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colors[i]} flex items-center justify-center text-[#e8dcc8] text-xs font-bold border-2 border-[#1a1510]`}
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {initials}
                  </div>
                );
              })}
            </div>
            <div>
              <div className="text-sm text-[#e8dcc8] font-medium" style={{ fontFamily: "'Lora', serif" }}>
                Patient traders
              </div>
              <div className="text-xs text-[#6d6354]" style={{ fontFamily: "'Lora', serif" }}>
                already inside the Post
              </div>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="mt-8 p-5 rounded-xl bg-[#c4956a]/[0.04] border border-[#c4956a]/8">
            <p className="text-sm text-[#a0947e] italic leading-relaxed mb-4" style={{ fontFamily: "'Lora', serif" }}>
              "The loss pause feature saved my account. After 3 bad trades you're forced to stop and think — like a farmer waiting for better weather."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7d9b6f] to-[#5a7a4c] flex items-center justify-center text-[#e8dcc8] text-xs font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                TG
              </div>
              <div>
                <div className="text-xs font-semibold text-[#e8dcc8]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Thomas Greenfield
                </div>
                <div className="text-xs text-[#6d6354]" style={{ fontFamily: "'Lora', serif" }}>Swing Trader</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side — Form */}
      <div className="grid place-items-center px-5 sm:px-6 py-10 lg:py-0 bg-[#1a1510] pt-safe pb-safe">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link
            to="/"
            className="lg:hidden flex items-center gap-3 mb-8 sm:mb-10 justify-center"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#c4956a] to-[#8b7355] flex items-center justify-center border border-[#c4956a]/30">
              <span className="text-lg">🌾</span>
            </div>
            <span className="text-xl font-bold text-[#e8dcc8]" style={{ fontFamily: "'Playfair Display', serif" }}>
              The Old <span className="gradient-text">Post</span>
            </span>
          </Link>

          {/* Toggle - Login / Signup */}
          <div
            className="flex bg-[#c4956a]/[0.04] border border-[#c4956a]/10 rounded-lg p-1 mb-8"
            id="auth-toggle"
          >
            <button
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all duration-300 cursor-pointer ${
                isLogin
                  ? "bg-gradient-to-r from-[#c4956a] to-[#8b7355] text-[#1a1510] shadow-lg shadow-[#c4956a]/15"
                  : "text-[#6d6354] hover:text-[#a0947e]"
              }`}
              onClick={() => setIsLogin(true)}
              id="toggle-login"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all duration-300 cursor-pointer ${
                !isLogin
                  ? "bg-gradient-to-r from-[#c4956a] to-[#8b7355] text-[#1a1510] shadow-lg shadow-[#c4956a]/15"
                  : "text-[#6d6354] hover:text-[#a0947e]"
              }`}
              onClick={() => setIsLogin(false)}
              id="toggle-signup"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Join the Post
            </button>
          </div>

          {/* Header Text */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#e8dcc8] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              {isLogin ? "Welcome back, trader" : "Join the trading post"}
            </h1>
            <p className="text-sm text-[#6d6354]" style={{ fontFamily: "'Lora', serif" }}>
              {isLogin
                ? "Pick up where you left off. The fields await."
                : "Create your ledger and start watching the markets."}
            </p>
          </div>

          {/* Divider */}
          <div className="ornament-divider mb-6">
            <span className="text-xs text-[#6d6354]">✦</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" id="auth-form">
            {/* Name (signup only) */}
            {!isLogin && (
              <div className="animate-fade-in">
                <label
                  htmlFor="name"
                  className="block text-sm text-[#a0947e] mb-2 font-medium"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Greenfield"
                  className="w-full px-4 py-3.5 rounded-lg bg-[#c4956a]/[0.04] border border-[#c4956a]/10 text-[#e8dcc8] placeholder:text-[#4a4338] focus:outline-none focus:border-[#c4956a]/30 transition-all duration-300 text-sm"
                  style={{ fontFamily: "'Lora', serif" }}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm text-[#a0947e] mb-2 font-medium"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@countryside.com"
                className="w-full px-4 py-3.5 rounded-lg bg-[#c4956a]/[0.04] border border-[#c4956a]/10 text-[#e8dcc8] placeholder:text-[#4a4338] focus:outline-none focus:border-[#c4956a]/30 transition-all duration-300 text-sm"
                required
                style={{ fontFamily: "'Lora', serif" }}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="text-sm text-[#a0947e] font-medium"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Password
                </label>
                {isLogin && (
                  <a
                    href="#"
                    className="text-xs text-[#c4956a] hover:text-[#dab896] transition-colors"
                    id="forgot-password"
                    style={{ fontFamily: "'Lora', serif" }}
                  >
                    Lost your key?
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 pr-12 py-3.5 rounded-lg bg-[#c4956a]/[0.04] border border-[#c4956a]/10 text-[#e8dcc8] placeholder:text-[#4a4338] focus:outline-none focus:border-[#c4956a]/30 transition-all duration-300 text-sm"
                  required
                  style={{ fontFamily: "'Lora', serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6d6354] hover:text-[#a0947e] transition-colors cursor-pointer text-sm"
                  id="toggle-password-visibility"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary w-full !py-3.5 !text-base !mt-6"
              id="auth-submit"
            >
              {isLogin ? "Enter the Post" : "Create My Ledger"}
            </button>
          </form>

          {/* Terms (signup only) */}
          {!isLogin && (
            <p className="text-xs text-[#6d6354] text-center mt-4 leading-relaxed italic" style={{ fontFamily: "'Lora', serif" }}>
              By joining, you agree to our{" "}
              <a href="#" className="text-[#c4956a] hover:underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="text-[#c4956a] hover:underline">
                Privacy
              </a>
              .
            </p>
          )}

          {/* Back to home */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm text-[#6d6354] hover:text-[#c4956a] transition-colors duration-300"
              style={{ fontFamily: "'Lora', serif" }}
            >
              ← Back to the fields
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
