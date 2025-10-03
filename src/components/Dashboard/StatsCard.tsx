import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * COMPONENTE STATSCARD (CARTÃO DE ESTATÍSTICAS)
 * 
 * Este componente é reutilizado para mostrar estatísticas no dashboard.
 * Cada cartão mostra um número importante (ex: consultas hoje, clientes total).
 * 
 * Props (parâmetros que recebe):
 * - title: título do cartão (ex: "Consultas Hoje")
 * - value: valor principal (ex: "12")
 * - description: descrição adicional (ex: "3 ainda hoje")
 * - icon: ícone do cartão
 * - gradient: cor do gradiente de fundo
 */

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  gradient?: string;
  actionButton?: ReactNode;
}

const StatsCard = ({ title, value, description, icon, gradient = "from-brand-purple to-brand-pink", actionButton }: StatsCardProps) => {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg" style={{ backgroundColor: 'rgb(252, 249, 252)' }}>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-brand-purple opacity-70 absolute top-6 right-[1.85rem]">
          {icon}
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="text-2xl font-bold text-foreground mb-1">
          {value}
        </div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
        {actionButton && (
          <div className="absolute bottom-6 right-6">
            {actionButton}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;