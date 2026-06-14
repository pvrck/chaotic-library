import { supabase } from '@/lib/supabaseClient';
import { EAchievementConditionType } from '@/types/achievement.type';

export const checkAchievements = async (userId: string | undefined, conditionType: string) => {
  // Sécurité : ne rien faire si on n'a pas d'ID utilisateur
  if (!userId) return;

  const unlockedIds: string[] = [];

  // 1. Récupérer les définitions de ce type
  const { data: definitions } = await supabase
    .from('achievements_definitions')
    .select('*')
    .eq('condition_type', conditionType);

  if (!definitions || definitions.length === 0) return;

  // 2. Calculer la progression réelle de l'utilisateur
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

  // 3. Comparer et débloquer
  for (const def of definitions) {
    if (userProgress >= def.threshold) {
      const { data } = await supabase
        .from('user_achievements')
        .insert([{ user_id: userId, achievement_id: def.id }])
        .select('achievement_id');

      if (data) unlockedIds.push(def.title);
    }
  }
  return unlockedIds;
};
