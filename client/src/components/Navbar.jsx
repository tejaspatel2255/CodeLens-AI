import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Terminal, History, Menu, X, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { sidebarOpen, setSidebarOpen } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Analyze Code', href: '/analyze' },
    { name: 'History', href: '/history' },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full glass-card border-t-0 border-x-0 border-b border-border/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Branding */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accentCyan to-accentPurple p-[1px] shadow-lg shadow-accentCyan/10 transition-all duration-300 group-hover:scale-105">
                <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-background">
                  <Terminal className="h-5 w-5 text-accentCyan group-hover:text-accentPurple transition-colors duration-300" />
                </div>
              </div>
              <span className="font-heading text-lg font-extrabold tracking-wide bg-gradient-to-r from-accentCyan via-textMain to-accentPurple bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
                CodeLens <span className="text-accentCyan font-body font-light">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
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

            <div className="h-4 w-[1px] bg-border/50"></div>

            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
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
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg px-2 pt-2 pb-4 space-y-1 shadow-2xl">
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
        </div>
      )}
    </nav>
  );
}
