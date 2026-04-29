import React, { useState, useCallback, useEffect, useRef } from "react";
import { FoodCalorieInfo, FoodEntry, DailyLog } from "../../types";
import { analyzeImageForCalories } from "../../services/geminiService";
import {
  getTodayKey,
  getDailyLog,
  addFoodEntries,
  removeFoodEntry,
  getWeeklyLogs,
  updateFamilyMember,
} from "../../services/calorieLogService";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useFamilyMembers } from "../hooks/useFamilyMembers";
import Navbar from "../components/Navbar";
import CalorieResultCard from "../components/cards/CalorieResultCard";
import LoadingSpinner from "../components/loading/LoadingSpinner";

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ base64: result.split(",")[1], mimeType: file.type });
    };
    reader.onerror = reject;
  });

const CaloriesCounter: React.FC = () => {
  const { currentUser } = useAuth();
  const { language, t } = useLanguage();
  const uid = currentUser?.uid ?? "";

  // Image / analysis
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<FoodCalorieInfo[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Daily log / profile
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [weeklyLogs, setWeeklyLogs] = useState<DailyLog[]>([]);
  const [logLoading, setLogLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("2000");

  // Active tab
  const [activeTab, setActiveTab] = useState<"analyze" | "history">("analyze");

  const todayKey = getTodayKey();
  const {
    profile,
    profileLoading,
    activeMember,
    activeGoalCalories,
    reloadProfile,
  } = useFamilyMembers(uid);

  // Load data
  useEffect(() => {
    if (!uid) return;
    setLogLoading(true);
    const memberId = activeMember?.id;
    if (!memberId) {
      setDailyLog(null);
      setWeeklyLogs([]);
      setGoalInput("2000");
      setLogLoading(false);
      return;
    }

    setGoalInput(String(activeGoalCalories));
    Promise.all([
      getDailyLog(uid, memberId, todayKey),
      getWeeklyLogs(uid, memberId),
    ]).then(([log, weekly]) => {
      setDailyLog(log);
      setWeeklyLogs(weekly);
    }).finally(() => setLogLoading(false));
  }, [activeGoalCalories, activeMember?.id, profile.activeMemberId, profileLoading, todayKey, uid]);

  const refreshLog = async () => {
    if (!uid || !activeMember) return;
    const [log, weekly] = await Promise.all([
      getDailyLog(uid, activeMember.id, todayKey),
      getWeeklyLogs(uid, activeMember.id),
    ]);
    setDailyLog(log);
    setWeeklyLogs(weekly);
  };

  // Image handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnalyzeError(null);
    setAnalysisResults([]);
    if (isCameraOpen) closeCamera();
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setAnalyzeError(t("invalidFormat"));
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setAnalyzeError(t("cameraUnavailable"));
      return;
    }
    setAnalyzeError(null);
    setImageFile(null);
    setPreviewUrl(null);
    setAnalysisResults([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play();
        }
      }, 100);
    } catch (err: any) {
      if (err.name === "NotAllowedError") setAnalyzeError(t("cameraPermissionDenied"));
      else if (err.name === "NotFoundError") setAnalyzeError(t("cameraNotFound"));
      else setAnalyzeError(t("cameraAccessError"));
      setIsCameraOpen(false);
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOpen(false);
  };

  const handleTakePhoto = () => {
    if (!videoRef.current || !isCameraOpen) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
          setImageFile(file);
          setPreviewUrl(URL.createObjectURL(file));
          setAnalysisResults([]);
          closeCamera();
        }
      }, "image/jpeg", 0.9);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!imageFile) { setAnalyzeError(t("selectPhotoFirst")); return; }
    setIsAnalyzing(true);
    setAnalyzeError(null);
    setAnalysisResults([]);
    try {
      const { base64, mimeType } = await fileToBase64(imageFile);
      const data = await analyzeImageForCalories(base64, mimeType, language);
      if (!data.length) {
        setAnalyzeError(t("noFoodDetected"));
        return;
      }
      setAnalysisResults(data);
    } catch (err: any) {
      setAnalyzeError(err?.message ?? t("analyzeImageError"));
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, language, t]);

  const handleSaveToLog = async () => {
    if (!analysisResults.length || !uid || !activeMember) return;
    setIsSaving(true);
    try {
      await addFoodEntries(uid, activeMember.id, todayKey, analysisResults);
      await refreshLog();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      setAnalysisResults([]);
      setImageFile(null);
      setPreviewUrl(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEntry = async (entry: FoodEntry) => {
    if (!uid || !activeMember) return;
    await removeFoodEntry(uid, activeMember.id, todayKey, entry);
    await refreshLog();
  };

  const handleSaveGoal = async () => {
    if (!uid || !activeMember) return;
    const goal = parseInt(goalInput);
    if (isNaN(goal) || goal < 100) return;
    const updatedMember = await updateFamilyMember(uid, activeMember.id, {
      customDailyGoal: goal,
      useSuggestedGoal: false,
    });
    if (updatedMember) {
      await reloadProfile();
      setGoalInput(String(goal));
    }
    setEditGoal(false);
  };

  const handleUseSuggestedGoal = async () => {
    if (!uid || !activeMember) return;
    const updatedMember = await updateFamilyMember(uid, activeMember.id, {
      useSuggestedGoal: true,
    });
    if (updatedMember) {
      await reloadProfile();
      setGoalInput(String(updatedMember.suggestedDailyCalories));
      setEditGoal(false);
    }
  };

  const openGoalEditor = () => {
    setGoalInput(String(goalCalories));
    setEditGoal(true);
  };

  const closeGoalEditor = () => {
    setGoalInput(String(goalCalories));
    setEditGoal(false);
  };

  const adjustGoalInput = (delta: number) => {
    setGoalInput((current) => {
      const parsed = parseInt(current);
      const baseValue = Number.isNaN(parsed) ? goalCalories : parsed;
      return String(Math.max(100, Math.min(10000, baseValue + delta)));
    });
  };

  // Cleanup
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play();
    }
    if (!isCameraOpen && videoRef.current) videoRef.current.srcObject = null;
  }, [isCameraOpen]);

  useEffect(() => {
    if (!editGoal) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeGoalEditor();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editGoal]);

  const totalToday = dailyLog?.totalCalories ?? 0;
  const goalCalories = activeGoalCalories;
  const progressPct = Math.min(100, Math.round((totalToday / goalCalories) * 100));
  const remaining = Math.max(0, goalCalories - totalToday);
  const isOverGoal = totalToday > goalCalories;

  const analysisTotal = analysisResults.reduce((s, i) => s + i.caloriesPerItem * i.quantity, 0);

  const dayLabels = language === "es"
    ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {!activeMember ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
            <h2 className="text-xl font-bold text-slate-800">{t("noActiveMemberTitle")}</h2>
            <p className="text-slate-500 mt-2">{t("noActiveMemberBody")}</p>
          </div>
        ) : (
          <>
        {/* Daily summary card */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-emerald-100 text-sm font-medium">{t("activeMemberSummary")} {activeMember.name}</p>
              <p className="text-emerald-100 text-sm font-medium uppercase tracking-wide">{t("today")} · {todayKey}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-5xl font-bold">{totalToday.toLocaleString()}</span>
                <span className="text-emerald-200 text-lg">/ {goalCalories.toLocaleString()} kcal</span>
              </div>
              <p className={`mt-1 text-sm font-medium ${isOverGoal ? "text-orange-200" : "text-emerald-100"}`}>
                {isOverGoal
                  ? `${(totalToday - goalCalories).toLocaleString()} ${t("kcalOverGoal")}`
                  : `${remaining.toLocaleString()} ${t("kcalRemaining")}`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-emerald-50">
                <span className="px-2 py-1 rounded-full bg-white/15">{t("currentWeight")}: {activeMember.weightKg} kg</span>
                <span className="px-2 py-1 rounded-full bg-white/15">{t("targetWeight")}: {activeMember.targetWeightKg} kg</span>
                <span className="px-2 py-1 rounded-full bg-white/15">{t(`weightGoal.${activeMember.weightGoal}`)}</span>
              </div>
            </div>

            {/* Progress ring */}
            <div className="flex-shrink-0 relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <circle
                  cx="44" cy="44" r="36" fill="none"
                  stroke={isOverGoal ? "#fb923c" : "white"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressPct / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">{progressPct}%</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isOverGoal ? "bg-orange-400" : "bg-white"}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Edit goal */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="px-2 py-1 rounded-full bg-white/15 text-white">{activeMember.useSuggestedGoal ? t("suggestedGoal") : t("customGoal")}</span>
              <button onClick={openGoalEditor} className="flex items-center gap-1 text-xs text-emerald-200 hover:text-white transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t("dailyGoalEdit")}
              </button>
              {!activeMember.useSuggestedGoal && (
                <button onClick={handleUseSuggestedGoal} className="text-xs text-emerald-200 hover:text-white transition">
                  {t("useSuggestedGoal")}
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-emerald-100">{t("suggestionBasedOnGoal")}</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
          <button
            onClick={() => setActiveTab("analyze")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === "analyze" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t("analyzePhoto")}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === "history" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {t("dayLog")}
          </button>
        </div>

        {activeTab === "analyze" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Image input */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
              <h2 className="text-lg font-bold text-slate-800">📸 {t("mealPhoto")}</h2>

              {/* Camera view */}
              {isCameraOpen && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <button
                    onClick={handleTakePhoto}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition"
                  >
                    <div className="w-10 h-10 bg-emerald-500 rounded-full" />
                  </button>
                </div>
              )}

              {/* Preview */}
              {previewUrl && !isCameraOpen && (
                <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-100">
                  <img src={previewUrl} alt={t("previewAlt")} className="w-full h-full object-contain" />
                  <button
                    onClick={() => { setPreviewUrl(null); setImageFile(null); setAnalysisResults([]); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-slate-800/60 hover:bg-slate-800 text-white rounded-full flex items-center justify-center transition text-xs"
                    aria-label={t("removeImage")}
                  >✕</button>
                </div>
              )}

              {/* Placeholder */}
              {!previewUrl && !isCameraOpen && (
                <label htmlFor="imageUpload" className="flex flex-col items-center justify-center gap-3 h-40 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition">
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-600">{t("clickUploadImage")}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t("supportedFormats")}</p>
                  </div>
                </label>
              )}
              <input id="imageUpload" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} className="hidden" />

              {/* Camera toggle */}
              <button
                onClick={isCameraOpen ? closeCamera : openCamera}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition ${
                  isCameraOpen
                    ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {isCameraOpen ? t("closeCamera") : t("useCamera")}
              </button>

              {/* Analyze button */}
              <button
                onClick={handleAnalyze}
                disabled={!imageFile || isAnalyzing}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition shadow-sm hover:shadow-md"
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t("analyzingAI")}
                  </span>
                ) : (
                  `✨ ${t("analyzeCalories")}`
                )}
              </button>

              {analyzeError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {analyzeError}
                </div>
              )}
            </div>

            {/* Right: Results */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-800">🔍 {t("analysisResults")}</h2>

              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <LoadingSpinner />
                  <p className="text-slate-500 text-sm">{t("aiAnalyzingPhoto")}</p>
                </div>
              )}

              {!isAnalyzing && analysisResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-5xl mb-3">🍽️</div>
                  <p className="text-slate-500 text-sm">{t("uploadAndPress")}<br />«{t("analyzeCalories")}» {t("startToBegin")}</p>
                </div>
              )}

              {!isAnalyzing && analysisResults.length > 0 && (
                <>
                  <p className="text-xs text-slate-500">{t("clickResultHint")}</p>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {analysisResults.map((item, i) => (
                      <CalorieResultCard key={i} item={item} />
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold text-slate-700">{t("estimatedTotal")}</span>
                      <span className="text-2xl font-bold text-orange-500">{analysisTotal.toLocaleString()} kcal</span>
                    </div>

                    {savedSuccess ? (
                      <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-semibold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {t("savedToLog")}
                      </div>
                    ) : (
                      <button
                        onClick={handleSaveToLog}
                        disabled={isSaving}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition shadow-sm hover:shadow-md"
                      >
                        {isSaving ? t("saving") : `💾 ${t("saveToLog")}`}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-5">
            {/* Weekly summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">📅 {t("last7Days")}</h2>
              <div className="flex gap-2 justify-between">
                {weeklyLogs.map((log) => {
                  const d = new Date(log.date + "T12:00:00");
                  const isToday = log.date === todayKey;
                  const pct = Math.min(100, Math.round((log.totalCalories / goalCalories) * 100));
                  const over = log.totalCalories > goalCalories;
                  return (
                    <div key={log.date} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl ${isToday ? "bg-emerald-50" : ""}`}>
                      <span className={`text-xs font-medium ${isToday ? "text-emerald-600" : "text-slate-500"}`}>{dayLabels[d.getDay()]}</span>
                      <div className="w-full h-20 bg-slate-100 rounded-lg overflow-hidden relative flex items-end">
                        <div
                          className={`w-full rounded-lg transition-all duration-500 ${over ? "bg-orange-400" : isToday ? "bg-emerald-500" : "bg-emerald-300"}`}
                          style={{ height: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${over ? "text-orange-500" : isToday ? "text-emerald-600" : "text-slate-600"}`}>
                        {log.totalCalories > 0 ? `${log.totalCalories}` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today's entries */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">🗒️ {t("todayMeals")}</h2>
                <span className="text-sm text-slate-500">
                  {dailyLog?.entries.length ?? 0} {dailyLog?.entries.length === 1 ? t("entry") : t("entries")}
                </span>
              </div>

              {logLoading ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : !dailyLog?.entries.length ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="text-5xl mb-3">🥗</div>
                  <p className="text-slate-500 text-sm">{t("noEntriesToday")}<br />{t("analyzePhotoToStart")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyLog.entries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition group">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">
                          {entry.foodItem} {entry.quantity > 1 && <span className="text-slate-500 font-normal">×{entry.quantity}</span>}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{entry.servingSize}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-orange-500 font-bold text-sm">
                          {(entry.caloriesPerItem * entry.quantity).toLocaleString()} kcal
                        </span>
                        <button
                          onClick={() => handleRemoveEntry(entry)}
                          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                          aria-label={t("removeEntry")}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <span className="font-bold text-slate-700">{t("totalForDay")}</span>
                    <span className={`text-xl font-bold ${isOverGoal ? "text-orange-500" : "text-emerald-600"}`}>
                      {totalToday.toLocaleString()} kcal
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {editGoal && activeMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4" onClick={closeGoalEditor}>
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="daily-goal-modal-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-emerald-600">{activeMember.name}</p>
                <h2 id="daily-goal-modal-title" className="mt-1 text-2xl font-bold text-slate-900">{t("dailyGoalEdit")}</h2>
                <p className="mt-2 text-sm text-slate-500">{t("dailyGoalModalHint")}</p>
              </div>
              <button
                onClick={closeGoalEditor}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                aria-label={t("cancel")}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("dailyGoalLabel")}</p>
              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  onClick={() => adjustGoalInput(-50)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
                  aria-label={t("decreaseGoal")}
                >
                  -
                </button>
                <div className="min-w-[170px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
                  <input
                    type="number"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className="w-full bg-transparent text-center text-3xl font-bold text-slate-900 outline-none"
                    min={100}
                    step={50}
                  />
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">kcal</p>
                </div>
                <button
                  onClick={() => adjustGoalInput(50)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
                  aria-label={t("increaseGoal")}
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={closeGoalEditor}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSaveGoal}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaloriesCounter;

