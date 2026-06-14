export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      achievements_definitions: {
        Row: {
          condition_type: string;
          created_at: string | null;
          description: string | null;
          id: string;
          threshold: number;
          title: string;
          xp_reward: number;
        };
        Insert: {
          condition_type: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          threshold: number;
          title: string;
          xp_reward: number;
        };
        Update: {
          condition_type?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          threshold?: number;
          title?: string;
          xp_reward?: number;
        };
        Relationships: [];
      };
      books: {
        Row: {
          added_at: string | null;
          author: string;
          finished_at: string | null;
          format: Database['public']['Enums']['book_format'];
          id: string;
          is_lc: boolean;
          isbn: string | null;
          saga_name: string | null;
          saga_volume: number | null;
          started_at: string | null;
          status: Database['public']['Enums']['book_status'];
          thumbnail: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          added_at?: string | null;
          author: string;
          finished_at?: string | null;
          format?: Database['public']['Enums']['book_format'];
          id?: string;
          is_lc?: boolean;
          isbn?: string | null;
          saga_name?: string | null;
          saga_volume?: number | null;
          started_at?: string | null;
          status?: Database['public']['Enums']['book_status'];
          thumbnail?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          added_at?: string | null;
          author?: string;
          finished_at?: string | null;
          format?: Database['public']['Enums']['book_format'];
          id?: string;
          is_lc?: boolean;
          isbn?: string | null;
          saga_name?: string | null;
          saga_volume?: number | null;
          started_at?: string | null;
          status?: Database['public']['Enums']['book_status'];
          thumbnail?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      challenge_pool: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          duration_days: number | null;
          id: string;
          title: string;
          type: string;
          xp_bonus: number;
          xp_malus: number;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          duration_days?: number | null;
          id?: string;
          title: string;
          type: string;
          xp_bonus?: number;
          xp_malus?: number;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          duration_days?: number | null;
          id?: string;
          title?: string;
          type?: string;
          xp_bonus?: number;
          xp_malus?: number;
        };
        Relationships: [];
      };
      changelog_views: {
        Row: {
          changelog_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          changelog_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          changelog_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'changelog_views_changelog_id_fkey';
            columns: ['changelog_id'];
            isOneToOne: false;
            referencedRelation: 'changelogs';
            referencedColumns: ['id'];
          },
        ];
      };
      changelogs: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          is_published: boolean | null;
          title: string;
          version: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          is_published?: boolean | null;
          title: string;
          version: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          is_published?: boolean | null;
          title?: string;
          version?: string;
        };
        Relationships: [];
      };
      levels_config: {
        Row: {
          created_at: string;
          id: number;
          title: string;
          xp_min: number;
        };
        Insert: {
          created_at?: string;
          id?: number;
          title: string;
          xp_min: number;
        };
        Update: {
          created_at?: string;
          id?: number;
          title?: string;
          xp_min?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          email: string;
          id: string;
          role: Database['public']['Enums']['app_role'];
          updated_at: string | null;
          username: string | null;
          xp: number;
          created_at?: string;
        };
        Insert: {
          avatar_url?: string | null;
          email: string;
          id: string;
          role?: Database['public']['Enums']['app_role'];
          updated_at?: string | null;
          username?: string | null;
          xp?: number;
        };
        Update: {
          avatar_url?: string | null;
          email?: string;
          id?: string;
          role?: Database['public']['Enums']['app_role'];
          updated_at?: string | null;
          username?: string | null;
          xp?: number;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          achievement_id: string | null;
          id: string;
          unlocked_at: string | null;
          user_id: string | null;
        };
        Insert: {
          achievement_id?: string | null;
          id?: string;
          unlocked_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          achievement_id?: string | null;
          id?: string;
          unlocked_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_achievements_achievement_id_fkey';
            columns: ['achievement_id'];
            isOneToOne: false;
            referencedRelation: 'achievements_definitions';
            referencedColumns: ['id'];
          },
        ];
      };
      user_challenges: {
        Row: {
          activated_at: string | null;
          challenge_id: string;
          completed_at: string | null;
          expires_at: string | null;
          id: string;
          status: Database['public']['Enums']['challenge_status'];
          user_id: string;
        };
        Insert: {
          activated_at?: string | null;
          challenge_id: string;
          completed_at?: string | null;
          expires_at?: string | null;
          id?: string;
          status?: Database['public']['Enums']['challenge_status'];
          user_id: string;
        };
        Update: {
          activated_at?: string | null;
          challenge_id?: string;
          completed_at?: string | null;
          expires_at?: string | null;
          id?: string;
          status?: Database['public']['Enums']['challenge_status'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_challenges_challenge_id_fkey';
            columns: ['challenge_id'];
            isOneToOne: false;
            referencedRelation: 'challenge_pool';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_challenges_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_goals: {
        Row: {
          created_at: string | null;
          id: string;
          target_count: number;
          user_id: string;
          year: number;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          target_count: number;
          user_id: string;
          year: number;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          target_count?: number;
          user_id?: string;
          year?: number;
        };
        Relationships: [];
      };
      xp_history: {
        Row: {
          amount: number;
          created_at: string | null;
          id: string;
          reason: string;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          id?: string;
          reason: string;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          id?: string;
          reason?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      app_role: 'user' | 'admin';
      book_format: 'Papier' | 'Numérique' | 'Audio' | 'Kindle';
      book_status: 'A lire' | 'En cours' | 'Lu' | 'Abandonné';
      challenge_status: 'en_cours' | 'reussi' | 'echoue';
      status: 'en_cours' | 'reussi' | 'echoue';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ['user', 'admin'],
      book_format: ['Papier', 'Numérique', 'Audio', 'Kindle'],
      book_status: ['A lire', 'En cours', 'Lu', 'Abandonné'],
      challenge_status: ['en_cours', 'reussi', 'echoue'],
      status: ['en_cours', 'reussi', 'echoue'],
    },
  },
} as const;
