import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

type Props = {
    isOpen: boolean
    onClose: () => void
    paciente: string
    data: string
    hora: string
    onConfirm: () => Promise<void> | void
    isLoading?: boolean
}

export function ConfirmarConsultaModal({ isOpen, onClose, paciente, data, hora, onConfirm, isLoading }: Props) {
    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Deseja confirmar a consulta de {paciente} no dia {data} às {hora}?
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose} disabled={!!isLoading}>Não</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} disabled={!!isLoading}>Sim</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}


