import { Toaster, toast } from 'sonner';
import { useLanguage } from './contexts/LanguageContext'; // Corrected import path
import NavBar from './components/navigation/NavBar';
import Footer from './components/common/Footer';
import WelcomeTour from './components/common/WelcomeTour';
import ScrollToTop from './components/common/ScrollToTop';
import AccessibilityWidget from './components/common/AccessibilityWidget';
import FloatingChatSupport from './components/common/FloatingChatSupport';
import { Info, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const GlassyToast = ({ message, type = 'info', description }) => {
    const icons = {
        success: <CheckCircle className="text-emerald-500" size={20} />,
        error: <XCircle className="text-rose-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />,
        warning: <AlertCircle className="text-amber-500" size={20} />,
    };

    return (
        <div className="flex items-center gap-4 bg-background/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[300px] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="shrink-0">
                {icons[type]}
            </div>
            <div className="flex-1">
                <p className="text-sm font-black uppercase tracking-tight text-foreground">{message}</p>
                {description && <p className="text-xs font-bold text-muted-foreground mt-0.5">{description}</p>}
            </div>
        </div>
    );
};

export const showToast = (message, type = 'info', description) => {
    toast.custom((t) => (
        <GlassyToast message={message} type={type} description={description} />
    ));
};

function AppContent({ children }) {
  const { dir } = useLanguage();
  return (
    <div dir={dir} className="flex flex-col min-h-screen">
      <Toaster 
        position="bottom-right" 
        toastOptions={{
            style: { background: 'transparent', border: 'none', boxShadow: 'none' },
        }}
      />
      <WelcomeTour />
      <NavBar />
      <AccessibilityWidget />
      <FloatingChatSupport />
      <ScrollToTop />
      <main className="pt-28 flex-grow flex flex-col overflow-x-hidden">
        <div className={`flex-1 ${window.location.pathname.startsWith('/messages') ? '' : 'container mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function Layout({ children }) {
  return (
    <AppContent>{children}</AppContent>
  );
}
