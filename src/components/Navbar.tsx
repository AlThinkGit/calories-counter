import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
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

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 py-1.5 px-3 rounded-xl hover:bg-slate-50 transition"
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
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs text-slate-500">{t("connectedAs")}</p>
                  <p className="text-sm font-medium text-slate-700 truncate">{userEmail || t("connectedAsFallback")}</p>
                </div>
                <div className="sm:hidden px-4 py-3 border-b border-slate-100 space-y-2">
                  <div className="space-y-2 pb-2 border-b border-slate-100">
                    <Link to="/app" onClick={() => setMenuOpen(false)} className="block text-sm text-slate-600 hover:text-slate-900 transition">
                      {t("dashboardNav")}
                    </Link>
                    <Link to="/family" onClick={() => setMenuOpen(false)} className="block text-sm text-slate-600 hover:text-slate-900 transition">
                      {t("familyNav")}
                    </Link>
                  </div>
                  <p className="text-xs text-slate-500">{t("language")}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage("es")}
                      className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition ${language === "es" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      {t("spanish")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage("en")}
                      className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition ${language === "en" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      {t("english")}
                    </button>
                  </div>
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
