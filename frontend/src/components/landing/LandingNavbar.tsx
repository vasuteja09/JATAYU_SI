import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '#home', isExternal: false },
  { label: 'How It Works', href: '#how-it-works', isExternal: false },
  { label: 'Features', href: '#features', isExternal: false },
  { label: 'Maintenance Planning', href: '/app/schedule', isExternal: true },
  { label: 'Department Portals', href: '#department-access', isExternal: false },
];

export const LandingNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 border-b border-slate-200/80 shadow-xs backdrop-blur-md' : 'bg-white/70 backdrop-blur-sm'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Main navigation">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group" aria-label="JATAYU Home">
          <div className="w-8 h-8 rounded-lg bg-aerospace-900 flex items-center justify-center shadow-xs overflow-hidden border border-aerospace-700">
            <img src="/eagle.svg" alt="JATAYU" className="w-6 h-6 object-contain p-0.5" />
          </div>
          <div>
            <span className="text-sm font-bold text-aerospace-900 tracking-tight">JATAYU</span>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider -mt-0.5">VIMAAN AI</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {navLinks.map((link) => (
            <li key={link.href}>
              {link.isExternal ? (
                <Link
                  to={link.href}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-aerospace-900 hover:bg-slate-100/60 transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  onClick={() => handleNavClick(link.href)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-aerospace-900 hover:bg-slate-100/60 transition-colors cursor-pointer"
                >
                  {link.label}
                </button>
              )}
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => handleNavClick('#department-access')}
            className="bg-aerospace-900 hover:bg-aerospace-800 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
          >
            Access Portal
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-aerospace-900 hover:bg-slate-100 transition-colors cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="md:hidden bg-white/95 border-t border-slate-100 px-4 py-3 space-y-1 shadow-lg backdrop-blur-md"
        >
          {navLinks.map((link) => (
            link.isExternal ? (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="block w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {link.label}
              </button>
            )
          ))}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => handleNavClick('#department-access')}
              className="w-full bg-aerospace-900 hover:bg-aerospace-800 text-white font-semibold px-4 py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Access Portal
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
