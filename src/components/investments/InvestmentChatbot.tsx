import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebLLM, FINANCIAL_ASSISTANT_SYSTEM_PROMPT } from '@/hooks/useWebLLM';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface InvestmentData {
    totalInvested: number;
    totalCurrentValue: number;
    totalReturn: number;
    returnPercentage: number;
    investments: {
        name: string;
        type: string;
        amount: number;
        currentValue: number;
        returnPercent: number;
    }[];
}

interface InvestmentChatbotProps {
    investmentData: InvestmentData;
}

export function InvestmentChatbot({ investmentData }: InvestmentChatbotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        isLoading,
        isInitialized,
        progress,
        error,
        initialize,
        chat,
        clearHistory
    } = useWebLLM({
        systemPrompt: `${FINANCIAL_ASSISTANT_SYSTEM_PROMPT}

Dados atuais do utilizador em investimentos:
- Total investido: ${investmentData.totalInvested.toLocaleString('pt-AO')} Kz
- Valor atual: ${investmentData.totalCurrentValue.toLocaleString('pt-AO')} Kz
- Retorno total: ${investmentData.totalReturn.toLocaleString('pt-AO')} Kz
- Percentagem de retorno: ${investmentData.returnPercentage.toFixed(2)}%

Lista de investimentos:
${investmentData.investments.map(inv => `- ${inv.name} (${inv.type}): investido ${inv.amount.toLocaleString('pt-AO')} Kz, valor atual ${inv.currentValue.toLocaleString('pt-AO')} Kz, retorno ${inv.returnPercent.toFixed(2)}%`).join('\n')}

Sempre que possível, use estes dados concretos para responder às perguntas.`,
        onChunk: (chunk) => {
            // Atualiza a última mensagem em tempo real
            setMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                    return [
                        ...prev.slice(0, -1),
                        { ...lastMessage, content: lastMessage.content + chunk }
                    ];
                }
                return prev;
            });
        },
        onComplete: () => {
            // Scroll para o final quando a resposta estiver completa
        },
        onError: (err) => {
            console.error('Erro no chatbot:', err);
        }
    });

    // Inicializar modelo quando o chatbot abre
    useEffect(() => {
        if (isOpen && !isInitialized && messages.length === 0) {
            initialize().then(() => {
                // Adicionar mensagem de boas-vindas
                setMessages([
                    {
                        id: 'welcome',
                        role: 'assistant',
                        content: 'Olá! Sou o seu assistente de investimentos. Pode fazer perguntas sobre os seus investimentos, como por exemplo:\n\n- "Quanto tenho investido no total?"\n- "Quais são os meus melhores investimentos?"\n- "Devo diversificar a minha carteira?"\n- "Qual é o meu retorno até agora?"\n\nComo posso ajudar?',
                        timestamp: new Date()
                    }
                ]);
            });
        }
    }, [isOpen, isInitialized, initialize, messages.length]);

    // Scroll para o final quando há novas mensagens
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        };

        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setInputValue('');

        try {
            await chat(userMessage.content);
        } catch (err) {
            setMessages(prev => [
                ...prev.slice(0, -1),
                { ...assistantMessage, content: 'Desculpe, ocorreu um erro ao processar a sua mensagem. Por favor, tente novamente.' }
            ]);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 z-50"
                size="icon"
            >
                <Sparkles className="h-6 w-6" />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] flex flex-col shadow-xl z-50 bg-background border-primary/20">
            {/* Header */}
            <CardHeader className="flex-shrink-0 py-3 px-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-semibold">Assistente de Investimentos</CardTitle>
                            <p className="text-xs text-muted-foreground">
                                {isInitialized
                                    ? (isLoading ? 'A processar...' : 'Online')
                                    : `${progress}% carregado`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setIsMinimized(!isMinimized)}
                        >
                            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                                setIsOpen(false);
                                setIsMinimized(false);
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {/* Error message */}
            {error && (
                <div className="mx-4 mt-2 p-2 bg-destructive/10 text-destructive text-xs rounded">
                    {error.message.includes('Failed to fetch')
                        ? 'Erro de conexão. O modelo está a ser baixado do servidor e pode demorar. Tente novamente ou use uma VPN.'
                        : error.message}
                </div>
            )}

            {/* Messages */}
            {!isMinimized && (
                <>
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                        {!isInitialized && messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    A carregar TinyLlama...
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {progress}% concluído
                                </p>
                            </div>
                        )}

                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        <Bot className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] rounded-lg px-3 py-2 ${message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p className="text-xs opacity-50 mt-1">
                                        {message.timestamp.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                {message.role === 'user' && (
                                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                            <div className="flex gap-2 justify-start">
                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Bot className="h-4 w-4 text-primary" />
                                </div>
                                <div className="bg-muted rounded-lg px-3 py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </CardContent>

                    {/* Input */}
                    <div className="flex-shrink-0 p-3 border-t bg-muted/30">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Escreva a sua mensagem..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button
                                onClick={handleSend}
                                disabled={isLoading || !inputValue.trim()}
                                size="icon"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </Card>
    );
}
