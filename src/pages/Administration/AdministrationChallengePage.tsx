import { AdminChallenge } from '@/components/Administration/AdminChallenge';
import { ChallengePoolItem } from '@/types/challenges.type';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Shield } from 'lucide-react';

export const AdministrationChallengePage = () => {
  const [challenges, setChallenges] = useState<ChallengePoolItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadAdminData = async () => {
      try {
        const { data: chalData } = await supabase
          .from('challenge_pool')
          .select('*')
          .order('created_at', { ascending: false });

        if (isMounted) {
          setChallenges(chalData || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Erreur admin load:', err);
        if (isMounted) setLoading(false);
      }
    };

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  if (loading)
    return (
      <div className="flex justify-center py-12" role="status" aria-label="Chargement">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );

  return (
    <>
      <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-6">
        <Shield className="h-4 w-4 text-indigo-600" /> Gestion des challenges ({challenges.length})
      </h2>
      <AdminChallenge challenges={challenges} setRefreshTrigger={setRefreshTrigger} />
    </>
  );
};
