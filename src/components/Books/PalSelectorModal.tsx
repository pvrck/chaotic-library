import { getRandomBookFromPAL, PickableBook } from '@/services/pickService';
import { Book } from '@/types/books.type';
import { Check, Dices, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';

interface PalSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  allBooks: Book[];
  sagasMap: Record<string, string>;
  onValidateBook: (bookId: string) => Promise<void>; // Fonction pour passer le livre en "En cours"
}

export default function PalSelectorModal({
  isOpen,
  onClose,
  allBooks,
  sagasMap,
  onValidateBook,
}: PalSelectorModalProps) {
  const [drawnBook, setDrawnBook] = useState<PickableBook | null>(null);
  const [rerollsLeft, setRerollsLeft] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLaunchDraw = () => {
    const book = getRandomBookFromPAL(allBooks, sagasMap);
    setDrawnBook(book);
    setRerollsLeft(2); // Reset des jokers au tout premier tirage de la session
  };

  const handleReroll = () => {
    if (rerollsLeft > 0) {
      const book = getRandomBookFromPAL(allBooks, sagasMap);
      setDrawnBook(book);
      setRerollsLeft((prev) => prev - 1);
    }
  };

  const handleConfirm = async () => {
    if (!drawnBook || !drawnBook.id) return;
    setIsSubmitting(true);
    try {
      await onValidateBook(drawnBook.id!);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la validation du tirage', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative space-y-6">
        {/* Fermeture */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* En-tête */}
        <div className="text-center space-y-1">
          <div className="mx-auto h-10 w-10 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Dices className="h-5 w-5" />
          </div>
          <h3 className="font-black text-slate-800 dark:text-white tracking-tight text-base">
            Le Destin de la PAL
          </h3>
          <p className="text-xs text-slate-400">
            Laisse la bibliothèque choisir ta prochaine lecture.
          </p>
        </div>

        {/* Zone de résultat */}
        <div className="min-h-[120px] flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-4 text-center">
          {drawnBook ? (
            <div className="space-y-1.5 animate-in zoom-in-95 duration-200">
              {drawnBook.saga_title && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                  {drawnBook.saga_title} · Tome {drawnBook.volume_number}
                </span>
              )}
              <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">
                {drawnBook.title}
              </h4>
              <p className="text-xs text-slate-400">Par {drawnBook.author || 'Auteur inconnu'}</p>
            </div>
          ) : (
            <button
              onClick={handleLaunchDraw}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/10 transition cursor-pointer"
            >
              <Dices className="h-4 w-4" /> Lancer le tirage
            </button>
          )}
        </div>

        {/* Boutons d'actions si tirage effectué */}
        {drawnBook && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {/* Bouton Reroll */}
              <button
                disabled={rerollsLeft === 0}
                onClick={handleReroll}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Relancer ({rerollsLeft})</span>
              </button>

              {/* Bouton Accepter */}
              <button
                disabled={isSubmitting}
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-emerald-500/10 transition cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Lire ce livre</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
