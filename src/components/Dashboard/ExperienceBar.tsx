import * as route from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Level } from '@/types/levels.type';
import { getPlayerLevelInfo } from '@/utils/levelUtils';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const ExperienceBar = () => {
  const { profile } = useAuth();
  const [levelsConfig, setLevelsConfig] = useState<Level[]>([]);

  // Charger la configuration des niveaux au montage
  useEffect(() => {
    const fetchLevels = async () => {
      const { data } = await supabase
        .from('levels_config')
        .select('*')
        .order('xp_min', { ascending: true });
      if (data) setLevelsConfig(data);
    };
    fetchLevels();
  }, []);

  const currentXp = profile?.xp || 0;
  const { title, nextLevelXp, progressPercentage } = getPlayerLevelInfo(currentXp, levelsConfig);

  // Petit calcul rapide pour retrouver le numéro du niveau (ex: Niveau 3)
  // On compte simplement combien de paliers l'utilisateur a dépassés
  const currentLevelNumber = levelsConfig.filter((lvl) => currentXp >= lvl.xp_min).length || 1;

  // Calcul des textes d'affichage de l'XP à droite de la jauge
  const currentLevelMinXp = levelsConfig[currentLevelNumber - 1]?.xp_min || 0;
  const xpGainedInRange = currentXp - currentLevelMinXp;
  const xpRequiredForNext = nextLevelXp ? nextLevelXp - currentLevelMinXp : 0;

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase">
          Statut de la lectrice
        </span>
        <Link
          to={route.HISTORIC_XP}
          className="text-xs text-slate-400 hover:text-indigo-300 flex items-center transition-colors"
        >
          Voir l'historique <ChevronRight className="w-3 h-3 ml-1" />
        </Link>
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 items-center">
          <h2 className="text-2xl font-black mt-1 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <div>
              Niveau {currentLevelNumber} :{' '}
              <span className="text-indigo-400 font-extrabold">{title}</span>
            </div>
            <span className="text-slate-500 text-sm font-normal">({currentXp} XP au total)</span>
          </h2>
        </div>
        <div className="text-sm font-bold text-slate-200">
          {nextLevelXp === null
            ? 'Niveau Maximal Atteint ✨'
            : `${xpGainedInRange} / ${xpRequiredForNext} XP (Rang suiv. à ${nextLevelXp})`}
        </div>
      </div>
      <div className="w-full bg-slate-800 h-3 rounded-full mt-4 overflow-hidden p-[2px] border border-slate-700">
        <div
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};
