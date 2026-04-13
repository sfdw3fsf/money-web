import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

/* ===== Section Components ===== */

function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Warm Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#c4956a]/[0.06] rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#8b7355]/[0.04] rounded-full blur-[120px]" style={{ animationDelay: '1s' }} />

      {/* Subtle Grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(196, 149, 106, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(196, 149, 106, 0.2) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#c4956a]/[0.08] border border-[#c4956a]/15 mb-8">
          <span className="text-sm">🌾</span>
          <span className="text-sm text-[#c4956a] font-medium" style={{ fontFamily: "'Lora', serif" }}>Now open — Patient traders welcome</span>
        </div>

        {/* Heading */}
        <h1
          className="animate-fade-in-up delay-100 opacity-0 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-6"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          From the Fields,
          <br />
          <span className="gradient-text italic">to the Charts</span>
        </h1>

        {/* Subtitle */}
        <p
          className="animate-fade-in-up delay-200 opacity-0 text-lg sm:text-xl text-[#a0947e] max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ fontFamily: "'Lora', serif" }}
        >
          A countryside trading post where patience meets precision.
          <br className="hidden sm:block" />
          AI-powered signals filtered by market wisdom, not market noise.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up delay-300 opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/dashboard" className="btn-primary text-lg !px-10 !py-4 flex items-center gap-2" id="hero-cta-primary">
            Enter the Trading Post
            <span>→</span>
          </Link>
          <a href="#the-method" className="btn-secondary text-lg !px-10 !py-4" id="hero-cta-secondary">
            Learn Our Method
          </a>
        </div>

        {/* Stats */}
        <div className="animate-fade-in-up delay-400 opacity-0 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { value: '80%', label: 'Code-Filtered' },
            { value: '6×', label: 'Lower API Cost' },
            { value: '1.5:1', label: 'Min Risk-Reward' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[#e8dcc8]" style={{ fontFamily: "'Playfair Display', serif" }}>{stat.value}</div>
              <div className="text-xs sm:text-sm text-[#6d6354] mt-1" style={{ fontFamily: "'Lora', serif" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1a1510] to-transparent" />
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: '🌾',
      title: 'Code-First Filtering',
      description: 'Market conditions are evaluated by code before AI ever sees them. Sideways markets, misaligned trends, and extreme RSI are rejected automatically.',
    },
    {
      icon: '📊',
      title: 'Dual Timeframe Watch',
      description: '5-minute and 15-minute candles must agree on trend direction. Misalignment means no signal — saving you from false entries.',
    },
    {
      icon: '🔔',
      title: 'Real-Time Telegram',
      description: 'When the fields look right and AI confirms, signals arrive on your Telegram with entry, TP, SL, and precise R:R ratios.',
    },
    {
      icon: '📒',
      title: 'Signal Journal',
      description: 'Every signal — traded or filtered — is logged. Track your win rate, consecutive losses, and optimize your approach over time.',
    },
    {
      icon: '⚖️',
      title: 'Risk-Reward Gate',
      description: 'Minimum 1.5:1 risk-reward ratio enforced on every signal. Bad R:R means no trade — protecting your capital automatically.',
    },
    {
      icon: '🛡️',
      title: 'Loss Pause System',
      description: 'After 3 consecutive losses, all analysis pauses automatically. Cool your head, let the market reset, and come back fresh.',
    },
  ]

  return (
    <section id="provisions" className="relative py-28 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="section-label">Provisions</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#e8dcc8] mt-3 mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
            Tools of the <span className="gradient-text italic">Trade</span>
          </h2>
          <p className="text-[#a0947e] text-lg max-w-2xl mx-auto" style={{ fontFamily: "'Lora', serif" }}>
            A well-stocked post for the patient trader. Every tool earns its keep.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              id={`feature-card-${i}`}
              className="group relative p-7 rounded-xl bg-[#231f18]/40 border border-[#c4956a]/8 hover:bg-[#231f18]/60 hover:border-[#c4956a]/15 transition-all duration-500 cursor-default"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-[#c4956a]/[0.08] border border-[#c4956a]/12 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#e8dcc8] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{feature.title}</h3>
                <p className="text-sm text-[#a0947e] leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'The Wire Comes In',
      description: 'Real-time market data streams via Binance WebSocket — both 5m and 15m candles arrive at the post.',
    },
    {
      step: '02',
      title: 'The Farmer Checks the Soil',
      description: 'Code-based indicators (EMA, RSI, volume) filter out 80% of market noise before AI is even consulted.',
    },
    {
      step: '03',
      title: 'The Sage Speaks',
      description: 'Once conditions align, Gemini AI confirms the entry, sets precise TP/SL levels, and estimates confidence.',
    },
    {
      step: '04',
      title: 'The Dispatch Rides Out',
      description: 'Signals that pass all gates (confidence ≥ 70%, R:R ≥ 1.5:1) are sent to your Telegram and logged in the journal.',
    },
  ]

  return (
    <section id="the-method" className="relative py-28 px-6">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c4956a]/[0.03] rounded-full blur-[150px]" />

      <div className="relative max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <span className="section-label">The Method</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#e8dcc8] mt-3 mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
            How the <span className="gradient-text italic">Post</span> Works
          </h2>
          <p className="text-[#a0947e] text-lg max-w-2xl mx-auto" style={{ fontFamily: "'Lora', serif" }}>
            Four careful steps. No rushing. Like planting season — timing is everything.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12">
          {steps.map((s, i) => (
            <div
              key={s.step}
              id={`step-${i}`}
              className={`flex flex-col md:flex-row items-center gap-8 ${
                i % 2 !== 0 ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Step Number */}
              <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-[#c4956a]/[0.08] border border-[#c4956a]/15 flex items-center justify-center">
                <span className="text-2xl font-bold gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>{s.step}</span>
              </div>

              {/* Content */}
              <div className={`flex-1 ${i % 2 !== 0 ? 'md:text-right' : ''}`}>
                <h3 className="text-xl font-semibold text-[#e8dcc8] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{s.title}</h3>
                <p className="text-[#a0947e] leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>{s.description}</p>
              </div>

              {/* Connector Line (hidden on last) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  const plans = [
    {
      name: 'The Apprentice',
      price: '$0',
      period: '/forever',
      description: 'Learn the ropes. Watch the fields.',
      features: [
        '1 Trading Pair',
        'Real-time Chart',
        'Basic Indicators',
        'Community Almanac',
        'Signal Journal',
      ],
      cta: 'Start Free',
      highlighted: false,
    },
    {
      name: 'The Farmer',
      price: '$29',
      period: '/month',
      description: 'Full access. Real harvests.',
      features: [
        'Unlimited Markets',
        'AI Signal Analysis',
        'Dual Timeframe Filtering',
        'Telegram Dispatches',
        'Full Signal Journal',
        'Risk-Reward Gate',
        'Loss Pause System',
        'Priority Carrier Pigeons',
      ],
      cta: 'Begin Farming',
      highlighted: true,
    },
    {
      name: 'The Estate',
      price: '$99',
      period: '/month',
      description: 'For serious operations.',
      features: [
        'Everything in Farmer',
        'Unlimited API Calls',
        'Team Collaboration',
        'Dedicated Field Agent',
        'Custom Strategies',
        'Uptime Guarantee',
        'White-label Option',
      ],
      cta: 'Contact the Guild',
      highlighted: false,
    },
  ]

  return (
    <section id="rates" className="relative py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="section-label">Rates</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#e8dcc8] mt-3 mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
            Honest, <span className="gradient-text italic">Fair</span> Rates
          </h2>
          <p className="text-[#a0947e] text-lg max-w-2xl mx-auto" style={{ fontFamily: "'Lora', serif" }}>
            No hidden fees. No surprises. Like a handshake at the market.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              id={`pricing-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
              className={`relative rounded-xl p-8 transition-all duration-500 ${
                plan.highlighted
                  ? 'bg-[#c4956a]/[0.08] border-2 border-[#c4956a]/25 scale-[1.02] shadow-xl shadow-[#c4956a]/10'
                  : 'bg-[#231f18]/40 border border-[#c4956a]/8 hover:border-[#c4956a]/15'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#c4956a] to-[#8b7355] text-xs font-semibold text-[#1a1510]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Best Harvest
                </div>
              )}

              <h3 className="text-lg font-semibold text-[#e8dcc8] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{plan.name}</h3>
              <p className="text-sm text-[#6d6354] mb-5" style={{ fontFamily: "'Lora', serif" }}>{plan.description}</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-[#e8dcc8]" style={{ fontFamily: "'Playfair Display', serif" }}>{plan.price}</span>
                <span className="text-[#6d6354] text-sm" style={{ fontFamily: "'Lora', serif" }}>{plan.period}</span>
              </div>

              <Link
                to="/login"
                className={`block text-center w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                  plan.highlighted
                    ? 'btn-primary'
                    : 'bg-[#c4956a]/[0.06] border border-[#c4956a]/12 text-[#e8dcc8] hover:bg-[#c4956a]/[0.1] hover:border-[#c4956a]/20'
                }`}
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {plan.cta}
              </Link>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-[#a0947e]" style={{ fontFamily: "'Lora', serif" }}>
                    <span className="text-[#7d9b6f] text-xs">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Thomas Greenfield',
      role: 'Swing Trader, 3 years',
      avatar: 'TG',
      text: 'The pre-filter saved me from so many bad trades. I used to overtrade every sideways market — now the Post just says "wait" and I listen.',
      color: 'from-[#7d9b6f] to-[#5a7a4c]',
    },
    {
      name: 'Mai Linh Pham',
      role: 'Crypto Analyst',
      avatar: 'ML',
      text: 'The dual timeframe alignment is genius. My win rate went from 45% to 62% in the first month. The countryside vibes are a bonus.',
      color: 'from-[#c4956a] to-[#8b7355]',
    },
    {
      name: 'James Whitaker',
      role: 'Day Trader',
      avatar: 'JW',
      text: 'I love the loss pause feature. After 3 bad trades it makes me step away. Saved my account more than once. Patience really is the farmer\'s tool.',
      color: 'from-[#b5594e] to-[#8b3e36]',
    },
  ]

  return (
    <section id="testimonials" className="relative py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="section-label">Testimonials</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#e8dcc8] mt-3 mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
            Word from the <span className="gradient-text italic">Fields</span>
          </h2>
          <p className="text-[#a0947e] text-lg max-w-2xl mx-auto" style={{ fontFamily: "'Lora', serif" }}>
            Honest words from honest traders who chose patience over haste.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="group relative p-7 rounded-xl bg-[#231f18]/40 border border-[#c4956a]/8 hover:border-[#c4956a]/15 transition-all duration-500"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-[#c4956a] text-sm">★</span>
                ))}
              </div>

              <p className="text-sm text-[#a0947e] leading-relaxed mb-6 italic" style={{ fontFamily: "'Lora', serif" }}>"{t.text}"</p>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center text-[#e8dcc8] text-sm font-bold`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#e8dcc8]" style={{ fontFamily: "'Playfair Display', serif" }}>{t.name}</div>
                  <div className="text-xs text-[#6d6354]" style={{ fontFamily: "'Lora', serif" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section id="cta" className="relative py-28 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#c4956a]/[0.06] rounded-full blur-[120px]" />

        <div className="relative z-10 p-12 rounded-2xl bg-[#c4956a]/[0.06] border border-[#c4956a]/15">
          <span className="text-4xl mb-4 block">🌻</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#e8dcc8] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            The Fields Are Waiting
          </h2>
          <p className="text-[#a0947e] text-lg mb-8 max-w-xl mx-auto" style={{ fontFamily: "'Lora', serif" }}>
            Step into the Old Trading Post. Patience rewarded, noise filtered, signals delivered.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard" className="btn-primary text-lg !px-10 !py-4" id="cta-primary">
              Enter the Post — It's Free
            </Link>
            <span className="text-sm text-[#6d6354] italic" style={{ fontFamily: "'Lora', serif" }}>No credit card needed</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ===== Landing Page ===== */

export default function LandingPage() {
  return (
    <div className="relative">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
