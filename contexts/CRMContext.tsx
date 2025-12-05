import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Lead, User, PipelineStage } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

interface CRMContextType {
  users: User[];
  leads: Lead[];
  currentUser: User | null;
  isLoading: boolean;
  isOnline: boolean;
  setCurrentUser: (user: User) => void;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'companyId'>) => void;
  updateLead: (lead: Lead) => void;
  deleteLead: (id: string) => void;
  moveLeadStage: (id: string, stage: PipelineStage) => void;
  exportCSV: (filteredLeads: Lead[]) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};

export const CRMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const { addToast } = useToast();

  // --- Mappers (Schema: snake_case <-> Frontend: camelCase) ---
  
  const mapLeadFromDB = (data: any): Lead => {
    if (!data) return {} as Lead;
    return {
      id: data.id?.toString(),
      name: data.nome || 'Sem nome',
      company: data.empresa || '',
      email: data.email || '',
      phone: data.telefone || '',
      source: data.origem,
      value: Number(data.valor) || 0,
      createdAt: data.data_criacao || data.created_at || new Date().toISOString(),
      stage: data.etapa_pipeline as PipelineStage,
      ownerId: data.responsavel_id,
      notes: data.observacoes || '',
      companyId: data.company_id
    };
  };

  const mapLeadToDB = (lead: any) => {
    return {
      company_id: lead.companyId,
      nome: lead.name,
      responsavel_id: lead.ownerId,
      etapa_pipeline: lead.stage,
      empresa: lead.company || null,
      email: lead.email || null,
      telefone: lead.phone || null,
      origem: lead.source, 
      valor: lead.value || 0,
      observacoes: lead.notes || null,
    };
  };

  const mapUserFromDB = (data: any): User => ({
    id: data.id,
    authUserId: data.auth_user_id,
    name: data.nome,
    email: data.email,
    role: data.papel,
    companyId: data.company_id,
    isActive: data.is_active
  });

  // --- Auth Logic ---

  const checkSession = async (): Promise<User | null> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (session?.user) {
        const { data: userProfile, error: profileError } = await supabase
          .from('crm_users')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single();
        
        if (profileError) {
          console.error("Erro ao buscar perfil:", JSON.stringify(profileError, null, 2));
          
          if (profileError.code === '42P17') {
             await supabase.auth.signOut();
             setCurrentUser(null);
             throw new Error("ERRO DE BANCO (RLS): Copie e rode o arquivo fix_rls_recursion.sql no Supabase.");
          }

          if (profileError.code === 'PGRST116') {
             await supabase.auth.signOut();
             setCurrentUser(null);
             throw new Error("Perfil não encontrado: Contate o suporte.");
          }
          return null;
        }

        if (userProfile) {
          if (!userProfile.is_active) {
             await supabase.auth.signOut();
             setCurrentUser(null);
             throw new Error("Conta desativada.");
          }

          const mappedUser = mapUserFromDB(userProfile);
          setCurrentUser(mappedUser);
          await fetchData(mappedUser);
          return mappedUser;
        }
      }
      return null;
    } catch (error: any) {
      console.error("Erro na sessão:", error.message);
      if (error.message?.includes('RLS') || error.message?.includes('Perfil') || error.message?.includes('Conta')) {
         throw error;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) throw error;
      
      const user = await checkSession();
      if (!user) {
         throw new Error("Não foi possível carregar o perfil do usuário.");
      }
    } catch (error: any) {
      console.error("Login catch:", error.message);
      
      if (error.message?.includes('RLS')) {
         addToast({ 
            title: 'Erro de Configuração (42P17)', 
            description: 'Execute o script fix_rls_recursion.sql no Supabase.', 
            type: 'error' 
         });
      } else if (error.message?.includes('Perfil não encontrado')) {
         addToast({ title: 'Acesso Negado', description: 'Usuário sem perfil no CRM.', type: 'error' });
      } else if (error.message?.includes('Conta desativada')) {
         addToast({ title: 'Acesso Negado', description: 'Sua conta está inativa.', type: 'error' });
      } else if (error.status === 400 || error.message === 'Invalid login credentials') {
         addToast({ title: 'Falha no Login', description: 'Email ou senha incorretos.', type: 'error' });
      } else {
         addToast({ title: 'Erro ao entrar', description: error.message, type: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setLeads([]);
    setUsers([]);
  };

  // --- Data Logic (Multi-Tenant) ---

  const fetchData = async (userOverride?: User) => {
    const userToUse = userOverride || currentUser;
    if (!userToUse || !userToUse.companyId) return;

    try {
      const { data: usersData, error: usersError } = await supabase
        .from('crm_users')
        .select('*')
        .eq('company_id', userToUse.companyId)
        .order('nome');
      
      if (usersError) throw usersError;
      if (usersData) setUsers(usersData.map(mapUserFromDB));

      let leadsQuery = supabase
        .from('crm_leads')
        .select('*')
        .eq('company_id', userToUse.companyId)
        .order('data_criacao', { ascending: false });

      if (userToUse.role === 'vendedor') {
        leadsQuery = leadsQuery.eq('responsavel_id', userToUse.id);
      }

      const { data: leadsData, error: leadsError } = await leadsQuery;

      if (leadsError) throw leadsError;

      if (leadsData) {
        setLeads(leadsData.map(mapLeadFromDB));
      } else {
        setLeads([]);
      }

      setIsOnline(true);
    } catch (error: any) {
      console.error("Erro fetchData:", error);
      if (error.code === '42P17') {
         addToast({ title: 'Erro Crítico de Dados', description: 'Recursão RLS. Execute fix_rls_recursion.sql.', type: 'error' });
      } else {
         addToast({ title: 'Erro de Conexão', description: 'Falha ao sincronizar dados.', type: 'error' });
      }
      setIsOnline(false);
    }
  };

  useEffect(() => {
    checkSession().catch(err => console.error("Session check init failed:", err));
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
       if (event === 'SIGNED_OUT') {
         setCurrentUser(null);
         setLeads([]);
         setUsers([]);
       }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- CRUD Actions ---

  const updateUser = async (updatedUser: User) => {
    if (currentUser?.role !== 'admin') return;
    if (updatedUser.companyId !== currentUser.companyId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('crm_users').update({
          nome: updatedUser.name,
          papel: updatedUser.role
        }).eq('id', updatedUser.id);
      
      if (error) throw error;
      setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
      addToast({ title: 'Usuário atualizado', type: 'success' });
    } catch (e: any) {
      addToast({ title: 'Erro', description: e.message, type: 'error' });
    } finally { setIsLoading(false); }
  };

  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'companyId'>) => {
    if (!currentUser?.companyId) return;
    
    setIsLoading(true);
    try {
      const payload = { 
          ...leadData, 
          companyId: currentUser.companyId,
          ownerId: leadData.ownerId || currentUser.id
      };
      
      const dbPayload = mapLeadToDB(payload);
      
      const { data, error } = await supabase
        .from('crm_leads')
        .insert([dbPayload])
        .select();
      
      if (error) throw error;
      
      if (data) {
        setLeads(prev => [mapLeadFromDB(data[0]), ...prev]);
        addToast({ title: 'Lead Criado', type: 'success' });
      }
    } catch (e: any) {
      console.error(e);
      addToast({ title: 'Erro ao criar lead', description: e.message, type: 'error' });
    } finally { setIsLoading(false); }
  };

  const updateLead = async (updatedLead: Lead) => {
    if (currentUser?.role === 'vendedor' && updatedLead.ownerId !== currentUser.id) {
        addToast({ title: 'Acesso Negado', description: 'Você só pode editar seus leads.', type: 'error' });
        return;
    }

    setLeads(prev => prev.map(l => (l.id === updatedLead.id ? updatedLead : l)));
    
    try {
      const dbPayload = mapLeadToDB(updatedLead);
      const { error } = await supabase.from('crm_leads').update(dbPayload).eq('id', updatedLead.id);
      if (error) throw error;
      addToast({ title: 'Lead salvo', type: 'success' });
    } catch (e: any) {
      console.error(e);
      addToast({ title: 'Erro ao salvar', description: e.message, type: 'error' });
      fetchData();
    }
  };

  const deleteLead = async (id: string) => {
    const leadToDelete = leads.find(l => l.id === id);
    if (!leadToDelete) return;

    // Permissão: Admin OU Dono do Lead
    if (currentUser?.role !== 'admin' && leadToDelete.ownerId !== currentUser?.id) {
        addToast({ title: 'Permissão Negada', description: 'Você só pode excluir seus próprios leads.', type: 'error' });
        return;
    }

    const backup = [...leads];
    setLeads(prev => prev.filter(l => l.id !== id));
    
    try {
      const { error } = await supabase.from('crm_leads').delete().eq('id', id);
      if (error) throw error;
      addToast({ title: 'Lead removido', type: 'success' });
    } catch (e: any) {
      setLeads(backup);
      addToast({ title: 'Erro ao remover', description: e.message, type: 'error' });
    }
  };

  const moveLeadStage = async (id: string, stage: PipelineStage) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    if (currentUser?.role === 'vendedor' && lead.ownerId !== currentUser.id) {
         addToast({ title: 'Bloqueado', description: 'Este lead não é seu.', type: 'error' });
         return;
    }

    const updatedLead = { ...lead, stage };
    setLeads(prev => prev.map(l => (l.id === id ? updatedLead : l)));

    try {
      const { error } = await supabase
        .from('crm_leads')
        .update({ etapa_pipeline: stage })
        .eq('id', id);

      if (error) throw error;
    } catch (e: any) {
      setLeads(prev => prev.map(l => (l.id === id ? lead : l)));
      addToast({ title: 'Erro ao mover', description: e.message, type: 'error' });
    }
  };

  const exportCSV = (filteredLeads: Lead[]) => {
      const headers = ['Nome', 'Empresa', 'Email', 'Telefone', 'Origem', 'Status', 'Valor', 'Responsável', 'Data Criação'];
      const rows = filteredLeads.map(l => {
        const owner = users.find(u => u.id === l.ownerId)?.name || 'N/A';
        return [
          `"${l.name}"`, `"${l.company}"`, `"${l.email}"`, `"${l.phone}"`, 
          `"${l.source}"`, `"${l.stage}"`, l.value, `"${owner}"`, 
          new Date(l.createdAt).toLocaleDateString()
        ].join(',');
      });
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leads_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <CRMContext.Provider
      value={{
        users, leads, currentUser, isLoading, isOnline,
        setCurrentUser, signIn, signOut,
        updateUser,
        addLead, updateLead, deleteLead, moveLeadStage, exportCSV,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};