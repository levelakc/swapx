import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage, languages } from '../../contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../api/api';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, X, Sun, Moon, Search, Coins, MessageCircle, LayoutDashboard, Compass, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';
import CurrencySwitcher from '../CurrencySwitcher';
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
          <div className="flex items-center gap-2 sm:gap-4">
             
             {/* Browse Icon */}
             <div className="hidden md:flex items-center gap-2">
                <NavLink 
                    to="/browse" 
                    className={({ isActive }) => `p-2 rounded-full transition-all ${isActive ? 'bg-primary text-primary-content shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    title={t('browseItems')}
                >
                    <Compass size={20} />
                </NavLink>
                <NavLink 
                    to="/services" 
                    className={({ isActive }) => `p-2 rounded-full transition-all ${isActive ? 'bg-primary text-primary-content shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    title={t('browseServices', 'Services')}
                >
                    <Briefcase size={20} />
                </NavLink>
             </div>

             {/* Search Bar - Expandable */}
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
                    <button onClick={() => setIsSearchOpen(true)} className="hidden md:block p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Search className="h-5 w-5"/>
                    </button>
                )}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
                <button onClick={handleThemeChange} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                {theme === 'dark' ? <Sun className="h-5 w-5"/> : <Moon className="h-5 w-5"/>}
                </button>

                <div className="relative">
                    <select 
                        onChange={(e) => setLanguage(e.target.value)} 
                        value={language} 
                        className="bg-transparent text-lg appearance-none cursor-pointer focus:outline-none hover:opacity-80 transition-opacity"
                    >
                        {languages.map(lang => (
                        <option key={lang.code} value={lang.code} className="bg-background text-foreground">
                            {lang.flag}
                        </option>
                        ))}
                    </select>
                </div>
                
                <CurrencySwitcher />
            </div>

            {/* User Profile / Auth */}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                {/* Coins Badge */}
                <Link to="/coins" className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-yellow-500/10 text-yellow-600 rounded-full text-sm font-bold hover:bg-yellow-500/20 transition-colors">
                    <Coins size={14} />
                    <span>{user.coins}</span>
                </Link>

                {/* Messages Badge */}
                <Link to="/messages" className="hidden md:flex p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors relative">
                    <MessageCircle size={20} />
                    {/* Add notification dot logic here later */}
                </Link>

                <div className="relative group">
                  <Link to="/profile">
                    <img 
                        src={user.avatar || `https://avatar.vercel.sh/${user.email}.svg`} 
                        alt="Avatar" 
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary transition-all cursor-pointer"
                    />
                  </Link>
                  
                  {/* Dropdown */}
                  <div className="hidden md:block absolute right-0 mt-2 w-56 bg-background rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right border border-border">
                    <div className="px-4 py-2 border-b border-border mb-2">
                        <p className="font-semibold text-sm truncate">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    
                    <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                      <User className="mr-2 h-4 w-4"/> {t('profile')}
                    </Link>
                    <Link to="/messages" className="md:hidden flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                      <MessageCircle className="mr-2 h-4 w-4"/> {t('messages')}
                    </Link>
                    <Link to="/coins" className="md:hidden flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                      <Coins className="mr-2 h-4 w-4"/> {t('myCoins')}
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
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {t('signIn', 'Sign In')}
                </Link>
                <Link to="/register" className="px-5 py-2 rounded-full bg-primary text-primary-content text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all">
                  {t('register', 'Register')}
                </Link>
              </div>
            )}
            
            {/* Mobile Menu Button & Icons */}
            <div className="md:hidden flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)} 
                className="p-2 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                <Search className="h-5 w-5" />
              </button>

              <NavLink to="/browse" className={({ isActive }) => `p-2 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <Compass className="h-5 w-5" />
              </NavLink>

              <NavLink to="/services" className={({ isActive }) => `p-2 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <Briefcase className="h-5 w-5" />
              </NavLink>

              {user ? (
                <>
                    <NavLink to="/messages" className={({ isActive }) => `p-2 transition-colors relative ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                        <MessageCircle className="h-5 w-5" />
                    </NavLink>
                    <Link to="/coins" className="p-2 text-yellow-600">
                        <Coins className="h-5 w-5" />
                    </Link>
                    <Link to="/profile" className="p-1">
                        <img 
                            src={user.avatar || `https://avatar.vercel.sh/${user.email}.svg`} 
                            alt="Avatar" 
                            className="h-7 w-7 rounded-full object-cover ring-2 ring-transparent active:ring-primary transition-all"
                        />
                    </Link>
                </>
              ) : (
                  <Link to="/login" className="p-2 text-muted-foreground hover:text-foreground">
                    <User className="h-6 w-6" />
                  </Link>
              )}
            </div>
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
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
                <NavLink 
                    to="/browse" 
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => `block px-4 py-3 rounded-lg text-base font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`}
                >
                    {t('browseItems', 'Browse')}
                </NavLink>
                <NavLink 
                    to="/services" 
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => `block px-4 py-3 rounded-lg text-base font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`}
                >
                    {t('browseServices', 'Services')}
                </NavLink>
                
                <div className="border-t border-border my-2 pt-2 grid grid-cols-2 gap-2">
                    <button onClick={handleThemeChange} className="flex items-center justify-center p-3 rounded-lg bg-muted/50 hover:bg-muted">
                        {theme === 'dark' ? <><Sun className="mr-2 h-4 w-4"/> Light</> : <><Moon className="mr-2 h-4 w-4"/> Dark</>}
                    </button>
                    <div className="flex items-center justify-center p-3 rounded-lg bg-muted/50 hover:bg-muted">
                        <CurrencySwitcher />
                    </div>
                </div>

                {!user && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <Link to="/login" onClick={() => setIsOpen(false)} className="block text-center px-4 py-3 rounded-lg bg-muted font-medium">
                        {t('login')}
                        </Link>
                        <Link to="/register" onClick={() => setIsOpen(false)} className="block text-center px-4 py-3 rounded-lg bg-primary text-primary-content font-bold">
                        {t('register')}
                        </Link>
                    </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
