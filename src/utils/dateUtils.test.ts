import { describe, it, expect } from 'vitest';
import { formatDate } from './dateUtils';

describe('dateUtils - formatDate()', () => {
  // 🧪 Test 1 : Le cas nominal avec une date au format YYYY-MM-DD
  it('devrait formater correctement une date standard au format français', () => {
    const result = formatDate('2024-12-15');

    // Le format 'short' pour le mois en fr-FR donne généralement "15 déc. 2024"
    // Note : Selon l'environnement, l'espace peut être un espace insécable, on teste la chaîne globale
    expect(result).toMatch(/15 déc\.? 2024/);
  });

  // 🧪 Test 2 : Le cas nominal avec une chaîne complète ISO (comme ce que renvoie Supabase)
  it('devrait formater correctement une chaîne ISO complète', () => {
    const result = formatDate('2026-06-07T14:30:00.000Z');
    expect(result).toMatch(/7 juin\.? 2026/);
  });

  // 🧪 Test 3 : Gestion des valeurs vides (null / undefined / chaîne vide)
  it('devrait retourner une chaîne vide si la date est nulle, indéfinie ou vide', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
  });

  // 🧪 Test 4 : Gestion des erreurs (chaîne de caractères invalide)
  it('devrait retourner une chaîne vide et ne pas cracher si la chaîne fournie est invalide', () => {
    const result = formatDate('pas-une-date-du-tout');
    expect(result).toBe('');
  });
});
