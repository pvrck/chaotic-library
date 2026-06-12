// src/pages/Administration/AdministrationChangeLogPage.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChangelogForm } from '@/components/Administration/ChangeLog/ChangelogForm';
import { ChangelogTable } from '@/components/Administration/ChangeLog/ChangelogTable';
import { Changelog } from '@/types/changelog.type';

export const AdministrationChangeLogPage = () => {
  const [logs, setLogs] = useState<Changelog[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [editingLog, setEditingLog] = useState<Changelog | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('changelogs') // Nom de ta table
        .select('*')
        .order('created_at', { ascending: false });
      setLogs(data || []);
    };
    fetchLogs();
  }, [refresh]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Gestion du Changelog</h1>

      {/* Formulaire pour ajouter */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <ChangelogForm
          key={editingLog?.id || 'new'}
          initialData={editingLog}
          onSuccess={() => {
            setEditingLog(null);
            setRefresh((prev) => prev + 1);
          }}
        />
      </div>

      {/* Liste pour éditer/supprimer */}
      <ChangelogTable
        logs={logs}
        onAction={() => setRefresh((prev) => prev + 1)}
        onEdit={(log) => setEditingLog(log)}
      />
    </div>
  );
};
