import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight, FileClock } from 'lucide-react';
import { XpLog } from '@/types/XpLog.type';

const PAGE_SIZE = 10;

export const XpHistoryPage = () => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<XpLog[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchLogs = async () => {
      setLoading(true);
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data } = await supabase
        .from('xp_logs')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      setLogs(data || []);
      setLoading(false);
    };

    fetchLogs();
  }, [profile, page]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FileClock className="h-6 w-6 text-indigo-600 dark:text-slate-100" /> Historique de mon XP
      </h1>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm"
            >
              <div className="flex items-center gap-4">
                {log.amount > 0 ? (
                  <ArrowUpCircle className="w-6 h-6 text-emerald-500" />
                ) : (
                  <ArrowDownCircle className="w-6 h-6 text-rose-500" />
                )}
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-300">{log.reason}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <span
                className={`font-bold text-lg ${log.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {log.amount > 0 ? '+' : ''}
                {log.amount} XP
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Contrôles de pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
          className="flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 transition-colors rounded-lg dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
        </button>

        <span className="text-sm text-slate-500 dark:text-slate-400">Page {page + 1}</span>

        <button
          disabled={logs.length < PAGE_SIZE}
          onClick={() => setPage(page + 1)}
          className="flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 transition-colors rounded-lg dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
        >
          Suivant <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};
