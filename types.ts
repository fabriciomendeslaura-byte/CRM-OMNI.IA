
export type Role = 'admin' | 'vendedor';

export interface User {
  id: number; // bigint in DB (crm_users.id)
  authUserId: string; // uuid in DB (crm_users.auth_user_id)
  name: string; // crm_users.nome
  email: string; // crm_users.email
  role: Role; // crm_users.papel (enum)
  companyId: number; // crm_users.company_id
  isActive: boolean; // crm_users.is_active
}

// Database Enum: lead_stage
export enum PipelineStage {
  NOVO = 'novo_lead',
  EM_ATENDIMENTO = 'em_atendimento',
  REUNIAO_AGENDADA = 'reuniao_marcada',
  VENDA_FEITA = 'venda_feita',
  FOLLOW_UP = 'follow_up',
  PERDIDO = 'perdido',
}

export const PipelineStageLabels: Record<PipelineStage, string> = {
  [PipelineStage.NOVO]: 'Novo Lead',
  [PipelineStage.EM_ATENDIMENTO]: 'Em Atendimento',
  [PipelineStage.REUNIAO_AGENDADA]: 'Reunião Marcada',
  [PipelineStage.VENDA_FEITA]: 'Venda Feita',
  [PipelineStage.FOLLOW_UP]: 'Follow-up',
  [PipelineStage.PERDIDO]: 'Perdido',
};

// Database Enum: lead_origin
export enum LeadSource {
  FORMULARIO = 'formulario',
  WHATSAPP = 'whatsapp',
  REDES_SOCIAIS = 'redes_sociais',
  INDICACAO = 'indicacao',
  OUTROS = 'outros',
}

export const LeadSourceLabels: Record<LeadSource, string> = {
  [LeadSource.FORMULARIO]: 'Formulário',
  [LeadSource.WHATSAPP]: 'WhatsApp',
  [LeadSource.REDES_SOCIAIS]: 'Redes Sociais',
  [LeadSource.INDICACAO]: 'Indicação',
  [LeadSource.OUTROS]: 'Outros',
};

export interface Lead {
  id: string; // bigint in DB, string in Frontend
  name: string; // crm_leads.nome
  company: string; // crm_leads.empresa
  email: string; // crm_leads.email
  phone: string; // crm_leads.telefone
  source: LeadSource; // crm_leads.origem
  value: number; // crm_leads.valor (numeric)
  createdAt: string; // crm_leads.data_criacao
  stage: PipelineStage; // crm_leads.etapa_pipeline
  ownerId: number; // crm_leads.responsavel_id (FK -> crm_users.id)
  notes: string; // crm_leads.observacoes
  companyId: number; // crm_leads.company_id (FK -> crm_companies.id)
}

export type PeriodFilter = 'today' | '7days' | '30days' | 'total';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}
