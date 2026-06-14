import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

export const MonthPopover = ({
  selectedMonth,
  selectedYear,
  onSelect,
}: {
  selectedMonth: number;
  selectedYear: number;
  onSelect: (m: number) => void;
}) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const months = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  // Si l'année sélectionnée est l'année en cours, on bride. Sinon, on affiche tout.
  const isCurrentYear = selectedYear === currentYear;
  const availableMonths = isCurrentYear ? months.slice(0, currentMonth + 1) : months;

  return (
    <Menu as="div" className="relative">
      <MenuButton className="px-6 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 rounded-full font-bold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800">
        {months[selectedMonth]} ▼
      </MenuButton>
      <MenuItems className="absolute left-0 mt-2 w-40 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-xl border border-slate-100 p-1 z-10">
        {availableMonths.map((m, i) => (
          <MenuItem key={i}>
            {({ active }) => (
              <button
                onClick={() => onSelect(i)}
                className={`${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'} block w-full text-left px-4 py-2 rounded-lg text-sm font-medium`}
              >
                {m}
              </button>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
};
