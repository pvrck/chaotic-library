// src/components/Administration/ChangelogTable.tsx
import { supabase } from '@/lib/supabaseClient';
import { Trash2, Edit2 } from 'lucide-react';
import { Changelog } from '@/types/changelog.type';

interface ChangelogTableProps {
  logs: Changelog[];
  onAction: () => void;
  onEdit: (log: Changelog) => void;
}

export const ChangelogTable = ({ logs, onAction, onEdit }: ChangelogTableProps) => {
  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce log ?')) {
      const { error } = await supabase.from('changelogs').delete().eq('id', id);

      if (error) {
        console.error('Erreur de suppression:', error);
      } else {
        onAction(); // Rafraîchit la liste
      }
    }
  };

  return (
    <table className="w-full bg-white rounded-lg shadow">
      {logs.map((log) => (
        <tr key={log.id} className="border-b">
          <td className="p-4">{log.title}</td>
          <td className="p-4 flex gap-2">
            <button
              title="Modifier"
              aria-label="Modifier"
              onClick={() => onEdit(log)}
              className="text-blue-500"
            >
              <Edit2 size={18} />
            </button>
            <button
              title="Supprimer"
              aria-label="Supprimer"
              onClick={() => handleDelete(log.id)}
              className="text-red-500"
            >
              <Trash2 size={18} />
            </button>
          </td>
        </tr>
      ))}
    </table>
  );
};
