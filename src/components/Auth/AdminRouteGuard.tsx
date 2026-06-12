import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export const AdminRouteGuard = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // On suppose que tu as une table "profiles" avec une colonne "role"
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setIsAdmin(profile?.role === 'admin');
      setLoading(false);
    };

    checkAdmin();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};
