import { ChangelogItemProps } from '@/types/changelog.type';

export const ChangelogItem = ({ version, date, title, content }: ChangelogItemProps) => {
  return (
    <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
          {version}
        </span>
        <span className="text-gray-500 text-sm">{new Date(date).toLocaleDateString()}</span>
      </div>

      <h3 className="text-xl font-bold mb-3">{title}</h3>

      {/* Rendu du contenu HTML (nécessite de gérer la sécurité si tu ne maîtrises pas la source) */}
      <div
        className="prose prose-slate prose-sm max-w-none 
                   prose-headings:font-bold 
                   prose-ul:list-disc prose-ul:ml-4"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};
