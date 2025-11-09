import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

/**
 * COMPONENTE PRINCIPAL DO ALIGNWORK
 * 
 * Este é o coração do sistema. Ele:
 * - Configura o roteamento (qual página mostrar para cada URL)
 * - Configura o sistema de notificações (toasts)
 * - Configura o cliente para fazer requisições (React Query)
 * - Configura o contexto global de dados (AppProvider)
 * 
 * Rotas disponíveis:
 * - "/" = Dashboard (tela inicial)
 * - Outras rotas serão adicionadas aqui conforme o sistema cresce
 */

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <AuthProvider>
          <ThemeProvider>
            <AppProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Rotas públicas */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Rotas protegidas */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/configuracoes" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/perfil" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />

                  {/* Futuras rotas do sistema serão adicionadas aqui */}
                  {/* Exemplo: <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} /> */}
                  {/* Exemplo: <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} /> */}

                  {/* SEMPRE MANTER ESTA ROTA POR ÚLTIMO - captura URLs inválidas */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
            </AppProvider>
          </ThemeProvider>
        </AuthProvider>
      </TenantProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
