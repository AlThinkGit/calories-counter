import { useState, useContext, useEffect } from "react";
import LoginForm from "../components/forms/LoginForm";
import RegisterForm from "../components/forms/RegisterForm";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
  const [view, setView] = useState<"login" | "register">("login");
  const { login, register, loading, error, currentUser } = useContext(AuthContext);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) navigate("/", { replace: true });
  }, [currentUser, navigate]);

  const handleLogin = async (email: string, password: string, rememberSession: boolean) => {
    try {
      await login(email, password, rememberSession);
    } catch {
      // error shown via context
    }
  };

  const handleRegister = async (payload: { email: string; password: string; nickname: string }) => {
    try {
      await register(payload);
    } catch {
      // error shown via context
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl shadow-lg mb-4">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">CaloriAI</h1>
          <p className="text-slate-500 mt-1">{t("brandTagline")}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-7">
            <button
              onClick={() => setView("login")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                view === "login"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t("signIn")}
            </button>
            <button
              onClick={() => setView("register")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                view === "register"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t("createAccount")}
            </button>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              {view === "login" ? t("welcomeBack") : t("createYourAccount")}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {view === "login"
                ? t("signInContinue")
                : t("startTrackingToday")}
            </p>
          </div>

          {view === "login" ? (
            <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
          ) : (
            <RegisterForm onSubmit={handleRegister} loading={loading} error={error} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

