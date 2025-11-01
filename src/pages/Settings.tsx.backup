import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";

/**
 * PÁGINA DE CONFIGURAÇÕES
 * 
 * Esta página permite ao usuário configurar suas preferências pessoais,
 * notificações e tema do sistema.
 */

const Settings = () => {
    const { settings, saveSettings } = useApp();
    const { toast } = useToast();

    // Estados locais para os controles da página
    const [notifications, setNotifications] = useState(settings.notificationsEnabled);
    const [emailReminders, setEmailReminders] = useState(settings.emailReminders);
    const [theme, setTheme] = useState(settings.theme);
    const [isLoading, setIsLoading] = useState(false);

    // Hidratar estados locais quando as configurações mudarem
    useEffect(() => {
        setNotifications(settings.notificationsEnabled);
        setEmailReminders(settings.emailReminders);
        setTheme(settings.theme);
    }, [settings]);

    const handleSaveSettings = async () => {
        setIsLoading(true);

        try {
            const newSettings = {
                notificationsEnabled: notifications,
                emailReminders: emailReminders,
                theme: theme,
                language: settings.language
            };

            // Salvar no contexto global e localStorage
            saveSettings(newSettings);

            // Simular delay para UX
            await new Promise(resolve => setTimeout(resolve, 400));

            // Exibir toast de sucesso
            toast({
                title: "Preferências salvas",
                description: "Suas configurações foram salvas com sucesso.",
            });
        } catch (error) {
            toast({
                title: "Erro ao salvar",
                description: "Ocorreu um erro ao salvar suas configurações.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Background idêntico ao da página de Login (copiado de src/pages/Login.tsx linha 18)
        <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,var(--g-from-pastel)_0%,var(--g-mid-pastel)_48%,var(--g-to-pastel)_100%)] p-4">
            <div className="w-full max-w-2xl space-y-6">
                {/* Topbar com botão Voltar */}
                <div className="flex justify-start">
                    <Link
                        to="/"
                        className="text-black hover:text-white transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Link>
                </div>

                {/* Header da página */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-white">
                        Configurações
                    </h1>
                    <p className="text-white/80">
                        Personalize sua experiência no AlignWork
                    </p>
                </div>

                {/* Card de Preferências */}
                <Card className="rounded-2xl bg-white text-black border border-black/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.25)] p-6 md:p-8">
                    <CardHeader>
                        <CardTitle className="text-xl">Preferências</CardTitle>
                        <CardDescription>
                            Configure suas preferências de notificação
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="notifications" className="text-base">
                                    Ativar notificações
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Receba notificações do sistema
                                </p>
                            </div>
                            <Switch
                                id="notifications"
                                checked={notifications}
                                onCheckedChange={setNotifications}
                                aria-checked={notifications}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="email-reminders" className="text-base">
                                    Receber lembretes por e-mail
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Receba lembretes importantes por e-mail
                                </p>
                            </div>
                            <Switch
                                id="email-reminders"
                                checked={emailReminders}
                                onCheckedChange={setEmailReminders}
                                aria-checked={emailReminders}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Card de Tema */}
                <Card className="rounded-2xl bg-white text-black border border-black/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.25)] p-6 md:p-8">
                    <CardHeader>
                        <CardTitle className="text-xl">Tema</CardTitle>
                        <CardDescription>
                            Escolha o tema da interface
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup value={theme} onValueChange={setTheme} className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="system" id="system" />
                                <Label htmlFor="system">Sistema</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="light" id="light" />
                                <Label htmlFor="light">Claro</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="dark" id="dark" />
                                <Label htmlFor="dark">Escuro</Label>
                            </div>
                        </RadioGroup>
                    </CardContent>
                </Card>

                {/* Card de Idioma */}
                <Card className="rounded-2xl bg-white text-black border border-black/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.25)] p-6 md:p-8">
                    <CardHeader>
                        <CardTitle className="text-xl">Idioma</CardTitle>
                        <CardDescription>
                            Selecione o idioma da interface
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select disabled>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Em breve" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* Botão Salvar */}
                <div className="flex justify-center">
                    <Button
                        onClick={handleSaveSettings}
                        disabled={isLoading}
                        aria-busy={isLoading}
                        className="bg-[linear-gradient(90deg,var(--g-from)_0%,var(--g-to)_100%)] bg-[length:200%_100%] bg-[position:0%_0%] hover:bg-[position:100%_0%] transition-[background-position] duration-1000 ease-in-out text-white rounded-xl h-10 px-4 font-medium focus-visible:ring-4 focus-visible:ring-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <SettingsIcon className="w-4 h-4 mr-2" />
                        {isLoading ? "Salvando..." : "Salvar alterações"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
