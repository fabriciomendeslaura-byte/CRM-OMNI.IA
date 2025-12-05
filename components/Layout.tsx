import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Trello, Users, UserCircle, Settings, BrainCircuit, Sun, Moon, Wifi, WifiOff, LogOut } from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { useTheme } from '../contexts/ThemeContext';

const Layout: React.FC = () => {
  const { currentUser, isOnline, signOut } = useCRM();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (!currentUser) return null;

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pipeline', icon: Trello, label: 'Pipeline' },
    { to: '/leads', icon: Users, label: 'Leads' },
    ...(currentUser.role === 'admin' ? [{ to: '/admin', icon: Settings, label: 'Admin' }] : []),
  ];

  const getTitle = () => {
    const path = location.pathname.substring(1);
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col transition-colors duration-300">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white leading-none">
              CRM <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 text-lg">OMNI.IA</span>
            </h1>
          </div>
          
          <div className={`mt-4 flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full w-fit ${isOnline ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
             {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
             {isOnline ? 'Conectado' : 'Offline'}
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-border space-y-2">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive ? 'bg-primary/10 text-primary' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`
            }
          >
            <UserCircle className="w-5 h-5" />
            Meu Perfil
          </NavLink>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur-sm flex items-center justify-between px-8 z-10 transition-colors duration-300">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{getTitle()}</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title={isDarkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center gap-3 pl-6 border-l border-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">{currentUser.name}</p>
                <p className="text-xs text-zinc-500 capitalize">{currentUser.role}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                {currentUser.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;