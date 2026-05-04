import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userInitial = currentUser?.email?.charAt(0).toUpperCase() ?? "U";
  const userEmail = currentUser?.email ?? "";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <nav className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-800">CaloriAI</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/app"
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${location.pathname === "/app" || location.pathname === "/" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50"}`}
            >
              {t("dashboardNav")}
            </Link>
            <Link
              to="/family"
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${location.pathname === "/family" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50"}`}
            >
              {t("familyNav")}
            </Link>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setLanguage("es")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${language === "es" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${language === "en" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-800"
            aria-label={isDark ? t("switchToLight") : t("switchToDark")}
            title={isDark ? t("switchToLight") : t("switchToDark")}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0-1.414 1.414M7.05 16.95l-1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3c-.07.33-.11.67-.11 1.01a7 7 0 009.9 6.38z" />
              </svg>
            )}
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
                type="button"
              onClick={() => setMenuOpen(!menuOpen)}
                className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            >
                {menuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="hidden sm:flex items-center gap-2 py-1.5 px-3 rounded-xl hover:bg-slate-50 transition"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label={t("connectedAs")}
              >
              <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">
                {userInitial}
              </div>
              <span className="hidden sm:block text-sm text-slate-600 max-w-[140px] truncate">{userEmail}</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

              {menuOpen && (
                <div className="hidden sm:block absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs text-slate-500">{t("connectedAs")}</p>
                  <p className="text-sm font-medium text-slate-700 truncate">{userEmail || t("connectedAsFallback")}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t("signOut")}
                </button>
              </div>
            )}

              <div
                className={`sm:hidden fixed inset-0 z-[60] transition-opacity duration-300 ${menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                aria-hidden={!menuOpen}
              >
                <button
                  type="button"
                  className="absolute inset-0 bg-slate-950/55"
                  onClick={() => setMenuOpen(false)}
                  aria-label={t("cancel")}
                />

                <div
                  className={`absolute inset-0 bg-white px-6 pt-6 pb-8 flex flex-col transform transition-transform duration-300 ease-out ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">{t("connectedAs")}</p>
                      <p className="text-base font-semibold text-slate-800 mt-1 truncate max-w-[220px]">{userEmail || t("connectedAsFallback")}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMenuOpen(false)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                      aria-label={t("cancel")}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-8 space-y-3">
                    <Link
                      to="/app"
                      onClick={() => setMenuOpen(false)}
                      className={`block rounded-2xl px-4 py-4 text-base font-semibold transition ${location.pathname === "/app" || location.pathname === "/" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700"}`}
                    >
                      {t("dashboardNav")}
                    </Link>
                    <Link
                      to="/family"
                      onClick={() => setMenuOpen(false)}
                      className={`block rounded-2xl px-4 py-4 text-base font-semibold transition ${location.pathname === "/family" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700"}`}
                    >
                      {t("familyNav")}
                    </Link>
                  </div>

                  <div className="mt-8">
                    <p className="text-sm text-slate-500 mb-3">{t("language")}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setLanguage("es")}
                        className={`px-4 py-3 text-sm font-semibold rounded-xl transition ${language === "es" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"}`}
                      >
                        {t("spanish")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage("en")}
                        className={`px-4 py-3 text-sm font-semibold rounded-xl transition ${language === "en" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"}`}
                      >
                        {t("english")}
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {t("signOut")}
                    </button>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
