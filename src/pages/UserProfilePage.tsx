import { UserBadge } from '@/components/Community/UserBadge';
import { UserLibraryTab } from '@/components/Community/UserLibraryTab';
import { AchievementsGrid } from '@/components/Profile/AchievementsGrid';
import * as route from '@/constants/routes';
import { supabase } from '@/lib/supabaseClient';
import { CommunityUser } from '@/types/users.type';
import { ArrowLeft, BookOpen, Loader2, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<'library' | 'achievements'>('library');
  const [visitedUser, setVisitedUser] = useState<CommunityUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('community_users_list')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          setVisitedUser(data as CommunityUser);
        }
      } catch (err) {
        console.error('Erreur profil public:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!visitedUser) {
    return (
      <div className="text-center py-12 text-slate-400 italic">Utilisateur introuvable... 🕸️</div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-4">
      {/* Retour rapide */}
      <Link
        to={route.COMMUNITY}
        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Retour à la communauté
      </Link>

      {/* 🌟 LE BADGE EN MODE BANNIÈRE EN HAUT */}
      <UserBadge user={visitedUser} variant="banner" />

      {/* 📑 BARRE DES ONGLETS */}
      <div className="flex border-b border-slate-100 dark:border-slate-700/50">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 cursor-pointer ${
            activeTab === 'library'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpen className="h-4 w-4" /> Bibliothèque
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 cursor-pointer ${
            activeTab === 'achievements'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Trophy className="h-4 w-4" /> Succès débloqués
        </button>
      </div>

      {/* 📦 CONTENU DES ONGLETS */}
      <div className="animate-in fade-in duration-150">
        {activeTab === 'library' ? (
          <UserLibraryTab visitedUserId={visitedUser.id} />
        ) : (
          <AchievementsGrid userId={visitedUser.id} onlyShowUnlocked={true} />
        )}
      </div>
    </div>
  );
};
