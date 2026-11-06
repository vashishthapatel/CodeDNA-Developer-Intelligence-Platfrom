import { useState, useEffect } from 'react';
import { Dna, Github, Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { createGitHubOAuthUrl } from '../../lib/githubOAuth';

const navLinks = [
  { label: 'Platform', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Technology', href: '#technology' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const connectGitHub = () => window.location.assign(createGitHubOAuthUrl());

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0B100D]/90 backdrop-blur-xl border-b border-[rgba(241,238,229,0.10)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand - matches Dashboard TopNav */}
          <a href="#" className="flex items-center gap-2.5 group select-none shrink-0">
            <span className="w-9 h-9 rounded-[10px] grid place-items-center bg-gradient-to-br from-[#B99A5D] to-[#8F7545] text-[#0B100D] border border-[#B99A5D]/40 shadow-[0_2px_14px_-2px_rgba(185,154,93,0.35)] transition-transform group-hover:scale-105 duration-200">
              <Dna className="w-5 h-5 text-[#0B100D]" />
            </span>
            <span className="font-display text-[1.35rem] tracking-tight text-[#F1EEE5]">
              Code<span className="text-[#B99A5D] italic">DNA</span>
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#121A15]/80 border border-[rgba(241,238,229,0.08)] backdrop-blur-md">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[#A0AA9D] hover:text-[#F1EEE5] hover:bg-[#1B2820] rounded-full transition-all duration-180"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={connectGitHub}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#A0AA9D] hover:text-[#F1EEE5] transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={connectGitHub}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#B99A5D] to-[#8F7545] text-[#0B100D] font-bold text-xs tracking-wide px-4 py-2 border border-[#B99A5D]/60 shadow-[0_4px_16px_-2px_rgba(185,154,93,0.4)] hover:brightness-110 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Connect GitHub</span>
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="sm:hidden p-2 rounded-lg text-[#F1EEE5] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed inset-0 z-40 bg-[#0B100D]/95 backdrop-blur-2xl flex flex-col pt-24 pb-8 px-6 transition-all duration-300 md:hidden ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col gap-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-lg font-medium text-[#A0AA9D] hover:text-[#F1EEE5] py-3 border-b border-[rgba(241,238,229,0.06)] flex items-center justify-between"
            >
              <span>{link.label}</span>
              <ArrowRight className="w-4 h-4 opacity-40" />
            </a>
          ))}
        </div>

        <div className="mt-auto space-y-3 pt-6 border-t border-[rgba(241,238,229,0.08)]">
          <div className="flex items-center gap-2 mb-2 text-xs text-[#A0AA9D]">
            <Sparkles className="w-3.5 h-3.5 text-[#B99A5D]" />
            <span>Developer Intelligence Atelier</span>
          </div>
          <button
            type="button"
            onClick={connectGitHub}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#B99A5D] to-[#8F7545] text-[#0B100D] font-bold text-sm tracking-wide px-5 py-3.5 border border-[#B99A5D]/60 shadow-[0_4px_16px_-2px_rgba(185,154,93,0.4)]"
          >
            <Github className="w-4 h-4" />
            <span>Connect with GitHub</span>
          </button>
          <a
            href="app.html"
            className="w-full inline-flex items-center justify-center py-2.5 text-xs text-[#A0AA9D] hover:text-[#F1EEE5]"
          >
            Explore Dashboard Demo
          </a>
        </div>
      </div>
    </>
  );
}
