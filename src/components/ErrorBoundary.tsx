import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
        // TODO: Sentry.captureException(error, { extra: errorInfo });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Ops! Algo deu errado
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Desculpe, encontramos um erro inesperado.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-4 text-left">
                                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                                    Detalhes do erro (apenas em desenvolvimento)
                                </summary>
                                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-48">
                                    <div className="font-semibold mb-2">Mensagem:</div>
                                    {this.state.error.message}
                                    
                                    <div className="font-semibold mt-4 mb-2">Stack:</div>
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                        <Button onClick={this.handleReset} className="w-full">
                            Recarregar Aplicação
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

