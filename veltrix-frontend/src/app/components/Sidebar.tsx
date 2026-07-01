import { useVeltrixStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  Users, 
  UserCheck, 
  Compass, 
  TrendingUp, 
  Mail, 
  CalendarRange, 
  Phone, 
  CheckSquare, 
  Calendar, 
  HelpCircle, 
  LogOut,
  Layers,
  X
} from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  activeTab: 'workspace' | 'console';
}

export default function Sidebar({ activeTab }: SidebarProps) {
  const { 
    user, 
    signOut, 
    activeBdrTab, 
    activeAdminTab, 
    setActiveBdrTab, 
    setActiveAdminTab,
    sidebarOpen,
    setSidebarOpen
  } = useVeltrixStore();
  const router = useRouter();

  const handleLogout = () => {
    signOut();
    router.push('/');
  };

  const getTabName = (name: string) => name.toLowerCase();

  const handleTabClick = (name: string) => {
    if (user?.role === 'bdr') {
       if (name === 'Leads') setActiveBdrTab('queue');
       else setActiveBdrTab(getTabName(name));
    } else {
       if (name === 'Home') setActiveAdminTab('operations');
       else if (name === 'Team Performance') setActiveAdminTab('performance');
       else if (name === 'Opportunities') setActiveAdminTab('opportunities');
       else setActiveAdminTab(getTabName(name));
    }
  };

  const isTabActive = (name: string) => {
    if (user?.role === 'bdr') {
       if (name === 'Leads') return activeBdrTab === 'queue' || activeBdrTab === 'directory';
       return activeBdrTab === getTabName(name);
    } else {
       if (name === 'Home') return activeAdminTab === 'operations';
       if (name === 'Team Performance') return activeAdminTab === 'performance';
       if (name === 'Opportunities') return activeAdminTab === 'opportunities';
       return activeAdminTab === getTabName(name);
    }
  };

  const menuItems = user?.role === 'admin'
    ? [
        { name: 'Home', icon: Home },
        { name: 'Accounts', icon: Users },
        { name: 'Contacts', icon: UserCheck },
        { name: 'Leads', icon: Compass },
        { name: 'Team Performance', icon: TrendingUp },
        { name: 'Opportunities', icon: Layers },
        { name: 'Emails', icon: Mail },
        { name: 'Meetings', icon: CalendarRange },
        { name: 'Calls', icon: Phone },
        { name: 'Tasks', icon: CheckSquare },
        { name: 'Calendar', icon: Calendar },
        { name: 'Support', icon: HelpCircle },
      ]
    : [
        { name: 'Leads', icon: Compass },
        { name: 'Opportunities', icon: TrendingUp },
        { name: 'Meetings', icon: CalendarRange },
        { name: 'Tasks', icon: CheckSquare },
        { name: 'Calendar', icon: Calendar },
      ];

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-[#f3f4f6] border-r border-gray-300 flex flex-col justify-between shadow-sm text-slate-700 transform transition-transform duration-300 ease-in-out
        md:relative md:transform-none md:flex md:translate-x-0 min-h-screen shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Brand Header: EspoCRM style logo with close toggle */}
          <div className="h-14 border-b border-gray-300 px-6 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0">
                V
              </div>
              <div className="text-sm tracking-wider font-extrabold text-slate-800">
                VELTRIX<span className="text-blue-500 font-semibold text-xs tracking-normal ml-0.5">CRM</span>
              </div>
            </div>
            
            {/* Mobile close button */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded md:hidden text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Identity Session Info */}
          <div className="px-6 py-3 border-b border-gray-300 bg-white/50">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                {user?.role === 'admin' ? 'System Administrator' : 'BDR Rep Session'}
              </span>
            </div>
            <p className="text-xs text-slate-800 font-bold truncate mt-0.5">{user?.name}</p>
          </div>

          {/* Dynamic Navigation list */}
          <nav className="p-2 space-y-0.5 mt-2">
            {menuItems.map((item) => {
              const isActive = isTabActive(item.name);

              return (
                <button
                  key={item.name}
                  onClick={() => handleTabClick(item.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-[11px] font-bold transition-all ${
                    isActive
                      ? 'bg-white border-l-4 border-l-blue-600 text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <item.icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout Session Action */}
        <div className="p-3 border-t border-gray-300 bg-white/40">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-[11px] font-bold text-slate-500 hover:text-red-700 hover:bg-red-50/50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-red-600" />
            Sign Out Session
          </button>
        </div>
      </aside>
    </>
  );
}
