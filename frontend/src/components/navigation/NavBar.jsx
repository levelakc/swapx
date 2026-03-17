import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage, languages } from '../../contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { getMe, getConversations } from '../../api/api';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Menu, X, Sun, Moon, Search, Coins, MessageCircle, LayoutDashboard, Compass, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';
import CurrencySwitcher from '../CurrencySwitcher';
import LanguageSwitcher from '../LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';

export default function NavBar() {
  const { t, setLanguage, language } = useLanguage();
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
    refetchInterval: 10000, // Poll every 10 seconds
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/95 backdrop-blur-md shadow-sm py-2' : 'bg-background py-4'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link to="/" className="text-2xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {t('brand')}
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-2">
             
             {/* Browse Icons */}
             <div className="flex items-center gap-1 sm:gap-2">
                <NavLink 
                    to="/browse" 
                    className={({ isActive }) => `flex flex-col items-center p-1.5 sm:p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                    <Compass size={20} />
                    <span className="text-[9px] font-bold mt-0.5 uppercase tracking-tighter text-center leading-tight">
                        {t('navBrowse', 'Browse')}
                    </span>
                </NavLink>
                <NavLink 
                    to="/services" 
                    className={({ isActive }) => `flex flex-col items-center p-1.5 sm:p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                    <Briefcase size={20} />
                    <span className="text-[9px] font-bold mt-0.5 uppercase tracking-tighter text-center leading-tight">
                        {t('navServices', 'Services')}
                    </span>
                </NavLink>
             </div>

             {/* Search - Expandable for Desktop, Icon for Mobile */}
             <div className={`relative transition-all duration-300 ${isSearchOpen ? 'w-full md:w-64 absolute md:relative left-0 right-0 px-4 md:px-0 bg-background md:bg-transparent z-20 flex items-center' : 'w-auto'}`}>
                {isSearchOpen ? (
                    <>
                        <Search className="absolute left-6 md:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <input 
                            type="text" 
                            placeholder={t('search')} 
                            className="w-full bg-muted/50 rounded-full py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            autoFocus
                            onBlur={() => setIsSearchOpen(false)}
                            onKeyDown={handleSearch}
                        />
                        <button onClick={() => setIsSearchOpen(false)} className="absolute right-6 md:right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full">
                            <X className="h-4 w-4 text-muted-foreground"/>
                        </button>
                    </>
                ) : (
                    <button onClick={() => setIsSearchOpen(true)} className="flex flex-col items-center p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Search size={20}/>
                        <span className="text-[9px] font-bold mt-0.5 uppercase tracking-tighter text-center leading-tight">
                            {t('navSearch', 'Search')}
                        </span>
                    </button>
                )}
            </div>

            {/* Desktop Only Actions */}
            <div className="hidden lg:flex items-center gap-3 ml-2">
                <button onClick={handleThemeChange} className="flex flex-col items-center p-1.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                    {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                    <span className="text-[9px] font-bold mt-0.5 uppercase tracking-tighter text-center leading-tight">
                        {theme === 'dark' ? t('light') : t('dark')}
                    </span>
                </button>

                <LanguageSwitcher />
                <CurrencySwitcher />
            </div>

            {/* User Profile / Auth */}
            {user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Coins Badge */}
                <Link to="/coins" className="flex flex-col items-center p-1.5 sm:p-2 rounded-xl text-yellow-600 hover:bg-yellow-500/10 transition-colors">
                    <div className="flex items-center gap-1">
                        <Coins size={18} />
                        <span className="text-xs font-bold">{user.coins}</span>
                    </div>
                    <span className="text-[10px] font-bold mt-0.5 uppercase tracking-tighter">{t('myCoins').split(' ')[1] || t('myCoins')}</span>
                </Link>

                {/* Offers Badge */}
                <Link to="/messages" className="flex flex-col items-center p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-primary transition-colors relative">
                    <div className="relative">
                        <ArrowRightLeft size={20} />
                        {totalUnread > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold mt-0.5 uppercase tracking-tighter">{t('offers', 'Offers')}</span>
                </Link>

                <div className="relative group">
                  <Link to="/profile" className="flex flex-col items-center p-1.5 sm:p-2">
                    <img 
                        src={user.avatar || `https://avatar.vercel.sh/${user.email}.svg`} 
                        alt="Avatar" 
                        className="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary transition-all cursor-pointer"
                    />
                    <span className="text-[10px] font-bold mt-0.5 uppercase tracking-tighter">{t('profile')}</span>
                  </Link>
                  
                  {/* Dropdown */}
                  <div className="hidden md:block absolute right-0 mt-2 w-56 bg-background rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right border border-border">
                    <div className="px-4 py-2 border-b border-border mb-2">
                        <p className="font-semibold text-sm truncate">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    
                    <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                      <UserIcon className="mr-2 h-4 w-4"/> {t('profile')}
                    </Link>
                    
                    {user?.role === 'admin' && (
                      <Link to="/admin" className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                        <LayoutDashboard className="mr-2 h-4 w-4"/> {t('admin')}
                      </Link>
                    )}
                    
                    <div className="border-t border-border mt-2 pt-2">
                        <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <LogOut className="mr-2 h-4 w-4"/> {t('logout')}
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link to="/login" className="px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase">
                  {t('signIn', 'Sign In')}
                </Link>
                <Link to="/register" className="px-4 py-2 rounded-full bg-primary text-primary-content text-xs font-bold hover:shadow-lg hover:shadow-primary/30 transition-all uppercase">
                  {t('register', 'Register')}
                </Link>
              </div>
            )}
            
            {/* Mobile Menu Button - for Settings/Theme */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground focus:outline-none"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleThemeChange} className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all">
                        {theme === 'dark' ? <Sun className="h-5 w-5 mb-1"/> : <Moon className="h-5 w-5 mb-1"/>}
                        <span className="text-xs font-black uppercase tracking-widest">
                            {theme === 'dark' ? t('light') : t('dark')}
                        </span>
                    </button>
                    <div className="flex items-center justify-center p-3 rounded-lg bg-muted/50">
                        <CurrencySwitcher />
                    </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-black uppercase tracking-widest">{t('language')}</span>
                    <LanguageSwitcher />
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>

  );
}
