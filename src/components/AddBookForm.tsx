import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BookOpen, Search, Loader2, Plus, Sparkles } from 'lucide-react';
import { BookFormat, BookStatus } from '@/types';

interface AddBookFormProps {
  onBookAdded: () => void;
}

export default function AddBookForm({ onBookAdded }: AddBookFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // États du formulaire
  const [isbnOrTitle, setIsbnOrTitle] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [format, setFormat] = useState<BookFormat>('Papier');
  const [status, setStatus] = useState<BookStatus>('A lire');
  const [sagaName, setSagaName] = useState('');
  const [sagaVolume, setSagaVolume] = useState('');

  // Fonction pour chercher les infos du livre via l'API Open Library
  const fetchBookInfo = async () => {
    if (!isbnOrTitle.trim()) return;
    setFetching(true);

    try {
      // On nettoie l'entrée si c'est un ISBN (on ne garde que les chiffres)
      const cleanIsbn = isbnOrTitle.replace(/[- ]/g, '');
      const isIsbn = /^\d{10}$|^\d{13}$/.test(cleanIsbn);

      let url = '';
      if (isIsbn) {
        url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&jscmd=data&format=json`;
      } else {
        // Si ce n'est pas un ISBN, on fait une recherche par titre
        url = `https://openlibrary.org/search.json?title=${encodeURIComponent(isbnOrTitle)}&limit=1`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (isIsbn) {
        const bookKey = `ISBN:${cleanIsbn}`;
        if (data[bookKey]) {
          const bookData = data[bookKey];
          setTitle(bookData.title || '');
          setAuthor(bookData.authors?.[0]?.name || '');
        } else {
          alert('Livre introuvable avec cet ISBN. Remplis-le à la main !');
        }
      } else {
        if (data.docs && data.docs.length > 0) {
          const topResult = data.docs[0];
          setTitle(topResult.title || '');
          setAuthor(topResult.author_name?.[0] || '');
        } else {
          alert('Aucun livre trouvé avec ce titre.');
        }
      }
    } catch (error) {
      console.error('Erreur API OpenLibrary:', error);
    } finally {
      setFetching(false);
    }
  };

  // Soumission à Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) return;
    setLoading(true);

    // 1. Récupérer l'utilisateur connecté
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // 2. Ton insertion existante (qui utilise déjà title, author, saga_name, etc.)
    const { error: insertError } = await supabase.from('books').insert([
      {
        title,
        author,
        status: 'A lire', // Correspond à ton type BookStatus
        format,
        saga_name: sagaName.trim() || null,
        saga_volume: sagaVolume ? parseInt(sagaVolume) : null,
        user_id: user.id,
      },
    ]);

    if (insertError) throw insertError;

    // 3. 🎁 NOUVEAU : Calcul et attribution des +10 XP d'ajout !
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', user.id)
      .single();

    const currentXp = profile?.xp || 0;

    await supabase
      .from('profiles')
      .update({ xp: currentXp + 10 }) // 👈 +10 XP par livre ajouté
      .eq('id', user.id);

    // 4. Reset tes champs de formulaire (adapte selon tes variables actuelles)
    setTitle('');
    setAuthor('');
    setSagaName('');
    setSagaVolume('');
    onBookAdded();

    alert('📚 Livre ajouté au réservoir ! (+10 XP)');
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-700/50">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Plus className="h-5 w-5 text-indigo-600" /> Ajouter un nouveau livre
      </h2>

      {/* Barre de recherche magique (ISBN ou Titre) */}
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Recherche magique (ISBN, Code-barres ou Titre)
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ex: 9782253006329 ou Le Nom de la Rose"
              value={isbnOrTitle}
              onChange={(e) => setIsbnOrTitle(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={fetchBookInfo}
            disabled={fetching}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50 transition-colors"
          >
            {fetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Remplir
          </button>
        </div>
      </div>

      {/* Formulaire réel */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Titre du livre *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Auteur *
            </label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Formats & Statuts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as BookFormat)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Papier">📖 Papier</option>
              <option value="Numérique">📱 Numérique (.epub...)</option>
              <option value="Audio">🎧 Audio</option>
              <option value="Kindle">🔥 Abonnement Kindle</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Statut de lecture
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BookStatus)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="A lire">📚 À lire (PAL)</option>
              <option value="En cours">⏳ En cours</option>
              <option value="Lu">✅ Lu</option>
              <option value="Abandonné">❌ Abandonné</option>
            </select>
          </div>
        </div>

        {/* Section optionnelle : Sagas */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Saga (Optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex: Le Trône de Fer"
              value={sagaName}
              onChange={(e) => setSagaName(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tome</label>
            <input
              type="number"
              placeholder="Ex: 1"
              value={sagaVolume}
              onChange={(e) => setSagaVolume(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BookOpen className="h-4 w-4" />
          )}
          Enregistrer dans ma bibliothèque
        </button>
      </form>
    </div>
  );
}
