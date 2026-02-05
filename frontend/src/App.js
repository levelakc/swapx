import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext'; // Import LanguageProvider
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
import Admin from './pages/Admin';
import CoinPanel from './pages/CoinPanel'; // Import CoinPanel
import MessageScreen from './pages/MessageScreen';
import Login from './pages/Login';
import Register from './pages/Register'; // Import Register component
import PrivateRoute from './components/common/PrivateRoute';
import StaticPage from './pages/StaticPages';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider> {/* Wrap with LanguageProvider */}
        <ThemeProvider>
          <CurrencyProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="min-h-screen">
                <Toaster />
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
                      <Route path="/my-items" element={<MyItems />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="/profile" element={<Profile />} />
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
    </QueryClientProvider>
  );
}

export default App;
