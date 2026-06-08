import { useNavigate } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
      <div className="space-y-6 max-w-md">
        {/* Icône un peu chaotique */}
        <div className="relative inline-block">
          <HelpCircle className="h-24 w-24 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <span className="absolute -top-2 -right-2 text-4xl select-none">🕵️‍♀️</span>
        </div>

        {/* Textes */}
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            404
          </h1>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Page perdue dans le Warp...
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Même la magie du Chaos ne trouve rien à cette adresse. Le grimoire que tu cherches a dû
            être dévoré par un rat de bibliothèque.
          </p>
        </div>

        {/* Bouton Retour */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer w-full justify-center"
        >
          <Home className="h-4 w-4" />
          Retourner au Tableau de Bord
        </button>
      </div>
    </div>
  );
}
