import { useXpHistory } from '@/hooks/useXpHistory';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export const XpHistoryFeed = () => {
  const { logs, loading } = useXpHistory(5); // On n'affiche que les 5 derniers

  if (loading) return <div>Chargement de ton historique...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-500">Journal d'XP</h3>
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
        >
          <div className="flex items-center gap-3">
            {log.amount > 0 ? (
              <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <ArrowDownCircle className="w-5 h-5 text-rose-500" />
            )}
            <div>
              <p className="text-sm font-medium">{log.reason}</p>
              <p className="text-xs text-slate-400">
                {new Date(log.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <span className={`font-bold ${log.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {log.amount > 0 ? '+' : ''}
            {log.amount} XP
          </span>
        </div>
      ))}
    </div>
  );
};
