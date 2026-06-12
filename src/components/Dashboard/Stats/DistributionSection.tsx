import { COLORS, SUPPORT_COLORS } from '@/constants/stats_color';
import { getFormatDistribution, getLibraryDistribution } from '@/services/statsService';
import { Book } from '@/types/books.type';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export const DistributionSection = ({ books }: { books: Book[] }) => {
  const statusData = getLibraryDistribution(books);
  const formatData = getFormatDistribution(books);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="h-64 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100">
        <h3 className="text-lg font-bold mb-4">Répartition des statuts</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ bottom: 30 }}>
            <Pie data={statusData} innerRadius={40} outerRadius={60} dataKey="value">
              {statusData.map((e, i) => (
                <Cell key={i} fill={COLORS[e.name as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
            />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="h-64 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100">
        <h3 className="text-lg font-bold mb-4">Répartition par support</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ bottom: 30 }}>
            <Pie data={formatData} innerRadius={50} outerRadius={70} dataKey="value">
              {formatData.map((e, i) => (
                <Cell key={i} fill={SUPPORT_COLORS[e.name as keyof typeof SUPPORT_COLORS]} />
              ))}
            </Pie>
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
            />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
