import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer id="site-footer" className="relative border-t border-[#c4956a]/10 bg-[#1a1510]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#c4956a] to-[#8b7355] flex items-center justify-center border border-[#c4956a]/30">
                <span className="text-sm">🌾</span>
              </div>
              <span className="text-lg font-bold text-[#e8dcc8]" style={{ fontFamily: "'Playfair Display', serif" }}>
                The Old <span className="gradient-text">Post</span>
              </span>
            </Link>
            <p className="text-sm text-[#6d6354] leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
              Patient trading, honest signals. Like a good harvest — it takes time, but the yield is worth it.
            </p>
          </div>

          {/* Links */}
          {[
            { title: 'The Post', links: ['Trading Floor', 'Signal Ledger', 'The Method', 'Almanac'] },
            { title: 'Community', links: ['About Us', 'Field Notes', 'Join the Guild', 'Write Us'] },
            { title: 'Fine Print', links: ['Privacy', 'Terms', 'Risk Notice', 'Disclaimers'] },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-[#c4956a] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-[#6d6354] hover:text-[#a0947e] transition-colors duration-300" style={{ fontFamily: "'Lora', serif" }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Ornament Divider */}
        <div className="ornament-divider mb-8">
          <span className="text-[#6d6354]">✦</span>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6d6354] italic" style={{ fontFamily: "'Lora', serif" }}>
            © {new Date().getFullYear()} The Old Trading Post. "Patience is the farmer's greatest tool."
          </p>
          <div className="flex items-center gap-3 text-xs text-[#6d6354]">
            <span>Est. 2024</span>
            <span>·</span>
            <span>Countryside Edition</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
