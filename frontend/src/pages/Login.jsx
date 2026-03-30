import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { login } from '../api/api';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import { Facebook, Globe } from 'lucide-react';
import { useEffect } from 'react';
import logoWithSlogan from '../imgs/3.jpg';
import ImageWithFallback from '../components/common/ImageWithFallback';
import SEO from '../components/common/SEO';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const savedEmail = localStorage.getItem('remembered_email');
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: savedEmail || '',
      rememberMe: !!savedEmail
    }
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
        // Fetch user data using the token or just assume success if token is valid
        // Ideally we fetch /auth/me with the token to get the user object
        // But for now, let's construct a minimal user object or fetch it.
        // Better: Save token, then redirect to profile where data will be fetched.
        // We need to save it in the same format as 'base44_user' usually stores (user object + token).
        // Since we only have token, we can't save full object yet.
        // But 'api.js' getToken() reads from 'base44_user'.token.
        // So we can save { token }.
        
        // However, 'getMe' relies on the token.
        // Let's do a quick hack: save token, then fetch user, then save full object?
        // Or simply:
        localStorage.setItem('base44_user', JSON.stringify({ token }));
        
        // Redirect to profile or home, let the app handle fetching user data if needed.
        // We might want to reload to update NavBar.
        navigate('/profile');
        window.location.reload();
    }
  }, [location, navigate]);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => login(email, password),
    onSuccess: (data, variables) => {
      localStorage.setItem('base44_user', JSON.stringify(data));
      
      if (variables.rememberMe) {
        localStorage.setItem('remembered_email', variables.email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      if (data.dailyReward) {
        toast.success('You received 5 coins for your daily login!');
      } else {
        toast.success('Logged in successfully!');
      }
      navigate('/profile');
      window.location.reload(); // To refresh user state in NavBar
    },
    onError: (error) => {
      toast.error(error.message || 'Login failed');
    },
  });

  const onSubmit = (data) => {
    loginMutation.mutate(data);
  };

  const handleGoogleLogin = () => {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      window.location.href = `${apiUrl}/auth/google`;
  };

  const handleFacebookLogin = () => {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      window.location.href = `${apiUrl}/auth/facebook`;
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <SEO title={t('login')} description={t('signInToAccount')} />
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <Link to="/">
            <ImageWithFallback src={logoWithSlogan} alt="Ahlafot" className="h-32 md:h-40 w-auto object-contain mb-2 hover:scale-105 transition-transform" />
          </Link>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-foreground">
            {t('signInToAccount', 'Sign in to your account')}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">{t('emailAddress', 'Email address')}</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder={t('emailAddress', 'Email address')}
                {...register('email', { required: t('emailRequired', 'Email is required') })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">{t('password', 'Password')}</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder={t('password', 'Password')}
                {...register('password', { required: t('passwordRequired', 'Password is required') })}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center group cursor-pointer select-none">
              <div className="relative">
                <input
                  id="remember-me"
                  name="rememberMe"
                  type="checkbox"
                  className="sr-only peer"
                  {...register('rememberMe')}
                />
                <div className="w-5 h-5 bg-muted/50 border border-border rounded-lg peer-checked:bg-primary peer-checked:border-primary transition-all duration-200 flex items-center justify-center group-hover:border-primary/50">
                  <div className="w-2.5 h-2.5 bg-white rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity transform scale-50 peer-checked:scale-100 duration-200" />
                </div>
              </div>
              <span className="ml-3 text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                {t('rememberMe', 'Remember me')}
              </span>
            </label>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-content bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={loginMutation.isLoading}
            >
              {loginMutation.isLoading ? t('signingIn', 'Signing in...') : t('signIn', 'Sign in')}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">{t('orContinueWith', 'Or continue with')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              onClick={handleGoogleLogin}
            >
              <Globe className="h-5 w-5 text-red-500 mr-2" /> {t('google', 'Google')}
            </button>
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              onClick={handleFacebookLogin}
            >
              <Facebook className="h-5 w-5 text-blue-600 mr-2" /> {t('facebook', 'Facebook')}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          <Link to="/register" className="font-medium text-primary hover:text-primary-focus">
            {t('noAccount', 'Don\'t have an account? Sign Up')}
          </Link>
        </div>
      </div>
    </div>
  );
}
