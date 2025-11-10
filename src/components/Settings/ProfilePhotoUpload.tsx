import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { User } from "@/types/auth";
import { Camera, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProfilePhotoUploadProps {
    user: User | null;
    photoFile: File | null;
    photoPreview: string | null;
    onPhotoChange: (file: File | null, preview: string | null) => void;
    onPhotoRemove: () => void;
}

/**
 * Componente para upload e gerenciamento de foto de perfil
 * 
 * - Exibe foto atual ou iniciais
 * - Permite selecionar nova foto (PNG, JPG)
 * - Preview antes de salvar
 * - Validação de tamanho (max 5MB) e formato
 * - Botão para remover foto
 */
export const ProfilePhotoUpload = ({
    user,
    photoFile,
    photoPreview,
    onPhotoChange,
    onPhotoRemove
}: ProfilePhotoUploadProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);

        // Validar tipo
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Formato não suportado. Use PNG ou JPG');
            return;
        }

        // Validar tamanho
        if (file.size > MAX_SIZE) {
            setError('Arquivo muito grande. Tamanho máximo: 5MB');
            return;
        }

        // Criar preview
        const reader = new FileReader();
        reader.onloadend = () => {
            onPhotoChange(file, reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveClick = () => {
        if (user?.profile_photo_url || photoPreview) {
            setShowRemoveDialog(true);
        }
    };

    const confirmRemove = () => {
        onPhotoRemove();
        setShowRemoveDialog(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const displayPhotoUrl = photoPreview || user?.profile_photo_url;

    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                {/* Avatar / Preview */}
                <div className="relative">
                    <UserAvatar user={user} size="xl" />
                    {photoPreview && (
                        <div className="absolute inset-0 rounded-full border-4 border-brand-purple animate-pulse" />
                    )}
                </div>

                {/* Controles */}
                <div className="flex flex-col gap-2 flex-1">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="gap-2"
                        >
                            <Camera className="w-4 h-4" />
                            {displayPhotoUrl ? 'Alterar foto' : 'Adicionar foto'}
                        </Button>

                        {displayPhotoUrl && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRemoveClick}
                                className="gap-2 text-destructive hover:text-destructive"
                            >
                                <Trash2 className="w-4 h-4" />
                                Remover
                            </Button>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <p className="text-xs text-muted-foreground">
                        Formatos: PNG, JPG • Tamanho máximo: 5MB
                    </p>

                    {photoPreview && (
                        <p className="text-xs text-brand-purple font-medium flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            Nova foto selecionada. Clique em "Salvar" para aplicar.
                        </p>
                    )}

                    {error && (
                        <p className="text-xs text-destructive font-medium">
                            {error}
                        </p>
                    )}
                </div>
            </div>

            {/* Dialog de confirmação de remoção */}
            <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover foto de perfil?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Sua foto de perfil será removida e substituída pelas iniciais do seu nome.
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemove}>
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

