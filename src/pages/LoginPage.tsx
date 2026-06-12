import Auth from '@/components/Auth/Auth';
import { useAuth } from '@/context/AuthContext';

export const LoginPage = () => {
  const { session } = useAuth();

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Auth />
      </div>
    );
  }

  return <div>Login</div>;
};
