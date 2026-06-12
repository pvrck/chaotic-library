import { useEffect, useState } from 'react';
import { getChangelogs } from '@/services/changelogService';
import { Changelog } from '@/types/changelog.type';

export const ChangelogList = () => {
  const [logs, setLogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChangelogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Chargement des nouveautés...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Nouveautés</h2>
      {logs.map((log) => (
        <div key={log.id} className="border-l-4 border-indigo-500 pl-4 py-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">{log.title}</h3>
            <span className="text-sm text-gray-500">{log.version}</span>
          </div>
          <p className="text-gray-700 mt-1">{log.content}</p>
        </div>
      ))}
    </div>
  );
};
