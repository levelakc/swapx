import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'; // Import LanguageProvider
import Layout from './Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import BrowseServices from './pages/BrowseServices';
import ItemDetail from './pages/ItemDetail';
import ServiceDetail from './pages/ServiceDetail';
import CreateItem from './pages/CreateItem';
import MyItems from './pages/MyItems';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Admin from './pages/Admin';
import CoinPanel from './pages/CoinPanel'; // Import CoinPanel
import MessageScreen from './pages/MessageScreen';
import Login from './pages/Login';
import Register from './pages/Register'; // Import Register component
import PrivateRoute from './components/common/PrivateRoute';
import StaticPage from './pages/StaticPages';
import ScrollToTopReset from './components/common/ScrollToTopReset';
import InitialLoader from './components/common/InitialLoader';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

const queryClient = new QueryClient();

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <LanguageProvider> {/* Wrap with LanguageProvider */}
          <AnimatePresence>
            {isLoading && <InitialLoader />}
          </AnimatePresence>
          <ThemeProvider>
            <CurrencyProvider>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <ScrollToTopReset />
                <div className="min-h-screen">
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/browse" element={<Browse listingType="item" />} />
                      <Route path="/services" element={<BrowseServices />} />
                      <Route path="/item/:id" element={<ItemDetail />} />
                      <Route path="/service/:id" element={<ServiceDetail />} />
                      
                      {/* Protected Routes */}
                      <Route element={<PrivateRoute />}>
                        <Route path="/create" element={<CreateItem />} />
                        <Route path="/edit-item/:id" element={<CreateItem />} />
                        <Route path="/my-items" element={<MyItems />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/profile/:id" element={<PublicProfile />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/coins" element={<CoinPanel />} />
                        <Route path="/messages/:id" element={<MessageScreen />} />
                      </Route>

                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} /> {/* Add Register route */}
                      
                      {/* Static Pages */}
                      <Route path="/about" element={<StaticPage />} />
                      <Route path="/careers" element={<StaticPage />} />
                      <Route path="/press" element={<StaticPage />} />
                      <Route path="/terms" element={<StaticPage />} />
                      <Route path="/privacy" element={<StaticPage />} />
                      <Route path="/company" element={<StaticPage />} />
                    </Routes>
                  </Layout>
                </div>
              </BrowserRouter>
            </CurrencyProvider>
          </ThemeProvider>
        </LanguageProvider> {/* Close LanguageProvider */}
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
