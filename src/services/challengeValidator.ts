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
        return this.applyOperator(
          await this.getBooksReadCount(userId),
          condition.operator,
          condition.threshold
        );
      case EConditionType.PagesRead:
        return this.applyOperator(
          await this.getPagesReadCount(userId),
          condition.operator,
          condition.threshold
        );
      case EConditionType.AuthorRepeat:
        return this.applyOperator(
          await this.getMaxAuthorRepeat(userId),
          condition.operator,
          condition.threshold
        );
      case EConditionType.SagaStart:
        return this.applyOperator(
          await this.getSagasStartedCount(userId),
          condition.operator,
          condition.threshold
        );
      case EConditionType.SagaContinue:
        return this.applyOperator(
          await this.getSagasContinuedCount(userId),
          condition.operator,
          condition.threshold
        );
      case EConditionType.SagaEnd:
        return this.applyOperator(
          await this.getSagasEndedCount(userId),
          condition.operator,
          condition.threshold
        );
      case EConditionType.FormatMix:
        return this.applyOperator(
          await this.getFormatMixCount(userId),
          condition.operator,
          condition.threshold
        );
      case EConditionType.NoAbandon:
        return this.applyOperator(
          await this.getAbandonedCount(userId),
          condition.operator,
          condition.threshold
        );
      default:
        console.warn(`Type de défi non implémenté : ${condition.type}`);
        return false;
    }
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
      case EConditionType.BooksRead: {
        const value = await this.getBooksReadCount(userId);
        return Math.min((value / condition.threshold) * 100, 100);
      }
      case EConditionType.PagesRead: {
        const value = await this.getPagesReadCount(userId);
        return Math.min((value / condition.threshold) * 100, 100);
      }
      case EConditionType.AuthorRepeat: {
        const value = await this.getMaxAuthorRepeat(userId);
        return Math.min((value / condition.threshold) * 100, 100);
      }
      case EConditionType.SagaStart: {
        const value = await this.getSagasStartedCount(userId);
        return Math.min((value / condition.threshold) * 100, 100);
      }
      case EConditionType.SagaContinue: {
        const value = await this.getSagasContinuedCount(userId);
        return Math.min((value / condition.threshold) * 100, 100);
      }
      case EConditionType.SagaEnd: {
        const value = await this.getSagasEndedCount(userId);
        return Math.min((value / condition.threshold) * 100, 100);
      }
      case EConditionType.FormatMix: {
        const value = await this.getFormatMixCount(userId);
        return Math.min((value / condition.threshold) * 100, 100);
      }
      case EConditionType.NoAbandon: {
        const abandoned = await this.getAbandonedCount(userId);
        return abandoned <= condition.threshold ? 100 : 0;
      }
      default:
        return 0;
    }
  },

  // --- LOGIQUE MÉTIER DES COMPTAGES ---

  async getBooksReadCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu);
    return count || 0;
  },

  async getPagesReadCount(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('books')
      .select('page_count')
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu);

    if (error || !data) return 0;
    return data.reduce((sum, book) => sum + (book.page_count || 0), 0);
  },

  async getMaxAuthorRepeat(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('books')
      .select('author')
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu);

    if (error || !data) return 0;

    const counts: Record<string, number> = {};
    data.forEach((b) => {
      counts[b.author] = (counts[b.author] || 0) + 1;
    });

    return Math.max(...Object.values(counts), 0);
  },

  async getFormatMixCount(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('books')
      .select('format')
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu);

    if (error || !data) return 0;
    return new Set(data.map((b) => b.format)).size;
  },

  async getAbandonedCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', EBookStatus.Abandonne);
    return count ?? 0;
  },

  // --- NOUVELLE LOGIQUE ASSOCIEE AUX SAGAS ---

  // SAGA_START : Nombre de tomes 1 lus
  async getSagasStartedCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu)
      .eq('volume_number', 1) // Met à jour vers volume_number si saga_volume a été migré
      .not('saga_id', 'is', null);

    if (error) return 0;
    return count || 0;
  },

  // SAGA_CONTINUE : Nombre de sagas distinctes avancées (au moins un tome lu après le premier)
  async getSagasContinuedCount(userId: string): Promise<number> {
    // Récupère tous les livres lus reliés à une saga
    const { data, error } = await supabase
      .from('books')
      .select('saga_id, volume_number')
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu)
      .not('saga_id', 'is', null);

    if (error || !data) return 0;

    // Regroupe les tomes lus par saga_id
    const sagasProgress: Record<string, number[]> = {};
    data.forEach((b) => {
      if (!sagasProgress[b.saga_id]) sagasProgress[b.saga_id] = [];
      sagasProgress[b.saga_id].push(b.volume_number!);
    });

    let continuedCount = 0;

    // Une saga est considérée comme "continuée" si l'utilisateur a lu un tome supérieur au tome 1
    // OU s'il a lu au moins deux tomes différents d'une même saga
    for (const sagaId in sagasProgress) {
      const volumes = sagasProgress[sagaId];
      const hasAdvancedVolume = volumes.some((vol) => vol > 1);
      const readMultipleVolumes = volumes.length >= 2;

      if (hasAdvancedVolume || readMultipleVolumes) {
        continuedCount++;
      }
    }

    return continuedCount;
  },

  // SAGA_END : Nombre de sagas terminées ce mois-ci / au total
  async getSagasEndedCount(userId: string): Promise<number> {
    const { data: books, error } = await supabase
      .from('books')
      .select('saga_id, volume_number')
      .eq('user_id', userId)
      .eq('status', EBookStatus.Lu)
      .not('saga_id', 'is', null);

    if (error || !books) return 0;

    let completedSagasCount = 0;

    // On isole les sagas uniques lues pour vérifier leur statut global
    const uniqueSagaIds = Array.from(new Set(books.map((b) => b.saga_id)));

    for (const sagaId of uniqueSagaIds) {
      // 1. Récupérer les métadonnées de la saga
      const { data: sagaInfo } = await supabase
        .from('sagas')
        .select('total_volumes')
        .eq('id', sagaId)
        .maybeSingle();

      if (!sagaInfo) continue;

      let targetFinalVolume = sagaInfo.total_volumes;

      // 2. Si non renseigné, fallback sur le plus grand volume enregistré dans le catalogue global
      if (!targetFinalVolume) {
        const { data: maxVolume } = await supabase
          .from('saga_volumes')
          .select('volume_number')
          .eq('saga_id', sagaId)
          .order('volume_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (maxVolume) {
          targetFinalVolume = maxVolume.volume_number;
        }
      }

      // Si on n'a aucune information sur la fin de la saga, on ne peut pas la valider
      if (!targetFinalVolume) continue;

      // 3. Vérifier si l'utilisateur a bien lu ce tome final précis
      const hasReadFinalVolume = books.some(
        (b) => b.saga_id === sagaId && b.volume_number === targetFinalVolume
      );

      if (hasReadFinalVolume) {
        completedSagasCount++;
      }
    }

    return completedSagasCount;
  },
};
