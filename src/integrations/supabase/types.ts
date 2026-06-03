export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_health_config: {
        Row: {
          created_at: string
          fb_ad_account_id: string
          guardrail_mode: string
          id: string
          rejection_threshold: number
          updated_at: string
          warning_threshold: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          fb_ad_account_id: string
          guardrail_mode?: string
          id?: string
          rejection_threshold?: number
          updated_at?: string
          warning_threshold?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          fb_ad_account_id?: string
          guardrail_mode?: string
          id?: string
          rejection_threshold?: number
          updated_at?: string
          warning_threshold?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_health_config_fb_ad_account_id_fkey"
            columns: ["fb_ad_account_id"]
            isOneToOne: false
            referencedRelation: "fb_ad_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      account_health_events: {
        Row: {
          created_at: string
          event_type: string
          fb_ad_account_id: string
          id: string
          metadata: Json
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          fb_ad_account_id: string
          id?: string
          metadata?: Json
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          fb_ad_account_id?: string
          id?: string
          metadata?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_health_events_fb_ad_account_id_fkey"
            columns: ["fb_ad_account_id"]
            isOneToOne: false
            referencedRelation: "fb_ad_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      account_health_snapshots: {
        Row: {
          approved_ads: number | null
          fb_ad_account_id: string
          health_state: string
          id: string
          last_synced_at: string | null
          rejected_ads: number | null
          rejection_ratio: number | null
          snapshot_at: string
          sync_status: string
          total_ads: number | null
          workspace_id: string
        }
        Insert: {
          approved_ads?: number | null
          fb_ad_account_id: string
          health_state?: string
          id?: string
          last_synced_at?: string | null
          rejected_ads?: number | null
          rejection_ratio?: number | null
          snapshot_at?: string
          sync_status?: string
          total_ads?: number | null
          workspace_id: string
        }
        Update: {
          approved_ads?: number | null
          fb_ad_account_id?: string
          health_state?: string
          id?: string
          last_synced_at?: string | null
          rejected_ads?: number | null
          rejection_ratio?: number | null
          snapshot_at?: string
          sync_status?: string
          total_ads?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_health_snapshots_fb_ad_account_id_fkey"
            columns: ["fb_ad_account_id"]
            isOneToOne: false
            referencedRelation: "fb_ad_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          target_email: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_email: string
          user_id: string
          workspace_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_email?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_products: {
        Row: {
          brand_id: string
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          price: string | null
          sku: string | null
          status: string
          updated_at: string | null
          url: string | null
          workspace_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: string | null
          sku?: string | null
          status?: string
          updated_at?: string | null
          url?: string | null
          workspace_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: string | null
          sku?: string | null
          status?: string
          updated_at?: string | null
          url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          category: string | null
          client_id: string | null
          colors: string[] | null
          created_at: string | null
          created_by: string
          guidelines: string | null
          id: string
          industry: string | null
          last_synced_at: string | null
          logo_url: string | null
          name: string
          tone: string | null
          typography: string | null
          updated_at: string | null
          website: string | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          colors?: string[] | null
          created_at?: string | null
          created_by: string
          guidelines?: string | null
          id?: string
          industry?: string | null
          last_synced_at?: string | null
          logo_url?: string | null
          name: string
          tone?: string | null
          typography?: string | null
          updated_at?: string | null
          website?: string | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          client_id?: string | null
          colors?: string[] | null
          created_at?: string | null
          created_by?: string
          guidelines?: string | null
          id?: string
          industry?: string | null
          last_synced_at?: string | null
          logo_url?: string | null
          name?: string
          tone?: string | null
          typography?: string | null
          updated_at?: string | null
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brands_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_url_ad_accounts: {
        Row: {
          campaign_url_id: string
          fb_ad_account_id: string
          id: string
          workspace_id: string
        }
        Insert: {
          campaign_url_id: string
          fb_ad_account_id: string
          id?: string
          workspace_id: string
        }
        Update: {
          campaign_url_id?: string
          fb_ad_account_id?: string
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_ad_accounts_fb_ad_account_id_fkey"
            columns: ["fb_ad_account_id"]
            isOneToOne: false
            referencedRelation: "fb_ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_ad_accounts_offer_id_fkey"
            columns: ["campaign_url_id"]
            isOneToOne: false
            referencedRelation: "campaign_urls"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_url_ads: {
        Row: {
          ad_format: string
          campaign_url_id: string
          carousel_cards: Json | null
          collection_config: Json | null
          created_at: string | null
          cta: string | null
          description: string | null
          destination_url: string | null
          display_link: string | null
          headline: string | null
          id: string
          media_type: string | null
          media_urls: string[] | null
          name: string
          primary_text: string | null
          sort_order: number
          workspace_id: string
        }
        Insert: {
          ad_format?: string
          campaign_url_id: string
          carousel_cards?: Json | null
          collection_config?: Json | null
          created_at?: string | null
          cta?: string | null
          description?: string | null
          destination_url?: string | null
          display_link?: string | null
          headline?: string | null
          id?: string
          media_type?: string | null
          media_urls?: string[] | null
          name?: string
          primary_text?: string | null
          sort_order?: number
          workspace_id: string
        }
        Update: {
          ad_format?: string
          campaign_url_id?: string
          carousel_cards?: Json | null
          collection_config?: Json | null
          created_at?: string | null
          cta?: string | null
          description?: string | null
          destination_url?: string | null
          display_link?: string | null
          headline?: string | null
          id?: string
          media_type?: string | null
          media_urls?: string[] | null
          name?: string
          primary_text?: string | null
          sort_order?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_ads_offer_id_fkey"
            columns: ["campaign_url_id"]
            isOneToOne: false
            referencedRelation: "campaign_urls"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_url_cl_folder_links: {
        Row: {
          campaign_url_id: string
          cl_folder_id: string
          created_at: string
          id: string
          workspace_id: string
        }
        Insert: {
          campaign_url_id: string
          cl_folder_id: string
          created_at?: string
          id?: string
          workspace_id: string
        }
        Update: {
          campaign_url_id?: string
          cl_folder_id?: string
          created_at?: string
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_cl_folder_links_cl_folder_id_fkey"
            columns: ["cl_folder_id"]
            isOneToOne: false
            referencedRelation: "cl_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_cl_folder_links_offer_id_fkey"
            columns: ["campaign_url_id"]
            isOneToOne: false
            referencedRelation: "campaign_urls"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_url_folder_items: {
        Row: {
          asset_id: string | null
          created_at: string
          folder_id: string
          id: string
          item_type: string
          media_type: string | null
          metadata: Json
          source: string
          workspace_id: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          folder_id: string
          id?: string
          item_type?: string
          media_type?: string | null
          metadata?: Json
          source?: string
          workspace_id: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          folder_id?: string
          id?: string
          item_type?: string
          media_type?: string | null
          metadata?: Json
          source?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_folder_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "campaign_url_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_url_folders: {
        Row: {
          campaign_url_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          campaign_url_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          campaign_url_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_folders_offer_id_fkey"
            columns: ["campaign_url_id"]
            isOneToOne: false
            referencedRelation: "campaign_urls"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_url_pages: {
        Row: {
          campaign_url_id: string
          id: string
          page_id: string
          workspace_id: string
        }
        Insert: {
          campaign_url_id: string
          id?: string
          page_id: string
          workspace_id: string
        }
        Update: {
          campaign_url_id?: string
          id?: string
          page_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_pages_offer_id_fkey"
            columns: ["campaign_url_id"]
            isOneToOne: false
            referencedRelation: "campaign_urls"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_url_replacement_links: {
        Row: {
          campaign_url_id: string
          created_at: string | null
          id: string
          url: string
          workspace_id: string
        }
        Insert: {
          campaign_url_id: string
          created_at?: string | null
          id?: string
          url: string
          workspace_id: string
        }
        Update: {
          campaign_url_id?: string
          created_at?: string | null
          id?: string
          url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_replacement_links_offer_id_fkey"
            columns: ["campaign_url_id"]
            isOneToOne: false
            referencedRelation: "campaign_urls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_replacement_links_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_url_targeting_links: {
        Row: {
          campaign_url_id: string
          created_at: string
          id: string
          is_default: boolean
          sort_order: number
          targeting_template_id: string
          workspace_id: string
        }
        Insert: {
          campaign_url_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          sort_order?: number
          targeting_template_id: string
          workspace_id: string
        }
        Update: {
          campaign_url_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          sort_order?: number
          targeting_template_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_url_targeting_links_campaign_url_id_fkey"
            columns: ["campaign_url_id"]
            isOneToOne: false
            referencedRelation: "campaign_urls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_url_targeting_links_targeting_template_id_fkey"
            columns: ["targeting_template_id"]
            isOneToOne: false
            referencedRelation: "targeting_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_urls: {
        Row: {
          ads_config: Json
          adset_config: Json
          campaign_config: Json
          campaign_url_type: string
          created_at: string
          created_by: string
          id: string
          name: string
          pixel_id: string | null
          status: string
          targeting_template_id: string | null
          tracking_url: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ads_config?: Json
          adset_config?: Json
          campaign_config?: Json
          campaign_url_type?: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          pixel_id?: string | null
          status?: string
          targeting_template_id?: string | null
          tracking_url?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ads_config?: Json
          adset_config?: Json
          campaign_config?: Json
          campaign_url_type?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          pixel_id?: string | null
          status?: string
          targeting_template_id?: string | null
          tracking_url?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_targeting_template_id_fkey"
            columns: ["targeting_template_id"]
            isOneToOne: false
            referencedRelation: "targeting_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      cl_adgroups: {
        Row: {
          ad_type: string
          created_at: string
          created_by: string
          cta: string
          description_id: string | null
          destination_url: string | null
          display_link: string | null
          headline_id: string | null
          id: string
          is_favourite: boolean
          media_ids: string[]
          name: string
          page_avatar_url: string | null
          page_name: string
          primary_text_id: string | null
          workspace_id: string
        }
        Insert: {
          ad_type?: string
          created_at?: string
          created_by: string
          cta?: string
          description_id?: string | null
          destination_url?: string | null
          display_link?: string | null
          headline_id?: string | null
          id?: string
          is_favourite?: boolean
          media_ids?: string[]
          name?: string
          page_avatar_url?: string | null
          page_name?: string
          primary_text_id?: string | null
          workspace_id: string
        }
        Update: {
          ad_type?: string
          created_at?: string
          created_by?: string
          cta?: string
          description_id?: string | null
          destination_url?: string | null
          display_link?: string | null
          headline_id?: string | null
          id?: string
          is_favourite?: boolean
          media_ids?: string[]
          name?: string
          page_avatar_url?: string | null
          page_name?: string
          primary_text_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cl_adgroups_description_id_fkey"
            columns: ["description_id"]
            isOneToOne: false
            referencedRelation: "cl_descriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cl_adgroups_headline_id_fkey"
            columns: ["headline_id"]
            isOneToOne: false
            referencedRelation: "cl_headlines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cl_adgroups_primary_text_id_fkey"
            columns: ["primary_text_id"]
            isOneToOne: false
            referencedRelation: "cl_primary_texts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cl_adgroups_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cl_descriptions: {
        Row: {
          categories: string[]
          created_at: string
          created_by: string
          id: string
          is_favourite: boolean
          platforms: string[]
          tags: string[]
          text: string
          workspace_id: string
        }
        Insert: {
          categories?: string[]
          created_at?: string
          created_by: string
          id?: string
          is_favourite?: boolean
          platforms?: string[]
          tags?: string[]
          text: string
          workspace_id: string
        }
        Update: {
          categories?: string[]
          created_at?: string
          created_by?: string
          id?: string
          is_favourite?: boolean
          platforms?: string[]
          tags?: string[]
          text?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cl_descriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cl_folder_items: {
        Row: {
          created_at: string
          folder_id: string
          id: string
          item_id: string
          item_type: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          folder_id: string
          id?: string
          item_id: string
          item_type?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string
          id?: string
          item_id?: string
          item_type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cl_folder_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "cl_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      cl_folders: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          sort_order: number
          tags: string[]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cl_folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cl_headlines: {
        Row: {
          categories: string[]
          created_at: string
          created_by: string
          id: string
          is_favourite: boolean
          platforms: string[]
          tags: string[]
          text: string
          workspace_id: string
        }
        Insert: {
          categories?: string[]
          created_at?: string
          created_by: string
          id?: string
          is_favourite?: boolean
          platforms?: string[]
          tags?: string[]
          text: string
          workspace_id: string
        }
        Update: {
          categories?: string[]
          created_at?: string
          created_by?: string
          id?: string
          is_favourite?: boolean
          platforms?: string[]
          tags?: string[]
          text?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cl_headlines_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cl_primary_texts: {
        Row: {
          categories: string[]
          created_at: string
          created_by: string
          id: string
          is_favourite: boolean
          platforms: string[]
          tags: string[]
          text: string
          workspace_id: string
        }
        Insert: {
          categories?: string[]
          created_at?: string
          created_by: string
          id?: string
          is_favourite?: boolean
          platforms?: string[]
          tags?: string[]
          text: string
          workspace_id: string
        }
        Update: {
          categories?: string[]
          created_at?: string
          created_by?: string
          id?: string
          is_favourite?: boolean
          platforms?: string[]
          tags?: string[]
          text?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cl_primary_texts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      client_users: {
        Row: {
          client_id: string
          created_at: string
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          created_by: string
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      copilot_conversations: {
        Row: {
          created_at: string
          id: string
          module_context: string | null
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_context?: string | null
          title?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_context?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      copilot_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          images: string[]
          metadata: Json
          role: string
          workspace_id: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          images?: string[]
          metadata?: Json
          role?: string
          workspace_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          images?: string[]
          metadata?: Json
          role?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "copilot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_assets: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          folder_id: string | null
          height: number | null
          id: string
          storage_path: string
          thumbnail_url: string | null
          uploaded_by: string
          url: string
          width: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string
          folder_id?: string | null
          height?: number | null
          id?: string
          storage_path: string
          thumbnail_url?: string | null
          uploaded_by: string
          url: string
          width?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          folder_id?: string | null
          height?: number | null
          id?: string
          storage_path?: string
          thumbnail_url?: string | null
          uploaded_by?: string
          url?: string
          width?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_assets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "creative_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      fb_ad_accounts: {
        Row: {
          account_status: number | null
          created_at: string
          currency: string | null
          fb_account_id: string
          fb_business_manager_id: string | null
          fb_connection_id: string
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          account_status?: number | null
          created_at?: string
          currency?: string | null
          fb_account_id: string
          fb_business_manager_id?: string | null
          fb_connection_id: string
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          account_status?: number | null
          created_at?: string
          currency?: string | null
          fb_account_id?: string
          fb_business_manager_id?: string | null
          fb_connection_id?: string
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fb_ad_accounts_fb_business_manager_id_fkey"
            columns: ["fb_business_manager_id"]
            isOneToOne: false
            referencedRelation: "fb_business_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fb_ad_accounts_fb_connection_id_fkey"
            columns: ["fb_connection_id"]
            isOneToOne: false
            referencedRelation: "fb_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fb_ad_accounts_fb_connection_id_fkey"
            columns: ["fb_connection_id"]
            isOneToOne: false
            referencedRelation: "fb_connections_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fb_ad_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      fb_business_managers: {
        Row: {
          created_at: string
          fb_business_id: string
          fb_connection_id: string
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          fb_business_id: string
          fb_connection_id: string
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          fb_business_id?: string
          fb_connection_id?: string
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fb_business_managers_fb_connection_id_fkey"
            columns: ["fb_connection_id"]
            isOneToOne: false
            referencedRelation: "fb_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fb_business_managers_fb_connection_id_fkey"
            columns: ["fb_connection_id"]
            isOneToOne: false
            referencedRelation: "fb_connections_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fb_business_managers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      fb_connections: {
        Row: {
          connected_at: string
          connected_by: string
          created_at: string
          fb_user_id: string
          fb_user_name: string
          id: string
          last_synced_at: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          connected_at?: string
          connected_by: string
          created_at?: string
          fb_user_id: string
          fb_user_name: string
          id?: string
          last_synced_at?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          connected_at?: string
          connected_by?: string
          created_at?: string
          fb_user_id?: string
          fb_user_name?: string
          id?: string
          last_synced_at?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fb_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      fb_pages: {
        Row: {
          active_ad_count: number
          fb_ad_account_id: string | null
          fb_page_id: string
          id: string
          name: string | null
          status: string | null
          workspace_id: string
        }
        Insert: {
          active_ad_count?: number
          fb_ad_account_id?: string | null
          fb_page_id: string
          id?: string
          name?: string | null
          status?: string | null
          workspace_id: string
        }
        Update: {
          active_ad_count?: number
          fb_ad_account_id?: string | null
          fb_page_id?: string
          id?: string
          name?: string | null
          status?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fb_pages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      fb_tokens: {
        Row: {
          access_token: string
          created_at: string
          fb_connection_id: string
          id: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          fb_connection_id: string
          id?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          fb_connection_id?: string
          id?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fb_tokens_fb_connection_id_fkey"
            columns: ["fb_connection_id"]
            isOneToOne: true
            referencedRelation: "fb_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fb_tokens_fb_connection_id_fkey"
            columns: ["fb_connection_id"]
            isOneToOne: true
            referencedRelation: "fb_connections_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      genie_categories: {
        Row: {
          created_at: string
          created_by: string
          icon: string | null
          id: string
          name: string
          niche: string | null
          reference_urls: Json | null
          system_prompt: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          icon?: string | null
          id?: string
          name: string
          niche?: string | null
          reference_urls?: Json | null
          system_prompt?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          icon?: string | null
          id?: string
          name?: string
          niche?: string | null
          reference_urls?: Json | null
          system_prompt?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      genie_category_winners: {
        Row: {
          category_id: string
          created_at: string
          id: string
          image_url: string
          is_cross_niche: boolean
          notes: string | null
          source: string | null
          storage_path: string
          tags: string[]
          workspace_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          image_url: string
          is_cross_niche?: boolean
          notes?: string | null
          source?: string | null
          storage_path?: string
          tags?: string[]
          workspace_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          image_url?: string
          is_cross_niche?: boolean
          notes?: string | null
          source?: string | null
          storage_path?: string
          tags?: string[]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "genie_category_winners_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "genie_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      genie_feedback: {
        Row: {
          comment: string | null
          created_at: string
          feedback_type: string
          id: string
          metadata: Json
          strategy_angle: string | null
          strategy_title: string | null
          target_id: string
          target_type: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          feedback_type: string
          id?: string
          metadata?: Json
          strategy_angle?: string | null
          strategy_title?: string | null
          target_id: string
          target_type: string
          user_id: string
          workspace_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          metadata?: Json
          strategy_angle?: string | null
          strategy_title?: string | null
          target_id?: string
          target_type?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      genie_generations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          output_url: string
          parent_id: string | null
          prompt: string
          reference_image_ids: string[]
          reference_mode: string
          settings: Json
          status: string
          storage_path: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          output_url: string
          parent_id?: string | null
          prompt: string
          reference_image_ids?: string[]
          reference_mode?: string
          settings?: Json
          status?: string
          storage_path: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          output_url?: string
          parent_id?: string | null
          prompt?: string
          reference_image_ids?: string[]
          reference_mode?: string
          settings?: Json
          status?: string
          storage_path?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "genie_generations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "genie_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      genie_templates: {
        Row: {
          brand_id: string | null
          category_id: string | null
          created_at: string
          created_by: string
          id: string
          image_url: string
          name: string
          tags: string[]
          workspace_id: string
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          image_url: string
          name?: string
          tags?: string[]
          workspace_id: string
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string
          name?: string
          tags?: string[]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "genie_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_board_items: {
        Row: {
          board_id: string
          brand: string | null
          created_at: string
          domain: string | null
          id: string
          metadata: Json
          note: string | null
          platform: string | null
          source_ad_id: string
          status: string | null
          thumb_url: string | null
          workspace_id: string
        }
        Insert: {
          board_id: string
          brand?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          metadata?: Json
          note?: string | null
          platform?: string | null
          source_ad_id: string
          status?: string | null
          thumb_url?: string | null
          workspace_id: string
        }
        Update: {
          board_id?: string
          brand?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          metadata?: Json
          note?: string | null
          platform?: string | null
          source_ad_id?: string
          status?: string | null
          thumb_url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_board_items_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "insight_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_boards: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          tags: string[]
          workspace_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          tags?: string[]
          workspace_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          tags?: string[]
          workspace_id?: string
        }
        Relationships: []
      }
      insight_competitors: {
        Row: {
          competitor_type: string
          country: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          identifier: string
          language: string | null
          name: string
          status: string
          workspace_id: string
        }
        Insert: {
          competitor_type?: string
          country?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          identifier?: string
          language?: string | null
          name: string
          status?: string
          workspace_id: string
        }
        Update: {
          competitor_type?: string
          country?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          identifier?: string
          language?: string | null
          name?: string
          status?: string
          workspace_id?: string
        }
        Relationships: []
      }
      insight_domains: {
        Row: {
          competitor_id: string
          country: string | null
          created_at: string
          created_by: string
          id: string
          language: string | null
          name: string
          status: string
          url: string
          workspace_id: string
        }
        Insert: {
          competitor_id: string
          country?: string | null
          created_at?: string
          created_by: string
          id?: string
          language?: string | null
          name: string
          status?: string
          url: string
          workspace_id: string
        }
        Update: {
          competitor_id?: string
          country?: string | null
          created_at?: string
          created_by?: string
          id?: string
          language?: string | null
          name?: string
          status?: string
          url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_domains_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "insight_competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_follows: {
        Row: {
          competitor_id: string
          created_at: string
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          competitor_id: string
          created_at?: string
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          competitor_id?: string
          created_at?: string
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_follows_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "insight_competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_keywords: {
        Row: {
          competitor_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          keyword: string
          workspace_id: string
        }
        Insert: {
          competitor_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          keyword: string
          workspace_id: string
        }
        Update: {
          competitor_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          keyword?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_keywords_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "insight_competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_pages: {
        Row: {
          competitor_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          page_id: string
          status: string
          workspace_id: string
        }
        Insert: {
          competitor_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          page_id: string
          status?: string
          workspace_id: string
        }
        Update: {
          competitor_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          page_id?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_pages_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "insight_competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_queue_items: {
        Row: {
          action_type: string
          created_at: string
          created_by: string
          id: string
          source_ad_id: string
          status: string
          workspace_id: string
        }
        Insert: {
          action_type?: string
          created_at?: string
          created_by: string
          id?: string
          source_ad_id: string
          status?: string
          workspace_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by?: string
          id?: string
          source_ad_id?: string
          status?: string
          workspace_id?: string
        }
        Relationships: []
      }
      insight_user_preferences: {
        Row: {
          created_at: string
          followed_brands: string[]
          followed_tags: string[]
          id: string
          industries: string[]
          interests: string[]
          onboarded: boolean
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          followed_brands?: string[]
          followed_tags?: string[]
          id?: string
          industries?: string[]
          interests?: string[]
          onboarded?: boolean
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          followed_brands?: string[]
          followed_tags?: string[]
          id?: string
          industries?: string[]
          interests?: string[]
          onboarded?: boolean
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      launch_ad_accounts: {
        Row: {
          fb_ad_account_id: string
          id: string
          launch_id: string
          setup_config: Json | null
          workspace_id: string
        }
        Insert: {
          fb_ad_account_id: string
          id?: string
          launch_id: string
          setup_config?: Json | null
          workspace_id: string
        }
        Update: {
          fb_ad_account_id?: string
          id?: string
          launch_id?: string
          setup_config?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "launch_ad_accounts_fb_ad_account_id_fkey"
            columns: ["fb_ad_account_id"]
            isOneToOne: false
            referencedRelation: "fb_ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_ad_accounts_launch_id_fkey"
            columns: ["launch_id"]
            isOneToOne: false
            referencedRelation: "launches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_ad_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_ads: {
        Row: {
          adset_id: string
          budget_after: number | null
          budget_before: number | null
          budget_multiplier: number
          copy_group_id: string | null
          created_ad_id: string | null
          cta: string | null
          description: string | null
          destination_ad_account_id: string | null
          destination_fb_page_id: string | null
          destination_url: string | null
          display_link: string | null
          headline: string | null
          id: string
          launch_id: string
          media_type: string | null
          media_urls: string[] | null
          name: string
          primary_text: string | null
          sort_order: number
          source_ad_id: string | null
          status: string
          target_pair_id: string | null
          workspace_id: string
        }
        Insert: {
          adset_id: string
          budget_after?: number | null
          budget_before?: number | null
          budget_multiplier?: number
          copy_group_id?: string | null
          created_ad_id?: string | null
          cta?: string | null
          description?: string | null
          destination_ad_account_id?: string | null
          destination_fb_page_id?: string | null
          destination_url?: string | null
          display_link?: string | null
          headline?: string | null
          id?: string
          launch_id: string
          media_type?: string | null
          media_urls?: string[] | null
          name?: string
          primary_text?: string | null
          sort_order?: number
          source_ad_id?: string | null
          status?: string
          target_pair_id?: string | null
          workspace_id: string
        }
        Update: {
          adset_id?: string
          budget_after?: number | null
          budget_before?: number | null
          budget_multiplier?: number
          copy_group_id?: string | null
          created_ad_id?: string | null
          cta?: string | null
          description?: string | null
          destination_ad_account_id?: string | null
          destination_fb_page_id?: string | null
          destination_url?: string | null
          display_link?: string | null
          headline?: string | null
          id?: string
          launch_id?: string
          media_type?: string | null
          media_urls?: string[] | null
          name?: string
          primary_text?: string | null
          sort_order?: number
          source_ad_id?: string | null
          status?: string
          target_pair_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "launch_ads_adset_id_fkey"
            columns: ["adset_id"]
            isOneToOne: false
            referencedRelation: "launch_adsets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_ads_launch_id_fkey"
            columns: ["launch_id"]
            isOneToOne: false
            referencedRelation: "launches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_ads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_adsets: {
        Row: {
          bid_amount: number | null
          bid_strategy: string | null
          budget_period: string | null
          budget_value: number | null
          campaign_id: string
          delivery_type: string | null
          id: string
          launch_id: string
          name: string
          performance_goal: string | null
          placements: Json | null
          schedule_end: string | null
          schedule_start: string | null
          sort_order: number
          status: string
          targeting: Json | null
          workspace_id: string
        }
        Insert: {
          bid_amount?: number | null
          bid_strategy?: string | null
          budget_period?: string | null
          budget_value?: number | null
          campaign_id: string
          delivery_type?: string | null
          id?: string
          launch_id: string
          name?: string
          performance_goal?: string | null
          placements?: Json | null
          schedule_end?: string | null
          schedule_start?: string | null
          sort_order?: number
          status?: string
          targeting?: Json | null
          workspace_id: string
        }
        Update: {
          bid_amount?: number | null
          bid_strategy?: string | null
          budget_period?: string | null
          budget_value?: number | null
          campaign_id?: string
          delivery_type?: string | null
          id?: string
          launch_id?: string
          name?: string
          performance_goal?: string | null
          placements?: Json | null
          schedule_end?: string | null
          schedule_start?: string | null
          sort_order?: number
          status?: string
          targeting?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "launch_adsets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "launch_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_adsets_launch_id_fkey"
            columns: ["launch_id"]
            isOneToOne: false
            referencedRelation: "launches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_adsets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_campaigns: {
        Row: {
          bid_strategy: string | null
          budget_period: string | null
          budget_type: string | null
          budget_value: number | null
          catalogue_ads_override: Json | null
          delivery_type: string | null
          id: string
          launch_id: string
          name: string
          objective: string | null
          sort_order: number
          special_ad_category: string[] | null
          status: string
          workspace_id: string
        }
        Insert: {
          bid_strategy?: string | null
          budget_period?: string | null
          budget_type?: string | null
          budget_value?: number | null
          catalogue_ads_override?: Json | null
          delivery_type?: string | null
          id?: string
          launch_id: string
          name?: string
          objective?: string | null
          sort_order?: number
          special_ad_category?: string[] | null
          status?: string
          workspace_id: string
        }
        Update: {
          bid_strategy?: string | null
          budget_period?: string | null
          budget_type?: string | null
          budget_value?: number | null
          catalogue_ads_override?: Json | null
          delivery_type?: string | null
          id?: string
          launch_id?: string
          name?: string
          objective?: string | null
          sort_order?: number
          special_ad_category?: string[] | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "launch_campaigns_launch_id_fkey"
            columns: ["launch_id"]
            isOneToOne: false
            referencedRelation: "launches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      launches: {
        Row: {
          active_count: number
          budget_after: number | null
          budget_before: number | null
          budget_multiplier: number
          completed_step: number
          created_ads_count: number
          created_at: string
          created_by: string
          id: string
          last_modified_by: string | null
          launch_batch_id: string | null
          launch_config: Json | null
          launch_strategy: string | null
          name: string
          paused_count: number
          platform: string
          selected_ads_count: number
          status: string
          target_pairs_count: number
          targeting_template_id: string | null
          unique_pages_count: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          active_count?: number
          budget_after?: number | null
          budget_before?: number | null
          budget_multiplier?: number
          completed_step?: number
          created_ads_count?: number
          created_at?: string
          created_by: string
          id?: string
          last_modified_by?: string | null
          launch_batch_id?: string | null
          launch_config?: Json | null
          launch_strategy?: string | null
          name: string
          paused_count?: number
          platform?: string
          selected_ads_count?: number
          status?: string
          target_pairs_count?: number
          targeting_template_id?: string | null
          unique_pages_count?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          active_count?: number
          budget_after?: number | null
          budget_before?: number | null
          budget_multiplier?: number
          completed_step?: number
          created_ads_count?: number
          created_at?: string
          created_by?: string
          id?: string
          last_modified_by?: string | null
          launch_batch_id?: string | null
          launch_config?: Json | null
          launch_strategy?: string | null
          name?: string
          paused_count?: number
          platform?: string
          selected_ads_count?: number
          status?: string
          target_pairs_count?: number
          targeting_template_id?: string | null
          unique_pages_count?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "launches_targeting_template_id_fkey"
            columns: ["targeting_template_id"]
            isOneToOne: false
            referencedRelation: "targeting_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launches_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      rrm_account_links: {
        Row: {
          created_at: string
          fb_ad_account_id: string
          id: string
          label: string | null
          link_type: string
          url: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          fb_ad_account_id: string
          id?: string
          label?: string | null
          link_type: string
          url: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          fb_ad_account_id?: string
          id?: string
          label?: string | null
          link_type?: string
          url?: string
          workspace_id?: string
        }
        Relationships: []
      }
      rrm_account_settings: {
        Row: {
          ad_name_append: string | null
          ad_name_prefix_override: string | null
          auto_launch_enabled: boolean
          auto_launch_override: boolean
          created_at: string
          dilution_campaign_url_id: string | null
          dilution_enabled: boolean
          dilution_links_source: string | null
          fb_ad_account_id: string
          id: string
          pause_rate_override: number | null
          recovery_threshold_override: number | null
          rejection_threshold_override: number | null
          replacement_campaign_url_id: string | null
          replacement_enabled: boolean
          replacement_links_source: string | null
          selected_page_ids: string[]
          updated_at: string
          warning_threshold_override: number | null
          workspace_id: string
        }
        Insert: {
          ad_name_append?: string | null
          ad_name_prefix_override?: string | null
          auto_launch_enabled?: boolean
          auto_launch_override?: boolean
          created_at?: string
          dilution_campaign_url_id?: string | null
          dilution_enabled?: boolean
          dilution_links_source?: string | null
          fb_ad_account_id: string
          id?: string
          pause_rate_override?: number | null
          recovery_threshold_override?: number | null
          rejection_threshold_override?: number | null
          replacement_campaign_url_id?: string | null
          replacement_enabled?: boolean
          replacement_links_source?: string | null
          selected_page_ids?: string[]
          updated_at?: string
          warning_threshold_override?: number | null
          workspace_id: string
        }
        Update: {
          ad_name_append?: string | null
          ad_name_prefix_override?: string | null
          auto_launch_enabled?: boolean
          auto_launch_override?: boolean
          created_at?: string
          dilution_campaign_url_id?: string | null
          dilution_enabled?: boolean
          dilution_links_source?: string | null
          fb_ad_account_id?: string
          id?: string
          pause_rate_override?: number | null
          recovery_threshold_override?: number | null
          rejection_threshold_override?: number | null
          replacement_campaign_url_id?: string | null
          replacement_enabled?: boolean
          replacement_links_source?: string | null
          selected_page_ids?: string[]
          updated_at?: string
          warning_threshold_override?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rrm_account_settings_dilution_offer_id_fkey"
            columns: ["dilution_campaign_url_id"]
            isOneToOne: false
            referencedRelation: "campaign_urls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrm_account_settings_fb_ad_account_id_fkey"
            columns: ["fb_ad_account_id"]
            isOneToOne: false
            referencedRelation: "fb_ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrm_account_settings_replacement_offer_id_fkey"
            columns: ["replacement_campaign_url_id"]
            isOneToOne: false
            referencedRelation: "campaign_urls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrm_account_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      rrm_global_links: {
        Row: {
          created_at: string
          id: string
          label: string | null
          link_type: string
          url: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          link_type: string
          url: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          link_type?: string
          url?: string
          workspace_id?: string
        }
        Relationships: []
      }
      rrm_global_settings: {
        Row: {
          ad_name_append: string
          auto_launch_delay_minutes: number
          auto_launch_enabled: boolean
          check_interval_minutes: number
          created_at: string
          default_dilution_campaign_url_id: string | null
          default_replacement_campaign_url_id: string | null
          dilution_ad_name_prefix: string
          dilution_enabled: boolean
          dilution_links_source: string
          id: string
          pause_rate: number
          recovery_threshold: number
          rejection_threshold: number
          replacement_ad_name_prefix: string
          replacement_enabled: boolean
          replacement_links_source: string
          updated_at: string
          warning_threshold: number
          workspace_id: string
        }
        Insert: {
          ad_name_append?: string
          auto_launch_delay_minutes?: number
          auto_launch_enabled?: boolean
          check_interval_minutes?: number
          created_at?: string
          default_dilution_campaign_url_id?: string | null
          default_replacement_campaign_url_id?: string | null
          dilution_ad_name_prefix?: string
          dilution_enabled?: boolean
          dilution_links_source?: string
          id?: string
          pause_rate?: number
          recovery_threshold?: number
          rejection_threshold?: number
          replacement_ad_name_prefix?: string
          replacement_enabled?: boolean
          replacement_links_source?: string
          updated_at?: string
          warning_threshold?: number
          workspace_id: string
        }
        Update: {
          ad_name_append?: string
          auto_launch_delay_minutes?: number
          auto_launch_enabled?: boolean
          check_interval_minutes?: number
          created_at?: string
          default_dilution_campaign_url_id?: string | null
          default_replacement_campaign_url_id?: string | null
          dilution_ad_name_prefix?: string
          dilution_enabled?: boolean
          dilution_links_source?: string
          id?: string
          pause_rate?: number
          recovery_threshold?: number
          rejection_threshold?: number
          replacement_ad_name_prefix?: string
          replacement_enabled?: boolean
          replacement_links_source?: string
          updated_at?: string
          warning_threshold?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rrm_global_settings_default_dilution_offer_id_fkey"
            columns: ["default_dilution_campaign_url_id"]
            isOneToOne: false
            referencedRelation: "campaign_urls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrm_global_settings_default_replacement_offer_id_fkey"
            columns: ["default_replacement_campaign_url_id"]
            isOneToOne: false
            referencedRelation: "campaign_urls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rrm_global_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_concepts: {
        Row: {
          background: string | null
          category_id: string | null
          composition: string | null
          created_at: string
          created_by: string
          custom_prompt: string | null
          id: string
          is_custom: boolean
          lighting: string | null
          scene: string | null
          tags: string[]
          title: string
          workspace_id: string
        }
        Insert: {
          background?: string | null
          category_id?: string | null
          composition?: string | null
          created_at?: string
          created_by: string
          custom_prompt?: string | null
          id?: string
          is_custom?: boolean
          lighting?: string | null
          scene?: string | null
          tags?: string[]
          title: string
          workspace_id: string
        }
        Update: {
          background?: string | null
          category_id?: string | null
          composition?: string | null
          created_at?: string
          created_by?: string
          custom_prompt?: string | null
          id?: string
          is_custom?: boolean
          lighting?: string | null
          scene?: string | null
          tags?: string[]
          title?: string
          workspace_id?: string
        }
        Relationships: []
      }
      saved_strategies: {
        Row: {
          angle: string | null
          brand_id: string | null
          created_at: string
          created_by: string
          custom_prompt: string | null
          hook: string | null
          id: string
          is_custom: boolean
          layout: string | null
          tags: string[]
          title: string
          visual_direction: string | null
          workspace_id: string
        }
        Insert: {
          angle?: string | null
          brand_id?: string | null
          created_at?: string
          created_by: string
          custom_prompt?: string | null
          hook?: string | null
          id?: string
          is_custom?: boolean
          layout?: string | null
          tags?: string[]
          title: string
          visual_direction?: string | null
          workspace_id: string
        }
        Update: {
          angle?: string | null
          brand_id?: string | null
          created_at?: string
          created_by?: string
          custom_prompt?: string | null
          hook?: string | null
          id?: string
          is_custom?: boolean
          layout?: string | null
          tags?: string[]
          title?: string
          visual_direction?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      targeting_templates: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          platform: string
          template_payload: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          platform?: string
          template_payload?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          platform?: string
          template_payload?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "targeting_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invites: {
        Row: {
          created_at: string
          email: string
          id: string
          invite_token: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invite_token?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invite_token?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_sage_scripts: {
        Row: {
          created_at: string
          created_by: string
          framework: string
          id: string
          parent_script_id: string | null
          script_data: Json | null
          source: string
          status: string
          version: number
          video_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          framework?: string
          id?: string
          parent_script_id?: string | null
          script_data?: Json | null
          source?: string
          status?: string
          version?: number
          video_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          framework?: string
          id?: string
          parent_script_id?: string | null
          script_data?: Json | null
          source?: string
          status?: string
          version?: number
          video_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_sage_scripts_parent_script_id_fkey"
            columns: ["parent_script_id"]
            isOneToOne: false
            referencedRelation: "video_sage_scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sage_scripts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_sage_videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sage_scripts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      video_sage_videos: {
        Row: {
          analysis: Json | null
          created_at: string
          created_by: string
          duration_seconds: number | null
          id: string
          language: string | null
          status: string
          storage_path: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
          workspace_id: string
        }
        Insert: {
          analysis?: Json | null
          created_at?: string
          created_by: string
          duration_seconds?: number | null
          id?: string
          language?: string | null
          status?: string
          storage_path?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          workspace_id: string
        }
        Update: {
          analysis?: Json | null
          created_at?: string
          created_by?: string
          duration_seconds?: number | null
          id?: string
          language?: string | null
          status?: string
          storage_path?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_sage_videos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_users: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_users_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      fb_connections_safe: {
        Row: {
          connected_at: string | null
          connected_by: string | null
          created_at: string | null
          fb_user_id: string | null
          fb_user_name: string | null
          id: string | null
          last_synced_at: string | null
          status: string | null
          workspace_id: string | null
        }
        Insert: {
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string | null
          fb_user_id?: string | null
          fb_user_name?: string | null
          id?: string | null
          last_synced_at?: string | null
          status?: string | null
          workspace_id?: string | null
        }
        Update: {
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string | null
          fb_user_id?: string | null
          fb_user_name?: string | null
          id?: string | null
          last_synced_at?: string | null
          status?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fb_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_invite_by_token: {
        Args: { _token: string }
        Returns: {
          email: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          workspace_name: string
        }[]
      }
      get_user_workspace_ids: { Args: { _user_id: string }; Returns: string[] }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner_or_admin: { Args: { _user_id: string }; Returns: boolean }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_owner_or_admin: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member" | "owner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member", "owner"],
    },
  },
} as const
