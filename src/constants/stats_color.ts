import { EBookFormat, EBookStatus } from '@/types/books.type';

export const COLORS = {
  [EBookStatus.Lu]: '#22c55e', // vert
  [EBookStatus.ALire]: '#6366f1', // indigo
  [EBookStatus.Abandonne]: '#ef4444', // rouge
  [EBookStatus.EnCours]: '#f59e0b', // ambre
};

export const SUPPORT_COLORS = {
  [EBookFormat.Papier]: '#3b82f6', // Bleu
  [EBookFormat.Numerique]: '#8b5cf6', // Violet
  [EBookFormat.Audio]: '#f59e0b', // Ambre/Orange
  [EBookFormat.Kindle]: '#94a3b8', // Gris
};
