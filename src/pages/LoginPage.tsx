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
    <div
      className="relative grid lg:grid-cols-2"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      {/* Left Side — Decorative */}
      <div className="hidden lg:grid relative overflow-hidden bg-[#0d0d14] place-items-center">
        {/* Gradient Orbs */}
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px]" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 px-12 xl:px-16 max-w-xl">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-10 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
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
            <span className="text-xl font-bold text-white">
              Money<span className="gradient-text">Web</span>
            </span>
          </Link>

          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            Start building your
            <br />
            <span className="gradient-text">revenue engine</span>
          </h2>
          <p className="text-[#8b8b9e] text-base leading-relaxed mb-8 max-w-md">
            Join thousands of creators who turned their ideas into thriving
            online businesses.
          </p>

          {/* Social Proof */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {["SC", "MJ", "PP", "AK"].map((initials, i) => {
                const colors = [
                  "from-pink-500 to-rose-500",
                  "from-blue-500 to-cyan-500",
                  "from-amber-500 to-orange-500",
                  "from-green-500 to-emerald-500",
                ];
                return (
                  <div
                    key={initials}
                    className={`w-9 h-9 rounded-full bg-gradient-to-br ${colors[i]} flex items-center justify-center text-white text-xs font-bold border-2 border-[#0d0d14]`}
                  >
                    {initials}
                  </div>
                );
              })}
            </div>
            <div>
              <div className="text-sm text-white font-medium">
                10,000+ creators
              </div>
              <div className="text-xs text-[#5a5a6e]">
                already building with MoneyWeb
              </div>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="mt-8 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-sm text-[#8b8b9e] italic leading-relaxed mb-4">
              "I launched my first digital product in less than a weekend. The
              platform is incredibly intuitive and the support team is amazing."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                SC
              </div>
              <div>
                <div className="text-xs font-semibold text-white">
                  Sarah Chen
                </div>
                <div className="text-xs text-[#5a5a6e]">$15K/mo revenue</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side — Form */}
      <div className="grid place-items-center px-6 bg-[#0a0a0f]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link
            to="/"
            className="lg:hidden flex items-center gap-3 mb-10 justify-center"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
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
            <span className="text-xl font-bold text-white">
              Money<span className="gradient-text">Web</span>
            </span>
          </Link>

          {/* Toggle - Login / Signup */}
          <div
            className="flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 mb-8"
            id="auth-toggle"
          >
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer ${
                isLogin
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20"
                  : "text-[#5a5a6e] hover:text-[#8b8b9e]"
              }`}
              onClick={() => setIsLogin(true)}
              id="toggle-login"
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer ${
                !isLogin
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20"
                  : "text-[#5a5a6e] hover:text-[#8b8b9e]"
              }`}
              onClick={() => setIsLogin(false)}
              id="toggle-signup"
            >
              Sign Up
            </button>
          </div>

          {/* Header Text */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-[#5a5a6e]">
              {isLogin
                ? "Enter your credentials to access your dashboard."
                : "Start your free account and begin building today."}
            </p>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-[#8b8b9e] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 cursor-pointer"
              id="google-login"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-[#8b8b9e] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 cursor-pointer"
              id="github-login"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-[#5a5a6e]">
              or continue with email
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" id="auth-form">
            {/* Name (signup only) */}
            {!isLogin && (
              <div className="animate-fade-in">
                <label
                  htmlFor="name"
                  className="block text-sm text-[#8b8b9e] mb-2 font-medium"
                >
                  Full Name
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a6e]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-[#3a3a4e] focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all duration-300 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm text-[#8b8b9e] mb-2 font-medium"
              >
                Email
              </label>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a6e]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-[#3a3a4e] focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all duration-300 text-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="text-sm text-[#8b8b9e] font-medium"
                >
                  Password
                </label>
                {isLogin && (
                  <a
                    href="#"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    id="forgot-password"
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a6e]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-[#3a3a4e] focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all duration-300 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a5a6e] hover:text-[#8b8b9e] transition-colors cursor-pointer"
                  id="toggle-password-visibility"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary w-full !py-3.5 !text-base !mt-6"
              id="auth-submit"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Terms (signup only) */}
          {!isLogin && (
            <p className="text-xs text-[#5a5a6e] text-center mt-4 leading-relaxed">
              By signing up, you agree to our{" "}
              <a href="#" className="text-indigo-400 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-indigo-400 hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          )}

          {/* Back to home */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm text-[#5a5a6e] hover:text-indigo-400 transition-colors duration-300"
            >
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
