import { Dna, Github, Twitter, Linkedin } from 'lucide-react';

const footerLinks = {
  Platform: ['Overview', 'Atelier Live', 'Radar Profile', 'RefactorIQ', 'Developer Archetypes'],
  Intelligence: ['4-Axis Scoring', 'Archetype Engine', 'Commit Cadence', 'Telemetry API'],
  Company: ['About CodeDNA', 'Engineering Manifesto', 'Security & OAuth', 'Privacy Policy'],
};

export function Footer() {
  return (
    <footer className="relative border-t border-[rgba(241,238,229,0.08)] bg-[#0B100D]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 mb-12 sm:mb-16">
          {/* Logo + Tagline */}
          <div className="sm:col-span-2">
            <a href="#" className="inline-flex items-center gap-2.5 group mb-4">
              <span className="w-8 h-8 rounded-[9px] grid place-items-center bg-gradient-to-br from-[#B99A5D] to-[#8F7545] text-[#0B100D] border border-[#B99A5D]/40 shadow-[0_2px_12px_rgba(185,154,93,0.3)]">
                <Dna className="w-4 h-4 text-[#0B100D]" />
              </span>
              <span className="font-display text-xl tracking-tight text-[#F1EEE5]">
                Code<span className="text-[#B99A5D] italic">DNA</span>
              </span>
            </a>
            <p className="text-xs sm:text-sm text-[#A0AA9D] leading-relaxed max-w-xs">
              The luxury developer intelligence platform that transforms raw git telemetry into a
              measurable executive engineering fingerprint.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-2.5 mt-5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="w-8 h-8 rounded-lg border border-[rgba(241,238,229,0.10)] bg-[#121A15] grid place-items-center text-[#A0AA9D] hover:text-[#D1B678] hover:border-[#B99A5D]/40 transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="w-8 h-8 rounded-lg border border-[rgba(241,238,229,0.10)] bg-[#121A15] grid place-items-center text-[#A0AA9D] hover:text-[#D1B678] hover:border-[#B99A5D]/40 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-lg border border-[rgba(241,238,229,0.10)] bg-[#121A15] grid place-items-center text-[#A0AA9D] hover:text-[#D1B678] hover:border-[#B99A5D]/40 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-mono text-[11px] font-bold text-[#F1EEE5] uppercase tracking-luxe mb-4">
                {category}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-xs sm:text-sm text-[#A0AA9D] hover:text-[#F1EEE5] transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 sm:pt-8 border-t border-[rgba(241,238,229,0.06)] text-xs text-[#A0AA9D]">
          <p>© {new Date().getFullYear()} CodeDNA Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-[#F1EEE5] transition-colors">
              Privacy Notice
            </a>
            <a href="#" className="hover:text-[#F1EEE5] transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-[#F1EEE5] transition-colors">
              Security
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#80917B] animate-pulse" />
            <span className="font-mono text-[11px]">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
