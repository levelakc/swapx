import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { register as registerUser } from '../api/api';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import { Facebook, Globe } from 'lucide-react';

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const password = watch('password');

  const registerMutation = useMutation({
    mutationFn: (userData) => registerUser(userData),
    onSuccess: (data) => {
      localStorage.setItem('base44_user', JSON.stringify(data)); // Assuming direct login after registration
      toast.success('Registration successful! You are now logged in.');
      navigate('/profile');
      window.location.reload(); // To refresh user state in NavBar
    },
    onError: (error) => {
      toast.error(error.message || 'Registration failed');
    },
  });

  const onSubmit = (data) => {
    registerMutation.mutate(data);
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
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            {t('registerAccount', 'Register your account')}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="full-name" className="sr-only">{t('fullName', 'Full Name')}</label>
              <input
                id="full-name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder={t('fullNamePlaceholder', 'Full Name')}
                {...register('full_name', { required: t('fullNameRequired', 'Full Name is required') })}
              />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">{t('emailAddress', 'Email address')}</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder={t('emailAddressPlaceholder', 'Email address')}
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
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder={t('passwordPlaceholder', 'Password')}
                {...register('password', { required: t('passwordRequired', 'Password is required'), minLength: { value: 6, message: t('passwordMinLength', 'Password must be at least 6 characters') } })}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">{t('confirmPassword', 'Confirm Password')}</label>
              <input
                id="confirm-password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder={t('confirmPasswordPlaceholder', 'Confirm Password')}
                {...register('confirm_password', {
                  required: t('confirmPasswordRequired', 'Confirm Password is required'),
                  validate: value => value === password || t('passwordsMismatch', 'Passwords do not match')
                })}
              />
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-content bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={registerMutation.isLoading}
            >
              {registerMutation.isLoading ? t('registering', 'Registering...') : t('register', 'Register')}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              onClick={handleGoogleLogin}
            >
              <Globe className="h-5 w-5 text-red-500 mr-2" /> Google
            </button>
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              onClick={handleFacebookLogin}
            >
              <Facebook className="h-5 w-5 text-blue-600 mr-2" /> Facebook
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          <Link to="/login" className="font-medium text-primary hover:text-primary-focus">
            {t('alreadyHaveAccount', 'Already have an account? Sign In')}
          </Link>
        </div>
      </div>
    </div>
  );
}
