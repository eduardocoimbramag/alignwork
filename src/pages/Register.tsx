import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm';
import { Button } from '../components/ui/button';
import { Heart, ArrowLeft } from 'lucide-react';

export const Register: React.FC = () => {
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate('/dashboard', { replace: true });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-pink/25 via-brand-purple/20 to-brand-lime/25 p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                        <Heart className="h-8 w-8 text-white drop-shadow-sm" />
                        <h1 className="text-3xl font-bold text-white drop-shadow-sm">
                            AlignWork
                        </h1>
                    </div>
                    <p className="text-white/90 drop-shadow-sm">
                        Sistema de gestão para profissionais de saúde
                    </p>
                </div>

                {/* Register Form */}
                <RegisterForm onSuccess={handleSuccess} />

                {/* Footer */}
                <div className="text-center space-y-4">
                    <p className="text-sm text-white/90 drop-shadow-sm">
                        Já tem uma conta?{' '}
                        <Link
                            to="/login"
                            className="font-medium text-white hover:text-white/80 transition-colors drop-shadow-sm"
                        >
                            Fazer login
                        </Link>
                    </p>

                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="text-white/90 hover:text-white hover:bg-white/10 transition-colors drop-shadow-sm"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                </div>
            </div>
        </div>
    );
};
