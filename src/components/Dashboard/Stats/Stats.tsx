import { DistributionSection } from '@/components/Dashboard/Stats/DistributionSection';
import { YearlyChart } from '@/components/Dashboard/Stats/YearlyChart';
import { useBooks } from '@/hooks/useBooks';
import { getMonthlySnapshot, getYearlyEvolutionStats } from '@/services/statsService';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { MonthPopover } from './MonthPopover';
import { YearPopover } from './YearPopover';

export const Stats = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const currentMonth = new Date().getMonth();

  const { books } = useBooks();

  const availableYears = useMemo(() => {
    const years = books.map((book) => new Date(book.added_at).getFullYear());
    // On ajoute l'année en cours au cas où la bibliothèque est vide
    const currentYear = new Date().getFullYear();
    return Array.from(new Set([currentYear, ...years])).sort((a, b) => b - a);
  }, [books]);

  const yearlyData = useMemo(
    () => getYearlyEvolutionStats(books, selectedYear),
    [books, selectedYear]
  );
  const monthlyStats = useMemo(
    () => getMonthlySnapshot(books, selectedYear, selectedMonth),
    [books, selectedYear, selectedMonth]
  );

  // On ne garde que les données jusqu'au mois en cours
  const filteredYearlyData = useMemo(() => {
    return yearlyData.slice(0, currentMonth + 1);
  }, [yearlyData, currentMonth]);

  const statsConfig = [
    { label: 'Total Bibliothèque', key: 'total', color: 'text-slate-900', bg: 'bg-slate-200' },
    { label: 'Livres Lus', key: 'lus', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Dans la PAL', key: 'pal', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Abandonnés', key: 'abandonnes', color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Ajoutés ce mois', key: 'ajoutesCeMois', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const handleYearChange = (newYear: number) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    setSelectedYear(newYear);

    // Si on revient sur l'année en cours et que le mois actuel est "futur"
    // par rapport à aujourd'hui, on le limite à "maintenant".
    if (newYear === currentYear && selectedMonth > currentMonth) {
      setSelectedMonth(currentMonth);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Mon activité de lecture</h2>
          <p className="text-sm text-slate-500">
            Vue d'ensemble et statistiques de votre bibliothèque
          </p>
        </div>

        <div className="flex gap-3">
          <YearPopover
            selectedYear={selectedYear}
            onSelect={handleYearChange}
            years={availableYears}
          />
          <MonthPopover
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onSelect={setSelectedMonth}
          />
        </div>
      </div>

      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
        Statistiques pour {new Date(2026, selectedMonth).toLocaleString('fr-FR', { month: 'long' })}
      </h3>

      {/* Snapshot Mensuel (4 cartes) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsConfig.map((stat) => (
          <motion.div
            key={`${selectedMonth}-${stat.key}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * statsConfig.indexOf(stat) }}
            className={`p-4 ${stat.bg} rounded-2xl border border-white/50 shadow-sm`}
          >
            <p className={`text-[9px] font-black uppercase tracking-wider ${stat.color} mb-1`}>
              {stat.label}
            </p>
            <p className="text-2xl font-black text-slate-900">
              {monthlyStats[stat.key as keyof typeof monthlyStats]}
            </p>
          </motion.div>
        ))}
      </div>

      <YearlyChart data={filteredYearlyData} />
      <DistributionSection books={books} />
    </div>
  );
};
