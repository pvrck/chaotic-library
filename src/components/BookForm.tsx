import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BookOpen, Search, Loader2, Plus, Sparkles } from 'lucide-react';
import { BookFormat, BookStatus } from '@/types';

interface BookFormProps {
  onBookAdded: () => void;
}

interface GoogleBookVolumeInfo {
  title: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string; // Souvent au format "YYYY" ou "YYYY-MM-DD"
  description?: string; // Le résumé complet (souvent en français si recherché ainsi)
  industryIdentifiers?: {
    type: 'ISBN_10' | 'ISBN_13' | 'OTHER';
    identifier: string;
  }[];
  readingModes: {
    text: boolean;
    image: boolean;
  };
  pageCount?: number;
  printType: string;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  maturityRating: string;
  allowAnonLogging: boolean;
  contentVersion: string;
  panelizationSummary?: {
    containsEpubBubbles: boolean;
    containsImageBubbles: boolean;
  };
  imageLinks?: {
    smallThumbnail?: string; // URL de la petite vignette
    thumbnail?: string; // URL de la couverture standard (la plus utilisée)
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  language: string;
  previewLink: string;
  infoLink: string;
  canonicalVolumeLink: string;
}

// Type local pour structurer les pré-résultats de recherche
interface GoogleBookSuggestion {
  id: string;
  title: string;
  authors: string;
  isbn: string | null;
  thumbnail: string | null;
}

export default function BookForm({ onBookAdded }: BookFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [isLc, setIsLc] = useState(false);
  const [addedAt, setAddedAt] = useState(new Date().toISOString().split('T')[0]);

  // États du formulaire
  const [isbnOrTitle, setIsbnOrTitle] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [format, setFormat] = useState<BookFormat>('Papier');
  const [status, setStatus] = useState<BookStatus>('A lire');
  const [sagaName, setSagaName] = useState('');
  const [sagaVolume, setSagaVolume] = useState('');
  const [isbn, setIsbn] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  // Stockage des suggestions trouvées (max 5)
  const [suggestions, setSuggestions] = useState<GoogleBookSuggestion[]>([]);

  // Fonction pour chercher les infos du livre via l'API Google Books
  const fetchBookInfo = async () => {
    if (!isbnOrTitle.trim()) return;
    setFetching(true);
    setSuggestions([]); // Reset des anciennes suggestions

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
      if (!apiKey) {
        alert('La clé VITE_GOOGLE_BOOKS_API_KEY est manquante dans votre fichier .env');
        setFetching(false);
        return;
      }

      const cleanIsbn = isbnOrTitle.replace(/[- ]/g, '');
      const isIsbn = /^\d{10}$|^\d{13}$/.test(cleanIsbn);

      const query = isIsbn ? `isbn:${cleanIsbn}` : encodeURIComponent(isbnOrTitle);

      // On demande jusqu'à 5 résultats à l'API
      const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=10&key=${apiKey}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        // Si c'est un ISBN, on prend le premier sans poser de questions
        if (isIsbn) {
          const volumeInfo = data.items[0].volumeInfo;
          setTitle(volumeInfo.title || '');
          setAuthor(volumeInfo.authors ? volumeInfo.authors.join(', ') : '');
        } else {
          // Si c'est une recherche textuelle, on mappe les résultats pour l'affichage
          const formattedSuggestions = data.items.map(
            (item: { id: string; volumeInfo: GoogleBookVolumeInfo }) => ({
              id: item.id,
              title: item.volumeInfo.title || 'Titre inconnu',
              authors: item.volumeInfo.authors
                ? item.volumeInfo.authors.join(', ')
                : 'Auteur inconnu',
              isbn:
                item.volumeInfo.industryIdentifiers?.find((id) => id.type === 'ISBN_13')
                  ?.identifier || null,
              thumbnail: item.volumeInfo.imageLinks?.smallThumbnail || null,
            })
          );
          setSuggestions(formattedSuggestions);
        }
      } else {
        alert(isIsbn ? 'Livre introuvable avec cet ISBN.' : 'Aucun livre trouvé avec ce titre.');
      }
    } catch (error) {
      console.error('Erreur API Google Books:', error);
      alert('Une erreur est survenue lors de la récupération des données.');
    } finally {
      setFetching(false);
    }
  };

  // Sélection d'une suggestion spécifique dans la liste
  const handleSelectSuggestion = (book: GoogleBookSuggestion) => {
    setTitle(book.title);
    setAuthor(book.authors);
    setIsbn(book.isbn);
    setThumbnail(book.thumbnail);
    setSuggestions([]); // Ferme la liste des suggestions une fois choisi
  };

  // Soumission à Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) return;
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error: insertError } = await supabase.from('books').insert([
        {
          title,
          author,
          status,
          format,
          saga_name: sagaName.trim() || null,
          saga_volume: sagaVolume ? parseInt(sagaVolume) : null,
          user_id: user.id,
          is_lc: isLc,
          added_at: addedAt,
          isbn,
          thumbnail,
        },
      ]);

      if (insertError) throw insertError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', user.id)
        .single();

      const currentXp = profile?.xp || 0;

      await supabase
        .from('profiles')
        .update({ xp: currentXp + 10 })
        .eq('id', user.id);

      setIsbnOrTitle('');
      setTitle('');
      setAuthor('');
      setSagaName('');
      setSagaVolume('');
      setIsLc(false);
      setAddedAt(new Date().toISOString().split('T')[0]);

      onBookAdded();
      alert('📚 Livre ajouté au réservoir ! (+10 XP)');
    } catch (error) {
      console.error("Erreur d'enregistrement:", error);
      alert("Impossible d'enregistrer le livre.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-700/50">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Plus className="h-5 w-5 text-indigo-600" /> Ajouter un nouveau livre
      </h2>

      {/* Barre de recherche magique */}
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-700/40 relative">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Recherche magique (ISBN, Code-barres ou Titre)
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ex: Le Trône de Fer"
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
            Chercher
          </button>
        </div>

        {/* 🌟 Liste déroulante des suggestions trouvées */}
        {suggestions.length > 0 && (
          <div className="absolute left-4 right-4 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
            <div className="bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Choisissez le bon résultat :
            </div>
            {suggestions.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => handleSelectSuggestion(book)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-sm flex flex-col transition-colors"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {book.title}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{book.authors}</span>
              </button>
            ))}
          </div>
        )}
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

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="isLc"
              checked={isLc}
              onChange={(e) => setIsLc(e.target.checked)}
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
              value={addedAt}
              onChange={(e) => setAddedAt(e.target.value)}
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
