import { useCallback, useEffect, useMemo, useState } from "react";
import { UserProfile, WeightGoal, BiologicalSex, ActivityLevel } from "../../types";
import {
  addFamilyMember,
  getUserProfile,
  removeFamilyMember,
  setActiveFamilyMember,
  updateFamilyMember,
} from "../../services/calorieLogService";

interface FamilyMemberDraft {
  name: string;
  age: number;
  sex: BiologicalSex;
  activityLevel: ActivityLevel;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  weightGoal: WeightGoal;
  customDailyGoal?: number;
  useSuggestedGoal: boolean;
}

interface FamilyMemberUpdateDraft {
  name: string;
  age: number;
  sex: BiologicalSex;
  activityLevel: ActivityLevel;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  weightGoal: WeightGoal;
}

export const useFamilyMembers = (uid: string) => {
  const [profile, setProfile] = useState<UserProfile>({ displayName: "", members: [], activeMemberId: null });
  const [profileLoading, setProfileLoading] = useState(true);

  const activeMember = useMemo(
    () => profile.members.find((member) => member.id === profile.activeMemberId) ?? profile.members[0] ?? null,
    [profile.activeMemberId, profile.members]
  );

  const activeGoalCalories = activeMember
    ? activeMember.useSuggestedGoal
      ? activeMember.suggestedDailyCalories
      : activeMember.customDailyGoal ?? activeMember.suggestedDailyCalories
    : 2000;

  const reloadProfile = useCallback(async (nextProfile?: UserProfile) => {
    if (!uid) {
      setProfile({ displayName: "", members: [], activeMemberId: null });
      return { displayName: "", members: [], activeMemberId: null } as UserProfile;
    }

    const resolvedProfile = nextProfile ?? await getUserProfile(uid);
    setProfile(resolvedProfile);
    return resolvedProfile;
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    reloadProfile().finally(() => setProfileLoading(false));
  }, [reloadProfile, uid]);

  const handleAddMember = useCallback(async (draft: FamilyMemberDraft) => {
    if (!uid) return null;
    const member = await addFamilyMember(uid, draft);
    const nextProfile = await getUserProfile(uid);
    const profileWithActive = nextProfile.activeMemberId ? nextProfile : { ...nextProfile, activeMemberId: member.id };
    await reloadProfile(profileWithActive);
    return member;
  }, [reloadProfile, uid]);

  const handleUpdateMember = useCallback(async (memberId: string, draft: FamilyMemberUpdateDraft) => {
    if (!uid) return null;
    const updatedMember = await updateFamilyMember(uid, memberId, draft);
    if (!updatedMember) return null;

    const nextProfile = {
      ...profile,
      members: profile.members.map((member) => member.id === updatedMember.id ? updatedMember : member),
    };
    await reloadProfile(nextProfile);
    return updatedMember;
  }, [profile, reloadProfile, uid]);

  const handleDeleteMember = useCallback(async (memberId: string) => {
    if (!uid) return;
    await removeFamilyMember(uid, memberId);
    const nextProfile = await getUserProfile(uid);
    await reloadProfile(nextProfile);
  }, [reloadProfile, uid]);

  const handleSelectMember = useCallback(async (memberId: string) => {
    if (!uid || memberId === profile.activeMemberId) return;
    await setActiveFamilyMember(uid, memberId);
    const nextProfile = { ...profile, activeMemberId: memberId };
    await reloadProfile(nextProfile);
  }, [profile, reloadProfile, uid]);

  return {
    profile,
    profileLoading,
    activeMember,
    activeGoalCalories,
    reloadProfile,
    handleAddMember,
    handleUpdateMember,
    handleDeleteMember,
    handleSelectMember,
  };
};
