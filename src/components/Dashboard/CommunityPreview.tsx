export const CommunityPreview = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          🏆 Classement de la guilde
        </h3>
        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md font-bold">
          Actif
        </span>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Compare ton niveau et ton XP avec les autres lecteurs de la communauté ! Qui sera le premier
        à vider sa PAL ?
      </p>

      <button className="w-full bg-slate-50 hover:bg-indigo-50 dark:bg-slate-900 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-100 dark:border-slate-700/30 flex items-center justify-center gap-1.5 cursor-pointer">
        👥 Voir la communauté
      </button>
    </div>
  );
};
