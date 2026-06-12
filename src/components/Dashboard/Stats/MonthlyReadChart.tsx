import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const MonthlyReadChart = ({ data }: { data: { name: string; count: number }[] }) => {
  return (
    <div className="h-64 w-full bg-white dark:bg-slate-800 p-4 pb-8 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-xs">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">
        Livres lus par mois
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            fontSize={12}
            tick={{ fill: '#94a3b8' }}
          />
          <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#ffffff',
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === new Date().getMonth() ? '#4f46e5' : '#e2e8f0'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
