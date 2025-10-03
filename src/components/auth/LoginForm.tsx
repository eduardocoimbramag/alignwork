import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
    onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading } = useAuth();
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            await login(data);
            toast({
                title: 'Login realizado com sucesso!',
                description: 'Bem-vindo ao AlignWork.',
            });
            onSuccess?.();
        } catch (error: any) {
            toast({
                title: 'Erro no login',
                description: error.detail || error.message || 'Credenciais inválidas',
                variant: 'destructive',
            });
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto bg-white/15 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] rounded-2xl">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-extrabold text-center text-[#a76bf3]">
                    Entrar
                </CardTitle>
                <CardDescription className="text-center text-black/80">
                    Entre com suas credenciais para acessar sua conta
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                className="pl-10"
                                {...register('email')}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Sua senha"
                                className="pl-10 pr-10"
                                {...register('password')}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-destructive">{errors.password.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 rounded-xl font-semibold text-white bg-[linear-gradient(90deg,var(--g-from)_0%,var(--g-to)_100%)] hover:bg-[linear-gradient(90deg,var(--g-to)_0%,var(--g-from)_100%)] focus-visible:ring-4 focus-visible:ring-white/40 transition-all duration-200"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Entrando...
                            </>
                        ) : (
                            'Entrar'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
