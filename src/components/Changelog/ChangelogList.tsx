import { Changelog } from '@/types/changelog.type';
import { ChangelogItem } from './ChangelogItem';

export const ChangelogList = ({ changelogs }: { changelogs: Changelog[] }) => {
  return (
    // On ajoute 'relative' ici pour que la ligne soit positionnée par rapport à ce bloc
    <div className="relative space-y-8">
      {/* C'est la ligne verticale */}
      {/* On la place absolument à gauche, alignée avec les points */}
      <div
        className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200"
        aria-hidden="true"
      ></div>

      {changelogs.map((cl) => (
        <div key={cl.id} className="relative flex items-start gap-6">
          {/* Le point */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white shadow shrink-0 z-10">
            <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
          </div>

          {/* La carte */}
          <div className="flex-1">
            <ChangelogItem
              version={cl.version}
              date={cl.created_at}
              title={cl.title}
              content={cl.content}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
