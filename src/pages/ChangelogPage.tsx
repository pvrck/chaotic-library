import { useEffect, useState } from 'react';
import { getChangelogs } from '@/services/changelogService';
import { ChangelogList } from '@/components/Changelog/ChangelogList';
import { Changelog } from '@/types/changelog.type';

export const ChangelogPage = () => {
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: Changelog[] = await getChangelogs();
        setChangelogs(data);
      } catch (error) {
        console.error('Erreur chargement:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Chargement des nouveautés...</div>;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-10">Nouveautés</h1>
      <ChangelogList changelogs={changelogs} />
    </div>
  );
};
