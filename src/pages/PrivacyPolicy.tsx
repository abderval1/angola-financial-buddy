import { Link } from "react-router-dom";
import { ChevronLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Voltar para Home
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent">
                        <span className="font-display text-xl font-bold text-accent-foreground">A</span>
                    </div>
                    <h1 className="text-3xl font-bold">Política de Privacidade</h1>
                </div>

                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                    <section>
                        <h2 className="text-xl font-semibold text-foreground">1. Introdução</h2>
                        <p>
                            A AngolaFinance ("nós", "nosso" ou "nos") está comprometida em proteger a sua privacidade. Esta Política de Privacidade explica como recolhemos, utilizamos, divulgamos e protegemos as suas informações quando utiliza a nossa plataforma.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground">2. Informações que Recolhemos</h2>
                        <p>Recolhemos informações que nos fornece directamente, tais como:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Informações de conta: Nome, endereço de e-mail e palavra-passe.</li>
                            <li>Dados financeiros: Dados de orçamento, receitas, despesas e metas de poupança que insere na plataforma.</li>
                            <li>Comunicações: Informações que nos fornece quando nos contacta para suporte.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground">3. Utilização das Informações</h2>
                        <p>Utilizamos as informações recolhidas para:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Fornecer, manter e melhorar os nossos serviços.</li>
                            <li>Personalizar a sua experiência na plataforma.</li>
                            <li>Processar as suas transacções e assinaturas.</li>
                            <li>Enviar comunicações sobre o serviço e suporte técnico.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground">4. Google OAuth</h2>
                        <p>
                            Ao utilizar o login com o Google, acedemos ao seu nome e endereço de e-mail para facilitar a criação da sua conta e autenticação. Não partilhamos estes dados com terceiros para fins publicitários.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground">5. Segurança dos Dados</h2>
                        <p>
                            Implementamos medidas técnicas e organizativas adequadas para proteger a segurança das suas informações. No entanto, lembre-se que nenhum método de transmissão pela Internet é 100% seguro.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground">6. Seus Direitos</h2>
                        <p>
                            Tem o direito de aceder, corrigir ou eliminar as suas informações pessoais a qualquer momento através das definições da sua conta ou contactando o nosso suporte.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground">7. Contacto</h2>
                        <p>
                            Se tiver dúvidas sobre esta Política de Privacidade, contacte-nos através do suporte oficial da AngolaFinance.
                        </p>
                    </section>

                    <p className="pt-8 text-xs italic">Última actualização: 09 de Fevereiro de 2026</p>
                </div>
            </div>
        </div>
    );
}
