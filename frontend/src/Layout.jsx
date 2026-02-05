import { Toaster } from 'sonner';
import { useLanguage } from './contexts/LanguageContext'; // Corrected import path
import NavBar from './components/navigation/NavBar';
import Footer from './components/common/Footer';

function AppContent({ children }) {
  const { dir } = useLanguage();
  return (
    <div dir={dir} className="flex flex-col min-h-screen">
      <Toaster richColors position="bottom-right" />
      <NavBar />
      <main className="pt-20 flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
