import { Calendar, Users, BarChart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

/**
 * COMPONENTE DE NAVEGAÇÃO MOBILE
 * 
 * Este menu aparece quando o usuário está no celular.
 * É um menu lateral (hambúrguer) com as principais opções do sistema.
 * 
 * Funcionalidades:
 * - Menu retrátil (slide-in)
 * - Links para todas as seções principais
 * - Design adaptado para toque em dispositivos móveis
 */

const MobileNav = () => {
  return (
    <Sheet>
      {/* Botão que abre o menu (apenas visível no mobile) */}
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      
      {/* Conteúdo do menu lateral */}
      <SheetContent side="left" className="w-72">
        <div className="flex flex-col space-y-4 mt-6">
          {/* Logo do app no menu */}
          <div className="flex items-center space-x-3 pb-4 border-b">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">AgendaPro</h2>
              <p className="text-sm text-muted-foreground">Gestão Profissional</p>
            </div>
          </div>
          
          {/* Menu de navegação */}
          <nav className="flex flex-col space-y-2">
            <Button 
              variant="ghost" 
              className="justify-start text-foreground hover:bg-brand-pink/20"
            >
              <BarChart className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
            
            <Button 
              variant="ghost" 
              className="justify-start text-foreground hover:bg-brand-pink/20"
            >
              <Calendar className="w-4 h-4 mr-3" />
              Agenda
            </Button>
            
            <Button 
              variant="ghost" 
              className="justify-start text-foreground hover:bg-brand-pink/20"
            >
              <Users className="w-4 h-4 mr-3" />
              Clientes
            </Button>
          </nav>
          
          {/* Informações do usuário na parte inferior */}
          <div className="mt-auto pt-4 border-t">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-green to-brand-lime flex items-center justify-center">
                <span className="text-sm font-semibold text-white">Dr</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Dr. Silva</p>
                <p className="text-sm text-muted-foreground">Dentista</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;