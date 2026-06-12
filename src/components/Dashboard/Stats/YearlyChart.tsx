import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface filteredYearlyData {
  month: string;
  total: number;
  lus: number;
  abandonnes: number;
}

export const YearlyChart = ({ data }: { data: filteredYearlyData[] }) => (
  <div className="h-80 w-full bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
    <h3 className="text-lg font-bold mb-4">Progression Annuelle</h3>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ bottom: 20, right: 20 }}>
        <XAxis dataKey="month" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip contentStyle={{ borderRadius: '12px' }} />
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#6366f1"
          name="Bibliothèque"
          strokeWidth={2}
        />
        <Line type="monotone" dataKey="lus" stroke="#22c55e" name="Lus" strokeWidth={2} />
        <Line
          type="monotone"
          dataKey="abandonnes"
          stroke="#ef4444"
          name="Abandonnés"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
