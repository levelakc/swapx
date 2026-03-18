import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage, languages } from '../../contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { getMe, getConversations } from '../../api/api';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Menu, X, Sun, Moon, Search, Coins, MessageCircle, LayoutDashboard, Compass, Briefcase, ArrowRightLeft, Infinity as InfinityIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import CurrencySwitcher from '../CurrencySwitcher';
import LanguageSwitcher from '../LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import logoIcon from '../../imgs/1.jpg';

const Logo = () => (
  <div className="flex items-center gap-2 group cursor-pointer relative">
    <div className="relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-secondary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <svg className="absolute inset-0 w-full h-full animate-[spin_10s_linear_infinite] group-hover:animate-[spin_5s_linear_infinite]" viewBox="0 0 100 100" dir="ltr">
        <defs>
          <path id="circlePath" d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
        </defs>
        <text className="text-[10px] font-black uppercase tracking-[0.2em] fill-foreground/40 group-hover:fill-primary transition-colors duration-300">
          <textPath href="#circlePath" startOffset="0%">
            AHLAFOT • AHLAFOT • AHLAFOT •
          </textPath>
        </text>
      </svg>
      <div className="relative z-10 flex items-center justify-center w-10 h-10 sm:w-13 sm:h-13 overflow-hidden bg-background rounded-full border-2 border-primary/20 group-hover:border-primary group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-700 shadow-lg">
        <img src={logoIcon} alt="Logo Icon" className="w-full h-full object-cover" />
      </div>
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-xl sm:text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 dark:from-white dark:to-purple-300 group-hover:scale-105 transition-transform duration-300 uppercase">
        Ahlafot
      </span>
    </div>
  </div>
);

export default function NavBar() {
  const { t, setLanguage, language, dir } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    retry: false,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    enabled: !!user,
    refetchInterval: 10000,
  });

  const totalUnread = conversations.reduce((acc, conv) => {
    return acc + (conv.unread_count?.[user?.email] || 0);
  }, 0);

  const handleLogout = () => {
    localStorage.removeItem('base44_user');
    window.location.reload();
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleThemeChange = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
        setIsSearchOpen(false);
        navigate(`/browse?keyword=${encodeURIComponent(e.target.value)}`);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/95 backdrop-blur-md shadow-sm py-1' : 'bg-background py-2'}`}>
      <div className="w-full px-2 sm:px-6 relative">
        <div className={`flex items-center justify-between ${dir === 'rtl' ? 'flex-row' : 'flex-row-reverse'}`}>
          
          {/* Logo */}
          <div className="flex-shrink-0 origin-left">
            <Link to="/" className="block">
              <Logo />
              <span className="sr-only">{t('brand')}</span>
            </Link>
          </div>

          {/* Right Section */}
          <div className={`flex items-center gap-0.5 sm:gap-1 ${dir === 'rtl' ? 'flex-row' : 'flex-row-reverse'}`}>
             
             {/* Main Navigation Icons */}
             <div className="flex items-center">
                <NavLink 
                    id="tour-explore"
                    to="/browse" 
                    className={({ isActive }) => `flex flex-col items-center p-1.5 sm:p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                    <Compass size={18} />
                    <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 uppercase tracking-tighter text-center leading-tight">
                        {t('navBrowse', 'Browse')}
                    </span>
                </NavLink>
                <NavLink 
                    id="tour-services"
                    to="/services" 
                    className={({ isActive }) => `flex flex-col items-center p-1.5 sm:p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                    <Briefcase size={18} />
                    <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 uppercase tracking-tighter text-center leading-tight">
                        {t('navServices', 'Services')}
                    </span>
                </NavLink>

                {/* Search Toggle */}
                <button 
                    onClick={() => setIsSearchOpen(!isSearchOpen)} 
                    className={`flex flex-col items-center p-1.5 sm:p-2 rounded-xl transition-all ${isSearchOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                    <Search size={18}/>
                    <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 uppercase tracking-tighter text-center leading-tight">
                        {t('navSearch', 'Search')}
                    </span>
                </button>
             </div>

             {/* Theme/Lang/Curr */}
             <div className="flex items-center">
                <button onClick={handleThemeChange} className="flex flex-col items-center p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                    {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
                    <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 uppercase tracking-tighter text-center leading-tight">
                        {theme === 'dark' ? t('light') : t('dark')}
                    </span>
                </button>

                <LanguageSwitcher />
                <CurrencySwitcher />
             </div>

             {/* User Section */}
             {user ? (
              <div className="flex items-center">
                <Link 
                    id="tour-coins"
                    to="/coins" 
                    className="flex flex-col items-center p-1.5 sm:p-2 rounded-xl text-yellow-600 hover:bg-yellow-500/10 transition-colors"
                >
                    <div className="flex items-center gap-1">
                        <Coins size={16} />
                        <span className="text-[10px] font-bold">{user.coins}</span>
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 uppercase tracking-tighter">{t('myCoins').split(' ')[1] || t('myCoins')}</span>
                </Link>

                <Link 
                    id="tour-offers"
                    to="/messages" 
                    className="flex flex-col items-center p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-primary transition-colors relative"
                >
                    <div className="relative">
                        <ArrowRightLeft size={18} />
                        {totalUnread > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-full w-full bg-red-500"></span>
                            </span>
                        )}
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 uppercase tracking-tighter">{t('offers', 'Offers')}</span>
                </Link>

                <Link id="tour-profile" to="/profile" className="flex flex-col items-center p-1.5 sm:p-2">
                  <img src={user.avatar || `https://avatar.vercel.sh/${user.email}.svg`} alt="Avatar" className="h-5 w-5 sm:h-7 sm:w-7 rounded-full object-cover ring-1 ring-border" />
                  <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 uppercase tracking-tighter">{t('profile')}</span>
                </Link>
              </div>
            ) : null}
            
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-muted-foreground hover:text-foreground focus:outline-none">
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* New Elegant Search Dropdown */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 px-4 py-3 bg-background/95 backdrop-blur-md border-b border-border shadow-lg z-40"
            >
              <div className="max-w-xl mx-auto flex items-center bg-muted/50 rounded-2xl px-4 py-2 border border-border/50">
                <Search size={18} className="text-muted-foreground mr-3" />
                <input 
                  type="text" 
                  placeholder={t('search')} 
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold py-1"
                  autoFocus
                  onKeyDown={handleSearch}
                />
                <button onClick={() => setIsSearchOpen(false)} className="ml-2 text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden bg-background border-b border-border overflow-hidden shadow-xl"
          >
            <div className="px-6 py-8 flex flex-col gap-4 max-w-sm mx-auto">
                {!user ? (
                    <>
                        <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-muted/50 font-black uppercase tracking-widest text-sm hover:bg-muted transition-all">
                            <UserIcon size={20} />
                            {t('signIn')}
                        </Link>
                        <Link to="/register" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                            <InfinityIcon size={20} />
                            {t('register')}
                        </Link>
                    </>
                ) : (
                    <>
                        {user?.role === 'admin' && (
                            <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-muted/50 font-black uppercase tracking-widest text-sm">
                                <LayoutDashboard size={20} />
                                {t('admin')}
                            </Link>
                        )}
                        <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-red-500/10 text-red-500 font-black uppercase tracking-widest text-sm active:scale-95 transition-all">
                            <LogOut size={20}/>
                            {t('logout')}
                        </button>
                    </>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
