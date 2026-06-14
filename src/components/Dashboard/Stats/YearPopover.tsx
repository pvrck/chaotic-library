import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

export const YearPopover = ({
  years,
  selectedYear,
  onSelect,
}: {
  years: number[];
  selectedYear: number;
  onSelect: (m: number) => void;
}) => {
  return (
    <Menu as="div" className="relative">
      <MenuButton className="px-6 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 rounded-full font-bold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800">
        {selectedYear} ▼
      </MenuButton>
      <MenuItems className="absolute left-0 mt-2 w-40 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-xl border border-slate-100 p-1 z-10">
        {years.map((y, i) => (
          <MenuItem key={i}>
            {({ active }) => (
              <button
                onClick={() => onSelect(y)}
                className={`${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'} block w-full text-left px-4 py-2 rounded-lg text-sm font-medium`}
              >
                {y}
              </button>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
};
