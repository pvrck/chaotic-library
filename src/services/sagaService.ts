import { supabase } from '@/lib/supabaseClient';
import { Saga, ESagaUserStatus } from '@/types/saga.type';
import { Book, EBookStatus } from '@/types/books.type';

interface DBUserSaga {
  user_id: string;
  status: ESagaUserStatus | null;
  is_favorite: boolean;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null; // 🌟 Jointure pour le profil social
}

interface DBSagaRow {
  id: string;
  title: string;
  author: string | null;
  total_volumes: number | null;
  created_at: string;
  created_by: string | null;
  user_sagas: DBUserSaga[] | null;
  books: Pick<Book, 'user_id' | 'status' | 'volume_number'>[] | null;
}
export const sagaService = {
  /**
   * Récupère le catalogue des sagas enrichi des interactions de l'utilisateur connecté
   * et de l'aspect social (les autres lecteurs).
   */
  async getSagasCatalog(
    currentUserId: string,
    page: number = 1,
    pageSize: number = 12,
    statusFilter: string = 'all'
  ): Promise<{ data: Saga[]; count: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 1. On prépare la requête de base
    let query = supabase.from('sagas').select(
      `
        *,
        user_sagas(
          user_id,
          status,
          is_favorite,
          profiles(username, avatar_url)
        ),
        books(user_id, status, volume_number)
      `,
      { count: 'exact' }
    );

    // 2. 🌟 FILTRAGE AVANCÉ CÔTÉ SERVEUR
    // Si on cherche uniquement les favoris de l'utilisateur
    if (statusFilter === 'favorites') {
      query = query.eq('user_sagas.user_id', currentUserId).eq('user_sagas.is_favorite', true);
    }
    // Si on cherche un statut précis (En cours, À lire, etc.)
    else if (statusFilter !== 'all') {
      query = query.eq('user_sagas.user_id', currentUserId).eq('user_sagas.status', statusFilter);
    }

    // 3. Exécution avec la pagination
    const {
      data: sagas,
      count,
      error,
    } = await query.order('title', { ascending: true }).range(from, to);

    if (error) throw error;
    if (!sagas) return { data: [], count: 0 };

    const dbSagas = sagas as unknown as DBSagaRow[];

    const mappedData = dbSagas.map((saga) => {
      const currentUserSaga = saga.user_sagas?.find((us) => us.user_id === currentUserId);

      // --- 🧠 CALCUL AUTOMATIQUE DU STATUT ---
      let calculatedStatus: ESagaUserStatus | null = currentUserSaga?.status || null;

      if (!calculatedStatus) {
        const userBooks = saga.books?.filter((b) => b.user_id === currentUserId) || [];
        if (userBooks.length > 0) {
          const hasReadFinalVolume = userBooks.some(
            (b) =>
              saga.total_volumes &&
              b.volume_number === saga.total_volumes &&
              b.status === EBookStatus.Lu
          );
          const hasReadAny = userBooks.some((b) => b.status === EBookStatus.Lu);
          const hasBooksToRead = userBooks.some(
            (b) => b.status === EBookStatus.ALire || b.status === EBookStatus.EnCours
          );
          const hasAbandonedBooks = userBooks.some((b) => b.status === EBookStatus.Abandonne);

          if (hasReadFinalVolume) calculatedStatus = ESagaUserStatus.Termine;
          else if (hasReadAny || userBooks.some((b) => b.status === EBookStatus.EnCours))
            calculatedStatus = ESagaUserStatus.EnCours;
          else if (hasAbandonedBooks && !hasReadAny) calculatedStatus = ESagaUserStatus.Abandonne;
          else if (hasBooksToRead) calculatedStatus = ESagaUserStatus.ALire;
        }
      }

      // --- 👥 ASPECT SOCIAL DÉTAILLÉ ---
      const readers = (saga.user_sagas || [])
        .filter((us) => us.status || us.is_favorite) // 🌟 Pris en compte dès qu'il y a un statut OU un favori
        .map((us) => ({
          user_id: us.user_id,
          status: us.status as ESagaUserStatus | null, // 🌟 Peut être null si l'utilisateur l'a juste en favori
          display_name: us.profiles?.username || 'Lecteur mystère',
          avatar_url: us.profiles?.avatar_url || undefined,
        }));

      return {
        id: saga.id,
        title: saga.title,
        author: saga.author,
        total_volumes: saga.total_volumes,
        created_at: saga.created_at,
        created_by: saga.created_by,
        user_interaction: {
          status: calculatedStatus,
          is_favorite: currentUserSaga?.is_favorite || false,
        },
        readers,
      };
    });

    const filteredData =
      statusFilter !== 'all'
        ? mappedData.filter((s) =>
            statusFilter === 'favorites'
              ? s.user_interaction.is_favorite
              : s.user_interaction.status === statusFilter
          )
        : mappedData;

    return { data: filteredData, count: count || 0 };
  },

  /**
   * Ajoute ou retire une saga des favoris de l'utilisateur
   */
  async toggleFavorite(userId: string, sagaId: string, isFavorite: boolean): Promise<void> {
    const { error } = await supabase
      .from('user_sagas')
      .upsert(
        { user_id: userId, saga_id: sagaId, is_favorite: isFavorite },
        { onConflict: 'user_id,saga_id' }
      );
    if (error) throw error;
  },

  /**
   * Modifie manuellement le statut d'une saga pour l'utilisateur
   */
  async updateManualStatus(
    userId: string,
    sagaId: string,
    status: ESagaUserStatus | null
  ): Promise<void> {
    const { error } = await supabase
      .from('user_sagas')
      .upsert(
        { user_id: userId, saga_id: sagaId, status: status },
        { onConflict: 'user_id,saga_id' }
      );
    if (error) throw error;
  },
};
