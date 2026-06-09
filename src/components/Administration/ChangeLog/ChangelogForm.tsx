import { createChangelog, updateChangelog } from '@/services/changelogService';
import { Changelog } from '@/types/changelog.type';
import { useState } from 'react';
import { TiptapEditor } from './TiptapEditor';

interface ChangelogFormProps {
  onSuccess?: () => void;
  initialData?: Changelog | null;
}

export const ChangelogForm = ({ initialData, onSuccess }: ChangelogFormProps) => {
  const [formData, setFormData] = useState(() => ({
    title: initialData?.title || '',
    version: initialData?.version || '',
    content: initialData?.content || '',
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (initialData) {
        // Mode Édition
        await updateChangelog(initialData.id, formData);
        alert('Mise à jour réussie !');
      } else {
        // Mode Création
        await createChangelog({ ...formData, is_published: true });
        alert('Changelog publié avec succès !');
      }

      setFormData({ title: '', version: '', content: '' });
      onSuccess?.();
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4"
    >
      <h2 className="text-xl font-bold mb-4">
        {initialData ? 'Modifier la mise à jour' : 'Ajouter une mise à jour'}
      </h2>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="title">
          Titre
        </label>
        <input
          id="title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="version">
          Version
        </label>
        <input
          id="version"
          required
          placeholder="ex: 1.0.1"
          value={formData.version}
          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Contenu</label>
        <TiptapEditor
          content={formData.content}
          onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 disabled:opacity-50"
      >
        {isSubmitting
          ? 'Enregistrement...'
          : initialData
            ? 'Enregistrer les modifications'
            : 'Publier la mise à jour'}
      </button>
    </form>
  );
};
