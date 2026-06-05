/**
 * Formate une chaîne de date (ISO ou YYYY-MM-DD) en format lisible à la française.
 * Exemple : "2024-12-15" -> "15 déc. 2024"
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);

  // On vérifie que la date est valide pour éviter un affichage "Invalid Date"
  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
