import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../contexts/CRMContext';
import { Button, Input, Card } from '../components/UIComponents';
import { BrainCircuit, Lock, Mail } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useCRM();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      addToast({ title: 'Bem-vindo de volta!', type: 'success' });
      navigate('/dashboard');
    } catch (error: any) {
      // Erro tratado no Context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20 mb-6 transform hover:scale-105 transition-transform duration-300">
            <BrainCircuit className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            CRM <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">OMNI.IA</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-lg">Inteligência para suas vendas</p>
        </div>

        <Card className="p-8 shadow-2xl border-zinc-200 dark:border-zinc-800 backdrop-blur-sm bg-surface/90">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input 
                  type="email" 
                  placeholder="seu@email.com" 
                  className="pl-9" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Senha</label>
                <a href="#" className="text-xs text-primary hover:text-primary-hover font-medium">Esqueceu a senha?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-9" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-none shadow-lg shadow-indigo-500/25" disabled={loading}>
              {loading ? 'Entrando...' : 'Acessar Sistema'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
             <p className="text-xs text-zinc-500 mb-2">Ainda não tem conta?</p>
             <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
               Solicite o acesso ao seu administrador
             </span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;