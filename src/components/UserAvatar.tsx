import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/types/auth";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    user: User | null;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

/**
 * Componente Avatar reutilizável para exibir foto ou iniciais do usuário
 * 
 * - Se o usuário tiver foto (profile_photo_url), exibe a foto
 * - Se não tiver foto, exibe as iniciais (primeira letra do first_name + primeira letra do last_name)
 * - Exemplo: "Eduardo Coimbra" → "EC"
 * 
 * @param user - Objeto do usuário com dados de perfil
 * @param size - Tamanho do avatar: sm (32px), md (40px), lg (64px), xl (96px)
 * @param className - Classes CSS adicionais
 */
export const UserAvatar = ({ user, size = "md", className }: UserAvatarProps) => {
    const getInitials = (user: User | null): string => {
        if (!user) return "?";
        
        const first = user.first_name?.charAt(0).toUpperCase() || "";
        const last = user.last_name?.charAt(0).toUpperCase() || "";
        
        if (first && last) {
            return first + last;
        }
        
        if (first) return first;
        if (last) return last;
        
        // Fallback: usar email
        if (user.email) {
            return user.email.charAt(0).toUpperCase();
        }
        
        return "?";
    };

    const sizeClasses = {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-16 w-16 text-lg",
        xl: "h-24 w-24 text-2xl"
    };

    const photoUrl = user?.profile_photo_url 
        ? `${import.meta.env.VITE_API_URL || "http://localhost:8000"}${user.profile_photo_url}`
        : undefined;

    return (
        <Avatar className={cn(sizeClasses[size], className)}>
            {photoUrl && (
                <AvatarImage 
                    src={photoUrl} 
                    alt={`${user?.first_name || "User"} ${user?.last_name || ""}`}
                />
            )}
            <AvatarFallback className="bg-gradient-to-br from-brand-purple to-brand-pink text-white font-bold">
                {getInitials(user)}
            </AvatarFallback>
        </Avatar>
    );
};

