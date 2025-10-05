import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { User as UserIcon, Edit, Mail, Phone, MapPin, Calendar } from "lucide-react";

/**
 * PÁGINA DE PERFIL
 * 
 * Esta página exibe as informações do usuário e permite editar
 * dados pessoais através de um modal.
 */

const Profile = () => {
    const { user } = useAuth();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Estados para edição (apenas UI, sem persistência no backend)
    const [editedName, setEditedName] = useState(user?.full_name || "");
    const [editedEmail, setEditedEmail] = useState(user?.email || "");
    const [editedPhone, setEditedPhone] = useState("");
    const [editedAddress, setEditedAddress] = useState("");

    const getUserInitials = () => {
        if (user?.full_name) {
            return user.full_name
                .split(' ')
                .map(name => name[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        return user?.username?.slice(0, 2).toUpperCase() || 'U';
    };

    const handleSaveProfile = () => {
        // Aqui seria implementada a lógica para salvar as alterações no backend
        console.log("Perfil atualizado:", {
            name: editedName,
            email: editedEmail,
            phone: editedPhone,
            address: editedAddress,
        });
        setIsEditDialogOpen(false);
    };

    const handleCancelEdit = () => {
        // Resetar valores para os originais
        setEditedName(user?.full_name || "");
        setEditedEmail(user?.email || "");
        setEditedPhone("");
        setEditedAddress("");
        setIsEditDialogOpen(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-purple/10 via-brand-pink/5 to-brand-lime/10">
            <div className="max-w-5xl mx-auto p-6 md:p-10">
                {/* Header da página */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent mb-2">
                        Perfil
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Gerencie suas informações pessoais
                    </p>
                </div>

                {/* Card principal com dados do usuário */}
                <Card className="rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <UserIcon className="w-5 h-5 text-brand-purple" />
                            Dados do Usuário
                        </CardTitle>
                        <CardDescription>
                            Suas informações pessoais e de contato
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Avatar e informações básicas */}
                            <div className="flex flex-col items-center md:items-start space-y-4">
                                <Avatar className="w-24 h-24 border-4 border-white/30">
                                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-brand-purple to-brand-pink text-white">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="text-center md:text-left">
                                    <h3 className="text-xl font-semibold text-foreground">
                                        {user?.full_name || user?.username}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>

                            {/* Informações detalhadas */}
                            <div className="flex-1 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-brand-purple" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Email</p>
                                            <p className="font-medium">{user?.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-brand-purple" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Telefone</p>
                                            <p className="font-medium">Não informado</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-4 h-4 text-brand-purple" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Endereço</p>
                                            <p className="font-medium">Não informado</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-4 h-4 text-brand-purple" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Membro desde</p>
                                            <p className="font-medium">Não informado</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botão de editar */}
                        <div className="flex justify-end mt-6">
                            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        className="bg-[linear-gradient(90deg,var(--g-from)_0%,var(--g-to)_100%)] bg-[length:200%_100%] bg-[position:0%_0%] hover:bg-[position:100%_0%] transition-[background-position] duration-1000 ease-in-out text-white rounded-xl h-10 px-4 font-medium focus-visible:ring-4 focus-visible:ring-white/40"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar Perfil
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Editar Perfil</DialogTitle>
                                        <DialogDescription>
                                            Faça alterações nas suas informações pessoais.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="name" className="text-right">
                                                Nome
                                            </Label>
                                            <Input
                                                id="name"
                                                value={editedName}
                                                onChange={(e) => setEditedName(e.target.value)}
                                                className="col-span-3"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="email" className="text-right">
                                                Email
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={editedEmail}
                                                onChange={(e) => setEditedEmail(e.target.value)}
                                                className="col-span-3"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="phone" className="text-right">
                                                Telefone
                                            </Label>
                                            <Input
                                                id="phone"
                                                value={editedPhone}
                                                onChange={(e) => setEditedPhone(e.target.value)}
                                                className="col-span-3"
                                                placeholder="(11) 99999-9999"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="address" className="text-right">
                                                Endereço
                                            </Label>
                                            <Input
                                                id="address"
                                                value={editedAddress}
                                                onChange={(e) => setEditedAddress(e.target.value)}
                                                className="col-span-3"
                                                placeholder="Rua, número, cidade"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={handleCancelEdit}>
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={handleSaveProfile}
                                            className="bg-[linear-gradient(90deg,var(--g-from)_0%,var(--g-to)_100%)] bg-[length:200%_100%] bg-[position:0%_0%] hover:bg-[position:100%_0%] transition-[background-position] duration-1000 ease-in-out text-white"
                                        >
                                            Salvar
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Profile;

