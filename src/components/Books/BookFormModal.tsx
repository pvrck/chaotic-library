import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { searchGoogleBooks } from '@/services/googleBooks.service';
import { X, BookOpen, Loader2 } from 'lucide-react';
import { Book, BookFormat, BookStatus, EBookFormat, EBookStatus } from '@/types/books.type';
import { GoogleBookSuggestion } from '@/types/googleBooks.type';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookToEdit?: Book | null;
  onSuccess: () => void;
}

const emptyBook: Book = {
  title: '',
  author: '',
  isbn: '',
  saga_name: '',
  saga_volume: null,
  format: EBookFormat.Papier,
  status: EBookStatus.ALire,
  is_lc: false,
  added_at: new Date().toISOString(),
  thumbnail: null,
};

export default function BookFormModal({
  isOpen,
  onClose,
  bookToEdit,
  onSuccess,
}: BookFormModalProps) {
  const { profile } = useAuth();
  const isEditMode = !!bookToEdit;

  // L'état prend correctement le bookToEdit s'il existe
  const [formData, setFormData] = useState<Book>(
    bookToEdit || { ...emptyBook, added_at: new Date().toISOString() }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GoogleBookSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSearch = async () => {
    if (!searchQuery.trim()) return;
    setFetching(true);
    setSuggestions([]);

    try {
      const cleanIsbn = searchQuery.replace(/[- ]/g, '');
      const isIsbn = /^\d{10}$|^\d{13}$/.test(cleanIsbn);
      const query = isIsbn ? `isbn:${cleanIsbn}` : searchQuery;

      const items = await searchGoogleBooks(query, 5);

      if (items.length > 0) {
        const formatted = items.map((item) => ({
          title: item.volumeInfo.title || '',
          // S'il y a plusieurs auteurs, ils sont séparés par une virgule ici 📝
          author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : '',
          isbn:
            item.volumeInfo.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier ||
            item.volumeInfo.industryIdentifiers?.find((id) => id.type === 'ISBN_10')?.identifier ||
            null,
          thumbnail:
            item.volumeInfo.imageLinks?.smallThumbnail ||
            item.volumeInfo.imageLinks?.thumbnail ||
            null,
        }));
        setSuggestions(formatted);
      } else {
        alert('Aucun résultat trouvé sur Google Books.');
      }
    } catch (error: unknown) {
      console.error(error);
      alert('Une erreur est survenue lors de la recherche.');
    } finally {
      setFetching(false);
    }
  };

  const selectSuggestion = (sug: GoogleBookSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      title: sug.title,
      author: sug.author, // Plus de faute de frappe, les auteurs multiples descendent ici
      isbn: sug.isbn || prev.isbn,
      thumbnail: sug.thumbnail || prev.thumbnail,
    }));
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim() || !profile?.id) return;

    setLoading(true);

    try {
      if (isEditMode && bookToEdit?.id) {
        const { error } = await supabase
          .from('books')
          .update({
            title: formData.title,
            author: formData.author,
            isbn: formData.isbn || null,
            saga_name: formData.saga_name || null,
            saga_volume: formData.saga_volume,
            format: formData.format,
            status: formData.status,
            is_lc: formData.is_lc,
            added_at: formData.added_at,
            thumbnail: formData.thumbnail || null,
          })
          .eq('id', bookToEdit.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('books').insert([
          {
            title: formData.title,
            author: formData.author,
            isbn: formData.isbn || null,
            saga_name: formData.saga_name || null,
            saga_volume: formData.saga_volume,
            format: formData.format,
            status: formData.status,
            is_lc: formData.is_lc,
            added_at: formData.added_at,
            user_id: profile.id,
            thumbnail: formData.thumbnail || null,
          },
        ]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error(error);
      alert('Erreur lors de la sauvegarde de la relique.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-5 border border-slate-100 dark:border-slate-700 shadow-xl space-y-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            {isEditMode ? 'Modifier la relique' : 'Ajouter une relique'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isEditMode && (
          <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/40">
            <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-wider">
              Recherche Google Books
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Titre ou ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGoogleSearch()}
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleGoogleSearch}
                disabled={fetching}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {fetching ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Chercher'}
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-40 overflow-y-auto shadow-md">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectSuggestion(sug)}
                    className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2.5 transition-colors text-xs"
                  >
                    <div className="h-8 w-6 bg-slate-100 rounded overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/50">
                      {sug.thumbnail ? (
                        <img src={sug.thumbnail} className="h-full w-full object-cover" />
                      ) : (
                        <BookOpen className="h-3 w-3 text-slate-400" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {sug.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{sug.author}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Section preview de la couverture */}
          {formData.thumbnail && (
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
              <img
                src={formData.thumbnail}
                alt="Couverture"
                className="h-14 w-10 object-cover rounded shadow-xs"
              />
              <span className="text-[10px] text-slate-400 italic">
                Illustration enregistrée ! ✨
              </span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Titre</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Auteur(s)
            </label>
            <input
              type="text"
              required
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
              Code ISBN (10 ou 13 chiffres)
            </label>
            <input
              type="text"
              placeholder="Ex: 9782266200264"
              value={formData.isbn || ''}
              onChange={(e) =>
                setFormData({ ...formData, isbn: e.target.value.replace(/[^0-9X]/gi, '') })
              }
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 p-3 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Saga (Optionnel)
              </label>
              <input
                type="text"
                value={formData.saga_name || ''}
                onChange={(e) => setFormData({ ...formData, saga_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vol.
              </label>
              <input
                type="number"
                value={formData.saga_volume || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    saga_volume: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Format
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value as BookFormat })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
              >
                <option value={EBookFormat.Papier}>{EBookFormat.Papier}</option>
                <option value={EBookFormat.Numerique}>{EBookFormat.Numerique}</option>
                <option value={EBookFormat.Audio}>{EBookFormat.Audio}</option>
                <option value={EBookFormat.Kindle}>{EBookFormat.Kindle}</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as BookStatus })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
              >
                <option value={EBookStatus.ALire}>{EBookStatus.ALire}</option>
                <option value={EBookStatus.EnCours}>{EBookStatus.EnCours}</option>
                <option value={EBookStatus.Lu}>{EBookStatus.Lu}</option>
                <option value={EBookStatus.Abandonne}>{EBookStatus.Abandonne}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="isLc"
                checked={formData.is_lc}
                onChange={(e) => setFormData({ ...formData, is_lc: e.target.checked })}
                className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label
                htmlFor="isLc"
                className="text-sm font-medium text-slate-600 dark:text-slate-400"
              >
                Lecture commune (LC)
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date d'ajout</label>
              <input
                type="date"
                value={formData.added_at ? formData.added_at.split('T')[0] : ''}
                onChange={(e) =>
                  setFormData({ ...formData, added_at: new Date(e.target.value).toISOString() })
                }
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl font-bold transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                'Sauvegarder'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
