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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      amt_admin_access_logs: {
        Row: {
          criado_em: string
          geo_aprox: string | null
          id: string
          ip: string | null
          rota: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          criado_em?: string
          geo_aprox?: string | null
          id?: string
          ip?: string | null
          rota?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          criado_em?: string
          geo_aprox?: string | null
          id?: string
          ip?: string | null
          rota?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      amt_admin_auditoria: {
        Row: {
          acao: string
          antes: Json | null
          criado_em: string
          depois: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          ip: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          antes?: Json | null
          criado_em?: string
          depois?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          antes?: Json | null
          criado_em?: string
          depois?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      amt_admin_login_attempts: {
        Row: {
          criado_em: string
          email: string | null
          id: string
          ip: string | null
          motivo: string | null
          sucesso: boolean
          user_agent: string | null
        }
        Insert: {
          criado_em?: string
          email?: string | null
          id?: string
          ip?: string | null
          motivo?: string | null
          sucesso?: boolean
          user_agent?: string | null
        }
        Update: {
          criado_em?: string
          email?: string | null
          id?: string
          ip?: string | null
          motivo?: string | null
          sucesso?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      amt_admin_mfa: {
        Row: {
          ativado_em: string | null
          criado_em: string
          totp_secret: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativado_em?: string | null
          criado_em?: string
          totp_secret: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativado_em?: string | null
          criado_em?: string
          totp_secret?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      amt_asaas_fila: {
        Row: {
          assinatura_id: string | null
          criado_em: string
          id: string
          payload: Json
          proximo_em: string
          sistema_id: string | null
          status: string
          tentativas: number
          tipo: string
          ultimo_erro: string | null
          updated_at: string
        }
        Insert: {
          assinatura_id?: string | null
          criado_em?: string
          id?: string
          payload: Json
          proximo_em?: string
          sistema_id?: string | null
          status?: string
          tentativas?: number
          tipo: string
          ultimo_erro?: string | null
          updated_at?: string
        }
        Update: {
          assinatura_id?: string | null
          criado_em?: string
          id?: string
          payload?: Json
          proximo_em?: string
          sistema_id?: string | null
          status?: string
          tentativas?: number
          tipo?: string
          ultimo_erro?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amt_asaas_fila_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "manager_assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amt_asaas_fila_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "manager_sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      amt_asaas_logs: {
        Row: {
          criado_em: string
          direcao: string
          erro: string | null
          fila_id: string | null
          id: string
          request: Json | null
          response: Json | null
          status_http: number | null
          tipo: string
        }
        Insert: {
          criado_em?: string
          direcao: string
          erro?: string | null
          fila_id?: string | null
          id?: string
          request?: Json | null
          response?: Json | null
          status_http?: number | null
          tipo: string
        }
        Update: {
          criado_em?: string
          direcao?: string
          erro?: string | null
          fila_id?: string | null
          id?: string
          request?: Json | null
          response?: Json | null
          status_http?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "amt_asaas_logs_fila_id_fkey"
            columns: ["fila_id"]
            isOneToOne: false
            referencedRelation: "amt_asaas_fila"
            referencedColumns: ["id"]
          },
        ]
      }
      amt_assinatura_modulos: {
        Row: {
          assinatura_id: string
          criado_em: string
          id: string
          modulo_id: string
          observacao: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assinatura_id: string
          criado_em?: string
          id?: string
          modulo_id: string
          observacao?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          assinatura_id?: string
          criado_em?: string
          id?: string
          modulo_id?: string
          observacao?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amt_assinatura_modulos_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "manager_assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amt_assinatura_modulos_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "amt_modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      amt_assinatura_overrides: {
        Row: {
          assinatura_id: string
          modulo_id: string
          motivo: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assinatura_id: string
          modulo_id: string
          motivo?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          assinatura_id?: string
          modulo_id?: string
          motivo?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amt_assinatura_overrides_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "manager_assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amt_assinatura_overrides_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "amt_modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      amt_modulos: {
        Row: {
          categoria: string | null
          chave: string
          criado_em: string
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          chave: string
          criado_em?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          chave?: string
          criado_em?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      amt_plano_modulos: {
        Row: {
          modulo_id: string
          plano_id: string
          status: string
          updated_at: string
        }
        Insert: {
          modulo_id: string
          plano_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          modulo_id?: string
          plano_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amt_plano_modulos_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "amt_modulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amt_plano_modulos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "manager_planos"
            referencedColumns: ["id"]
          },
        ]
      }
      amt_sistema_modulos: {
        Row: {
          criado_em: string
          modulo_id: string
          sistema_id: string
        }
        Insert: {
          criado_em?: string
          modulo_id: string
          sistema_id: string
        }
        Update: {
          criado_em?: string
          modulo_id?: string
          sistema_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amt_sistema_modulos_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "amt_modulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amt_sistema_modulos_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "manager_sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          cancelada_em: string | null
          ciclo: string
          created_at: string
          current_period_end: string | null
          empresa_id: string
          id: string
          plano: string
          status: Database["public"]["Enums"]["assinatura_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          cancelada_em?: string | null
          ciclo?: string
          created_at?: string
          current_period_end?: string | null
          empresa_id: string
          id?: string
          plano?: string
          status?: Database["public"]["Enums"]["assinatura_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          cancelada_em?: string | null
          ciclo?: string
          created_at?: string
          current_period_end?: string | null
          empresa_id?: string
          id?: string
          plano?: string
          status?: Database["public"]["Enums"]["assinatura_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json | null
          empresa_id: string | null
          entidade: string | null
          entidade_id: string | null
          id: number
          ip: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json | null
          empresa_id?: string | null
          entidade?: string | null
          entidade_id?: string | null
          id?: number
          ip?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json | null
          empresa_id?: string | null
          entidade?: string | null
          entidade_id?: string | null
          id?: number
          ip?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      caixas: {
        Row: {
          aberta_em: string
          aberto_por: string | null
          created_at: string
          empresa_id: string
          fechada_em: string | null
          fechado_por: string | null
          id: string
          observacoes: string | null
          status: Database["public"]["Enums"]["status_caixa"]
          updated_at: string
          valor_abertura: number
          valor_fechamento: number | null
        }
        Insert: {
          aberta_em?: string
          aberto_por?: string | null
          created_at?: string
          empresa_id: string
          fechada_em?: string | null
          fechado_por?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_caixa"]
          updated_at?: string
          valor_abertura?: number
          valor_fechamento?: number | null
        }
        Update: {
          aberta_em?: string
          aberto_por?: string | null
          created_at?: string
          empresa_id?: string
          fechada_em?: string | null
          fechado_por?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_caixa"]
          updated_at?: string
          valor_abertura?: number
          valor_fechamento?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "caixas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          ativa: boolean
          cor: string | null
          created_at: string
          descricao: string | null
          empresa_id: string
          icone: string | null
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          cor?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id: string
          icone?: string | null
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          cor?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          aniversario: string | null
          cpf: string | null
          created_at: string
          email: string | null
          empresa_id: string
          endereco: string | null
          id: string
          nome: string
          observacao: string | null
          telefone: string | null
          total_gasto: number
          updated_at: string
          visitas: number
        }
        Insert: {
          aniversario?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          empresa_id: string
          endereco?: string | null
          id?: string
          nome: string
          observacao?: string | null
          telefone?: string | null
          total_gasto?: number
          updated_at?: string
          visitas?: number
        }
        Update: {
          aniversario?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          id?: string
          nome?: string
          observacao?: string | null
          telefone?: string | null
          total_gasto?: number
          updated_at?: string
          visitas?: number
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          ativo: boolean
          cpf: string
          created_at: string
          email: string
          empresa_id: string
          endereco: string
          funcao: Database["public"]["Enums"]["app_role"]
          id: string
          nome: string
          telefone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          cpf: string
          created_at?: string
          email: string
          empresa_id: string
          endereco: string
          funcao: Database["public"]["Enums"]["app_role"]
          id?: string
          nome: string
          telefone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          cpf?: string
          created_at?: string
          email?: string
          empresa_id?: string
          endereco?: string
          funcao?: Database["public"]["Enums"]["app_role"]
          id?: string
          nome?: string
          telefone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      comandas: {
        Row: {
          aberta_em: string
          cliente_nome: string | null
          cliente_telefone: string | null
          created_at: string
          desconto: number
          empresa_id: string
          fechada_em: string | null
          garcom_id: string | null
          id: string
          mesa_id: string | null
          numero: number
          observacao: string | null
          status: Database["public"]["Enums"]["status_comanda"]
          subtotal: number
          taxa_servico: number
          taxa_servico_percentual: number
          total: number
          updated_at: string
        }
        Insert: {
          aberta_em?: string
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string
          desconto?: number
          empresa_id: string
          fechada_em?: string | null
          garcom_id?: string | null
          id?: string
          mesa_id?: string | null
          numero?: number
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_comanda"]
          subtotal?: number
          taxa_servico?: number
          taxa_servico_percentual?: number
          total?: number
          updated_at?: string
        }
        Update: {
          aberta_em?: string
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string
          desconto?: number
          empresa_id?: string
          fechada_em?: string | null
          garcom_id?: string | null
          id?: string
          mesa_id?: string | null
          numero?: number
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_comanda"]
          subtotal?: number
          taxa_servico?: number
          taxa_servico_percentual?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comandas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
        ]
      }
      contatos_leads: {
        Row: {
          created_at: string
          email: string
          empresa: string | null
          id: string
          mensagem: string
          nome: string
          segmento: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          empresa?: string | null
          id?: string
          mensagem: string
          nome: string
          segmento?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          empresa?: string | null
          id?: string
          mensagem?: string
          nome?: string
          segmento?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      crm_agenda: {
        Row: {
          cliente_id: string | null
          created_at: string
          fim: string | null
          id: string
          inicio: string
          lead_id: string | null
          observacoes: string | null
          responsavel_id: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          fim?: string | null
          id?: string
          inicio: string
          lead_id?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          fim?: string | null
          id?: string
          inicio?: string
          lead_id?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_agenda_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "manager_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_agenda_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "manager_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_alertas: {
        Row: {
          cliente_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          lido: boolean
          lido_em: string | null
          link: string | null
          mensagem: string | null
          metadata: Json | null
          severidade: string
          tipo: string
          titulo: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          lido?: boolean
          lido_em?: string | null
          link?: string | null
          mensagem?: string | null
          metadata?: Json | null
          severidade?: string
          tipo: string
          titulo: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          lido?: boolean
          lido_em?: string | null
          link?: string | null
          mensagem?: string | null
          metadata?: Json | null
          severidade?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_alertas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "manager_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_alertas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "manager_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_assinaturas_digitais: {
        Row: {
          assinado_em: string
          assinatura_hash: string
          created_at: string
          documento_hash: string
          evidencias: Json
          geolocalizacao: Json | null
          id: string
          ip_address: string | null
          metodo: string
          referencia_id: string
          signatario_documento: string | null
          signatario_email: string
          signatario_nome: string
          tipo: string
          user_agent: string | null
        }
        Insert: {
          assinado_em?: string
          assinatura_hash: string
          created_at?: string
          documento_hash: string
          evidencias?: Json
          geolocalizacao?: Json | null
          id?: string
          ip_address?: string | null
          metodo?: string
          referencia_id: string
          signatario_documento?: string | null
          signatario_email: string
          signatario_nome: string
          tipo: string
          user_agent?: string | null
        }
        Update: {
          assinado_em?: string
          assinatura_hash?: string
          created_at?: string
          documento_hash?: string
          evidencias?: Json
          geolocalizacao?: Json | null
          id?: string
          ip_address?: string | null
          metodo?: string
          referencia_id?: string
          signatario_documento?: string | null
          signatario_email?: string
          signatario_nome?: string
          tipo?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      crm_canais_config: {
        Row: {
          ativo: boolean
          canal: string
          created_at: string
          headers_extras: Json
          id: string
          observacoes: string | null
          provedor: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          ativo?: boolean
          canal: string
          created_at?: string
          headers_extras?: Json
          id?: string
          observacoes?: string | null
          provedor?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          ativo?: boolean
          canal?: string
          created_at?: string
          headers_extras?: Json
          id?: string
          observacoes?: string | null
          provedor?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      crm_categorias_lead: {
        Row: {
          ativo: boolean
          buscas: Json
          created_at: string
          grupo: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          buscas?: Json
          created_at?: string
          grupo?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          buscas?: Json
          created_at?: string
          grupo?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_checklist_implantacao: {
        Row: {
          cliente_id: string
          concluido_em: string | null
          created_at: string
          etapas: Json
          id: string
          observacoes: string | null
          responsavel_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          concluido_em?: string | null
          created_at?: string
          etapas?: Json
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          concluido_em?: string | null
          created_at?: string
          etapas?: Json
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_checklist_implantacao_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "manager_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_conteudos: {
        Row: {
          campanha_id: string | null
          created_at: string
          criado_por: string | null
          cta: string | null
          data_publicacao: string | null
          descricao: string | null
          formato: string
          hashtags: string | null
          id: string
          legenda: string | null
          status: string
          texto_arte: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          campanha_id?: string | null
          created_at?: string
          criado_por?: string | null
          cta?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          formato: string
          hashtags?: string | null
          id?: string
          legenda?: string | null
          status?: string
          texto_arte?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          campanha_id?: string | null
          created_at?: string
          criado_por?: string | null
          cta?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          formato?: string
          hashtags?: string | null
          id?: string
          legenda?: string | null
          status?: string
          texto_arte?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_conteudos_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "manager_campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contratos: {
        Row: {
          arquivo_url: string | null
          assinado_em: string | null
          cliente_id: string | null
          conteudo: string
          created_at: string
          id: string
          numero: number
          proposta_id: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivo_url?: string | null
          assinado_em?: string | null
          cliente_id?: string | null
          conteudo: string
          created_at?: string
          id?: string
          numero?: number
          proposta_id?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivo_url?: string | null
          assinado_em?: string | null
          cliente_id?: string | null
          conteudo?: string
          created_at?: string
          id?: string
          numero?: number
          proposta_id?: string | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "manager_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contratos_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "crm_propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_fin_categorias: {
        Row: {
          ativa: boolean
          cor: string | null
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_fin_conciliacoes: {
        Row: {
          conciliado: boolean
          conta_id: string
          created_at: string
          data: string
          descricao: string
          id: string
          lancamento_id: string | null
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          conciliado?: boolean
          conta_id: string
          created_at?: string
          data: string
          descricao: string
          id?: string
          lancamento_id?: string | null
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          conciliado?: boolean
          conta_id?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          lancamento_id?: string | null
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_fin_conciliacoes_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "crm_fin_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_fin_conciliacoes_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "crm_fin_lancamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_fin_contas: {
        Row: {
          agencia: string | null
          ativa: boolean
          banco: string | null
          conta: string | null
          created_at: string
          id: string
          nome: string
          saldo_atual: number
          saldo_inicial: number
          tipo: string
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          ativa?: boolean
          banco?: string | null
          conta?: string | null
          created_at?: string
          id?: string
          nome: string
          saldo_atual?: number
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          ativa?: boolean
          banco?: string | null
          conta?: string | null
          created_at?: string
          id?: string
          nome?: string
          saldo_atual?: number
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_fin_lancamentos: {
        Row: {
          anexos: Json | null
          categoria_id: string | null
          cliente_id: string | null
          conta_id: string | null
          created_at: string
          descricao: string
          documento: string | null
          forma_pagamento: string | null
          fornecedor: string | null
          id: string
          observacoes: string | null
          pago_em: string | null
          recorrencia_config: Json | null
          recorrente: boolean
          status: string
          tipo: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          anexos?: Json | null
          categoria_id?: string | null
          cliente_id?: string | null
          conta_id?: string | null
          created_at?: string
          descricao: string
          documento?: string | null
          forma_pagamento?: string | null
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          recorrencia_config?: Json | null
          recorrente?: boolean
          status?: string
          tipo: string
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          anexos?: Json | null
          categoria_id?: string | null
          cliente_id?: string | null
          conta_id?: string | null
          created_at?: string
          descricao?: string
          documento?: string | null
          forma_pagamento?: string | null
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          recorrencia_config?: Json | null
          recorrente?: boolean
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_fin_lancamentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "crm_fin_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_fin_lancamentos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "crm_fin_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_integracoes: {
        Row: {
          ativo: boolean
          config: Json
          created_at: string
          credenciais: Json
          id: string
          nome: string
          observacoes: string | null
          tipo: string
          ultimo_teste_em: string | null
          ultimo_teste_mensagem: string | null
          ultimo_teste_status: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          config?: Json
          created_at?: string
          credenciais?: Json
          id?: string
          nome?: string
          observacoes?: string | null
          tipo: string
          ultimo_teste_em?: string | null
          ultimo_teste_mensagem?: string | null
          ultimo_teste_status?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          config?: Json
          created_at?: string
          credenciais?: Json
          id?: string
          nome?: string
          observacoes?: string | null
          tipo?: string
          ultimo_teste_em?: string | null
          ultimo_teste_mensagem?: string | null
          ultimo_teste_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_lembretes: {
        Row: {
          agendado_para: string
          cliente_id: string | null
          created_at: string
          criado_por: string | null
          destinatario_nome: string | null
          destinatario_telefone: string
          erro: string | null
          id: string
          lead_id: string | null
          mensagem_id: string | null
          observacoes: string | null
          status: string
          template: string
          tentativas: number
          tipo: string
          titulo: string | null
          updated_at: string
          variaveis: Json
        }
        Insert: {
          agendado_para: string
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          destinatario_nome?: string | null
          destinatario_telefone: string
          erro?: string | null
          id?: string
          lead_id?: string | null
          mensagem_id?: string | null
          observacoes?: string | null
          status?: string
          template: string
          tentativas?: number
          tipo?: string
          titulo?: string | null
          updated_at?: string
          variaveis?: Json
        }
        Update: {
          agendado_para?: string
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          destinatario_nome?: string | null
          destinatario_telefone?: string
          erro?: string | null
          id?: string
          lead_id?: string | null
          mensagem_id?: string | null
          observacoes?: string | null
          status?: string
          template?: string
          tentativas?: number
          tipo?: string
          titulo?: string | null
          updated_at?: string
          variaveis?: Json
        }
        Relationships: []
      }
      crm_mensagens: {
        Row: {
          analise_ia: Json | null
          assunto: string | null
          canal: string
          cliente_id: string | null
          conteudo: string
          created_at: string
          criado_por: string | null
          destinatario: string | null
          direcao: string
          enviado_em: string | null
          enviado_via: string | null
          erro: string | null
          external_id: string | null
          id: string
          intencao: string | null
          lead_id: string | null
          sentimento: string | null
          status: string
          template_id: string | null
          updated_at: string
          urgencia: string | null
        }
        Insert: {
          analise_ia?: Json | null
          assunto?: string | null
          canal: string
          cliente_id?: string | null
          conteudo: string
          created_at?: string
          criado_por?: string | null
          destinatario?: string | null
          direcao?: string
          enviado_em?: string | null
          enviado_via?: string | null
          erro?: string | null
          external_id?: string | null
          id?: string
          intencao?: string | null
          lead_id?: string | null
          sentimento?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          urgencia?: string | null
        }
        Update: {
          analise_ia?: Json | null
          assunto?: string | null
          canal?: string
          cliente_id?: string | null
          conteudo?: string
          created_at?: string
          criado_por?: string | null
          destinatario?: string | null
          direcao?: string
          enviado_em?: string | null
          enviado_via?: string | null
          erro?: string | null
          external_id?: string | null
          id?: string
          intencao?: string | null
          lead_id?: string | null
          sentimento?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          urgencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_mensagens_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "manager_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_mensagens_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "manager_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_mensagens_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "crm_templates_mensagem"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_portal_acessos: {
        Row: {
          access_count: number
          contrato_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          last_access_at: string | null
          lead_id: string | null
          proposta_id: string | null
          token: string
          updated_at: string
        }
        Insert: {
          access_count?: number
          contrato_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          last_access_at?: string | null
          lead_id?: string | null
          proposta_id?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          access_count?: number
          contrato_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          last_access_at?: string | null
          lead_id?: string | null
          proposta_id?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_prompts_ia: {
        Row: {
          chave: string
          created_at: string
          id: string
          modelo: string
          provider: string
          template: string
          titulo: string
          updated_at: string
          variaveis: Json
        }
        Insert: {
          chave: string
          created_at?: string
          id?: string
          modelo?: string
          provider?: string
          template: string
          titulo: string
          updated_at?: string
          variaveis?: Json
        }
        Update: {
          chave?: string
          created_at?: string
          id?: string
          modelo?: string
          provider?: string
          template?: string
          titulo?: string
          updated_at?: string
          variaveis?: Json
        }
        Relationships: []
      }
      crm_propostas: {
        Row: {
          aceite_em: string | null
          cliente_id: string | null
          created_at: string
          criado_por: string | null
          desconto: number
          enviada_em: string | null
          id: string
          itens: Json
          lead_id: string | null
          numero: number
          observacoes: string | null
          plano_id: string | null
          sistema_id: string | null
          status: string
          titulo: string
          updated_at: string
          validade: string | null
          valor_mensal: number
          valor_setup: number
        }
        Insert: {
          aceite_em?: string | null
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          desconto?: number
          enviada_em?: string | null
          id?: string
          itens?: Json
          lead_id?: string | null
          numero?: number
          observacoes?: string | null
          plano_id?: string | null
          sistema_id?: string | null
          status?: string
          titulo: string
          updated_at?: string
          validade?: string | null
          valor_mensal?: number
          valor_setup?: number
        }
        Update: {
          aceite_em?: string | null
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          desconto?: number
          enviada_em?: string | null
          id?: string
          itens?: Json
          lead_id?: string | null
          numero?: number
          observacoes?: string | null
          plano_id?: string | null
          sistema_id?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          validade?: string | null
          valor_mensal?: number
          valor_setup?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_propostas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "manager_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_propostas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "manager_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_propostas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "manager_planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_propostas_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "manager_sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_push_subscriptions: {
        Row: {
          ativa: boolean
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          ativa?: boolean
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          ativa?: boolean
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crm_relatorios: {
        Row: {
          agrupamento: Json
          chart_config: Json
          chart_tipo: string | null
          colunas: Json
          created_at: string
          created_by: string | null
          descricao: string | null
          favorito: boolean
          filtros: Json
          fonte: string
          id: string
          limite: number | null
          nome: string
          ordenacao: Json
          updated_at: string
        }
        Insert: {
          agrupamento?: Json
          chart_config?: Json
          chart_tipo?: string | null
          colunas?: Json
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          favorito?: boolean
          filtros?: Json
          fonte: string
          id?: string
          limite?: number | null
          nome: string
          ordenacao?: Json
          updated_at?: string
        }
        Update: {
          agrupamento?: Json
          chart_config?: Json
          chart_tipo?: string | null
          colunas?: Json
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          favorito?: boolean
          filtros?: Json
          fonte?: string
          id?: string
          limite?: number | null
          nome?: string
          ordenacao?: Json
          updated_at?: string
        }
        Relationships: []
      }
      crm_relatorios_agendamentos: {
        Row: {
          ativo: boolean
          created_at: string
          destinatarios: string[]
          dia_mes: number | null
          dia_semana: number | null
          formato: string
          frequencia: string
          hora: string
          id: string
          proximo_disparo: string | null
          relatorio_id: string
          ultimo_disparo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          destinatarios?: string[]
          dia_mes?: number | null
          dia_semana?: number | null
          formato?: string
          frequencia: string
          hora?: string
          id?: string
          proximo_disparo?: string | null
          relatorio_id: string
          ultimo_disparo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          destinatarios?: string[]
          dia_mes?: number | null
          dia_semana?: number | null
          formato?: string
          frequencia?: string
          hora?: string
          id?: string
          proximo_disparo?: string | null
          relatorio_id?: string
          ultimo_disparo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_relatorios_agendamentos_relatorio_id_fkey"
            columns: ["relatorio_id"]
            isOneToOne: false
            referencedRelation: "crm_relatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sequencia_enrollments: {
        Row: {
          cliente_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          mensagens_geradas: number
          observacoes: string | null
          passo_atual: number
          proximo_disparo_em: string
          sequencia_id: string
          status: string
          ultima_execucao_em: string | null
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          mensagens_geradas?: number
          observacoes?: string | null
          passo_atual?: number
          proximo_disparo_em?: string
          sequencia_id: string
          status?: string
          ultima_execucao_em?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          mensagens_geradas?: number
          observacoes?: string | null
          passo_atual?: number
          proximo_disparo_em?: string
          sequencia_id?: string
          status?: string
          ultima_execucao_em?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_sequencia_enrollments_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "manager_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sequencia_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "manager_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sequencia_enrollments_sequencia_id_fkey"
            columns: ["sequencia_id"]
            isOneToOne: false
            referencedRelation: "crm_sequencias"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sequencia_passos: {
        Row: {
          canal: string
          condicao: string | null
          conteudo: string | null
          created_at: string
          dia: number
          id: string
          ordem: number
          sequencia_id: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          canal: string
          condicao?: string | null
          conteudo?: string | null
          created_at?: string
          dia?: number
          id?: string
          ordem?: number
          sequencia_id: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          canal?: string
          condicao?: string | null
          conteudo?: string | null
          created_at?: string
          dia?: number
          id?: string
          ordem?: number
          sequencia_id?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_sequencia_passos_sequencia_id_fkey"
            columns: ["sequencia_id"]
            isOneToOne: false
            referencedRelation: "crm_sequencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sequencia_passos_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "crm_templates_mensagem"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sequencias: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_templates_mensagem: {
        Row: {
          assunto: string | null
          ativo: boolean
          canal: string
          conteudo: string
          created_at: string
          id: string
          nome: string
          tom: string | null
          updated_at: string
          variaveis: Json
        }
        Insert: {
          assunto?: string | null
          ativo?: boolean
          canal: string
          conteudo: string
          created_at?: string
          id?: string
          nome: string
          tom?: string | null
          updated_at?: string
          variaveis?: Json
        }
        Update: {
          assunto?: string | null
          ativo?: boolean
          canal?: string
          conteudo?: string
          created_at?: string
          id?: string
          nome?: string
          tom?: string | null
          updated_at?: string
          variaveis?: Json
        }
        Relationships: []
      }
      crm_workflow_execucoes: {
        Row: {
          contexto: Json
          duracao_ms: number | null
          erro_mensagem: string | null
          finalizado_em: string | null
          id: string
          iniciado_em: string
          log_passos: Json
          origem: string | null
          status: string
          workflow_id: string
        }
        Insert: {
          contexto?: Json
          duracao_ms?: number | null
          erro_mensagem?: string | null
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string
          log_passos?: Json
          origem?: string | null
          status?: string
          workflow_id: string
        }
        Update: {
          contexto?: Json
          duracao_ms?: number | null
          erro_mensagem?: string | null
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string
          log_passos?: Json
          origem?: string | null
          status?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_workflow_execucoes_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "crm_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_workflows: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          definicao: Json
          descricao: string | null
          execucoes_erro: number
          execucoes_ok: number
          execucoes_total: number
          gatilho_config: Json
          gatilho_tipo: string
          id: string
          nome: string
          ultima_execucao: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          definicao?: Json
          descricao?: string | null
          execucoes_erro?: number
          execucoes_ok?: number
          execucoes_total?: number
          gatilho_config?: Json
          gatilho_tipo: string
          id?: string
          nome: string
          ultima_execucao?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          definicao?: Json
          descricao?: string | null
          execucoes_erro?: number
          execucoes_ok?: number
          execucoes_total?: number
          gatilho_config?: Json
          gatilho_tipo?: string
          id?: string
          nome?: string
          ultima_execucao?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cupons_fiscais: {
        Row: {
          cidade: string | null
          cliente_nome: string | null
          cnpj: string | null
          comanda_id: string | null
          desconto: number
          emitido_em: string
          emitido_por: string | null
          empresa_id: string
          endereco: string | null
          estado: string | null
          id: string
          itens: Json
          mesa_numero: string | null
          nome_fantasia: string | null
          numero: number
          observacoes: string | null
          pagamentos: Json
          razao_social: string
          subtotal: number
          taxa_servico: number
          telefone: string | null
          total: number
        }
        Insert: {
          cidade?: string | null
          cliente_nome?: string | null
          cnpj?: string | null
          comanda_id?: string | null
          desconto?: number
          emitido_em?: string
          emitido_por?: string | null
          empresa_id: string
          endereco?: string | null
          estado?: string | null
          id?: string
          itens?: Json
          mesa_numero?: string | null
          nome_fantasia?: string | null
          numero?: number
          observacoes?: string | null
          pagamentos?: Json
          razao_social: string
          subtotal?: number
          taxa_servico?: number
          telefone?: string | null
          total?: number
        }
        Update: {
          cidade?: string | null
          cliente_nome?: string | null
          cnpj?: string | null
          comanda_id?: string | null
          desconto?: number
          emitido_em?: string
          emitido_por?: string | null
          empresa_id?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          itens?: Json
          mesa_numero?: string | null
          nome_fantasia?: string | null
          numero?: number
          observacoes?: string | null
          pagamentos?: Json
          razao_social?: string
          subtotal?: number
          taxa_servico?: number
          telefone?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "cupons_fiscais_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupons_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativa: boolean
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          criada_por: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          fuso_horario: string
          id: string
          logo_url: string | null
          moeda: string
          nome_fantasia: string
          razao_social: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          criada_por?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          fuso_horario?: string
          id?: string
          logo_url?: string | null
          moeda?: string
          nome_fantasia: string
          razao_social: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          criada_por?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          fuso_horario?: string
          id?: string
          logo_url?: string | null
          moeda?: string
          nome_fantasia?: string
          razao_social?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ficha_tecnica: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          insumo_id: string
          observacao: string | null
          perda_percentual: number
          produto_id: string
          quantidade: number
          unidade: Database["public"]["Enums"]["unidade_medida"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          insumo_id: string
          observacao?: string | null
          perda_percentual?: number
          produto_id: string
          quantidade: number
          unidade: Database["public"]["Enums"]["unidade_medida"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          insumo_id?: string
          observacao?: string | null
          perda_percentual?: number
          produto_id?: string
          quantidade?: number
          unidade?: Database["public"]["Enums"]["unidade_medida"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ficha_tecnica_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ficha_tecnica_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ficha_tecnica_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          categorias: string[] | null
          cnpj: string | null
          condicoes_pagamento: string | null
          contato_nome: string | null
          created_at: string
          email: string | null
          empresa_id: string
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          prazo_entrega_dias: number | null
          telefone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          categorias?: string[] | null
          cnpj?: string | null
          condicoes_pagamento?: string | null
          contato_nome?: string | null
          created_at?: string
          email?: string | null
          empresa_id: string
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          prazo_entrega_dias?: number | null
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          categorias?: string[] | null
          cnpj?: string | null
          condicoes_pagamento?: string | null
          contato_nome?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          prazo_entrega_dias?: number | null
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      insumos: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          custo_unitario: number
          empresa_id: string
          estoque_atual: number
          estoque_minimo: number
          fornecedor: string | null
          id: string
          nome: string
          unidade: Database["public"]["Enums"]["unidade_medida"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          custo_unitario?: number
          empresa_id: string
          estoque_atual?: number
          estoque_minimo?: number
          fornecedor?: string | null
          id?: string
          nome: string
          unidade?: Database["public"]["Enums"]["unidade_medida"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          custo_unitario?: number
          empresa_id?: string
          estoque_atual?: number
          estoque_minimo?: number
          fornecedor?: string | null
          id?: string
          nome?: string
          unidade?: Database["public"]["Enums"]["unidade_medida"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insumos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_comanda: {
        Row: {
          comanda_id: string
          created_at: string
          desconto: number
          empresa_id: string
          entregue_em: string | null
          enviado_cozinha_em: string | null
          id: string
          observacao: string | null
          preco_unitario: number
          produto_id: string
          pronto_em: string | null
          quantidade: number
          status: Database["public"]["Enums"]["status_item"]
          total: number
          updated_at: string
        }
        Insert: {
          comanda_id: string
          created_at?: string
          desconto?: number
          empresa_id: string
          entregue_em?: string | null
          enviado_cozinha_em?: string | null
          id?: string
          observacao?: string | null
          preco_unitario: number
          produto_id: string
          pronto_em?: string | null
          quantidade?: number
          status?: Database["public"]["Enums"]["status_item"]
          total?: number
          updated_at?: string
        }
        Update: {
          comanda_id?: string
          created_at?: string
          desconto?: number
          empresa_id?: string
          entregue_em?: string | null
          enviado_cozinha_em?: string | null
          id?: string
          observacao?: string | null
          preco_unitario?: number
          produto_id?: string
          pronto_em?: string | null
          quantidade?: number
          status?: Database["public"]["Enums"]["status_item"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_comanda_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_comanda_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_comanda_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_lista_preco: {
        Row: {
          created_at: string
          empresa_id: string
          fornecedor_id: string
          id: string
          insumo_id: string | null
          lista_id: string
          nome_normalizado: string | null
          nome_produto: string
          observacao: string | null
          prazo_entrega_dias: number | null
          preco: number
          quantidade_minima: number | null
          unidade: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          fornecedor_id: string
          id?: string
          insumo_id?: string | null
          lista_id: string
          nome_normalizado?: string | null
          nome_produto: string
          observacao?: string | null
          prazo_entrega_dias?: number | null
          preco: number
          quantidade_minima?: number | null
          unidade?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          fornecedor_id?: string
          id?: string
          insumo_id?: string | null
          lista_id?: string
          nome_normalizado?: string | null
          nome_produto?: string
          observacao?: string | null
          prazo_entrega_dias?: number | null
          preco?: number
          quantidade_minima?: number | null
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_lista_preco_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_lista_preco_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_lista_preco_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_lista_preco_lista_id_fkey"
            columns: ["lista_id"]
            isOneToOne: false
            referencedRelation: "listas_preco"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_pedido_compra: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          insumo_id: string | null
          nome_produto: string
          pedido_id: string
          preco_unitario: number
          quantidade: number
          total: number | null
          unidade: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          insumo_id?: string | null
          nome_produto: string
          pedido_id: string
          preco_unitario: number
          quantidade: number
          total?: number | null
          unidade?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          insumo_id?: string | null
          nome_produto?: string
          pedido_id?: string
          preco_unitario?: number
          quantidade?: number
          total?: number | null
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_compra_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_compra_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_compra_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_financeiros: {
        Row: {
          categoria: string
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          fornecedor_cliente: string | null
          id: string
          observacao: string | null
          pago: boolean
          tipo: Database["public"]["Enums"]["tipo_lancamento"]
          updated_at: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          fornecedor_cliente?: string | null
          id?: string
          observacao?: string | null
          pago?: boolean
          tipo: Database["public"]["Enums"]["tipo_lancamento"]
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          empresa_id?: string
          fornecedor_cliente?: string | null
          id?: string
          observacao?: string | null
          pago?: boolean
          tipo?: Database["public"]["Enums"]["tipo_lancamento"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_financeiros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      listas_preco: {
        Row: {
          arquivo_nome: string | null
          ativo: boolean
          created_at: string
          data_vigencia: string
          empresa_id: string
          fornecedor_id: string
          id: string
          nome: string
          observacao: string | null
          updated_at: string
        }
        Insert: {
          arquivo_nome?: string | null
          ativo?: boolean
          created_at?: string
          data_vigencia?: string
          empresa_id: string
          fornecedor_id: string
          id?: string
          nome: string
          observacao?: string | null
          updated_at?: string
        }
        Update: {
          arquivo_nome?: string | null
          ativo?: boolean
          created_at?: string
          data_vigencia?: string
          empresa_id?: string
          fornecedor_id?: string
          id?: string
          nome?: string
          observacao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listas_preco_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listas_preco_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_assinaturas: {
        Row: {
          asaas_subscription_id: string | null
          cancelada_em: string | null
          ciclo: string
          cliente_id: string
          created_at: string
          external_ref: string | null
          id: string
          inicio_em: string
          metadata: Json
          moeda: string
          motivo_cancelamento: string | null
          plano_id: string
          proxima_cobranca: string | null
          sistema_id: string
          status: string
          sync_erro: string | null
          sync_status: string | null
          sync_ultimo_em: string | null
          trial_ate: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          asaas_subscription_id?: string | null
          cancelada_em?: string | null
          ciclo?: string
          cliente_id: string
          created_at?: string
          external_ref?: string | null
          id?: string
          inicio_em?: string
          metadata?: Json
          moeda?: string
          motivo_cancelamento?: string | null
          plano_id: string
          proxima_cobranca?: string | null
          sistema_id: string
          status?: string
          sync_erro?: string | null
          sync_status?: string | null
          sync_ultimo_em?: string | null
          trial_ate?: string | null
          updated_at?: string
          valor?: number
        }
        Update: {
          asaas_subscription_id?: string | null
          cancelada_em?: string | null
          ciclo?: string
          cliente_id?: string
          created_at?: string
          external_ref?: string | null
          id?: string
          inicio_em?: string
          metadata?: Json
          moeda?: string
          motivo_cancelamento?: string | null
          plano_id?: string
          proxima_cobranca?: string | null
          sistema_id?: string
          status?: string
          sync_erro?: string | null
          sync_status?: string | null
          sync_ultimo_em?: string | null
          trial_ate?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "manager_assinaturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "manager_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "manager_planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_assinaturas_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "manager_sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_atividades: {
        Row: {
          agendada_para: string | null
          cliente_id: string | null
          concluida: boolean
          concluida_em: string | null
          created_at: string
          descricao: string | null
          id: string
          lead_id: string | null
          oportunidade_id: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          agendada_para?: string | null
          cliente_id?: string | null
          concluida?: boolean
          concluida_em?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          lead_id?: string | null
          oportunidade_id?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          agendada_para?: string | null
          cliente_id?: string | null
          concluida?: boolean
          concluida_em?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          lead_id?: string | null
          oportunidade_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_atividades_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "manager_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_atividades_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "manager_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_atividades_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "manager_oportunidades"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_campanhas: {
        Row: {
          agendada_para: string | null
          assunto: string | null
          canal: string
          conteudo: string | null
          created_at: string
          cta_texto: string | null
          cta_url: string | null
          custo: number
          descricao: string | null
          enviada_em: string | null
          id: string
          nome: string
          segmento_id: string | null
          sistema_id: string | null
          status: string
          tipo: string
          total_abertos: number
          total_cliques: number
          total_conversoes: number
          total_destinatarios: number
          total_enviados: number
          updated_at: string
        }
        Insert: {
          agendada_para?: string | null
          assunto?: string | null
          canal?: string
          conteudo?: string | null
          created_at?: string
          cta_texto?: string | null
          cta_url?: string | null
          custo?: number
          descricao?: string | null
          enviada_em?: string | null
          id?: string
          nome: string
          segmento_id?: string | null
          sistema_id?: string | null
          status?: string
          tipo?: string
          total_abertos?: number
          total_cliques?: number
          total_conversoes?: number
          total_destinatarios?: number
          total_enviados?: number
          updated_at?: string
        }
        Update: {
          agendada_para?: string | null
          assunto?: string | null
          canal?: string
          conteudo?: string | null
          created_at?: string
          cta_texto?: string | null
          cta_url?: string | null
          custo?: number
          descricao?: string | null
          enviada_em?: string | null
          id?: string
          nome?: string
          segmento_id?: string | null
          sistema_id?: string | null
          status?: string
          tipo?: string
          total_abertos?: number
          total_cliques?: number
          total_conversoes?: number
          total_destinatarios?: number
          total_enviados?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_campanhas_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "manager_sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_clientes: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          created_at: string
          documento: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome_fantasia: string | null
          numero: string | null
          observacoes: string | null
          razao_social: string
          responsavel_email: string | null
          responsavel_nome: string | null
          responsavel_telefone: string | null
          status: string
          tags: string[]
          telefone: string | null
          tipo_documento: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          razao_social: string
          responsavel_email?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          status?: string
          tags?: string[]
          telefone?: string | null
          tipo_documento?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          razao_social?: string
          responsavel_email?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          status?: string
          tags?: string[]
          telefone?: string | null
          tipo_documento?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      manager_cobrancas: {
        Row: {
          assinatura_id: string | null
          cliente_id: string
          created_at: string
          descricao: string
          external_ref: string | null
          forma_pagamento: string | null
          id: string
          moeda: string
          observacoes: string | null
          pago_em: string | null
          status: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          assinatura_id?: string | null
          cliente_id: string
          created_at?: string
          descricao: string
          external_ref?: string | null
          forma_pagamento?: string | null
          id?: string
          moeda?: string
          observacoes?: string | null
          pago_em?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento: string
        }
        Update: {
          assinatura_id?: string | null
          cliente_id?: string
          created_at?: string
          descricao?: string
          external_ref?: string | null
          forma_pagamento?: string | null
          id?: string
          moeda?: string
          observacoes?: string | null
          pago_em?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_cobrancas_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "manager_assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_cobrancas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "manager_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_configuracoes: {
        Row: {
          atualizado_por: string | null
          categoria: string
          chave: string
          created_at: string
          descricao: string | null
          id: string
          updated_at: string
          valor: Json
        }
        Insert: {
          atualizado_por?: string | null
          categoria: string
          chave: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: Json
        }
        Update: {
          atualizado_por?: string | null
          categoria?: string
          chave?: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      manager_integracoes: {
        Row: {
          ativo: boolean
          config: Json
          created_at: string
          credenciais_ref: string | null
          criado_por: string | null
          descricao: string | null
          id: string
          metadata: Json
          nome: string
          provedor: string
          status: string
          tipo: string
          ultimo_erro: string | null
          ultimo_teste_em: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          config?: Json
          created_at?: string
          credenciais_ref?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          metadata?: Json
          nome: string
          provedor: string
          status?: string
          tipo: string
          ultimo_erro?: string | null
          ultimo_teste_em?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          config?: Json
          created_at?: string
          credenciais_ref?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          metadata?: Json
          nome?: string
          provedor?: string
          status?: string
          tipo?: string
          ultimo_erro?: string | null
          ultimo_teste_em?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      manager_landing_leads: {
        Row: {
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          landing_page_id: string
          mensagem: string | null
          metadata: Json | null
          nome: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          landing_page_id: string
          mensagem?: string | null
          metadata?: Json | null
          nome?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          landing_page_id?: string
          mensagem?: string | null
          metadata?: Json | null
          nome?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_landing_leads_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "manager_landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_landing_pages: {
        Row: {
          campanha_id: string | null
          conteudo: Json
          conversoes: number
          cor_primaria: string | null
          created_at: string
          cta_texto: string | null
          cta_url: string | null
          descricao: string | null
          headline: string | null
          id: string
          imagem_hero: string | null
          publicada_em: string | null
          seo_descricao: string | null
          seo_titulo: string | null
          sistema_id: string | null
          slug: string
          status: string
          subheadline: string | null
          titulo: string
          updated_at: string
          visualizacoes: number
        }
        Insert: {
          campanha_id?: string | null
          conteudo?: Json
          conversoes?: number
          cor_primaria?: string | null
          created_at?: string
          cta_texto?: string | null
          cta_url?: string | null
          descricao?: string | null
          headline?: string | null
          id?: string
          imagem_hero?: string | null
          publicada_em?: string | null
          seo_descricao?: string | null
          seo_titulo?: string | null
          sistema_id?: string | null
          slug: string
          status?: string
          subheadline?: string | null
          titulo: string
          updated_at?: string
          visualizacoes?: number
        }
        Update: {
          campanha_id?: string | null
          conteudo?: Json
          conversoes?: number
          cor_primaria?: string | null
          created_at?: string
          cta_texto?: string | null
          cta_url?: string | null
          descricao?: string | null
          headline?: string | null
          id?: string
          imagem_hero?: string | null
          publicada_em?: string | null
          seo_descricao?: string | null
          seo_titulo?: string | null
          sistema_id?: string | null
          slug?: string
          status?: string
          subheadline?: string | null
          titulo?: string
          updated_at?: string
          visualizacoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "manager_landing_pages_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "manager_campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_landing_pages_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "manager_sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_leads: {
        Row: {
          cargo: string | null
          cliente_id: string | null
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          proximo_contato: string | null
          score: number
          score_atualizado_em: string | null
          score_motivo: string | null
          sistema_interesse_id: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cargo?: string | null
          cliente_id?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          proximo_contato?: string | null
          score?: number
          score_atualizado_em?: string | null
          score_motivo?: string | null
          sistema_interesse_id?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cargo?: string | null
          cliente_id?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          proximo_contato?: string | null
          score?: number
          score_atualizado_em?: string | null
          score_motivo?: string | null
          sistema_interesse_id?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_leads_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "manager_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_leads_sistema_interesse_id_fkey"
            columns: ["sistema_interesse_id"]
            isOneToOne: false
            referencedRelation: "manager_sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_monitor_alvos: {
        Row: {
          ativo: boolean
          cliente_id: string | null
          created_at: string
          criado_por: string | null
          esperado_status: number
          headers: Json
          id: string
          intervalo_minutos: number
          metodo: string
          nome: string
          sistema_id: string | null
          timeout_segundos: number
          tipo: string
          ultima_latencia_ms: number | null
          ultimo_check_em: string | null
          ultimo_erro: string | null
          ultimo_status: string | null
          updated_at: string
          uptime_24h: number | null
          url: string
        }
        Insert: {
          ativo?: boolean
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          esperado_status?: number
          headers?: Json
          id?: string
          intervalo_minutos?: number
          metodo?: string
          nome: string
          sistema_id?: string | null
          timeout_segundos?: number
          tipo?: string
          ultima_latencia_ms?: number | null
          ultimo_check_em?: string | null
          ultimo_erro?: string | null
          ultimo_status?: string | null
          updated_at?: string
          uptime_24h?: number | null
          url: string
        }
        Update: {
          ativo?: boolean
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          esperado_status?: number
          headers?: Json
          id?: string
          intervalo_minutos?: number
          metodo?: string
          nome?: string
          sistema_id?: string | null
          timeout_segundos?: number
          tipo?: string
          ultima_latencia_ms?: number | null
          ultimo_check_em?: string | null
          ultimo_erro?: string | null
          ultimo_status?: string | null
          updated_at?: string
          uptime_24h?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_monitor_alvos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "manager_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_monitor_alvos_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "manager_sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_monitor_checks: {
        Row: {
          alvo_id: string
          checado_em: string
          erro: string | null
          http_status: number | null
          id: number
          latencia_ms: number | null
          status: string
        }
        Insert: {
          alvo_id: string
          checado_em?: string
          erro?: string | null
          http_status?: number | null
          id?: number
          latencia_ms?: number | null
          status: string
        }
        Update: {
          alvo_id?: string
          checado_em?: string
          erro?: string | null
          http_status?: number | null
          id?: number
          latencia_ms?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_monitor_checks_alvo_id_fkey"
            columns: ["alvo_id"]
            isOneToOne: false
            referencedRelation: "manager_monitor_alvos"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_notificacoes: {
        Row: {
          arquivada: boolean
          categoria: string
          created_at: string
          destinatario_id: string | null
          id: string
          link: string | null
          mensagem: string | null
          metadata: Json | null
          origem: string | null
          prioridade: string
          titulo: string
        }
        Insert: {
          arquivada?: boolean
          categoria?: string
          created_at?: string
          destinatario_id?: string | null
          id?: string
          link?: string | null
          mensagem?: string | null
          metadata?: Json | null
          origem?: string | null
          prioridade?: string
          titulo: string
        }
        Update: {
          arquivada?: boolean
          categoria?: string
          created_at?: string
          destinatario_id?: string | null
          id?: string
          link?: string | null
          mensagem?: string | null
          metadata?: Json | null
          origem?: string | null
          prioridade?: string
          titulo?: string
        }
        Relationships: []
      }
      manager_notificacoes_leituras: {
        Row: {
          lida_em: string
          notificacao_id: string
          user_id: string
        }
        Insert: {
          lida_em?: string
          notificacao_id: string
          user_id: string
        }
        Update: {
          lida_em?: string
          notificacao_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_notificacoes_leituras_notificacao_id_fkey"
            columns: ["notificacao_id"]
            isOneToOne: false
            referencedRelation: "manager_notificacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_oportunidades: {
        Row: {
          cliente_id: string | null
          created_at: string
          estagio: string
          fechada_em: string | null
          id: string
          lead_id: string | null
          motivo_perda: string | null
          observacoes: string | null
          plano_id: string | null
          previsao_fechamento: string | null
          probabilidade: number
          sistema_id: string | null
          titulo: string
          updated_at: string
          valor: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          estagio?: string
          fechada_em?: string | null
          id?: string
          lead_id?: string | null
          motivo_perda?: string | null
          observacoes?: string | null
          plano_id?: string | null
          previsao_fechamento?: string | null
          probabilidade?: number
          sistema_id?: string | null
          titulo: string
          updated_at?: string
          valor?: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          estagio?: string
          fechada_em?: string | null
          id?: string
          lead_id?: string | null
          motivo_perda?: string | null
          observacoes?: string | null
          plano_id?: string | null
          previsao_fechamento?: string | null
          probabilidade?: number
          sistema_id?: string | null
          titulo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "manager_oportunidades_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "manager_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_oportunidades_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "manager_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_oportunidades_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "manager_planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_oportunidades_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "manager_sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_planos: {
        Row: {
          ativo: boolean
          badge: string | null
          botao_destaque: string | null
          cor: string | null
          created_at: string
          descricao: string | null
          destaque: boolean
          id: string
          limites: Json
          nome: string
          ordem: number
          preco_anual: number
          preco_mensal: number
          recomendado: boolean
          recursos: Json
          sistema_id: string
          slug: string
          texto_comercial: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          badge?: string | null
          botao_destaque?: string | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          id?: string
          limites?: Json
          nome: string
          ordem?: number
          preco_anual?: number
          preco_mensal?: number
          recomendado?: boolean
          recursos?: Json
          sistema_id: string
          slug: string
          texto_comercial?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          badge?: string | null
          botao_destaque?: string | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          id?: string
          limites?: Json
          nome?: string
          ordem?: number
          preco_anual?: number
          preco_mensal?: number
          recomendado?: boolean
          recursos?: Json
          sistema_id?: string
          slug?: string
          texto_comercial?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_planos_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "manager_sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_scraper_auto_config: {
        Row: {
          ativo: boolean
          created_at: string
          enriquecer: boolean
          id: string
          limite_por_busca: number
          score_min: number
          sistemas_ids: string[]
          ufs: string[]
          ultima_execucao: string | null
          ultimo_sistema_id: string | null
          ultimo_uf: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          enriquecer?: boolean
          id?: string
          limite_por_busca?: number
          score_min?: number
          sistemas_ids?: string[]
          ufs?: string[]
          ultima_execucao?: string | null
          ultimo_sistema_id?: string | null
          ultimo_uf?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          enriquecer?: boolean
          id?: string
          limite_por_busca?: number
          score_min?: number
          sistemas_ids?: string[]
          ufs?: string[]
          ultima_execucao?: string | null
          ultimo_sistema_id?: string | null
          ultimo_uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      manager_scraper_buscas: {
        Row: {
          automatica: boolean
          cancelada: boolean
          cidade: string | null
          cidade_atual: string | null
          cidades_processadas: number
          contadores: Json
          created_at: string
          criado_por: string | null
          erro: string | null
          escopo: string
          estado: string | null
          finalizado_em: string | null
          id: string
          iniciado_em: string | null
          latitude: number | null
          longitude: number | null
          nichos: string[]
          query_final: string
          raio_km: number | null
          rede: string
          sistema_id: string | null
          status: string
          termo_extra: string | null
          tipo_negocio: string
          total_cidades: number
          total_resultados: number
          uf: string | null
          updated_at: string
        }
        Insert: {
          automatica?: boolean
          cancelada?: boolean
          cidade?: string | null
          cidade_atual?: string | null
          cidades_processadas?: number
          contadores?: Json
          created_at?: string
          criado_por?: string | null
          erro?: string | null
          escopo?: string
          estado?: string | null
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string | null
          latitude?: number | null
          longitude?: number | null
          nichos?: string[]
          query_final: string
          raio_km?: number | null
          rede?: string
          sistema_id?: string | null
          status?: string
          termo_extra?: string | null
          tipo_negocio: string
          total_cidades?: number
          total_resultados?: number
          uf?: string | null
          updated_at?: string
        }
        Update: {
          automatica?: boolean
          cancelada?: boolean
          cidade?: string | null
          cidade_atual?: string | null
          cidades_processadas?: number
          contadores?: Json
          created_at?: string
          criado_por?: string | null
          erro?: string | null
          escopo?: string
          estado?: string | null
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string | null
          latitude?: number | null
          longitude?: number | null
          nichos?: string[]
          query_final?: string
          raio_km?: number | null
          rede?: string
          sistema_id?: string | null
          status?: string
          termo_extra?: string | null
          tipo_negocio?: string
          total_cidades?: number
          total_resultados?: number
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_scraper_buscas_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "manager_sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_scraper_cidades: {
        Row: {
          ativa: boolean
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          populacao: number | null
          uf: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          populacao?: number | null
          uf: string
        }
        Update: {
          ativa?: boolean
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string
          populacao?: number | null
          uf?: string
        }
        Relationships: []
      }
      manager_scraper_leads: {
        Row: {
          avaliacao: number | null
          busca_id: string | null
          capturado_em: string
          categoria: string | null
          cidade: string | null
          created_at: string
          email: string | null
          endereco: string | null
          enviado_crm: boolean
          facebook: string | null
          google_maps_url: string | null
          google_place_id: string | null
          hash_dedupe: string
          horario_funcionamento: Json | null
          id: string
          instagram: string | null
          lead_id: string | null
          linkedin: string | null
          metadata: Json
          nome: string
          origem: string
          score: number
          sistema_id: string | null
          telefone: string | null
          total_avaliacoes: number | null
          uf: string | null
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          avaliacao?: number | null
          busca_id?: string | null
          capturado_em?: string
          categoria?: string | null
          cidade?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          enviado_crm?: boolean
          facebook?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          hash_dedupe: string
          horario_funcionamento?: Json | null
          id?: string
          instagram?: string | null
          lead_id?: string | null
          linkedin?: string | null
          metadata?: Json
          nome: string
          origem?: string
          score?: number
          sistema_id?: string | null
          telefone?: string | null
          total_avaliacoes?: number | null
          uf?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          avaliacao?: number | null
          busca_id?: string | null
          capturado_em?: string
          categoria?: string | null
          cidade?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          enviado_crm?: boolean
          facebook?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          hash_dedupe?: string
          horario_funcionamento?: Json | null
          id?: string
          instagram?: string | null
          lead_id?: string | null
          linkedin?: string | null
          metadata?: Json
          nome?: string
          origem?: string
          score?: number
          sistema_id?: string | null
          telefone?: string | null
          total_avaliacoes?: number | null
          uf?: string | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_scraper_leads_busca_id_fkey"
            columns: ["busca_id"]
            isOneToOne: false
            referencedRelation: "manager_scraper_buscas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_scraper_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "manager_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_scraper_leads_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "manager_sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_scraper_nichos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          ordem: number
          sistema_id: string
          slug: string
          termos: string[]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          sistema_id: string
          slug: string
          termos?: string[]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          sistema_id?: string
          slug?: string
          termos?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_scraper_nichos_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "manager_sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_scraper_resultados: {
        Row: {
          busca_id: string
          created_at: string
          dominio: string | null
          email: string | null
          id: string
          importado: boolean
          lead_id: string | null
          metadata: Json
          nome: string | null
          rede: string | null
          snippet: string | null
          telefone: string | null
          titulo: string | null
          url: string
        }
        Insert: {
          busca_id: string
          created_at?: string
          dominio?: string | null
          email?: string | null
          id?: string
          importado?: boolean
          lead_id?: string | null
          metadata?: Json
          nome?: string | null
          rede?: string | null
          snippet?: string | null
          telefone?: string | null
          titulo?: string | null
          url: string
        }
        Update: {
          busca_id?: string
          created_at?: string
          dominio?: string | null
          email?: string | null
          id?: string
          importado?: boolean
          lead_id?: string | null
          metadata?: Json
          nome?: string | null
          rede?: string | null
          snippet?: string | null
          telefone?: string | null
          titulo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_scraper_resultados_busca_id_fkey"
            columns: ["busca_id"]
            isOneToOne: false
            referencedRelation: "manager_scraper_buscas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_scraper_resultados_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "manager_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_segmentos: {
        Row: {
          created_at: string
          descricao: string | null
          filtros: Json
          id: string
          nome: string
          tipo: string
          total_contatos: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          filtros?: Json
          id?: string
          nome: string
          tipo?: string
          total_contatos?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          filtros?: Json
          id?: string
          nome?: string
          tipo?: string
          total_contatos?: number
          updated_at?: string
        }
        Relationships: []
      }
      manager_sistemas: {
        Row: {
          ativo: boolean
          atualizado_em: string | null
          checkout_url: string | null
          configuracoes: Json
          cor: string | null
          cores: Json | null
          created_at: string
          descricao: string | null
          dominio: string | null
          id: string
          logo_url: string | null
          nome: string
          pitch_comercial: string | null
          slug: string
          suporte_email: string | null
          suporte_whatsapp: string | null
          trial_dias: number | null
          updated_at: string
          url: string | null
          versao: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string | null
          checkout_url?: string | null
          configuracoes?: Json
          cor?: string | null
          cores?: Json | null
          created_at?: string
          descricao?: string | null
          dominio?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          pitch_comercial?: string | null
          slug: string
          suporte_email?: string | null
          suporte_whatsapp?: string | null
          trial_dias?: number | null
          updated_at?: string
          url?: string | null
          versao?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string | null
          checkout_url?: string | null
          configuracoes?: Json
          cor?: string | null
          cores?: Json | null
          created_at?: string
          descricao?: string | null
          dominio?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          pitch_comercial?: string | null
          slug?: string
          suporte_email?: string | null
          suporte_whatsapp?: string | null
          trial_dias?: number | null
          updated_at?: string
          url?: string | null
          versao?: string | null
        }
        Relationships: []
      }
      manager_ticket_mensagens: {
        Row: {
          autor_id: string | null
          autor_nome: string | null
          autor_tipo: string
          created_at: string
          id: string
          interna: boolean
          mensagem: string
          ticket_id: string
        }
        Insert: {
          autor_id?: string | null
          autor_nome?: string | null
          autor_tipo?: string
          created_at?: string
          id?: string
          interna?: boolean
          mensagem: string
          ticket_id: string
        }
        Update: {
          autor_id?: string | null
          autor_nome?: string | null
          autor_tipo?: string
          created_at?: string
          id?: string
          interna?: boolean
          mensagem?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_ticket_mensagens_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "manager_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_tickets: {
        Row: {
          assunto: string
          canal: string
          categoria: string
          cliente_id: string | null
          created_at: string
          descricao: string | null
          empresa_id: string | null
          fechado_em: string | null
          id: string
          numero: number
          prioridade: string
          responsavel_id: string | null
          sistema_id: string | null
          solicitante_email: string | null
          solicitante_id: string | null
          solicitante_nome: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assunto: string
          canal?: string
          categoria?: string
          cliente_id?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          fechado_em?: string | null
          id?: string
          numero?: number
          prioridade?: string
          responsavel_id?: string | null
          sistema_id?: string | null
          solicitante_email?: string | null
          solicitante_id?: string | null
          solicitante_nome?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assunto?: string
          canal?: string
          categoria?: string
          cliente_id?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          fechado_em?: string | null
          id?: string
          numero?: number
          prioridade?: string
          responsavel_id?: string | null
          sistema_id?: string | null
          solicitante_email?: string | null
          solicitante_id?: string | null
          solicitante_nome?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_tickets_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "manager_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_tickets_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "manager_sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_transacoes: {
        Row: {
          categoria: string | null
          cliente_id: string | null
          cobranca_id: string | null
          created_at: string
          data: string
          descricao: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          cliente_id?: string | null
          cobranca_id?: string | null
          created_at?: string
          data?: string
          descricao: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          tipo: string
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          cliente_id?: string | null
          cobranca_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "manager_transacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "manager_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_transacoes_cobranca_id_fkey"
            columns: ["cobranca_id"]
            isOneToOne: false
            referencedRelation: "manager_cobrancas"
            referencedColumns: ["id"]
          },
        ]
      }
      membros: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      mesas: {
        Row: {
          area: string | null
          capacidade: number
          created_at: string
          empresa_id: string
          id: string
          numero: string
          qrcode_url: string | null
          status: Database["public"]["Enums"]["status_mesa"]
          updated_at: string
        }
        Insert: {
          area?: string | null
          capacidade?: number
          created_at?: string
          empresa_id: string
          id?: string
          numero: string
          qrcode_url?: string | null
          status?: Database["public"]["Enums"]["status_mesa"]
          updated_at?: string
        }
        Update: {
          area?: string | null
          capacidade?: number
          created_at?: string
          empresa_id?: string
          id?: string
          numero?: string
          qrcode_url?: string | null
          status?: Database["public"]["Enums"]["status_mesa"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mesas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentos_estoque: {
        Row: {
          created_at: string
          custo_unitario: number | null
          empresa_id: string
          id: string
          insumo_id: string
          motivo: string | null
          quantidade: number
          referencia: string | null
          tipo: Database["public"]["Enums"]["tipo_movimento"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          custo_unitario?: number | null
          empresa_id: string
          id?: string
          insumo_id: string
          motivo?: string | null
          quantidade: number
          referencia?: string | null
          tipo: Database["public"]["Enums"]["tipo_movimento"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          custo_unitario?: number | null
          empresa_id?: string
          id?: string
          insumo_id?: string
          motivo?: string | null
          quantidade?: number
          referencia?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimento"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_estoque_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_estoque_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          autorizacao: string | null
          bandeira: string | null
          caixa_id: string | null
          comanda_id: string | null
          created_at: string
          empresa_id: string
          id: string
          metodo: Database["public"]["Enums"]["metodo_pagamento"]
          troco: number
          user_id: string | null
          valor: number
        }
        Insert: {
          autorizacao?: string | null
          bandeira?: string | null
          caixa_id?: string | null
          comanda_id?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          metodo: Database["public"]["Enums"]["metodo_pagamento"]
          troco?: number
          user_id?: string | null
          valor: number
        }
        Update: {
          autorizacao?: string | null
          bandeira?: string | null
          caixa_id?: string | null
          comanda_id?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_pagamento"]
          troco?: number
          user_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_compra: {
        Row: {
          assunto: string | null
          corpo_email: string | null
          created_at: string
          criado_por: string | null
          email_destinatario: string | null
          empresa_id: string
          entrega_prevista: string | null
          enviado_em: string | null
          fornecedor_id: string
          id: string
          numero: number
          observacao: string | null
          status: Database["public"]["Enums"]["status_pedido_compra"]
          total: number
          updated_at: string
        }
        Insert: {
          assunto?: string | null
          corpo_email?: string | null
          created_at?: string
          criado_por?: string | null
          email_destinatario?: string | null
          empresa_id: string
          entrega_prevista?: string | null
          enviado_em?: string | null
          fornecedor_id: string
          id?: string
          numero?: number
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_pedido_compra"]
          total?: number
          updated_at?: string
        }
        Update: {
          assunto?: string | null
          corpo_email?: string | null
          created_at?: string
          criado_por?: string | null
          email_destinatario?: string | null
          empresa_id?: string
          entrega_prevista?: string | null
          enviado_em?: string | null
          fornecedor_id?: string
          id?: string
          numero?: number
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_pedido_compra"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          nome: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          categoria_id: string | null
          cmv_percentual: number | null
          codigo: string | null
          created_at: string
          custo: number
          descricao: string | null
          destaque: boolean
          disponivel: boolean
          empresa_id: string
          id: string
          imagem_url: string | null
          nome: string
          preco_venda: number
          tags: string[] | null
          tempo_preparo_min: number | null
          updated_at: string
        }
        Insert: {
          categoria_id?: string | null
          cmv_percentual?: number | null
          codigo?: string | null
          created_at?: string
          custo?: number
          descricao?: string | null
          destaque?: boolean
          disponivel?: boolean
          empresa_id: string
          id?: string
          imagem_url?: string | null
          nome: string
          preco_venda?: number
          tags?: string[] | null
          tempo_preparo_min?: number | null
          updated_at?: string
        }
        Update: {
          categoria_id?: string | null
          cmv_percentual?: number | null
          codigo?: string | null
          created_at?: string
          custo?: number
          descricao?: string | null
          destaque?: boolean
          disponivel?: boolean
          empresa_id?: string
          id?: string
          imagem_url?: string | null
          nome?: string
          preco_venda?: number
          tags?: string[] | null
          tempo_preparo_min?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      promocao_produtos: {
        Row: {
          created_at: string
          id: string
          produto_id: string
          promocao_id: string
          quantidade: number
        }
        Insert: {
          created_at?: string
          id?: string
          produto_id: string
          promocao_id: string
          quantidade?: number
        }
        Update: {
          created_at?: string
          id?: string
          produto_id?: string
          promocao_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "promocao_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promocao_produtos_promocao_id_fkey"
            columns: ["promocao_id"]
            isOneToOne: false
            referencedRelation: "promocoes"
            referencedColumns: ["id"]
          },
        ]
      }
      promocoes: {
        Row: {
          ativa: boolean
          created_at: string
          criada_por: string | null
          descricao: string | null
          empresa_id: string
          fim_em: string | null
          id: string
          inicio_em: string | null
          nome: string
          preco_combo: number | null
          tipo: Database["public"]["Enums"]["tipo_promocao"]
          updated_at: string
          valor: number
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          criada_por?: string | null
          descricao?: string | null
          empresa_id: string
          fim_em?: string | null
          id?: string
          inicio_em?: string | null
          nome: string
          preco_combo?: number | null
          tipo?: Database["public"]["Enums"]["tipo_promocao"]
          updated_at?: string
          valor?: number
        }
        Update: {
          ativa?: boolean
          created_at?: string
          criada_por?: string | null
          descricao?: string | null
          empresa_id?: string
          fim_em?: string | null
          id?: string
          inicio_em?: string | null
          nome?: string
          preco_combo?: number | null
          tipo?: Database["public"]["Enums"]["tipo_promocao"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "promocoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      receitas: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          modo_preparo: string
          observacoes: string | null
          produto_id: string
          rendimento: string | null
          tempo_preparo_min: number | null
          updated_at: string
          utensilios: Json
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          modo_preparo?: string
          observacoes?: string | null
          produto_id: string
          rendimento?: string | null
          tempo_preparo_min?: number | null
          updated_at?: string
          utensilios?: Json
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          modo_preparo?: string
          observacoes?: string | null
          produto_id?: string
          rendimento?: string | null
          tempo_preparo_min?: number | null
          updated_at?: string
          utensilios?: Json
        }
        Relationships: [
          {
            foreignKeyName: "receitas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receitas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: true
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          criado_em: string
          criado_por: string | null
          user_id: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          user_id: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      amt_admin_check_rate_limit: {
        Args: { _email: string; _ip: string }
        Returns: boolean
      }
      has_company_role: {
        Args: {
          _empresa_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: {
        Args: { _empresa_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_member: {
        Args: { _empresa_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      recalcular_comanda: { Args: { _comanda_id: string }; Returns: undefined }
      recalcular_custo_produto: {
        Args: { _produto_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "gerencia" | "garcom" | "caixa" | "cozinha"
      assinatura_status: "trial" | "ativa" | "vencida" | "cancelada"
      metodo_pagamento:
        | "dinheiro"
        | "debito"
        | "credito"
        | "pix"
        | "vale"
        | "outros"
      status_caixa: "aberta" | "fechada"
      status_comanda: "aberta" | "fechada" | "cancelada" | "em_pagamento"
      status_item:
        | "pendente"
        | "preparando"
        | "pronto"
        | "entregue"
        | "cancelado"
      status_mesa: "livre" | "ocupada" | "reservada" | "manutencao"
      status_pedido_compra:
        | "rascunho"
        | "enviado"
        | "confirmado"
        | "recebido"
        | "cancelado"
      tipo_lancamento: "receita" | "despesa"
      tipo_movimento: "entrada" | "saida" | "ajuste" | "perda" | "transferencia"
      tipo_promocao: "percentual" | "valor_fixo" | "combo"
      unidade_medida: "un" | "kg" | "g" | "l" | "ml" | "dz" | "cx" | "pct"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "gerencia", "garcom", "caixa", "cozinha"],
      assinatura_status: ["trial", "ativa", "vencida", "cancelada"],
      metodo_pagamento: [
        "dinheiro",
        "debito",
        "credito",
        "pix",
        "vale",
        "outros",
      ],
      status_caixa: ["aberta", "fechada"],
      status_comanda: ["aberta", "fechada", "cancelada", "em_pagamento"],
      status_item: [
        "pendente",
        "preparando",
        "pronto",
        "entregue",
        "cancelado",
      ],
      status_mesa: ["livre", "ocupada", "reservada", "manutencao"],
      status_pedido_compra: [
        "rascunho",
        "enviado",
        "confirmado",
        "recebido",
        "cancelado",
      ],
      tipo_lancamento: ["receita", "despesa"],
      tipo_movimento: ["entrada", "saida", "ajuste", "perda", "transferencia"],
      tipo_promocao: ["percentual", "valor_fixo", "combo"],
      unidade_medida: ["un", "kg", "g", "l", "ml", "dz", "cx", "pct"],
    },
  },
} as const
