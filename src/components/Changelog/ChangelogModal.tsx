import { Changelog } from '@/types/changelog.type';
import { ChangelogItem } from './ChangelogItem';

export const ChangelogModal = ({
  changelog,
  onClose,
}: {
  changelog: Changelog;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-800">✨ Quoi de neuf ?</h2>

          <ChangelogItem
            version={changelog.version}
            date={changelog.created_at}
            title={changelog.title}
            content={changelog.content}
          />

          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Ok, compris !
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
