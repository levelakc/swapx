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

const Logo = () => {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-1.5 group cursor-pointer relative">
      <div className="relative flex items-center justify-center w-10 h-10 sm:w-16 sm:h-16 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-secondary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <svg className="absolute inset-0 w-full h-full animate-[spin_10s_linear_infinite] group-hover:animate-[spin_5s_linear_infinite]" viewBox="0 0 100 100" dir="ltr">
          <defs>
            <path id="circlePath" d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
          </defs>
          <text className="text-[10px] font-black uppercase tracking-[0.2em] fill-foreground/40 group-hover:fill-primary transition-colors duration-300">
            <textPath href="#circlePath" startOffset="0%">
              {t('brand').toUpperCase()} • {t('brand').toUpperCase()} • {t('brand').toUpperCase()} •
            </textPath>
          </text>
        </svg>
        <div className="relative z-10 flex items-center justify-center w-8 h-8 sm:w-13 sm:h-13 bg-background rounded-full border-2 border-primary group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-700 shadow-lg">
          <InfinityIcon className="w-5 h-5 sm:w-8 sm:h-8 text-primary" strokeWidth={3} />
        </div>
      </div>
      <div className="flex flex-col leading-none transition-transform duration-300 group-hover:scale-105">
        <span className="text-lg sm:text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 dark:from-white dark:to-purple-300 uppercase">
          {t('brand')}
        </span>
      </div>
    </div>
  );
};

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
      <div className="w-full px-1.5 sm:px-6">
        <div className="flex items-center justify-between">
          
          {/* Burger Menu Button - Always at Start (Right in RTL, Left in LTR) */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-1.5 text-muted-foreground hover:text-primary transition-colors flex flex-col items-center shrink-0"
          >
            <Menu size={22} className={isOpen ? 'rotate-90 transition-transform' : ''} />
            <span className="text-[8px] font-bold uppercase tracking-tighter mt-0.5">{t('menu', 'Menu')}</span>
          </button>

          {/* Icons Group */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {user && (
              <Link to="/profile" className="flex flex-col items-center p-1.5 sm:p-2 hover:bg-muted rounded-xl transition-all shrink-0">
                <img src={user.avatar || `https://avatar.vercel.sh/${user.email}.svg`} alt="Avatar" className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover ring-1 ring-border" />
                <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 uppercase tracking-tighter">{t('profile')}</span>
              </Link>
            )}

            {user && (
              <Link 
                  to="/messages" 
                  className="flex flex-col items-center p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-primary transition-colors relative shrink-0"
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
                  <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 uppercase tracking-tighter">{t('offers')}</span>
              </Link>
            )}

            {user && (
              <Link 
                  to="/coins" 
                  className="flex flex-col items-center p-1 sm:p-2 rounded-xl text-yellow-600 hover:bg-yellow-500/10 transition-colors shrink-0"
              >
                  <div className="flex items-center gap-1">
                      <Coins size={16} />
                      <span className="text-[10px] font-bold">{user.coins}</span>
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 uppercase tracking-tighter">{t('navCoins')}</span>
              </Link>
            )}

            <NavLink 
                to="/services" 
                className={({ isActive }) => `flex flex-col items-center p-1.5 sm:p-2 rounded-xl transition-all shrink-0 ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
                <Briefcase size={18} />
                <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 uppercase tracking-tighter text-center leading-tight">
                    {t('navServices')}
                </span>
            </NavLink>

            <NavLink 
                to="/browse" 
                className={({ isActive }) => `flex flex-col items-center p-1.5 sm:p-2 rounded-xl transition-all shrink-0 ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
                <Compass size={18} />
                <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 uppercase tracking-tighter text-center leading-tight">
                    {t('navBrowse')}
                </span>
            </NavLink>

            <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)} 
                className={`flex flex-col items-center p-1.5 sm:p-2 rounded-xl transition-all shrink-0 ${isSearchOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
                <Search size={18}/>
                <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 uppercase tracking-tighter text-center leading-tight">
                    {t('navSearch')}
                </span>
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Logo - Always at End (Left in RTL, Right in LTR) */}
          <Link to="/" className="block shrink-0">
            <Logo />
          </Link>
        </div>

        {/* New Elegant Search Dropdown */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 px-4 py-2 z-40 flex justify-center pointer-events-none"
            >
              <div className="w-full max-w-md bg-background/80 backdrop-blur-md border border-border/50 shadow-xl rounded-2xl px-4 py-2 flex items-center pointer-events-auto">
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

      {/* Burger Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: dir === 'ltr' ? -100 : 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir === 'ltr' ? -100 : 100 }}
            className={`fixed inset-y-0 ${dir === 'ltr' ? 'left-0' : 'right-0'} w-72 bg-background/95 backdrop-blur-xl border-x border-border shadow-2xl z-[60] p-6 flex flex-col gap-8`}
          >
            <div className="flex items-center justify-between mb-2">
                <Logo />
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted rounded-full transition-all"><X size={24}/></button>
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-center gap-6 py-4 bg-muted/20 rounded-3xl">
                    {!user ? (
                        <>
                            <Link to="/login" onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-1.5 group transition-all">
                                <div className="p-3 rounded-2xl bg-background border border-border group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm">
                                    <UserIcon size={22} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{t('signIn')}</span>
                            </Link>
                            <Link to="/register" onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-1.5 group transition-all">
                                <div className="p-3 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                    <InfinityIcon size={22} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{t('register')}</span>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/profile" onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-1.5 group transition-all">
                                <img src={user.avatar || `https://avatar.vercel.sh/${user.email}.svg`} alt="Avatar" className="h-12 w-12 rounded-2xl object-cover ring-2 ring-border group-hover:ring-primary transition-all shadow-md" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{t('profile')}</span>
                            </Link>
                            {user?.role === 'admin' && (
                                <Link to="/admin" onClick={() => setIsOpen(false)} className="flex flex-col items-center gap-1.5 group transition-all">
                                    <div className="p-3 rounded-2xl bg-background border border-border group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm">
                                        <LayoutDashboard size={22} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{t('admin')}</span>
                                </Link>
                            )}
                        </>
                    )}
                </div>

                <div className="border-t border-border/50 pt-8 flex flex-wrap items-center justify-center gap-8">
                    <button onClick={handleThemeChange} className="flex flex-col items-center gap-1.5 group transition-all">
                        <div className="p-3 rounded-2xl bg-background border border-border group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm">
                            {theme === 'dark' ? <Sun size={22}/> : <Moon size={22}/>}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                            {theme === 'dark' ? t('light') : t('dark')}
                        </span>
                    </button>
                    <LanguageSwitcher />
                    <CurrencySwitcher />
                </div>
            </div>

            {user && (
                <button onClick={handleLogout} className="mt-auto flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-red-500/10 text-red-500 font-black uppercase tracking-widest text-sm hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-red-500/5">
                    <LogOut size={20}/>
                    {t('logout')}
                </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {isOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55]" onClick={() => setIsOpen(false)} />
      )}
    </header>
  );
}
