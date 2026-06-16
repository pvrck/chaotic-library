import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { XpLog } from '@/types/XpLog.type';

export const useXpHistory = (limit: number = 10) => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<XpLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('xp_logs')
        .select('id, amount, reason, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setLogs(data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur inconnue est survenue');
      }
    } finally {
      setLoading(false);
    }
  }, [profile, limit]);

  useEffect(() => {
    if (!profile) return;

    // call fetchLogs inside an async IIFE to avoid calling setState
    // synchronously within the effect body
    (async () => {
      await fetchLogs();
    })();
  }, [profile, fetchLogs]);

  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('xp_logs_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'xp_logs',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          setLogs((prev) => [payload.new as XpLog, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, limit]);

  return { logs, loading, error, refresh: fetchLogs };
};
