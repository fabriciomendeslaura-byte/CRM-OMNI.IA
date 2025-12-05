import React, { useState } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { Card, Button, Input, Modal, Select } from '../components/UIComponents';
import { User } from '../types';
import { Edit2, Shield, AlertTriangle, UserCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Admin: React.FC = () => {
  const { users, currentUser, updateUser } = useCRM();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  const handleOpenEdit = (user: User) => {
    setEditingUser({ ...user });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.name || !editingUser?.id) return;

    // Atualiza apenas Nome e Papel
    updateUser(editingUser as User);
    
    setIsModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="space-y-8">
       <div className="flex justify-between items-end">
         <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Gestão de Usuários</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">Controle de acesso e equipe.</p>
         </div>
       </div>

       <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200/50 dark:border-amber-800/30 p-5 rounded-2xl flex items-start gap-4 text-amber-900 dark:text-amber-100 shadow-sm">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
             <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm mb-1">Aviso de Sistema</h4>
            <p className="text-sm opacity-90 leading-relaxed">
              A criação de novos usuários e a exclusão de contas são gerenciadas diretamente no banco de dados central. 
              Utilize esta tela para atualizar nomes ou alterar níveis de privilégio (Admin/Vendedor).
            </p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {users.map((user) => (
           <Card key={user.id} className="p-6 group hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
             <div className="flex items-start justify-between mb-6">
               <div className="flex items-center gap-4">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner ${
                    user.role === 'admin' 
                    ? 'bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-600 dark:text-purple-300' 
                    : 'bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30 text-blue-600 dark:text-blue-300'
                 }`}>
                    {user.name.charAt(0)}
                 </div>
                 <div>
                   <h3 className="font-bold text-zinc-900 dark:text-white text-lg">{user.name}</h3>
                   <p className="text-xs text-zinc-500">{user.email}</p>
                 </div>
               </div>
             </div>
             
             <div className="flex items-center justify-between mt-4">
               <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                 user.role === 'admin' 
                 ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' 
                 : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
               }`}>
                 {user.role === 'admin' ? 'Administrador' : 'Vendedor'}
               </span>
               <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(user)} className="text-zinc-400 hover:text-indigo-600">
                 <Edit2 className="w-4 h-4 mr-1" /> Editar
               </Button>
             </div>
           </Card>
         ))}
       </div>

       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar Usuário">
         <form onSubmit={handleSubmit} className="space-y-5">
           <div className="space-y-1">
             <label className="text-xs font-medium text-zinc-500">Nome</label>
             <Input 
                placeholder="Nome" 
                value={editingUser?.name || ''} 
                onChange={e => setEditingUser(p => ({...p, name: e.target.value}))} 
                required 
             />
           </div>
           
           <div className="space-y-1">
             <label className="text-xs font-medium text-zinc-500">Email (Somente leitura)</label>
             <Input 
                value={editingUser?.email || ''} 
                disabled 
                className="opacity-70 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
             />
           </div>

           <div className="space-y-1">
             <label className="text-xs font-medium text-zinc-500">Nível de Acesso</label>
             <Select value={editingUser?.role || 'vendedor'} onChange={e => setEditingUser(p => ({...p, role: e.target.value as any}))}>
               <option value="vendedor">Vendedor</option>
               <option value="admin">Administrador</option>
             </Select>
           </div>
           
           <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-xl mt-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-snug">
                <strong>Nota:</strong> Administradores possuem acesso irrestrito a todos os leads, configurações e dados da empresa.
              </p>
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
             <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
             <Button type="submit" className="shadow-lg shadow-indigo-500/20">Salvar Alterações</Button>
           </div>
         </form>
       </Modal>
    </div>
  );
};

export default Admin;