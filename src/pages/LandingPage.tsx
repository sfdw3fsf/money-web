import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

/* ===== Section Components ===== */

function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-indigo-300 font-medium">Now in Public Beta — Join 10,000+ creators</span>
        </div>

        {/* Heading */}
        <h1 className="animate-fade-in-up delay-100 opacity-0 text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6">
          Turn Your Ideas Into
          <br />
          <span className="gradient-text">Revenue Online</span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up delay-200 opacity-0 text-lg sm:text-xl text-[#8b8b9e] max-w-2xl mx-auto mb-10 leading-relaxed">
          The all-in-one platform to build, launch, and scale your online business.
          From landing pages to payments — everything you need in one place.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up delay-300 opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/login" className="btn-primary text-lg !px-10 !py-4 flex items-center gap-2" id="hero-cta-primary">
            Start Building Free
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a href="#how-it-works" className="btn-secondary text-lg !px-10 !py-4" id="hero-cta-secondary">
            See How It Works
          </a>
        </div>

        {/* Stats */}
        <div className="animate-fade-in-up delay-400 opacity-0 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { value: '10K+', label: 'Active Users' },
            { value: '$2M+', label: 'Revenue Generated' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-xs sm:text-sm text-[#5a5a6e] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      title: 'Lightning Fast Builder',
      description: 'Drag-and-drop page builder with 50+ templates. Launch your online store or landing page in minutes, not days.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      ),
      title: 'Seamless Payments',
      description: 'Accept payments globally with Stripe, PayPal, and crypto. Automatic invoicing and tax calculation built-in.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      title: 'Advanced Analytics',
      description: 'Real-time dashboards, conversion tracking, and AI-powered insights to optimize your revenue streams.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      ),
      title: 'AI Content Writer',
      description: 'Generate high-converting copy, product descriptions, and marketing emails with our built-in AI assistant.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
      title: 'Enterprise Security',
      description: 'SOC 2 compliant infrastructure with end-to-end encryption. Your data and your customers\' data stays safe.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      title: 'Team Collaboration',
      description: 'Invite team members, assign roles, and collaborate in real-time. Built for teams of 1 to 1,000.',
    },
  ]

  return (
    <section id="features" className="relative py-28 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-indigo-400 tracking-wider uppercase">Features</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-5">
            Everything You Need to <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-[#8b8b9e] text-lg max-w-2xl mx-auto">
            Powerful tools designed to help you build, grow, and monetize your online presence.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              id={`feature-card-${i}`}
              className="group relative p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-indigo-500/20 transition-all duration-500 cursor-default"
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:bg-indigo-500/15 group-hover:scale-110 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-[#8b8b9e] leading-relaxed">{feature.description}</p>
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
      title: 'Create Your Account',
      description: 'Sign up in 30 seconds. No credit card required. Start building immediately with our free plan.',
    },
    {
      step: '02',
      title: 'Build Your Product',
      description: 'Use our drag-and-drop builder to create your website, landing page, or online store. Choose from 50+ premium templates.',
    },
    {
      step: '03',
      title: 'Connect Payments',
      description: 'Link your Stripe or PayPal account in one click. Start accepting payments from customers worldwide.',
    },
    {
      step: '04',
      title: 'Launch & Scale',
      description: 'Go live with one click. Use our analytics and marketing tools to grow your audience and maximize revenue.',
    },
  ]

  return (
    <section id="how-it-works" className="relative py-28 px-6">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px]" />

      <div className="relative max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <span className="text-sm font-semibold text-indigo-400 tracking-wider uppercase">How It Works</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-5">
            From Zero to <span className="gradient-text">Revenue</span>
          </h2>
          <p className="text-[#8b8b9e] text-lg max-w-2xl mx-auto">
            Four simple steps to launch your money-making machine.
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
              <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                <span className="text-2xl font-bold gradient-text">{s.step}</span>
              </div>

              {/* Content */}
              <div className={`flex-1 ${i % 2 !== 0 ? 'md:text-right' : ''}`}>
                <h3 className="text-xl font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-[#8b8b9e] leading-relaxed">{s.description}</p>
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
      name: 'Starter',
      price: '$0',
      period: '/forever',
      description: 'Perfect for getting started and testing the waters.',
      features: [
        '1 Website',
        '1,000 Visitors/mo',
        'Basic Analytics',
        'Community Support',
        'SSL Certificate',
      ],
      cta: 'Start Free',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      description: 'For serious creators ready to monetize.',
      features: [
        'Unlimited Websites',
        '100,000 Visitors/mo',
        'Advanced Analytics',
        'Priority Support',
        'Custom Domain',
        'Payment Processing',
        'AI Content Writer',
        'A/B Testing',
      ],
      cta: 'Start Pro Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      description: 'For teams and businesses at scale.',
      features: [
        'Everything in Pro',
        'Unlimited Visitors',
        'Team Collaboration',
        'Dedicated Account Manager',
        'Custom Integrations',
        'SLA & Uptime Guarantee',
        'White-label Option',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ]

  return (
    <section id="pricing" className="relative py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-indigo-400 tracking-wider uppercase">Pricing</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-5">
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h2>
          <p className="text-[#8b8b9e] text-lg max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              id={`pricing-${plan.name.toLowerCase()}`}
              className={`relative rounded-2xl p-8 transition-all duration-500 ${
                plan.highlighted
                  ? 'bg-gradient-to-b from-indigo-500/10 to-purple-500/5 border-2 border-indigo-500/30 scale-[1.02] shadow-xl shadow-indigo-500/10'
                  : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}

              <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
              <p className="text-sm text-[#5a5a6e] mb-5">{plan.description}</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-[#5a5a6e] text-sm">{plan.period}</span>
              </div>

              <Link
                to="/login"
                className={`block text-center w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                  plan.highlighted
                    ? 'btn-primary'
                    : 'bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.08] hover:border-indigo-500/30'
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-[#8b8b9e]">
                    <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
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
      name: 'Sarah Chen',
      role: 'Founder, DesignFlow',
      avatar: 'SC',
      text: 'MoneyWeb transformed my side project into a full-time business. I went from $0 to $15K/month in just 3 months using their platform.',
      color: 'from-pink-500 to-rose-500',
    },
    {
      name: 'Marcus Johnson',
      role: 'Content Creator',
      avatar: 'MJ',
      text: 'The AI content writer alone is worth the subscription. It saves me hours every week and my conversion rates have doubled.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Priya Patel',
      role: 'E-commerce Owner',
      avatar: 'PP',
      text: 'I tried 5 different platforms before MoneyWeb. Nothing compares. The payment integration was seamless and support is incredible.',
      color: 'from-amber-500 to-orange-500',
    },
  ]

  return (
    <section id="testimonials" className="relative py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-indigo-400 tracking-wider uppercase">Testimonials</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-5">
            Loved by <span className="gradient-text">Creators</span>
          </h2>
          <p className="text-[#8b8b9e] text-lg max-w-2xl mx-auto">
            See what real people are saying about their experience with MoneyWeb.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="group relative p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/20 transition-all duration-500"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-sm text-[#8b8b9e] leading-relaxed mb-6 italic">"{t.text}"</p>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-bold`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-[#5a5a6e]">{t.role}</div>
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/10 rounded-full blur-[120px]" />

        <div className="relative z-10 p-12 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Making Money Online?
          </h2>
          <p className="text-[#8b8b9e] text-lg mb-8 max-w-xl mx-auto">
            Join 10,000+ creators who are already building their dream business with MoneyWeb.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" className="btn-primary text-lg !px-10 !py-4" id="cta-primary">
              Get Started — It's Free
            </Link>
            <span className="text-sm text-[#5a5a6e]">No credit card required</span>
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
