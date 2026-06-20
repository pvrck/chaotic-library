import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Shield } from 'lucide-react';
import { Profile } from '@/types/users.type';
import { AdminUsers } from '@/components/Administration/AdminUsers';
import { Level } from '@/types/levels.type';

export const AdministrationUsersPage = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadAdminData = async () => {
      try {
        const { data: userData } = await supabase.from('profiles').select('*');

        const { data: levelData } = await supabase
          .from('levels_config')
          .select('*')
          .order('xp_min', { ascending: true });

        if (isMounted) {
          setUsers((userData as unknown as Profile[]) || []);
          setLevels(levelData || []);
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
        <Shield className="h-4 w-4 text-indigo-600" /> Gestion des utilisateurs ({users.length})
      </h2>
      <AdminUsers users={users} levels={levels} setRefreshTrigger={setRefreshTrigger} />
    </>
  );
};
