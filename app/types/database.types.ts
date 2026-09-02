export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  admin: {
    Tables: {
      admin_accounts: {
        Row: {
          activated: boolean
          created_at: string
          deleted: boolean
          department_id: string | null
          id: string
          last_login_at: string | null
          mfa_enrolled: boolean
          status: Database['admin']['Enums']['admin_account_status']
          update_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          department_id?: string | null
          id?: string
          last_login_at?: string | null
          mfa_enrolled?: boolean
          status?: Database['admin']['Enums']['admin_account_status']
          update_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          department_id?: string | null
          id?: string
          last_login_at?: string | null
          mfa_enrolled?: boolean
          status?: Database['admin']['Enums']['admin_account_status']
          update_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'admin_accounts_department_id_fkey'
            columns: ['department_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
        ]
      }
      allowed_email_domains: {
        Row: {
          activated: boolean
          active: boolean
          created_at: string
          deleted: boolean
          domain: string
          id: string
          label: string | null
          update_user_id: string | null
          updated_at: string
        }
        Insert: {
          activated?: boolean
          active?: boolean
          created_at?: string
          deleted?: boolean
          domain: string
          id?: string
          label?: string | null
          update_user_id?: string | null
          updated_at?: string
        }
        Update: {
          activated?: boolean
          active?: boolean
          created_at?: string
          deleted?: boolean
          domain?: string
          id?: string
          label?: string | null
          update_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          activated: boolean
          admin_account_id: string
          created_at: string
          deleted: boolean
          id: string
          ip_address: string | null
          occurred_at: string
          target_resource: Json | null
          target_service_id: string | null
          update_user_id: string | null
          updated_at: string
        }
        Insert: {
          action: string
          activated?: boolean
          admin_account_id: string
          created_at?: string
          deleted?: boolean
          id?: string
          ip_address?: string | null
          occurred_at?: string
          target_resource?: Json | null
          target_service_id?: string | null
          update_user_id?: string | null
          updated_at?: string
        }
        Update: {
          action?: string
          activated?: boolean
          admin_account_id?: string
          created_at?: string
          deleted?: boolean
          id?: string
          ip_address?: string | null
          occurred_at?: string
          target_resource?: Json | null
          target_service_id?: string | null
          update_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_admin_account_id_fkey'
            columns: ['admin_account_id']
            isOneToOne: false
            referencedRelation: 'admin_accounts'
            referencedColumns: ['id']
          },
        ]
      }
      departments: {
        Row: {
          activated: boolean
          active: boolean
          code: string | null
          created_at: string
          deleted: boolean
          id: string
          manager_admin_account_id: string | null
          name: string
          parent_id: string | null
          update_user_id: string | null
          updated_at: string
        }
        Insert: {
          activated?: boolean
          active?: boolean
          code?: string | null
          created_at?: string
          deleted?: boolean
          id?: string
          manager_admin_account_id?: string | null
          name: string
          parent_id?: string | null
          update_user_id?: string | null
          updated_at?: string
        }
        Update: {
          activated?: boolean
          active?: boolean
          code?: string | null
          created_at?: string
          deleted?: boolean
          id?: string
          manager_admin_account_id?: string | null
          name?: string
          parent_id?: string | null
          update_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'departments_manager_admin_account_id_fkey'
            columns: ['manager_admin_account_id']
            isOneToOne: false
            referencedRelation: 'admin_accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'departments_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
        ]
      }
      role_assignments: {
        Row: {
          activated: boolean
          admin_account_id: string
          created_at: string
          deleted: boolean
          granted_at: string
          granted_by: string | null
          id: string
          role_type: Database['admin']['Enums']['admin_role_type']
          service_id: string | null
          update_user_id: string | null
          updated_at: string
        }
        Insert: {
          activated?: boolean
          admin_account_id: string
          created_at?: string
          deleted?: boolean
          granted_at?: string
          granted_by?: string | null
          id?: string
          role_type: Database['admin']['Enums']['admin_role_type']
          service_id?: string | null
          update_user_id?: string | null
          updated_at?: string
        }
        Update: {
          activated?: boolean
          admin_account_id?: string
          created_at?: string
          deleted?: boolean
          granted_at?: string
          granted_by?: string | null
          id?: string
          role_type?: Database['admin']['Enums']['admin_role_type']
          service_id?: string | null
          update_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'role_assignments_admin_account_id_fkey'
            columns: ['admin_account_id']
            isOneToOne: false
            referencedRelation: 'admin_accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'role_assignments_granted_by_fkey'
            columns: ['granted_by']
            isOneToOne: false
            referencedRelation: 'admin_accounts'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          p_role: Database['admin']['Enums']['admin_role_type']
          p_service_id?: string
        }
        Returns: boolean
      }
      is_department_head: {
        Args: { p_department_id: string }
        Returns: boolean
      }
      mark_mfa_enrolled: { Args: never, Returns: undefined }
      mark_mfa_unenrolled: { Args: never, Returns: undefined }
      set_admin_department: {
        Args: { p_admin_account_id: string, p_department_id?: string }
        Returns: undefined
      }
      update_own_department: {
        Args: { p_department_id?: string }
        Returns: undefined
      }
    }
    Enums: {
      admin_account_status: 'pending' | 'active' | 'suspended'
      admin_role_type: 'super_admin' | 'service_admin' | 'settlement_viewer'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  artboda: {
    Tables: {
      contract_bookings: {
        Row: {
          activated: boolean
          booking_id: string
          contract_id: string
          created_at: string
          deleted: boolean
          id: string
          update_user_id: string | null
          updated_at: string
        }
        Insert: {
          activated?: boolean
          booking_id: string
          contract_id: string
          created_at?: string
          deleted?: boolean
          id?: string
          update_user_id?: string | null
          updated_at?: string
        }
        Update: {
          activated?: boolean
          booking_id?: string
          contract_id?: string
          created_at?: string
          deleted?: boolean
          id?: string
          update_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contract_bookings_contract_id_fkey'
            columns: ['contract_id']
            isOneToOne: false
            referencedRelation: 'contracts'
            referencedColumns: ['id']
          },
        ]
      }
      contracts: {
        Row: {
          activated: boolean
          contract_number: string | null
          created_at: string
          deleted: boolean
          id: string
          inquiry_id: string
          organization_id: string
          payment_id: string | null
          signed_at: string | null
          status: Database['artboda']['Enums']['contract_status']
          total_amount: number | null
          update_user_id: string | null
          updated_at: string
        }
        Insert: {
          activated?: boolean
          contract_number?: string | null
          created_at?: string
          deleted?: boolean
          id?: string
          inquiry_id: string
          organization_id: string
          payment_id?: string | null
          signed_at?: string | null
          status?: Database['artboda']['Enums']['contract_status']
          total_amount?: number | null
          update_user_id?: string | null
          updated_at?: string
        }
        Update: {
          activated?: boolean
          contract_number?: string | null
          created_at?: string
          deleted?: boolean
          id?: string
          inquiry_id?: string
          organization_id?: string
          payment_id?: string | null
          signed_at?: string | null
          status?: Database['artboda']['Enums']['contract_status']
          total_amount?: number | null
          update_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contracts_inquiry_id_fkey'
            columns: ['inquiry_id']
            isOneToOne: true
            referencedRelation: 'inquiries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contracts_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      inquiries: {
        Row: {
          activated: boolean
          agreed_to_privacy: boolean
          budget_range: string | null
          contact_department: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone_encrypted: string | null
          created_at: string
          deleted: boolean
          desired_schedule: string | null
          expected_audience: number | null
          id: string
          performance_count: number | null
          reference_code: string
          requested_documents: Json | null
          status: Database['artboda']['Enums']['inquiry_status']
          target_audience: string | null
          update_user_id: string | null
          updated_at: string
          user_id: string | null
          venue: string | null
        }
        Insert: {
          activated?: boolean
          agreed_to_privacy?: boolean
          budget_range?: string | null
          contact_department?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone_encrypted?: string | null
          created_at?: string
          deleted?: boolean
          desired_schedule?: string | null
          expected_audience?: number | null
          id?: string
          performance_count?: number | null
          reference_code: string
          requested_documents?: Json | null
          status?: Database['artboda']['Enums']['inquiry_status']
          target_audience?: string | null
          update_user_id?: string | null
          updated_at?: string
          user_id?: string | null
          venue?: string | null
        }
        Update: {
          activated?: boolean
          agreed_to_privacy?: boolean
          budget_range?: string | null
          contact_department?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone_encrypted?: string | null
          created_at?: string
          deleted?: boolean
          desired_schedule?: string | null
          expected_audience?: number | null
          id?: string
          performance_count?: number | null
          reference_code?: string
          requested_documents?: Json | null
          status?: Database['artboda']['Enums']['inquiry_status']
          target_audience?: string | null
          update_user_id?: string | null
          updated_at?: string
          user_id?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      legal_document_versions: {
        Row: {
          activated: boolean
          content: Json
          created_at: string
          deleted: boolean
          doc_type: string
          effective_date: string
          eyebrow: string
          id: string
          title: string
          update_user_id: string | null
          updated_at: string
          version: number
        }
        Insert: {
          activated?: boolean
          content: Json
          created_at?: string
          deleted?: boolean
          doc_type: string
          effective_date: string
          eyebrow: string
          id?: string
          title: string
          update_user_id?: string | null
          updated_at?: string
          version: number
        }
        Update: {
          activated?: boolean
          content?: Json
          created_at?: string
          deleted?: boolean
          doc_type?: string
          effective_date?: string
          eyebrow?: string
          id?: string
          title?: string
          update_user_id?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          activated: boolean
          created_at: string
          deleted: boolean
          id: string
          organization_id: string
          role: string | null
          update_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          id?: string
          organization_id: string
          role?: string | null
          update_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          id?: string
          organization_id?: string
          role?: string | null
          update_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organization_members_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      organizations: {
        Row: {
          activated: boolean
          address: string | null
          billing_email: string | null
          business_registration_number: string | null
          contract_started_at: string | null
          created_at: string
          deleted: boolean
          id: string
          name: string
          org_type: Database['artboda']['Enums']['org_type']
          phone_encrypted: string | null
          update_user_id: string | null
          updated_at: string
        }
        Insert: {
          activated?: boolean
          address?: string | null
          billing_email?: string | null
          business_registration_number?: string | null
          contract_started_at?: string | null
          created_at?: string
          deleted?: boolean
          id?: string
          name: string
          org_type: Database['artboda']['Enums']['org_type']
          phone_encrypted?: string | null
          update_user_id?: string | null
          updated_at?: string
        }
        Update: {
          activated?: boolean
          address?: string | null
          billing_email?: string | null
          business_registration_number?: string | null
          contract_started_at?: string | null
          created_at?: string
          deleted?: boolean
          id?: string
          name?: string
          org_type?: Database['artboda']['Enums']['org_type']
          phone_encrypted?: string | null
          update_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_documents: {
        Row: {
          activated: boolean
          booking_id: string | null
          contract_id: string | null
          created_at: string
          deleted: boolean
          document_type: Database['artboda']['Enums']['document_type']
          file_url: string | null
          id: string
          issued_at: string | null
          payment_id: string
          status: Database['artboda']['Enums']['document_status']
          update_user_id: string | null
          updated_at: string
        }
        Insert: {
          activated?: boolean
          booking_id?: string | null
          contract_id?: string | null
          created_at?: string
          deleted?: boolean
          document_type: Database['artboda']['Enums']['document_type']
          file_url?: string | null
          id?: string
          issued_at?: string | null
          payment_id: string
          status?: Database['artboda']['Enums']['document_status']
          update_user_id?: string | null
          updated_at?: string
        }
        Update: {
          activated?: boolean
          booking_id?: string | null
          contract_id?: string | null
          created_at?: string
          deleted?: boolean
          document_type?: Database['artboda']['Enums']['document_type']
          file_url?: string | null
          id?: string
          issued_at?: string | null
          payment_id?: string
          status?: Database['artboda']['Enums']['document_status']
          update_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payment_documents_contract_id_fkey'
            columns: ['contract_id']
            isOneToOne: false
            referencedRelation: 'contracts'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_organization_id: { Args: never, Returns: string }
      decrypt_organization_phone: {
        Args: { p_organization_id: string }
        Returns: string
      }
    }
    Enums: {
      contract_status:
        | 'draft'
        | 'pending_payment'
        | 'active'
        | 'completed'
        | 'canceled'
      document_status: 'generated' | 'requested'
      document_type:
        | 'quote'
        | 'contract'
        | 'transaction_statement'
        | 'receipt'
        | 'tax_invoice'
      inquiry_status: 'submitted' | 'quoted' | 'converted' | 'closed'
      org_type:
        | 'kindergarten'
        | 'school'
        | 'library'
        | 'company'
        | 'individual_business'
        | 'other'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activated: boolean
          created_at: string
          deleted: boolean
          event_type: string
          id: string
          ip_country: string | null
          occurred_at: string
          service_id: string | null
          update_user_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          event_type: string
          id?: string
          ip_country?: string | null
          occurred_at?: string
          service_id?: string | null
          update_user_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          event_type?: string
          id?: string
          ip_country?: string | null
          occurred_at?: string
          service_id?: string | null
          update_user_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'activity_logs_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activity_logs_update_user_id_fkey'
            columns: ['update_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activity_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      bookings: {
        Row: {
          activated: boolean
          audience_count: number | null
          created_at: string
          deleted: boolean
          id: string
          payment_id: string | null
          product_id: string | null
          reference_code: string
          scheduled_at: string | null
          session_count: number | null
          status: Database['public']['Enums']['booking_status']
          update_user_id: string | null
          updated_at: string
          user_id: string | null
          venue: string | null
        }
        Insert: {
          activated?: boolean
          audience_count?: number | null
          created_at?: string
          deleted?: boolean
          id?: string
          payment_id?: string | null
          product_id?: string | null
          reference_code: string
          scheduled_at?: string | null
          session_count?: number | null
          status?: Database['public']['Enums']['booking_status']
          update_user_id?: string | null
          updated_at?: string
          user_id?: string | null
          venue?: string | null
        }
        Update: {
          activated?: boolean
          audience_count?: number | null
          created_at?: string
          deleted?: boolean
          id?: string
          payment_id?: string | null
          product_id?: string | null
          reference_code?: string
          scheduled_at?: string | null
          session_count?: number | null
          status?: Database['public']['Enums']['booking_status']
          update_user_id?: string | null
          updated_at?: string
          user_id?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'bookings_payment_id_fkey'
            columns: ['payment_id']
            isOneToOne: false
            referencedRelation: 'payments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_update_user_id_fkey'
            columns: ['update_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      creator_profiles: {
        Row: {
          activated: boolean
          contact: Json | null
          created_at: string
          deleted: boolean
          id: string
          name: string | null
          region: string | null
          update_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated?: boolean
          contact?: Json | null
          created_at?: string
          deleted?: boolean
          id?: string
          name?: string | null
          region?: string | null
          update_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated?: boolean
          contact?: Json | null
          created_at?: string
          deleted?: boolean
          id?: string
          name?: string | null
          region?: string | null
          update_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'creator_profiles_update_user_id_fkey'
            columns: ['update_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'creator_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      membership_tiers: {
        Row: {
          activated: boolean
          auto_promotion_criteria: Json | null
          created_at: string
          deleted: boolean
          discount_percent: number
          id: string
          level: number
          name: string
          service_id: string
          update_user_id: string | null
          updated_at: string
        }
        Insert: {
          activated?: boolean
          auto_promotion_criteria?: Json | null
          created_at?: string
          deleted?: boolean
          discount_percent?: number
          id?: string
          level: number
          name: string
          service_id: string
          update_user_id?: string | null
          updated_at?: string
        }
        Update: {
          activated?: boolean
          auto_promotion_criteria?: Json | null
          created_at?: string
          deleted?: boolean
          discount_percent?: number
          id?: string
          level?: number
          name?: string
          service_id?: string
          update_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'membership_tiers_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'membership_tiers_update_user_id_fkey'
            columns: ['update_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      payment_gateway_events: {
        Row: {
          activated: boolean
          created_at: string
          deleted: boolean
          event_type: string
          id: string
          payment_id: string
          provider: string
          provider_status: string | null
          raw_payload: Json | null
          update_user_id: string | null
          updated_at: string
        }
        Insert: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          event_type: string
          id?: string
          payment_id: string
          provider: string
          provider_status?: string | null
          raw_payload?: Json | null
          update_user_id?: string | null
          updated_at?: string
        }
        Update: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          event_type?: string
          id?: string
          payment_id?: string
          provider?: string
          provider_status?: string | null
          raw_payload?: Json | null
          update_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payment_gateway_events_payment_id_fkey'
            columns: ['payment_id']
            isOneToOne: false
            referencedRelation: 'payments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payment_gateway_events_update_user_id_fkey'
            columns: ['update_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          activated: boolean
          agreed_to_terms: boolean
          amount: number
          created_at: string
          deleted: boolean
          discount_amount: number | null
          fee_breakdown: Json | null
          id: string
          idempotency_key: string
          payment_method: Database['public']['Enums']['payment_method']
          payment_type: Database['public']['Enums']['payment_type']
          points_used: number | null
          product_amount: number
          provider: string
          provider_status: string | null
          provider_transaction_id: string | null
          service_id: string
          status: Database['public']['Enums']['payment_status']
          update_user_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activated?: boolean
          agreed_to_terms?: boolean
          amount: number
          created_at?: string
          deleted?: boolean
          discount_amount?: number | null
          fee_breakdown?: Json | null
          id?: string
          idempotency_key: string
          payment_method: Database['public']['Enums']['payment_method']
          payment_type?: Database['public']['Enums']['payment_type']
          points_used?: number | null
          product_amount: number
          provider: string
          provider_status?: string | null
          provider_transaction_id?: string | null
          service_id: string
          status?: Database['public']['Enums']['payment_status']
          update_user_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activated?: boolean
          agreed_to_terms?: boolean
          amount?: number
          created_at?: string
          deleted?: boolean
          discount_amount?: number | null
          fee_breakdown?: Json | null
          id?: string
          idempotency_key?: string
          payment_method?: Database['public']['Enums']['payment_method']
          payment_type?: Database['public']['Enums']['payment_type']
          points_used?: number | null
          product_amount?: number
          provider?: string
          provider_status?: string | null
          provider_transaction_id?: string | null
          service_id?: string
          status?: Database['public']['Enums']['payment_status']
          update_user_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'payments_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_update_user_id_fkey'
            columns: ['update_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      performance_catalog: {
        Row: {
          activated: boolean
          audience_age: string | null
          created_at: string
          creator_id: string | null
          deleted: boolean
          description: string | null
          duration_minutes: number | null
          genre: string | null
          id: string
          images: Json | null
          performance_type:
            | Database['public']['Enums']['performance_type']
            | null
          product_id: string
          update_user_id: string | null
          updated_at: string
        }
        Insert: {
          activated?: boolean
          audience_age?: string | null
          created_at?: string
          creator_id?: string | null
          deleted?: boolean
          description?: string | null
          duration_minutes?: number | null
          genre?: string | null
          id?: string
          images?: Json | null
          performance_type?:
            | Database['public']['Enums']['performance_type']
            | null
          product_id: string
          update_user_id?: string | null
          updated_at?: string
        }
        Update: {
          activated?: boolean
          audience_age?: string | null
          created_at?: string
          creator_id?: string | null
          deleted?: boolean
          description?: string | null
          duration_minutes?: number | null
          genre?: string | null
          id?: string
          images?: Json | null
          performance_type?:
            | Database['public']['Enums']['performance_type']
            | null
          product_id?: string
          update_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'performance_catalog_creator_id_fkey'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'creator_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'performance_catalog_product_id_fkey'
            columns: ['product_id']
            isOneToOne: true
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'performance_catalog_update_user_id_fkey'
            columns: ['update_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      point_balances: {
        Row: {
          activated: boolean
          balance: number
          created_at: string
          deleted: boolean
          id: string
          last_transaction_at: string | null
          update_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated?: boolean
          balance?: number
          created_at?: string
          deleted?: boolean
          id?: string
          last_transaction_at?: string | null
          update_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated?: boolean
          balance?: number
          created_at?: string
          deleted?: boolean
          id?: string
          last_transaction_at?: string | null
          update_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'point_balances_update_user_id_fkey'
            columns: ['update_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'point_balances_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      point_transactions: {
        Row: {
          activated: boolean
          amount: number
          created_at: string
          deleted: boolean
          description: string | null
          expires_at: string | null
          id: string
          payment_id: string | null
          service_id: string | null
          transaction_type: Database['public']['Enums']['point_transaction_type']
          update_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated?: boolean
          amount: number
          created_at?: string
          deleted?: boolean
          description?: string | null
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          service_id?: string | null
          transaction_type: Database['public']['Enums']['point_transaction_type']
          update_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated?: boolean
          amount?: number
          created_at?: string
          deleted?: boolean
          description?: string | null
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          service_id?: string | null
          transaction_type?: Database['public']['Enums']['point_transaction_type']
          update_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'point_transactions_payment_id_fkey'
            columns: ['payment_id']
            isOneToOne: false
            referencedRelation: 'payments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'point_transactions_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'point_transactions_update_user_id_fkey'
            columns: ['update_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'point_transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      product_service_exposures: {
        Row: {
          created_at: string
          id: string
          product_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_service_exposures_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_service_exposures_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          activated: boolean
          category: string | null
          created_at: string
          deleted: boolean
          id: string
          name: string
          price: number
          service_id: string
          status: Database['public']['Enums']['product_status']
          update_user_id: string | null
          updated_at: string
        }
        Insert: {
          activated?: boolean
          category?: string | null
          created_at?: string
          deleted?: boolean
          id?: string
          name: string
          price: number
          service_id: string
          status?: Database['public']['Enums']['product_status']
          update_user_id?: string | null
          updated_at?: string
        }
        Update: {
          activated?: boolean
          category?: string | null
          created_at?: string
          deleted?: boolean
          id?: string
          name?: string
          price?: number
          service_id?: string
          status?: Database['public']['Enums']['product_status']
          update_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'products_update_user_id_fkey'
            columns: ['update_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      services: {
        Row: {
          activated: boolean
          created_at: string
          deleted: boolean
          id: string
          name: string
          slug: string
          update_user_id: string | null
          updated_at: string
        }
        Insert: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          id?: string
          name: string
          slug: string
          update_user_id?: string | null
          updated_at?: string
        }
        Update: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          id?: string
          name?: string
          slug?: string
          update_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'services_update_user_id_fkey'
            columns: ['update_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_memberships: {
        Row: {
          activated: boolean
          created_at: string
          deleted: boolean
          id: string
          last_evaluated_at: string | null
          promoted_at: string | null
          service_id: string
          tier_id: string
          tier_source: Database['public']['Enums']['tier_source']
          update_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          id?: string
          last_evaluated_at?: string | null
          promoted_at?: string | null
          service_id: string
          tier_id: string
          tier_source?: Database['public']['Enums']['tier_source']
          update_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          id?: string
          last_evaluated_at?: string | null
          promoted_at?: string | null
          service_id?: string
          tier_id?: string
          tier_source?: Database['public']['Enums']['tier_source']
          update_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_memberships_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_memberships_tier_id_fkey'
            columns: ['tier_id']
            isOneToOne: false
            referencedRelation: 'membership_tiers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_memberships_update_user_id_fkey'
            columns: ['update_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_memberships_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_service_entitlements: {
        Row: {
          activated: boolean
          created_at: string
          deleted: boolean
          granted_at: string
          id: string
          service_id: string
          update_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          granted_at?: string
          id?: string
          service_id: string
          update_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          granted_at?: string
          id?: string
          service_id?: string
          update_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_service_entitlements_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_service_entitlements_update_user_id_fkey'
            columns: ['update_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_service_entitlements_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          activated: boolean
          created_at: string
          deleted: boolean
          display_name: string | null
          email: string | null
          home_region: string
          id: string
          update_user_id: string | null
          updated_at: string
        }
        Insert: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          display_name?: string | null
          email?: string | null
          home_region?: string
          id: string
          update_user_id?: string | null
          updated_at?: string
        }
        Update: {
          activated?: boolean
          created_at?: string
          deleted?: boolean
          display_name?: string | null
          email?: string | null
          home_region?: string
          id?: string
          update_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'users_update_user_id_fkey'
            columns: ['update_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrypt_pii: { Args: { p_encrypted: string }, Returns: string }
      encrypt_pii: { Args: { p_plain: string }, Returns: string }
    }
    Enums: {
      booking_status: 'reserved' | 'confirmed' | 'canceled' | 'completed'
      payment_method: 'corporate_card' | 'bank_transfer' | 'invoice'
      payment_status: 'pending' | 'succeeded' | 'failed' | 'refunded'
      payment_type: 'product_purchase' | 'other'
      performance_type: 'direct' | 'brokered'
      point_transaction_type: 'earn' | 'redeem' | 'expire' | 'admin_adjustment'
      product_status: 'draft' | 'published' | 'blocked'
      tier_source: 'auto' | 'manual'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
      ? R
      : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables']
    & DefaultSchema['Views'])
    ? (DefaultSchema['Tables']
      & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
        ? R
        : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I
  }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U
  }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema['Enums']
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema['CompositeTypes']
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  admin: {
    Enums: {
      admin_account_status: ['pending', 'active', 'suspended'],
      admin_role_type: ['super_admin', 'service_admin', 'settlement_viewer'],
    },
  },
  artboda: {
    Enums: {
      contract_status: [
        'draft',
        'pending_payment',
        'active',
        'completed',
        'canceled',
      ],
      document_status: ['generated', 'requested'],
      document_type: [
        'quote',
        'contract',
        'transaction_statement',
        'receipt',
        'tax_invoice',
      ],
      inquiry_status: ['submitted', 'quoted', 'converted', 'closed'],
      org_type: [
        'kindergarten',
        'school',
        'library',
        'company',
        'individual_business',
        'other',
      ],
    },
  },
  public: {
    Enums: {
      booking_status: ['reserved', 'confirmed', 'canceled', 'completed'],
      payment_method: ['corporate_card', 'bank_transfer', 'invoice'],
      payment_status: ['pending', 'succeeded', 'failed', 'refunded'],
      payment_type: ['product_purchase', 'other'],
      performance_type: ['direct', 'brokered'],
      point_transaction_type: ['earn', 'redeem', 'expire', 'admin_adjustment'],
      product_status: ['draft', 'published', 'blocked'],
      tier_source: ['auto', 'manual'],
    },
  },
} as const
