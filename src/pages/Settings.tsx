import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Shield, 
  Building, 
  Settings as SettingsIcon, 
  ArrowLeft,
  Clock
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ConsultoriosContent } from "@/components/Settings/Consultorios/ConsultoriosContent";
import { ProfilePhotoUpload } from "@/components/Settings/ProfilePhotoUpload";
import { ProfileFormContent } from "@/components/Settings/ProfileFormContent";
import { getCurrentUser, updateUser, uploadProfilePhoto, deleteProfilePhoto } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserUpdatePayload } from "@/types/auth";

/**
 * PÁGINA DE CONFIGURAÇÕES - REFATORADA
 * 
 * Layout inspirado no Google Chrome Settings com sidebar de navegação.
 * - Sidebar: 4 abas (Perfil, Permissões, Consultórios, Sistema)
 * - Conteúdo: muda dinamicamente baseado na aba ativa
 * - Responsivo: stack vertical em mobile, duas colunas em desktop
 */

// Types
type TabId = 'perfil' | 'permissoes' | 'consultorios' | 'sistema';
type TimezoneValue = 'america-recife' | 'america-sao-paulo' | 'america-manaus';

interface NavigationItem {
  id: TabId;
  label: string;
  icon: typeof User;
  description: string;
}

const Settings = () => {
  // Estados de navegação
  const [activeTab, setActiveTab] = useState<TabId>('sistema');

  // Estados de configurações (sistema)
  const { settings, saveSettings } = useApp();
  const { theme } = useTheme(); // Usar tema do ThemeProvider
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(settings.notificationsEnabled);
  const [emailReminders, setEmailReminders] = useState(settings.emailReminders);
  const [timezone, setTimezone] = useState<TimezoneValue>('america-recife');
  const [isLoading, setIsLoading] = useState(false);

  // Hidratar estados locais quando as configurações mudarem
  useEffect(() => {
    setNotifications(settings.notificationsEnabled);
    setEmailReminders(settings.emailReminders);
  }, [settings]);

  // Itens de navegação
  const navigationItems: NavigationItem[] = [
    {
      id: 'perfil',
      label: 'Perfil',
      icon: User,
      description: 'Informações pessoais e dados de conta'
    },
    {
      id: 'permissoes',
      label: 'Permissões',
      icon: Shield,
      description: 'Controle de acesso e segurança'
    },
    {
      id: 'consultorios',
      label: 'Consultórios',
      icon: Building,
      description: 'Gerenciar locais de atendimento'
    },
    {
      id: 'sistema',
      label: 'Sistema',
      icon: SettingsIcon,
      description: 'Preferências gerais do sistema'
    }
  ];

  // Handler: Mudança de aba
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Salvar configurações
  const handleSaveSettings = async () => {
    setIsLoading(true);

    try {
      const newSettings = {
        notificationsEnabled: notifications,
        emailReminders: emailReminders,
        theme: theme, // Sincronizar tema do ThemeProvider com AppContext
        language: settings.language
      };

      saveSettings(newSettings);

      // TODO: Salvar timezone no backend
      // await api.updateUserSettings({ timezone });

      await new Promise(resolve => setTimeout(resolve, 400));

      toast({
        title: 'Preferências salvas',
        description: 'Suas configurações foram salvas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar suas configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,var(--g-from-pastel)_0%,var(--g-mid-pastel)_48%,var(--g-to-pastel)_100%)] p-4 md:p-8">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Botão Voltar */}
        <div className="flex justify-start">
          <Link
            to="/"
            className="text-black hover:text-white transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>

        {/* Header Principal */}
        <header className="text-center lg:text-left space-y-2 mb-8">
          <h1 className="text-4xl font-bold text-white">
            Configurações
          </h1>
          <p className="text-white/80">
            Personalize sua experiência no AlignWork
          </p>
        </header>

        {/* Container de Duas Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Coluna 1: Sidebar de Navegação */}
          <aside>
            <Card className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg lg:sticky lg:top-4">
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {navigationItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start text-left h-auto py-3 px-4 transition-all",
                        activeTab === item.id && "bg-brand-purple/10 text-brand-purple font-semibold"
                      )}
                      onClick={() => handleTabChange(item.id)}
                    >
                      <item.icon className="w-5 h-5 mr-3 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.label}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </div>
                      </div>
                    </Button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Coluna 2: Área de Conteúdo */}
          <main>
            {activeTab === 'perfil' && <PerfilContent />}
            {activeTab === 'permissoes' && <PermissoesContent />}
            {activeTab === 'consultorios' && <ConsultoriosContent />}
            {activeTab === 'sistema' && (
              <SistemaContent
        notifications={notifications}
        setNotifications={setNotifications}
        emailReminders={emailReminders}
        setEmailReminders={setEmailReminders}
        timezone={timezone}
                setTimezone={setTimezone}
                isLoading={isLoading}
                handleSaveSettings={handleSaveSettings}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Aba Sistema
// ============================================
interface SistemaContentProps {
  notifications: boolean;
  setNotifications: (value: boolean) => void;
  emailReminders: boolean;
  setEmailReminders: (value: boolean) => void;
  timezone: TimezoneValue;
  setTimezone: (value: TimezoneValue) => void;
  isLoading: boolean;
  handleSaveSettings: () => void;
}

const SistemaContent = ({
  notifications,
  setNotifications,
  emailReminders,
  setEmailReminders,
  timezone,
  setTimezone,
  isLoading,
  handleSaveSettings
}: SistemaContentProps) => {
  const { theme } = useTheme();
  
  return (
  <div className="space-y-6">
    {/* Header da Seção */}
    <div>
      <h2 className="text-2xl font-bold text-foreground">Sistema</h2>
      <p className="text-muted-foreground">
        Configure preferências gerais do sistema
      </p>
    </div>

    {/* Card: Notificações */}
    <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
      <CardHeader>
        <CardTitle>Notificações</CardTitle>
        <CardDescription>
          Gerencie como você recebe notificações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Switch: Ativar notificações */}
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
          />
        </div>

        <Separator />

        {/* Switch: Email reminders */}
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
          />
        </div>
      </CardContent>
    </Card>

    {/* Card: Aparência */}
    <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
        <CardDescription>
          Personalize o tema da interface
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ThemeToggle variant="detailed" showIcons showLabel />
      </CardContent>
    </Card>

    {/* Card: Região e Idioma */}
    <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
      <CardHeader>
        <CardTitle>Região e Idioma</CardTitle>
        <CardDescription>
          Configure preferências regionais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="timezone" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Fuso Horário
          </Label>
          <Select value={timezone} onValueChange={(value) => setTimezone(value as TimezoneValue)}>
            <SelectTrigger id="timezone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="america-recife">
                (GMT-3) Recife, Brasília
              </SelectItem>
              <SelectItem value="america-sao-paulo">
                (GMT-3) São Paulo
              </SelectItem>
              <SelectItem value="america-manaus">
                (GMT-4) Manaus
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Idioma</Label>
          <Select disabled defaultValue="pt-br">
            <SelectTrigger id="language">
              <SelectValue placeholder="Em breve" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt-br">Português (Brasil)</SelectItem>
              <SelectItem value="en-us">English (US)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Suporte para múltiplos idiomas em breve
          </p>
        </div>
      </CardContent>
    </Card>

    {/* Botão Salvar */}
    <div className="flex justify-end">
      <Button
        onClick={handleSaveSettings}
        disabled={isLoading}
        className="bg-[linear-gradient(90deg,var(--g-from)_0%,var(--g-to)_100%)] hover:opacity-90 text-white px-6"
      >
        <SettingsIcon className="w-4 h-4 mr-2" />
        {isLoading ? 'Salvando...' : 'Salvar alterações'}
      </Button>
    </div>
  </div>
  );
};

// ============================================
// COMPONENTE: Aba Perfil
// ============================================
const PerfilContent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados locais
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_personal: "",
    phone_professional: "",
    phone_clinic: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Buscar dados do usuário
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });

  // Hidratar form quando usuário for carregado
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone_personal: user.phone_personal || "",
        phone_professional: user.phone_professional || "",
        phone_clinic: user.phone_clinic || ""
      });
    }
  }, [user]);

  // Mutation para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name || formData.first_name.trim().length < 2) {
      newErrors.first_name = "Nome deve ter pelo menos 2 caracteres";
    }

    if (!formData.last_name || formData.last_name.trim().length < 2) {
      newErrors.last_name = "Sobrenome deve ter pelo menos 2 caracteres";
    }

    if (!formData.email || !formData.email.includes("@")) {
      newErrors.email = "Email inválido";
    }

    // Validar telefones (se preenchidos)
    const validatePhone = (phone: string) => {
      if (!phone) return true;
      const numbers = phone.replace(/\D/g, '');
      return numbers.length >= 10;
    };

    if (formData.phone_personal && !validatePhone(formData.phone_personal)) {
      newErrors.phone_personal = "Telefone deve ter pelo menos 10 dígitos";
    }

    if (formData.phone_professional && !validatePhone(formData.phone_professional)) {
      newErrors.phone_professional = "Telefone deve ter pelo menos 10 dígitos";
    }

    if (formData.phone_clinic && !validatePhone(formData.phone_clinic)) {
      newErrors.phone_clinic = "Telefone deve ter pelo menos 10 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler: Alterar campo do formulário
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handler: Salvar alterações
  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Upload de foto (se alterada)
      if (photoFile) {
        await uploadProfilePhoto(photoFile);
        setPhotoFile(null);
        setPhotoPreview(null);
      }

      // 2. Atualizar dados do perfil
      const payload: UserUpdatePayload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_personal: formData.phone_personal || undefined,
        phone_professional: formData.phone_professional || undefined,
        phone_clinic: formData.phone_clinic || undefined
      };

      await updateProfileMutation.mutateAsync(payload);

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso."
      });
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      
      let errorMessage = "Não foi possível salvar as alterações";
      
      if (error?.detail) {
        errorMessage = typeof error.detail === 'string' 
          ? error.detail 
          : "Erro de validação. Verifique os campos";
      }

      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Foto alterada
  const handlePhotoChange = (file: File | null, preview: string | null) => {
    setPhotoFile(file);
    setPhotoPreview(preview);
  };

  // Handler: Remover foto
  const handlePhotoRemove = async () => {
    try {
      if (user?.profile_photo_url) {
        // Remover do servidor
        await deleteProfilePhoto();
        queryClient.invalidateQueries({ queryKey: ['current-user'] });
        
        toast({
          title: "Foto removida",
          description: "Sua foto de perfil foi removida com sucesso"
        });
      }
      
      // Limpar preview local
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error: any) {
      console.error("Erro ao remover foto:", error);
      
      toast({
        title: "Erro ao remover foto",
        description: "Não foi possível remover a foto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Perfil</h2>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais
        </p>
      </div>

      {/* Card: Foto de Perfil */}
      <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
          <CardDescription>
            Adicione uma foto para personalizar seu perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfilePhotoUpload
            user={user || null}
            photoFile={photoFile}
            photoPreview={photoPreview}
            onPhotoChange={handlePhotoChange}
            onPhotoRemove={handlePhotoRemove}
          />
        </CardContent>
      </Card>

      {/* Card: Dados do Perfil */}
      <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
        <CardHeader>
          <CardTitle>Dados do Perfil</CardTitle>
          <CardDescription>
            Atualize suas informações pessoais e de contato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileFormContent
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
          />
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            // Resetar para valores do usuário
            if (user) {
              setFormData({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
                phone_personal: user.phone_personal || "",
                phone_professional: user.phone_professional || "",
                phone_clinic: user.phone_clinic || ""
              });
            }
            setPhotoFile(null);
            setPhotoPreview(null);
            setErrors({});
          }}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-[linear-gradient(90deg,var(--g-from)_0%,var(--g-to)_100%)] hover:opacity-90 text-white px-6"
        >
          {isLoading ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Aba Permissões (Placeholder)
// ============================================
const PermissoesContent = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-foreground">Permissões</h2>
      <p className="text-muted-foreground">
        Controle de acesso e segurança
      </p>
    </div>

    <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-purple/10">
            <Shield className="w-8 h-8 text-brand-purple" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              Configurações de Permissões
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Esta seção estará disponível em breve.
            </p>
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Gerencie permissões de usuários, controle de acesso por função 
            (admin, médico, recepcionista) e configurações de segurança.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default Settings;
