import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { searchGoogleBooks } from '@/services/googleBooksService';
import { X, BookOpen, Loader2, Plus, List } from 'lucide-react';
import { Book, BookFormat, BookStatus, EBookFormat, EBookStatus } from '@/types/books.type';
import { GoogleBookSuggestion } from '@/types/googleBooks.type';
import { getCurrentXp, updateXpWithReason } from '@/utils/xpUtils';
import { Saga } from '@/types/saga.type';

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
  saga_id: null,
  volume_number: null,
  format: EBookFormat.Papier,
  status: EBookStatus.ALire,
  is_lc: false,
  added_at: new Date().toISOString(),
  thumbnail: null,
  page_count: null,
};

export default function BookFormModal({
  isOpen,
  onClose,
  bookToEdit,
  onSuccess,
}: BookFormModalProps) {
  const { profile } = useAuth();
  const isEditMode = !!bookToEdit;

  const [formData, setFormData] = useState<Book>(
    bookToEdit || { ...emptyBook, added_at: new Date().toISOString() }
  );

  // États pour la gestion des Sagas
  const [sagasList, setSagasList] = useState<Saga[]>([]);
  const [isPartOfSaga, setIsPartOfSaga] = useState(
    !!bookToEdit?.saga_id || !!bookToEdit?.saga_name
  );
  const [sagaMode, setSagaMode] = useState<'select' | 'create'>(
    bookToEdit?.saga_id ? 'select' : 'create'
  );
  const [newSagaTitle, setNewSagaTitle] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GoogleBookSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Charger la liste des sagas existantes pour le select
  useEffect(() => {
    if (!isOpen) return;
    const fetchSagas = async () => {
      const { data } = await supabase.from('sagas').select('*').order('title', { ascending: true });
      if (data) setSagasList(data);
    };
    fetchSagas();
  }, [isOpen]);

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
          author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : '',
          isbn:
            item.volumeInfo.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier ||
            item.volumeInfo.industryIdentifiers?.find((id) => id.type === 'ISBN_10')?.identifier ||
            null,
          thumbnail:
            item.volumeInfo.imageLinks?.smallThumbnail ||
            item.volumeInfo.imageLinks?.thumbnail ||
            null,
          page_count: item.volumeInfo.pageCount || null,
        }));
        setSuggestions(formatted);
      } else {
        alert('Aucun résultat trouvé sur Google Books.');
      }
    } catch (error) {
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
      author: sug.author,
      isbn: sug.isbn || prev.isbn,
      thumbnail: sug.thumbnail || prev.thumbnail,
      page_count: sug.page_count || prev.page_count,
    }));
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim() || !profile?.id) return;

    setLoading(true);

    try {
      let finalSagaId = formData.saga_id || null;
      let finalSagaName = formData.saga_name || null;
      let finalVolumeNumber = formData.volume_number || null;
      const cleanIsbn = formData.isbn ? formData.isbn.trim() : null;

      // 🌟 Utiliser un 'let' local pour contourner l'asynchronisme du State React
      let localSagaMode = sagaMode;

      if (isPartOfSaga) {
        if (localSagaMode === 'create') {
          const typedSagaTitle = newSagaTitle.trim();

          if (typedSagaTitle) {
            // 1. Recherche par nom (insensible à la casse)
            const { data: matchedSaga } = await supabase
              .from('sagas')
              .select('id, title')
              .ilike('title', typedSagaTitle)
              .maybeSingle();

            if (matchedSaga) {
              finalSagaId = matchedSaga.id;
              finalSagaName = matchedSaga.title;
              localSagaMode = 'select'; // ✅ Modifiable car c'est un 'let'
              setSagaMode('select'); // Optionnel : met à jour l'UI après le traitement
            }
            // 2. Recherche par ISBN (si le nom ne donnait rien)
            else if (cleanIsbn) {
              const { data: existingVolume } = await supabase
                .from('saga_volumes')
                .select('saga_id')
                .eq('isbn', cleanIsbn)
                .maybeSingle();

              if (existingVolume && existingVolume.saga_id) {
                const { data: existingSaga } = await supabase
                  .from('sagas')
                  .select('title')
                  .eq('id', existingVolume.saga_id)
                  .maybeSingle();

                if (existingSaga) {
                  const confirmed = window.confirm(
                    `Ce livre (ISBN) est déjà enregistré dans la saga "${existingSaga.title}".\n\nSouhaites-tu lier automatiquement ton livre à cette saga existante ?`
                  );

                  if (confirmed) {
                    finalSagaId = existingVolume.saga_id;
                    finalSagaName = existingSaga.title;
                    localSagaMode = 'select';
                    setSagaMode('select');
                  }
                }
              }
            }
          }
        }

        // 🌟 Utilisation de localSagaMode pour décider de l'action
        if (localSagaMode === 'create' && newSagaTitle.trim()) {
          const { data: newSaga, error: sagaErr } = await supabase
            .from('sagas')
            .insert([
              { title: newSagaTitle.trim(), author: formData.author, created_by: profile.id },
            ])
            .select()
            .single();

          if (sagaErr) throw sagaErr;
          finalSagaId = newSaga.id;
          finalSagaName = newSaga.title;
        } else if (localSagaMode === 'select' && finalSagaId) {
          const selectedSaga = sagasList.find((s) => s.id === finalSagaId);
          finalSagaName = selectedSaga ? selectedSaga.title : finalSagaName;
        }
        finalVolumeNumber = formData.volume_number || null;
      } else {
        finalSagaId = null;
        finalSagaName = null;
        finalVolumeNumber = null;
      }

      // 2. Mise à jour du catalogue global saga_volumes
      if (finalSagaId && finalVolumeNumber) {
        await supabase.from('saga_volumes').upsert(
          {
            saga_id: finalSagaId,
            volume_number: finalVolumeNumber,
            title: formData.title,
            page_count: formData.page_count,
            cover_url: formData.thumbnail,
            isbn: cleanIsbn,
          },
          { onConflict: 'saga_id,volume_number' }
        );
      }

      // 3. Payload pour le livre de l'utilisateur (inchangé)
      const bookPayload = {
        title: formData.title,
        author: formData.author,
        isbn: cleanIsbn,
        saga_name: finalSagaName,
        saga_volume: finalVolumeNumber,
        saga_id: finalSagaId,
        volume_number: finalVolumeNumber,
        format: formData.format,
        status: formData.status,
        is_lc: formData.is_lc,
        added_at: formData.added_at,
        thumbnail: formData.thumbnail || null,
        page_count: formData.page_count || null,
        started_at:
          formData.status === EBookStatus.EnCours && !bookToEdit?.started_at
            ? new Date().toISOString()
            : formData.started_at,
        finished_at:
          formData.status === EBookStatus.Lu && !bookToEdit?.finished_at
            ? new Date().toISOString()
            : formData.finished_at,
      };

      if (isEditMode && bookToEdit?.id) {
        const { error } = await supabase.from('books').update(bookPayload).eq('id', bookToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('books')
          .insert([{ ...bookPayload, user_id: profile.id }]);
        if (error) throw error;
      }

      onSuccess();
      if (!isEditMode) {
        const { currentXp } = await getCurrentXp(profile.id);
        updateXpWithReason(profile.id, currentXp - 10, `Nouveau livre ajouté - ${formData.title}`);
      }
      onClose();
    } catch (error) {
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
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleGoogleSearch}
                disabled={fetching}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-50"
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
                    className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2.5 text-xs"
                  >
                    <div className="h-8 w-6 bg-slate-100 rounded overflow-hidden shrink-0 flex items-center justify-center border">
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
            <label
              className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              htmlFor="book-title-input"
            >
              Titre
            </label>
            <input
              id="book-title-input"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label
              className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              htmlFor="book-author-input"
            >
              Auteur(s)
            </label>
            <input
              id="book-author-input"
              type="text"
              required
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label
              className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider"
              htmlFor="book-isbn-input"
            >
              Code ISBN
            </label>
            <input
              id="book-isbn-input"
              type="text"
              placeholder="Ex: 9782266200264"
              value={formData.isbn || ''}
              onChange={(e) =>
                setFormData({ ...formData, isbn: e.target.value.replace(/[^0-9X]/gi, '') })
              }
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 p-3 rounded-xl text-xs text-slate-800 dark:text-white"
            />
          </div>

          {/* 🌟 NOUVEAU BLOC : GESTION DES SAGAS */}
          <div className="bg-slate-50/60 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPartOfSagaCheckbox"
                checked={isPartOfSaga}
                onChange={(e) => setIsPartOfSaga(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label
                htmlFor="isPartOfSagaCheckbox"
                className="font-bold text-slate-700 dark:text-slate-300 select-none"
              >
                Ce livre fait partie d'une saga
              </label>
            </div>

            {isPartOfSaga && (
              <div className="space-y-2 pt-1 animate-in slide-in-from-top-1 duration-200">
                <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => setSagaMode('select')}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md transition-all ${sagaMode === 'select' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-500'}`}
                  >
                    <List className="h-3 w-3" /> Sélectionner
                  </button>
                  <button
                    type="button"
                    onClick={() => setSagaMode('create')}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md transition-all ${sagaMode === 'create' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-500'}`}
                  >
                    <Plus className="h-3 w-3" /> Nouvelle
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                      Saga
                    </label>
                    {sagaMode === 'select' ? (
                      <select
                        value={formData.saga_id || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, saga_id: e.target.value || null })
                        }
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      >
                        <option value="">-- Choisir une saga --</option>
                        {sagasList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Nom de la saga..."
                        value={newSagaTitle}
                        onChange={(e) => setNewSagaTitle(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      ></input>
                    )}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                      Tome
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 1"
                      value={formData.volume_number || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          volume_number: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de pages
            </label>
            <input
              type="number"
              value={formData.page_count || ''}
              onChange={(e) =>
                setFormData({ ...formData, page_count: parseInt(e.target.value) || null })
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-800 dark:text-white"
              placeholder="Ex: 350"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
                htmlFor="book-format-select"
              >
                Format
              </label>
              <select
                id="book-format-select"
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value as BookFormat })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-700 dark:text-slate-300"
              >
                <option value={EBookFormat.Papier}>{EBookFormat.Papier}</option>
                <option value={EBookFormat.Numerique}>{EBookFormat.Numerique}</option>
                <option value={EBookFormat.Audio}>{EBookFormat.Audio}</option>
                <option value={EBookFormat.Kindle}>{EBookFormat.Kindle}</option>
              </select>
            </div>
            <div>
              <label
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
                htmlFor="book-status-select"
              >
                Statut
              </label>
              <select
                id="book-status-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as BookStatus })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border-none text-slate-700 dark:text-slate-300"
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
              <label
                className="block text-xs font-medium text-slate-500 mb-1"
                htmlFor="book-addDate-input"
              >
                Date d'ajout
              </label>
              <input
                id="book-addDate-input"
                type="date"
                value={formData.added_at ? formData.added_at.split('T')[0] : ''}
                onChange={(e) =>
                  setFormData({ ...formData, added_at: new Date(e.target.value).toISOString() })
                }
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-lg text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl font-bold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Sauvegarde...
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
