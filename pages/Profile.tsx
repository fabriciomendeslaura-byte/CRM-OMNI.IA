import React from 'react';
import { useCRM } from '../contexts/CRMContext';
import { Card, Button } from '../components/UIComponents';
import { UserCircle, Mail, Briefcase, ShieldCheck, Star } from 'lucide-react';

const Profile: React.FC = () => {
  const { currentUser } = useCRM();

  return (
    <div className="max-w-3xl mx-auto space-y-8 pt-6">
      <div className="text-center relative">
         <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent -z-10"></div>
         <span className="bg-background px-4 text-zinc-400 text-sm font-medium uppercase tracking-widest">Configurações da Conta</span>
      </div>

      <Card className="overflow-hidden border-0 shadow-2xl shadow-indigo-500/10">
         {/* Header Background */}
         <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
            <div className="absolute top-10 left-10 w-20 h-20 bg-black/10 rounded-full blur-xl"></div>
         </div>

         <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-6 flex flex-col items-center">
               <div className="w-32 h-32 rounded-3xl bg-white dark:bg-zinc-900 p-2 shadow-xl">
                 <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-5xl font-bold text-indigo-600 dark:text-indigo-300">
                    {currentUser.name.charAt(0)}
                 </div>
               </div>
               <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mt-4">{currentUser.name}</h3>
               <div className="flex items-center gap-2 mt-1">
                 <span className="w-2 h-2 rounded-full bg-green-500"></span>
                 <span className="text-zinc-500 dark:text-zinc-400 font-medium capitalize">{currentUser.role}</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div className="flex items-start gap-4 p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group">
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-indigo-500 group-hover:scale-110 transition-transform">
                      <Mail className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-0.5">Email Corporativo</p>
                      <p className="text-zinc-900 dark:text-white font-medium">{currentUser.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-purple-200 dark:hover:border-purple-800 transition-colors group">
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-purple-500 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-0.5">Nível de Permissão</p>
                      <p className="text-zinc-900 dark:text-white font-medium capitalize">
                        {currentUser.role === 'admin' ? 'Administrador Total' : 'Vendedor'}
                      </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-amber-200 dark:hover:border-amber-800 transition-colors group">
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-amber-500 group-hover:scale-110 transition-transform">
                      <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-0.5">Identificador (ID)</p>
                      <p className="text-zinc-900 dark:text-white font-medium font-mono">#{currentUser.id}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors group">
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-emerald-500 group-hover:scale-110 transition-transform">
                      <Star className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-0.5">Status da Conta</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <p className="text-zinc-900 dark:text-white font-medium">Ativa e Verificada</p>
                      </div>
                  </div>
                </div>
            </div>
         </div>
      </Card>
      
      <div className="text-center">
         <p className="text-xs text-zinc-400 font-medium">CRM OMNI.IA v2.0 • Build 2024.10</p>
      </div>
    </div>
  );
};

export default Profile;