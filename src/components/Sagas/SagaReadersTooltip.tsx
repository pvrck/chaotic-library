import { ESagaUserStatus, SagaReaderInfo } from '@/types/saga.type';
import { Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SagaReadersTooltipProps {
  readers: SagaReaderInfo[];
  formatStatusLabel: (status: ESagaUserStatus | null) => string;
}

export default function SagaReadersTooltip({
  readers,
  formatStatusLabel,
}: SagaReadersTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 🌟 Sécurité pour mobile : Fermer la tooltip si on clique n'importe où ailleurs sur l'écran
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (readers.length === 0) return null;

  return (
    <div
      ref={tooltipRef}
      className="relative group/social"
      // Sur PC : On garde le comportement de survol natif
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Bouton déclencheur */}
      <button
        type="button"
        // Sur mobile : Le clic ouvre/ferme la tooltip
        onClick={(e) => {
          e.stopPropagation(); // Évite de déclencher d'autres actions sur la carte
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-500 font-bold transition cursor-pointer p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <Users className="h-3.5 w-3.5" />
        <span>{readers.length}</span>
      </button>

      {/* L'infobulle conditionnelle */}
      {isOpen && (
        <div className="absolute right-0 top-7 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between mb-2 border-b pb-1 dark:border-slate-700">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Suivi par
            </p>
            {/* Petit indicateur de fermeture discret pour le mobile */}
            <span className="text-[9px] text-slate-400 md:hidden font-medium">(clique à côté)</span>
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {readers.map((reader) => (
              <div key={reader.user_id} className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[90px]">
                  {reader.display_name}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-slate-50 dark:bg-slate-900 font-medium text-slate-500">
                  {formatStatusLabel(reader.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
