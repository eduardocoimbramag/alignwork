import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, Building2 } from "lucide-react";

interface ProfileFormContentProps {
    formData: {
        first_name: string;
        last_name: string;
        email: string;
        phone_personal: string;
        phone_professional: string;
        phone_clinic: string;
    };
    errors: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone_personal?: string;
        phone_professional?: string;
        phone_clinic?: string;
    };
    onChange: (field: string, value: string) => void;
}

/**
 * Componente de formulário de perfil
 * 
 * Contém:
 * - Seção: Informações Pessoais (Nome, Sobrenome, Email)
 * - Seção: Contatos (Telefones: pessoal, profissional, clínica)
 */
export const ProfileFormContent = ({
    formData,
    errors,
    onChange
}: ProfileFormContentProps) => {
    // Máscara de telefone brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    const formatPhone = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        }
        return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    };

    const handlePhoneChange = (field: string, value: string) => {
        const formatted = formatPhone(value);
        onChange(field, formatted);
    };

    return (
        <div className="space-y-6">
            {/* Seção: Informações Pessoais */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <User className="w-5 h-5 text-brand-purple" />
                        Informações Pessoais
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Dados básicos da sua conta
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nome */}
                    <div className="space-y-2">
                        <Label htmlFor="first_name" className="required">
                            Nome *
                        </Label>
                        <Input
                            id="first_name"
                            value={formData.first_name}
                            onChange={(e) => onChange('first_name', e.target.value)}
                            placeholder="Ex: Eduardo"
                            className={errors.first_name ? 'border-destructive' : ''}
                        />
                        {errors.first_name && (
                            <p className="text-xs text-destructive">{errors.first_name}</p>
                        )}
                    </div>

                    {/* Sobrenome */}
                    <div className="space-y-2">
                        <Label htmlFor="last_name" className="required">
                            Sobrenome *
                        </Label>
                        <Input
                            id="last_name"
                            value={formData.last_name}
                            onChange={(e) => onChange('last_name', e.target.value)}
                            placeholder="Ex: Coimbra"
                            className={errors.last_name ? 'border-destructive' : ''}
                        />
                        {errors.last_name && (
                            <p className="text-xs text-destructive">{errors.last_name}</p>
                        )}
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 required">
                        <Mail className="w-4 h-4" />
                        Email *
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => onChange('email', e.target.value)}
                        placeholder="seu@email.com"
                        className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                        <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Este será seu email de login
                    </p>
                </div>
            </div>

            {/* Separador */}
            <div className="border-t" />

            {/* Seção: Contatos */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Phone className="w-5 h-5 text-brand-purple" />
                        Contatos
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Telefones para contato (opcionais)
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Telefone Pessoal */}
                    <div className="space-y-2">
                        <Label htmlFor="phone_personal">
                            Telefone Pessoal
                        </Label>
                        <Input
                            id="phone_personal"
                            type="tel"
                            value={formData.phone_personal}
                            onChange={(e) => handlePhoneChange('phone_personal', e.target.value)}
                            placeholder="(81) 99999-9999"
                            maxLength={15}
                            className={errors.phone_personal ? 'border-destructive' : ''}
                        />
                        {errors.phone_personal && (
                            <p className="text-xs text-destructive">{errors.phone_personal}</p>
                        )}
                    </div>

                    {/* Telefone Profissional */}
                    <div className="space-y-2">
                        <Label htmlFor="phone_professional">
                            Telefone Profissional
                        </Label>
                        <Input
                            id="phone_professional"
                            type="tel"
                            value={formData.phone_professional}
                            onChange={(e) => handlePhoneChange('phone_professional', e.target.value)}
                            placeholder="(81) 98888-8888"
                            maxLength={15}
                            className={errors.phone_professional ? 'border-destructive' : ''}
                        />
                        {errors.phone_professional && (
                            <p className="text-xs text-destructive">{errors.phone_professional}</p>
                        )}
                    </div>

                    {/* Telefone da Clínica */}
                    <div className="space-y-2">
                        <Label htmlFor="phone_clinic" className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Telefone da Clínica
                        </Label>
                        <Input
                            id="phone_clinic"
                            type="tel"
                            value={formData.phone_clinic}
                            onChange={(e) => handlePhoneChange('phone_clinic', e.target.value)}
                            placeholder="(81) 3333-3333"
                            maxLength={15}
                            className={errors.phone_clinic ? 'border-destructive' : ''}
                        />
                        {errors.phone_clinic && (
                            <p className="text-xs text-destructive">{errors.phone_clinic}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Telefone fixo ou comercial do consultório
                        </p>
                    </div>
                </div>
            </div>

            {/* Nota sobre campos obrigatórios */}
            <div className="text-xs text-muted-foreground">
                * Campos obrigatórios
            </div>
        </div>
    );
};

