export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          couple_id: string | null;
          onboarding_done: boolean;
          comfort_level: number;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          avatar_url?: string | null;
          couple_id?: string | null;
          onboarding_done?: boolean;
          comfort_level?: number;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar_url?: string | null;
          couple_id?: string | null;
          onboarding_done?: boolean;
          comfort_level?: number;
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_profiles_couple';
            columns: ['couple_id'];
            isOneToOne: false;
            referencedRelation: 'couples';
            referencedColumns: ['id'];
          }
        ];
      };
      couples: {
        Row: {
          id: string;
          invite_code: string;
          partner_a_id: string;
          partner_b_id: string | null;
          status: 'pending' | 'active';
          created_at: string;
        };
        Insert: {
          id?: string;
          invite_code: string;
          partner_a_id: string;
          partner_b_id?: string | null;
          status?: 'pending' | 'active';
          created_at?: string;
        };
        Update: {
          id?: string;
          invite_code?: string;
          partner_a_id?: string;
          partner_b_id?: string | null;
          status?: 'pending' | 'active';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'couples_partner_a_id_fkey';
            columns: ['partner_a_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'couples_partner_b_id_fkey';
            columns: ['partner_b_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      onboarding_responses: {
        Row: {
          id: string;
          user_id: string;
          couple_id: string;
          love_languages: string[];
          interests: string[];
          schedule: Json | null;
          communication_style: string | null;
          open_to: string[] | null;
          raw_answers: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          couple_id: string;
          love_languages: string[];
          interests: string[];
          schedule?: Json | null;
          communication_style?: string | null;
          open_to?: string[] | null;
          raw_answers?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          couple_id?: string;
          love_languages?: string[];
          interests?: string[];
          schedule?: Json | null;
          communication_style?: string | null;
          open_to?: string[] | null;
          raw_answers?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'onboarding_responses_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'onboarding_responses_couple_id_fkey';
            columns: ['couple_id'];
            isOneToOne: false;
            referencedRelation: 'couples';
            referencedColumns: ['id'];
          }
        ];
      };
      daily_tasks: {
        Row: {
          id: string;
          couple_id: string;
          title: string;
          description: string;
          category: string | null;
          intensity: number | null;
          generated_date: string;
          ai_prompt_hash: string | null;
          completed: boolean;
          ai_reasoning: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          title: string;
          description: string;
          category?: string | null;
          intensity?: number | null;
          generated_date: string;
          ai_prompt_hash?: string | null;
          completed?: boolean;
          ai_reasoning?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          title?: string;
          description?: string;
          category?: string | null;
          intensity?: number | null;
          generated_date?: string;
          ai_prompt_hash?: string | null;
          completed?: boolean;
          ai_reasoning?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'daily_tasks_couple_id_fkey';
            columns: ['couple_id'];
            isOneToOne: false;
            referencedRelation: 'couples';
            referencedColumns: ['id'];
          }
        ];
      };
      feedback: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          couple_id: string;
          rating: number;
          feeling_tag: string | null;
          free_text: string | null;
          sentiment_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          couple_id: string;
          rating: number;
          feeling_tag?: string | null;
          free_text?: string | null;
          sentiment_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          couple_id?: string;
          rating?: number;
          feeling_tag?: string | null;
          free_text?: string | null;
          sentiment_score?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'feedback_couple_id_fkey';
            columns: ['couple_id'];
            isOneToOne: false;
            referencedRelation: 'couples';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'feedback_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      mood_checkins: {
        Row: {
          id: string;
          user_id: string;
          couple_id: string;
          mood: string;
          share_with_partner: boolean;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          couple_id: string;
          mood: string;
          share_with_partner?: boolean;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          couple_id?: string;
          mood?: string;
          share_with_partner?: boolean;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mood_checkins_couple_id_fkey';
            columns: ['couple_id'];
            isOneToOne: false;
            referencedRelation: 'couples';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mood_checkins_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      ai_logs: {
        Row: {
          id: string;
          timestamp: string;
          couple_id: string | null;
          operation_type: string;
          model_used: string;
          latency_ms: number | null;
          status: 'success' | 'error' | 'fallback';
          error_message: string | null;
          prompt_hash: string | null;
          token_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          timestamp?: string;
          couple_id?: string | null;
          operation_type: string;
          model_used?: string;
          latency_ms?: number | null;
          status: 'success' | 'error' | 'fallback';
          error_message?: string | null;
          prompt_hash?: string | null;
          token_count?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          timestamp?: string;
          couple_id?: string | null;
          operation_type?: string;
          model_used?: string;
          latency_ms?: number | null;
          status?: 'success' | 'error' | 'fallback';
          error_message?: string | null;
          prompt_hash?: string | null;
          token_count?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      couple_dates: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          title: string;
          type: string;
          date: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          created_by: string;
          title: string;
          type: string;
          date: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          created_by?: string;
          title?: string;
          type?: string;
          date?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'couple_dates_couple_id_fkey';
            columns: ['couple_id'];
            isOneToOne: false;
            referencedRelation: 'couples';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'couple_dates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      events: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          title: string;
          description: string | null;
          event_type: 'date' | 'countdown' | 'message';
          event_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          event_type: 'date' | 'countdown' | 'message';
          event_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          created_by?: string;
          title?: string;
          description?: string | null;
          event_type?: 'date' | 'countdown' | 'message';
          event_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'events_couple_id_fkey';
            columns: ['couple_id'];
            isOneToOne: false;
            referencedRelation: 'couples';
            referencedColumns: ['id'];
          }
        ];
      };
      locked_messages: {
        Row: {
          id: string;
          couple_id: string;
          sender_id: string;
          content: string;
          unlock_date: string;
          is_unlocked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          sender_id: string;
          content: string;
          unlock_date: string;
          is_unlocked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          sender_id?: string;
          content?: string;
          unlock_date?: string;
          is_unlocked?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'locked_messages_couple_id_fkey';
            columns: ['couple_id'];
            isOneToOne: false;
            referencedRelation: 'couples';
            referencedColumns: ['id'];
          }
        ];
      };
      memories: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          title: string;
          description: string | null;
          image_url: string | null;
          memory_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          image_url?: string | null;
          memory_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          created_by?: string;
          title?: string;
          description?: string | null;
          image_url?: string | null;
          memory_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'memories_couple_id_fkey';
            columns: ['couple_id'];
            isOneToOne: false;
            referencedRelation: 'couples';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
