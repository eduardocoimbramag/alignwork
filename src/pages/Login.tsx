import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { Button } from '../components/ui/button';
import { Heart, ArrowLeft } from 'lucide-react';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    const handleSuccess = () => {
        navigate(from, { replace: true });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,var(--g-from-pastel)_0%,var(--g-mid-pastel)_48%,var(--g-to-pastel)_100%)] p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                        <Heart className="h-8 w-8 text-white drop-shadow-sm" />
                        <h1 className="text-3xl font-extrabold text-white drop-shadow-sm">
                            AlignWork
                        </h1>
                    </div>
                    <p className="text-white/90 drop-shadow-sm">
                        Sistema de gestão para profissionais de saúde
                    </p>
                </div>

                {/* Login Form */}
                <LoginForm onSuccess={handleSuccess} />

                {/* Footer */}
                <div className="text-center space-y-4">
                    <p className="text-sm text-black">
                        Não tem uma conta?{' '}
                        <Link
                            to="/register"
                            className="font-medium text-[#a76bf3] hover:opacity-90 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-white/40 transition-colors"
                        >
                            Criar conta
                        </Link>
                    </p>

                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="text-black hover:text-white hover:bg-[#A76BF3] transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                </div>
            </div>
        </div>
    );
};
