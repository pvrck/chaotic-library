import { CommunityUser } from '@/types/users.type';
import { Calendar, Clock, EyeOff, User, Zap, Trophy } from 'lucide-react';

interface UserBadgeProps {
  user: CommunityUser & {
    latest_achievements?: { id: string; title: string; condition_type: string }[];
  };
  variant?: 'card' | 'banner';
}

export const UserBadge = ({ user, variant = 'card' }: UserBadgeProps) => {
  const registrationDateRaw = user.registration_date;
  const lastActivityRaw = user.last_activity;

  // 🌟 Déterminer si l'utilisateur est actif récemment (moins de 24h)
  const isRecentActivity = () => {
    if (!lastActivityRaw) return false;
    const lastActiveTime = new Date(lastActivityRaw).getTime();
    const currentTime = new Date().getTime();
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
    return currentTime - lastActiveTime < twentyFourHoursInMs;
  };

  const formatRegistrationDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Inconnu';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Inconnu';
    return date.toLocaleDateString('fr-FR', {
      month: variant === 'banner' ? 'long' : 'short',
      year: 'numeric',
    });
  };

  const formatLastActivity = (dateStr: string | null) => {
    if (!dateStr) return 'Aucune activité';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Aucune activity';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (variant === 'banner') {
    return (
      <div className="w-full bg-linear-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-slate-100 dark:border-slate-800/60 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xs">
        <div className="h-24 w-24 shrink-0 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-5xl border-2 border-indigo-500/20 shadow-md relative">
          {user.avatar_url && user.avatar_url.trim() !== '' ? (
            <span>{user.avatar_url}</span>
          ) : (
            <User className="h-10 w-10 text-slate-400" />
          )}
          {/* Pastille activité sur la bannière */}
          <span
            className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 ${isRecentActivity() ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
          />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center justify-center sm:justify-start gap-2">
            {user.username || 'Lecteur Mystère'}
          </h2>

          <div className="flex flex-wrap justify-center sm:justify-start gap-3 items-center">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-indigo-600 text-white shadow-xs">
              <Zap className="h-3.5 w-3.5 fill-current text-amber-300" /> {user.xp.toLocaleString()}{' '}
              XP
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-semibold">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Membre depuis{' '}
              {formatRegistrationDate(registrationDateRaw)}
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-semibold">
              <Clock className="h-3.5 w-3.5 text-purple-500" /> Actif le{' '}
              {formatLastActivity(lastActivityRaw)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 🗂️ VERSION CARTE CLASSIQUE
  return (
    <div
      className={`w-full h-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs transition-all duration-200 ${
        user.is_private
          ? 'opacity-85 cursor-not-allowed select-none relative'
          : 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
      }`}
    >
      {/* Badge Privé s'il l'est */}
      {user.is_private && (
        <span
          className="absolute top-3 right-3 p-1 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
          title="Profil privé"
        >
          <EyeOff className="h-3 w-3" />
        </span>
      )}

      {/* Avatar */}
      <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl border border-slate-100 dark:border-slate-700 shadow-inner relative">
        {user.avatar_url && user.avatar_url.trim() !== '' ? (
          <span>{user.avatar_url}</span>
        ) : (
          <User className="h-6 w-6 text-slate-400" />
        )}
        <span
          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${isRecentActivity() ? 'bg-emerald-500' : 'bg-slate-300'}`}
          title={isRecentActivity() ? 'Actif aujourd’hui !' : 'Hors ligne'}
        />
      </div>

      <h4 className="mt-3 font-bold text-slate-800 dark:text-white truncate w-full px-2">
        {user.username || 'Lecteur Mystère'}
      </h4>

      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
        <Zap className="h-3 w-3 fill-current" /> {user.xp.toLocaleString()} XP
      </span>

      {!user.is_private && user.latest_achievements && user.latest_achievements.length > 0 && (
        <div className="flex gap-1.5 mt-3 justify-center">
          {user.latest_achievements.map((ach) => (
            <div
              key={ach.id}
              className="p-1 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
              title={`Succès débloqué : ${ach.title}`}
            >
              <Trophy className="h-3 w-3" />
            </div>
          ))}
        </div>
      )}

      <div className="w-full mt-auto">
        <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-4" />

        <div className="w-full grid grid-cols-2 gap-2 text-[10px] text-slate-500">
          <div className="flex flex-col items-center gap-0.5 border-r border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="h-3 w-3" /> Membre
            </span>
            <span className="text-slate-700 dark:text-slate-400 font-semibold">
              {formatRegistrationDate(registrationDateRaw)}
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="h-3 w-3" /> Activité
            </span>
            <span className="text-slate-700 dark:text-slate-400 font-semibold truncate max-w-full px-1">
              {formatLastActivity(lastActivityRaw)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
