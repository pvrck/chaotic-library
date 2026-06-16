import { supabase } from '@/lib/supabaseClient';
import { EAchievementConditionType } from '@/types/achievement.type';
import { updateXpWithReason } from '@/utils/xpUtils';

export const checkAchievements = async (userId: string | undefined, conditionType: string) => {
  if (!userId) return;

  // 1. Récupérer les succès déjà débloqués pour cet utilisateur
  const { data: alreadyUnlocked } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const unlockedIdsSet = new Set(alreadyUnlocked?.map((a) => a.achievement_id) || []);

  // 2. Récupérer les définitions de ce type
  const { data: definitions } = await supabase
    .from('achievements_definitions')
    .select('*')
    .eq('condition_type', conditionType);

  if (!definitions || definitions.length === 0) return;

  // 3. Calculer la progression réelle
  let userProgress = 0;

  if (conditionType === EAchievementConditionType.LivresLus) {
    const { count } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'Lu');
    userProgress = count || 0;
  } else if (conditionType === EAchievementConditionType.SagaAvancee) {
    const { count } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'Lu')
      .not('saga_name', 'is', null);
    userProgress = count || 0;
  } else if (conditionType === EAchievementConditionType.ParticipationLc) {
    const { count } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'Lu')
      .not('is_lc', 'is', null);
    userProgress = count || 0;
  } else if (conditionType === EAchievementConditionType.LivresAnnee) {
    const currentYear = new Date().getFullYear();
    const { count } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'Lu')
      .gte('finished_at', `${currentYear}-01-01T00:00:00Z`)
      .lte('finished_at', `${currentYear}-12-31T23:59:59Z`);
    userProgress = count || 0;
  }

  // 4. Filtrer uniquement ceux qui sont atteints ET non encore possédés
  const newAchievements = definitions.filter(
    (def) => userProgress >= def.threshold && !unlockedIdsSet.has(def.id)
  );

  if (newAchievements.length === 0) return []; // Retourne un tableau vide au lieu de rien

  // 5. Récupérer l'XP actuel du profil
  const { data: profile } = await supabase.from('profiles').select('xp').eq('id', userId).single();

  let totalXpGained = 0;
  const unlockedTitles: string[] = [];

  for (const def of newAchievements) {
    // Insérer le succès
    const { error } = await supabase
      .from('user_achievements')
      .insert([{ user_id: userId, achievement_id: def.id }]);

    if (!error) {
      unlockedTitles.push(def.title);
      totalXpGained += def.xp_reward || 0; // Ajoute l'XP définie dans ton succès
    }
  }

  // 6. Si on a gagné de l'XP, on met à jour le profil
  if (totalXpGained > 0 && profile) {
    await updateXpWithReason(
      userId,
      profile.xp + totalXpGained,
      `Succès débloqué : ${unlockedTitles.join(', ')}`
    );
  }

  return unlockedTitles;
};
