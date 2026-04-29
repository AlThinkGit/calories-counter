import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";

import AuthPage from "./views/AuthPages";
import CaloriesCounter from "./views/CaloriesCounter";
import FamilyMembersPage from "./views/FamilyMembersPage";

const PrivateRoute = ({ element }: { element: React.ReactElement }) => {
  const { currentUser, authLoading } = useAuth();
  const { t } = useLanguage();
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">{t("loading")}</p>
        </div>
      </div>
    );
  }
  return currentUser ? element : <Navigate to="/auth" replace />;
};

const Router: React.FC = () => (
  <LanguageProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<PrivateRoute element={<CaloriesCounter />} />} />
          <Route path="/app" element={<PrivateRoute element={<CaloriesCounter />} />} />
          <Route path="/family" element={<PrivateRoute element={<FamilyMembersPage />} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </LanguageProvider>
);

export default Router;


