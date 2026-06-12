export interface Changelog {
  id: string;
  title: string;
  content: string;
  version: string;
  created_at: string;
  is_published: boolean;
}

export interface ChangelogItemProps {
  version: string;
  date: string;
  title: string;
  content: string;
}
