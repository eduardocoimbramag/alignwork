import { Calendar, Bell, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import MobileNav from "./MobileNav";

/**
 * COMPONENTE HEADER (CABEÇALHO)
 * 
 * Este é o cabeçalho do sistema que aparece no topo de todas as páginas.
 * Contém:
 * - Logo/título do sistema
 * - Menu de navegação principal (desktop)
 * - Menu hambúrguer (mobile)
 * - Botões de notificação e configurações
 */

const Header = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout.",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = () => {
    if (!user) return "U";

    // Prioridade 1: first_name + last_name
    if (user.first_name && user.last_name) {
      const first = user.first_name.charAt(0).toUpperCase();
      const last = user.last_name.charAt(0).toUpperCase();
      return first + last;
    }

    // Prioridade 2: apenas first_name
    if (user.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }

    // Prioridade 3: email (fallback)
    if (user.email) {
      const emailPrefix = user.email.split('@')[0];
      return emailPrefix.slice(0, 2).toUpperCase() || 'U';
    }

    // Prioridade 4: full_name (deprecated, compatibilidade)
    if (user.full_name) {
      return user.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }

    return 'U';
  };

  return (
    <header className="bg-gradient-to-r from-brand-purple/90 to-brand-pink/90 backdrop-blur-sm border-b border-white/20 shadow-lg sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        {/* LADO ESQUERDO: Menu mobile + Logo */}
        <div className="flex items-center space-x-3">
          <MobileNav />

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AlignWork</h1>
              <p className="text-sm text-white/80 hidden sm:block">Gestão Profissional</p>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: Ações do usuário */}
        <div className="flex items-center space-x-2">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-1">
            <ThemeToggle variant="compact" />
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Bell className="w-4 h-4" />
          </Button>

          {/* Avatar do usuário com dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-8 h-8 rounded-full border-2 border-white bg-white flex items-center justify-center p-0 hover:bg-white/90">
                <span className="text-xs font-semibold text-brand-purple">
                  {getUserInitials()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.first_name && user?.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user?.first_name || user?.full_name || user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/configuracoes" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;