import React, { useState, DragEvent } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { PipelineStage, Lead, PipelineStageLabels, LeadSourceLabels, LeadSource } from '../types';
import { Badge, Button, Modal, Input, Select, Textarea } from '../components/UIComponents';
import { Plus, Eye, Edit2, Trash2, ExternalLink, MessageSquare, GripVertical, MoreHorizontal } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const Pipeline: React.FC = () => {
  const { leads, moveLeadStage, currentUser, users, addLead, updateLead, deleteLead } = useCRM();
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  const { addToast } = useToast();

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedLeadId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, stage: PipelineStage) => {
    e.preventDefault();
    if (draggedLeadId) {
      moveLeadStage(draggedLeadId, stage);
      setDraggedLeadId(null);
    }
  };

  const getLeadsByStage = (stage: PipelineStage) => {
    return leads.filter(l => l.stage === stage);
  };

  const getStageTotal = (stage: PipelineStage) => {
    return getLeadsByStage(stage).reduce((acc, curr) => acc + curr.value, 0);
  };

  const openCreate = () => {
    setFormData({
      source: LeadSource.FORMULARIO,
      stage: PipelineStage.NOVO,
      ownerId: currentUser.role === 'vendedor' ? currentUser.id : undefined,
      value: 0
    });
    setIsFormOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setFormData({ ...lead });
    setIsFormOpen(true);
  };

  const openDetail = (lead: Lead) => {
    setViewingLead(lead);
    setIsDetailOpen(true);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este lead?')) {
      deleteLead(id);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.name || formData.value === undefined) {
       addToast({title: "Erro", description: "Preencha nome e valor.", type: 'error'});
       return;
    }
    
    if (formData.id) {
      updateLead(formData as Lead);
    } else {
      addLead({
        name: formData.name,
        company: formData.company || '',
        email: formData.email || '',
        phone: formData.phone || '',
        value: Number(formData.value),
        source: formData.source || LeadSource.FORMULARIO,
        notes: formData.notes || '',
        stage: formData.stage || PipelineStage.NOVO,
        ownerId: currentUser.role === 'vendedor' ? currentUser.id : Number(formData.ownerId) || currentUser.id
      });
    }
    setIsFormOpen(false);
  };

  const copyWhatsApp = () => {
    if(viewingLead) {
        navigator.clipboard.writeText(`https://wa.me/${viewingLead.phone}`);
        addToast({ title: "Link Copiado", description: "Link do WhatsApp na área de transferência", type: 'success' });
    }
  };

  const sendFakeMessage = () => {
    if(viewingLead) {
        addToast({ title: "Mensagem enviada", description: `Olá ${viewingLead.name}, como podemos ajudar?`, type: 'success' });
    }
  };

  const changeDetailStage = (stage: PipelineStage) => {
     if(viewingLead) {
        updateLead({ ...viewingLead, stage });
        setViewingLead({ ...viewingLead, stage });
     }
  };

  const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { notation: "compact", maximumFractionDigits: 1 })}`;

  const orderedStages = [
    PipelineStage.NOVO,
    PipelineStage.EM_ATENDIMENTO,
    PipelineStage.REUNIAO_AGENDADA,
    PipelineStage.FOLLOW_UP,
    PipelineStage.VENDA_FEITA,
    PipelineStage.PERDIDO
  ];

  const getStageColor = (stage: PipelineStage) => {
     switch(stage) {
        case PipelineStage.NOVO: return 'from-blue-500 to-cyan-400';
        case PipelineStage.EM_ATENDIMENTO: return 'from-indigo-500 to-purple-500';
        case PipelineStage.REUNIAO_AGENDADA: return 'from-violet-500 to-fuchsia-500';
        case PipelineStage.FOLLOW_UP: return 'from-amber-400 to-orange-500';
        case PipelineStage.VENDA_FEITA: return 'from-emerald-400 to-green-500';
        case PipelineStage.PERDIDO: return 'from-red-500 to-rose-500';
        default: return 'from-zinc-400 to-zinc-500';
     }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-6 px-1">
        <div>
           <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Pipeline</h2>
           <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             {leads.length} Oportunidades ativas
           </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-lg shadow-indigo-500/20" size="md">
          <Plus className="w-4 h-4" /> Nova Oportunidade
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="h-full min-w-[1200px] grid grid-cols-6 gap-4 pb-4 px-1">
          {orderedStages.map((stage) => {
            const stageLeads = getLeadsByStage(stage);
            return (
              <div
                key={stage}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
                className="flex flex-col h-full rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30 backdrop-blur-sm border border-zinc-100 dark:border-zinc-800/50 transition-colors"
              >
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${getStageColor(stage)} shadow-sm`}></div>
                    <span className="bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold px-2 py-0.5 rounded-full border border-zinc-100 dark:border-zinc-700 shadow-sm">
                      {stageLeads.length}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wide truncate mb-1" title={PipelineStageLabels[stage]}>
                    {PipelineStageLabels[stage]}
                  </h3>
                  <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                     {formatCurrency(getStageTotal(stage))}
                  </div>
                </div>

                {/* Cards Area */}
                <div className="flex-1 px-2 pb-2 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => openDetail(lead)}
                      className="group relative bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 dark:hover:shadow-indigo-900/10 hover:-translate-y-1 transition-all duration-300 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1 rounded text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                          {LeadSourceLabels[lead.source]}
                        </div>
                        <button className="text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-200">
                           <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight mb-1 truncate">
                        {lead.name}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mb-3">
                        {lead.company || 'Sem empresa'}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-50 dark:border-zinc-800">
                           <span className={`text-sm font-bold ${
                             lead.stage === PipelineStage.VENDA_FEITA ? 'text-emerald-600 dark:text-emerald-400' : 
                             lead.stage === PipelineStage.PERDIDO ? 'text-red-500 dark:text-red-400' :
                             'text-zinc-700 dark:text-zinc-300'
                           }`}>
                             {formatCurrency(lead.value)}
                           </span>
                           
                           <div className="flex -space-x-2">
                             <div 
                                className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-zinc-900 shadow-sm"
                                title={users.find(u => u.id === lead.ownerId)?.name}
                             >
                               {users.find(u => u.id === lead.ownerId)?.name.charAt(0) || '?'}
                             </div>
                           </div>
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-zinc-900/90 backdrop-blur rounded-lg shadow-sm border border-zinc-100 dark:border-zinc-800 p-1 z-10 translate-x-2 group-hover:translate-x-0 transition-transform">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEdit(lead); }}
                          className="p-1.5 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {(currentUser.role === 'admin' || currentUser.id === lead.ownerId) && (
                          <button 
                            onClick={(e) => handleDelete(lead.id, e)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {stageLeads.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20 group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                      <span className="text-xs text-zinc-400 group-hover:text-indigo-500 transition-colors font-medium">Sem leads</span>
                      <Plus className="w-4 h-4 text-zinc-300 group-hover:text-indigo-400 mt-1" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formData.id ? "Editar Oportunidade" : "Nova Oportunidade"}>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1">
             <label className="text-xs font-medium text-zinc-500">Nome do Lead</label>
             <Input placeholder="Ex: João Silva" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required className="font-semibold text-lg" />
          </div>
          <Input placeholder="Empresa" value={formData.company || ''} onChange={e => setFormData({...formData, company: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
             <Input placeholder="Email" type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
             <Input placeholder="Telefone" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs text-zinc-500 mb-1.5 block font-medium">Valor Estimado (R$)</label>
               <Input placeholder="0,00" type="number" value={formData.value || ''} onChange={e => setFormData({...formData, value: Number(e.target.value)})} required />
             </div>
             <div>
               <label className="text-xs text-zinc-500 mb-1.5 block font-medium">Origem</label>
               <Select value={formData.source || LeadSource.FORMULARIO} onChange={e => setFormData({...formData, source: e.target.value as LeadSource})}>
                 {Object.values(LeadSource).map(s => <option key={s} value={s}>{LeadSourceLabels[s]}</option>)}
               </Select>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-xs text-zinc-500 mb-1.5 block font-medium">Etapa do Funil</label>
                <Select value={formData.stage || PipelineStage.NOVO} onChange={e => setFormData({...formData, stage: e.target.value as PipelineStage})}>
                    {Object.values(PipelineStage).map(s => <option key={s} value={s}>{PipelineStageLabels[s]}</option>)}
                </Select>
             </div>
             {currentUser.role === 'admin' && (
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block font-medium">Responsável</label>
                  <Select value={formData.ownerId || ''} onChange={e => setFormData({...formData, ownerId: Number(e.target.value)})}>
                    <option value="">Selecione...</option>
                    {users.filter(u => u.role === 'vendedor').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </Select>
                </div>
             )}
          </div>
          <div className="space-y-1">
             <label className="text-xs font-medium text-zinc-500">Observações</label>
             <Textarea placeholder="Detalhes importantes sobre a negociação..." value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="h-28" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button type="submit" className="shadow-lg shadow-indigo-500/20">Salvar Lead</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalhes do Lead">
        {viewingLead && (
          <div className="space-y-6">
            <div className="flex justify-between items-start bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
               <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{viewingLead.name}</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium">{viewingLead.company}</p>
               </div>
               <Badge variant="neutral" className="text-sm px-3 py-1 bg-white dark:bg-zinc-800 shadow-sm">{PipelineStageLabels[viewingLead.stage]}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
               <div className="p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                 <p className="text-zinc-400 text-xs uppercase font-bold mb-1 tracking-wider">Contato</p>
                 <p className="text-zinc-900 dark:text-white font-medium truncate" title={viewingLead.email}>{viewingLead.email || '-'}</p>
               </div>
               <div className="p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                 <p className="text-zinc-400 text-xs uppercase font-bold mb-1 tracking-wider">Telefone</p>
                 <p className="text-zinc-900 dark:text-white font-medium">{viewingLead.phone || '-'}</p>
               </div>
               <div className="p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                 <p className="text-zinc-400 text-xs uppercase font-bold mb-1 tracking-wider">Valor</p>
                 <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">R$ {viewingLead.value.toLocaleString()}</p>
               </div>
               <div className="p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                 <p className="text-zinc-400 text-xs uppercase font-bold mb-1 tracking-wider">Origem</p>
                 <div className="inline-block"><Badge variant="default">{LeadSourceLabels[viewingLead.source]}</Badge></div>
               </div>
            </div>

            <div className="space-y-2">
               <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider px-1">Observações</p>
               <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[100px]">
                  <p className="text-zinc-700 dark:text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">{viewingLead.notes || 'Nenhuma observação registrada.'}</p>
               </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex gap-3">
                 <Button className="flex-1 gap-2 border-green-200 hover:border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900" variant="outline" onClick={copyWhatsApp}><ExternalLink className="w-4 h-4" /> WhatsApp</Button>
                 <Button className="flex-1 gap-2 border-blue-200 hover:border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900" variant="outline" onClick={sendFakeMessage}><MessageSquare className="w-4 h-4" /> Script</Button>
              </div>
              {viewingLead.stage !== PipelineStage.VENDA_FEITA && viewingLead.stage !== PipelineStage.PERDIDO && (
                  <div className="flex gap-3 mt-2">
                    <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20 border-0" onClick={() => changeDetailStage(PipelineStage.VENDA_FEITA)}>Marcar Ganho</Button>
                    <Button className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/20 border-0" onClick={() => changeDetailStage(PipelineStage.PERDIDO)}>Marcar Perdido</Button>
                  </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Pipeline;