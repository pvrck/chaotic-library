import { useState } from 'react';
import { Pencil, Check } from 'lucide-react'; // Icônes suggérées

export const AnnualGoalCard = ({
  current,
  goal,
  year,
  onSave,
  isEditable,
}: {
  current: number;
  goal: number;
  year: number;
  onSave: (newGoal: number) => void;
  isEditable: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempGoal, setTempGoal] = useState(goal);

  const percentage = Math.min((current / goal) * 100, 100);

  const handleSave = () => {
    onSave(tempGoal);
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Objectif {year}</h3>

        {isEditable &&
          (isEditing ? (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium whitespace-nowrap">
                Objectif :
              </label>
              <input
                type="number"
                min="1"
                className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={tempGoal}
                onChange={(e) => setTempGoal(Number(e.target.value))}
              />
              <button
                onClick={handleSave}
                className="text-emerald-600 hover:text-emerald-700 transition-colors"
                aria-label="Valider l'objectif"
              >
                <Check size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-slate-400 hover:text-indigo-600"
            >
              <Pencil size={18} />
            </button>
          ))}
      </div>

      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-bold text-indigo-600">
          {current} / {goal} livres
        </span>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
