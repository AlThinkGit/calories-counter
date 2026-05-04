import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../src/firebaseConfig";
import {
  ActivityLevel,
  BiologicalSex,
  DailyLog,
  FamilyMember,
  FoodCalorieInfo,
  FoodEntry,
  UserProfile,
  WeightGoal,
} from "../types";

export const getTodayKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const getProfileRef = (uid: string) => doc(db, "users", uid, "data", "profile");

const getMemberDailyLogRef = (uid: string, memberId: string, dateKey: string) =>
  doc(db, "users", uid, "familyMembers", memberId, "dailyLogs", dateKey);

const getMinimumCalories = (age: number) => {
  if (age <= 8) return 1000;
  if (age <= 13) return 1200;
  return 1400;
};

const getActivityMultiplier = (activityLevel: ActivityLevel) => {
  switch (activityLevel) {
    case "low":
      return 1.2;
    case "moderate":
      return 1.45;
    case "high":
      return 1.7;
    default:
      return 1.2;
  }
};

export const calculateSuggestedCalories = ({
  age,
  sex,
  activityLevel,
  heightCm,
  weightKg,
  weightGoal,
}: {
  age: number;
  sex: BiologicalSex;
  activityLevel: ActivityLevel;
  heightCm: number;
  weightKg: number;
  weightGoal: WeightGoal;
}): number => {
  let bmr = 0;

  if (age <= 3) {
    bmr = weightKg * 60;
  } else if (age <= 10) {
    bmr = weightKg * 45;
  } else {
    bmr = sex === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  let dailyCalories = bmr * getActivityMultiplier(activityLevel);

  if (weightGoal === "lose") dailyCalories -= 250;
  if (weightGoal === "gain") dailyCalories += 250;

  return Math.max(getMinimumCalories(age), Math.round(dailyCalories));
};

const normalizeProfile = (data?: Partial<UserProfile> | null): UserProfile => {
  const members = Array.isArray(data?.members) ? data!.members : [];
  return {
    displayName: data?.displayName ?? "",
    members,
    activeMemberId: data?.activeMemberId ?? members[0]?.id ?? null,
  };
};

// User profile
export const getUserProfile = async (uid: string): Promise<UserProfile> => {
  const ref = getProfileRef(uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const normalized = normalizeProfile(snap.data() as UserProfile);
    await setDoc(ref, normalized, { merge: true });
    return normalized;
  }
  const defaultProfile: UserProfile = { displayName: "", members: [], activeMemberId: null };
  await setDoc(ref, defaultProfile);
  return defaultProfile;
};

export const updateUserProfile = async (uid: string, profile: Partial<UserProfile>): Promise<void> => {
  const ref = getProfileRef(uid);
  await setDoc(ref, profile, { merge: true });
};

export const addFamilyMember = async (
  uid: string,
  memberInput: Omit<FamilyMember, "id" | "suggestedDailyCalories">
): Promise<FamilyMember> => {
  const profile = await getUserProfile(uid);
  const member: FamilyMember = {
    ...memberInput,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    suggestedDailyCalories: calculateSuggestedCalories(memberInput),
  };

  const updatedMembers = [...profile.members, member];
  await updateUserProfile(uid, {
    members: updatedMembers,
    activeMemberId: profile.activeMemberId ?? member.id,
  });
  return member;
};

export const updateFamilyMember = async (
  uid: string,
  memberId: string,
  updates: Partial<Omit<FamilyMember, "id">>
): Promise<FamilyMember | null> => {
  const profile = await getUserProfile(uid);
  let updatedMember: FamilyMember | null = null;

  const updatedMembers = profile.members.map((member) => {
    if (member.id !== memberId) return member;

    const merged = { ...member, ...updates } as FamilyMember;
    updatedMember = {
      ...merged,
      suggestedDailyCalories: calculateSuggestedCalories(merged),
    };
    return updatedMember;
  });

  await updateUserProfile(uid, { members: updatedMembers });
  return updatedMember;
};

export const setActiveFamilyMember = async (uid: string, memberId: string): Promise<void> => {
  await updateUserProfile(uid, { activeMemberId: memberId });
};

export const removeFamilyMember = async (uid: string, memberId: string): Promise<void> => {
  const profile = await getUserProfile(uid);
  const updatedMembers = profile.members.filter((member) => member.id !== memberId);
  const nextActiveMemberId = profile.activeMemberId === memberId ? updatedMembers[0]?.id ?? null : profile.activeMemberId;
  await updateUserProfile(uid, { members: updatedMembers, activeMemberId: nextActiveMemberId });
};

// Daily log
export const getDailyLog = async (uid: string, memberId: string, dateKey: string): Promise<DailyLog> => {
  const ref = getMemberDailyLogRef(uid, memberId, dateKey);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as DailyLog;
  }
  const emptyLog: DailyLog = { date: dateKey, memberId, totalCalories: 0, entries: [] };
  await setDoc(ref, emptyLog);
  return emptyLog;
};

export const addFoodEntries = async (
  uid: string,
  memberId: string,
  dateKey: string,
  items: FoodCalorieInfo[]
): Promise<FoodEntry[]> => {
  const ref = getMemberDailyLogRef(uid, memberId, dateKey);
  const now = new Date().toISOString();
  const newEntries: FoodEntry[] = items.map((item) => ({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    addedAt: now,
  }));
  const addedCalories = newEntries.reduce(
    (sum, e) => sum + e.caloriesPerItem * e.quantity,
    0
  );

  const snap = await getDoc(ref);
  if (snap.exists()) {
    const currentEntries = Array.isArray(snap.data().entries) ? snap.data().entries : [];
    await updateDoc(ref, {
      entries: [...currentEntries, ...newEntries],
      totalCalories: (snap.data().totalCalories || 0) + addedCalories,
    });
  } else {
    await setDoc(ref, {
      date: dateKey,
      memberId,
      totalCalories: addedCalories,
      entries: newEntries,
    });
  }
  return newEntries;
};

export const removeFoodEntry = async (
  uid: string,
  memberId: string,
  dateKey: string,
  entry: FoodEntry
): Promise<void> => {
  const ref = getMemberDailyLogRef(uid, memberId, dateKey);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const removedCals = entry.caloriesPerItem * entry.quantity;
  const currentTotal = snap.data().totalCalories || 0;
  const currentEntries = Array.isArray(snap.data().entries) ? snap.data().entries : [];
  await updateDoc(ref, {
    entries: currentEntries.filter((currentEntry: FoodEntry) => currentEntry.id !== entry.id),
    totalCalories: Math.max(0, currentTotal - removedCals),
  });
};

export const getWeeklyLogs = async (uid: string, memberId: string): Promise<DailyLog[]> => {
  const logs: DailyLog[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const ref = getMemberDailyLogRef(uid, memberId, key);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      logs.push(snap.data() as DailyLog);
    } else {
      logs.push({ date: key, memberId, totalCalories: 0, entries: [] });
    }
  }
  return logs;
};
