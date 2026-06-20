import { supabase } from '@/lib/supabaseClient';
import { EBookStatus } from '@/types/books.type';
import { ChallengeCondition, EConditionType, EOperator } from '@/types/challenges.type';

export const challengeValidator = {
  // Point d'entrée principal
  async evaluate(userId: string, condition: ChallengeCondition): Promise<boolean> {
    if (!condition || !condition.type) {
      console.warn('Défi avec condition vide détecté');
      return false;
    }

    switch (condition.type) {
      case EConditionType.BooksRead:
        return await this.checkBooksRead(userId, condition);
      case EConditionType.PagesRead:
        return await this.checkPagesRead(userId, condition);
      case EConditionType.AuthorRepeat:
        return await this.checkAuthorRepeat(userId, condition);
      case EConditionType.SagaContinue:
        return await this.checkSagaContinue(userId, condition);
      case EConditionType.FormatMix:
        return await this.checkFormatMix(userId, condition);
      case EConditionType.NoAbandon:
        return await this.checkNoAbandon(userId, condition);
      case EConditionType.SagaStart:
        return await this.checkSagaStart(userId, condition);
      default:
        console.warn(`Type de défi non implémenté : ${condition.type}`);
        return false;
    }
  },

  async checkBooksRead(userId: string, condition: ChallengeCondition): Promise<boolean> {
    const { count } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu);

    const total = count || 0;
    return this.applyOperator(total, condition.operator, condition.threshold);
  },

  async checkPagesRead(userId: string, condition: ChallengeCondition): Promise<boolean> {
    const { data, error } = await supabase
      .from('books')
      .select('page_count')
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu);

    if (error || !data) {
      console.error('Erreur lors du calcul des pages lues:', error);
      return false;
    }

    // On calcule la somme côté client
    const totalPages = data.reduce((sum, book) => sum + (book.page_count || 0), 0);

    return this.applyOperator(totalPages, condition.operator, condition.threshold);
  },

  async checkAuthorRepeat(userId: string, condition: ChallengeCondition): Promise<boolean> {
    const { data, error } = await supabase
      .from('books')
      .select('author')
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu);

    if (error || !data) return false;

    // On compte les occurrences par auteur
    const counts: Record<string, number> = {};
    data.forEach((b) => {
      counts[b.author] = (counts[b.author] || 0) + 1;
    });

    // On regarde si au moins un auteur a atteint le seuil
    const maxBooksByAuthor = Math.max(...Object.values(counts), 0);
    return this.applyOperator(maxBooksByAuthor, condition.operator, condition.threshold);
  },

  async checkSagaContinue(userId: string, condition: ChallengeCondition): Promise<boolean> {
    const { data, error } = await supabase
      .from('books')
      .select('saga_name')
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu)
      .not('saga_name', 'is', null);

    if (error || !data) return false;

    const counts: Record<string, number> = {};
    data.forEach((b) => {
      if (b.saga_name) counts[b.saga_name] = (counts[b.saga_name] || 0) + 1;
    });

    const maxBooksInSaga = Math.max(...Object.values(counts), 0);
    return this.applyOperator(maxBooksInSaga, condition.operator, condition.threshold);
  },

  // Défi : Lire des livres de formats variés
  async checkFormatMix(userId: string, condition: ChallengeCondition): Promise<boolean> {
    const { data, error } = await supabase
      .from('books')
      .select('format')
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu);

    if (error || !data) return false;

    // On utilise un Set pour ne garder que les formats uniques
    const uniqueFormats = new Set(data.map((b) => b.format)).size;

    return this.applyOperator(uniqueFormats, condition.operator, condition.threshold);
  },

  // Défi : Ne pas abandonner de livres
  async checkNoAbandon(userId: string, condition: ChallengeCondition): Promise<boolean> {
    const { count, error } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', EBookStatus.Abandonne);

    if (error) {
      console.error('Erreur checkNoAbandon:', error);
      return false;
    }

    // On s'assure que le count est traité comme un nombre
    const totalAbandoned = count ?? 0;
    // Si le défi est "Pas d'abandon", la condition sera (valeur <= 0) ou (valeur === 0)
    return this.applyOperator(totalAbandoned, condition.operator, condition.threshold);
  },

  // Défi : Commencer une nouvelle saga (lire le volume 1)
  async checkSagaStart(userId: string, condition: ChallengeCondition): Promise<boolean> {
    const { count, error } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu)
      .eq('saga_volume', 1); // Cible spécifiquement le premier tome

    if (error) return false;

    return this.applyOperator(count || 0, condition.operator, condition.threshold);
  },

  // Helper pour comparer les valeurs (GTE, EQ, LTE)
  applyOperator(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case EOperator.Gte:
        return value >= threshold;
      case EOperator.Eq:
        return value === threshold;
      case EOperator.Lte:
        return value <= threshold;
      default:
        return false;
    }
  },

  async getProgress(userId: string, condition: ChallengeCondition): Promise<number> {
    if (!condition || !condition.type) {
      console.warn('Défi avec condition vide détecté');
      return 0;
    }

    switch (condition.type) {
      case EConditionType.BooksRead:
        return await this.calculateBooksRead(userId, condition);
      case EConditionType.PagesRead:
        return await this.calculatePagesRead(userId, condition);
      case EConditionType.AuthorRepeat:
        return await this.calculateAuthorRepeat(userId, condition);
      case EConditionType.SagaContinue:
        return await this.calculateSagaContinue(userId, condition);
      case EConditionType.FormatMix:
        return await this.calculateFormatMix(userId, condition);
      case EConditionType.NoAbandon:
        return await this.calculateNoAbandon(userId, condition);
      case EConditionType.SagaStart:
        return await this.calculateSagaStart(userId, condition);
      default:
        return 0;
    }
  },

  // --- CALCULS DE PROGRESSION ---

  async calculateBooksRead(userId: string, condition: ChallengeCondition) {
    const { count } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu);
    return Math.min(((count || 0) / condition.threshold) * 100, 100);
  },

  async calculatePagesRead(userId: string, condition: ChallengeCondition) {
    const { data } = await supabase
      .from('books')
      .select('page_count')
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu);
    const total = data?.reduce((sum, b) => sum + (b.page_count || 0), 0) || 0;
    return Math.min((total / condition.threshold) * 100, 100);
  },

  async calculateAuthorRepeat(userId: string, condition: ChallengeCondition) {
    const { data } = await supabase
      .from('books')
      .select('author')
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu);
    const counts: Record<string, number> = {};
    data?.forEach((b) => (counts[b.author] = (counts[b.author] || 0) + 1));
    const max = Math.max(...Object.values(counts), 0);
    return Math.min((max / condition.threshold) * 100, 100);
  },

  async calculateSagaContinue(userId: string, condition: ChallengeCondition) {
    const { data } = await supabase
      .from('books')
      .select('saga_name')
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu)
      .not('saga_name', 'is', null);
    const counts: Record<string, number> = {};
    data?.forEach((b) => {
      if (b.saga_name) counts[b.saga_name] = (counts[b.saga_name] || 0) + 1;
    });
    const max = Math.max(...Object.values(counts), 0);
    return Math.min((max / condition.threshold) * 100, 100);
  },

  async calculateFormatMix(userId: string, condition: ChallengeCondition) {
    const { data } = await supabase
      .from('books')
      .select('format')
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu);
    const unique = new Set(data?.map((b) => b.format)).size;
    return Math.min((unique / condition.threshold) * 100, 100);
  },

  async calculateNoAbandon(userId: string, condition: ChallengeCondition) {
    const { count } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', EBookStatus.Abandonne);
    // Pour "NoAbandon", si threshold = 0, progression 100% si count = 0, sinon 0%
    return (count || 0) <= condition.threshold ? 100 : 0;
  },

  async calculateSagaStart(userId: string, condition: ChallengeCondition) {
    const { count } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu)
      .eq('saga_volume', 1);
    return Math.min(((count || 0) / condition.threshold) * 100, 100);
  },
};
