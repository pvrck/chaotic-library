import { EConditionType, EOperator } from '@/types/challenges.type';

interface Props {
  type: EConditionType;
  operator: EOperator;
  threshold: number;
  onChange: (updates: { type?: EConditionType; operator?: EOperator; threshold?: number }) => void;
}

const AdminChallengeConditionForm = ({ type, operator, threshold, onChange }: Props) => {
  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2">
      <label className="text-[10px] font-bold text-slate-400 uppercase">Règle de validation</label>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={type}
          onChange={(e) => onChange({ type: e.target.value as EConditionType })}
          className="col-span-2 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs"
        >
          {Object.values(EConditionType).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={operator}
          onChange={(e) => onChange({ operator: e.target.value as EOperator })}
          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs"
        >
          <option value="GTE">≥</option>
          <option value="EQ">=</option>
          <option value="LTE">≤</option>
        </select>
      </div>
      <input
        type="number"
        value={threshold}
        onChange={(e) => onChange({ threshold: parseInt(e.target.value) || 0 })}
        className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs"
        placeholder="Valeur seuil"
      />
    </div>
  );
};

export default AdminChallengeConditionForm;
