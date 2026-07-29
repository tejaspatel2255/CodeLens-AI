import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Terminal, History, Menu, X, Sparkles, User, LogOut, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { sidebarOpen, setSidebarOpen, user, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  if (location.pathname === '/auth') {
    return null;
  }

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Analyze Code', href: '/analyze' },
    { name: 'Generate Code', href: '/generate' },
    { name: 'History', href: '/history' },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full glass-card border-t-0 border-x-0 border-b border-border/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Branding */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accentCyan to-accentPurple p-[1px] shadow-lg shadow-accentCyan/20 transition-all duration-300 group-hover:scale-105">
                <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-background/90 overflow-hidden backdrop-blur-sm p-1">
                  <img src="/codelens_logo.svg" alt="CodeLens Logo" className="h-full w-full object-contain transition-transform group-hover:scale-110" />
                </div>
              </div>
              <span className="font-heading text-xl font-extrabold tracking-wide bg-gradient-to-r from-accentCyan via-textMain to-accentPurple bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
                CodeLens <span className="text-accentCyan font-body font-light">AI</span>
              </span>
            </Link>

          </div>


          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex space-x-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-all duration-250 ${
                      isActive
                        ? 'text-accentCyan bg-surface2/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-border/40'
                        : 'text-mutedMain hover:text-textMain hover:bg-surface/50 border border-transparent'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>

            {/* Auditory Learning / AI Voice Tutor Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-accentPurple/10 border border-accentPurple/20 text-accentPurple text-[10px] font-black uppercase tracking-wider select-none animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-accentPurple shadow-[0_0_8px_rgba(124,109,250,0.8)]"></span>
              Voice Tutor Active
            </div>

            <div className="h-4 w-[1px] bg-border/50"></div>

            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                sidebarOpen
                  ? 'bg-accentCyan/10 border-accentCyan text-accentCyan shadow-[0_0_15px_rgba(0,245,196,0.15)]'
                  : 'bg-surface border-border text-textMain hover:border-accentCyan/50 hover:bg-surface2 hover:shadow-[0_0_10px_rgba(0,245,196,0.05)]'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>History</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentCyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accentCyan"></span>
              </span>
            </button>

            {/* Desktop Auth Section */}
            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-border/50">
                {/* Profile Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface2/60 border border-border/80" title={user.email}>
                  <div className="h-5 w-5 rounded-full bg-accentPurple/25 border border-accentPurple flex items-center justify-center text-[10px] font-black text-accentPurple select-none uppercase">
                    {user.email ? user.email[0] : 'U'}
                  </div>
                  <span className="text-xs text-textMain/80 font-bold max-w-[90px] truncate font-mono">
                    {user.email?.split('@')[0]}
                  </span>
                </div>
                
                {/* Sign Out Button */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-xl border border-border bg-surface hover:bg-accentRed/10 hover:border-accentRed/35 hover:text-accentRed transition-all duration-300 cursor-pointer"
                  title="Sign Out Cloud Session"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-accentCyan/30 bg-accentCyan/10 hover:border-accentCyan/60 hover:bg-accentCyan hover:text-background text-[10px] font-heading font-black uppercase tracking-widest transition-all duration-300 shadow-md shadow-accentCyan/5 cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu & Sidebar Buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-mutedMain hover:text-textMain hover:bg-surface"
              aria-label="Toggle history sidebar"
            >
              <History className="h-5 w-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-mutedMain hover:text-textMain hover:bg-surface border border-transparent"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg px-2 pt-2 pb-4 space-y-2 shadow-2xl">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                  isActive
                    ? 'text-accentCyan bg-surface2 border border-border/50'
                    : 'text-mutedMain hover:text-textMain hover:bg-surface'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}

          <div className="h-[1px] bg-border/40 my-2 mx-2"></div>

          {/* Mobile Auth Sections */}
          {user ? (
            <div className="px-4 py-2 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-accentPurple/25 border border-accentPurple flex items-center justify-center text-xs font-black text-accentPurple uppercase">
                  {user.email ? user.email[0] : 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-textMain">{user.email?.split('@')[0]}</span>
                  <span className="text-[10px] text-mutedMain">{user.email}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl border border-accentRed/30 bg-accentRed/5 text-accentRed font-heading text-xs font-black uppercase tracking-wider text-center cursor-pointer"
              >
                Sign Out Account
              </button>
            </div>
          ) : (
            <div className="px-2 pt-1">
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-3 rounded-xl bg-gradient-to-r from-accentCyan to-accentPurple text-background font-heading text-xs font-black uppercase tracking-widest text-center shadow-lg shadow-accentCyan/5 cursor-pointer"
              >
                Sign In Cloud
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
