import { Link } from "react-router-dom";
import { ChevronLeft, FileText } from "lucide-react";

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Voltar para Home
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent">
                        <span className="font-display text-xl font-bold text-accent-foreground">K</span>
                    </div>
                    <h1 className="text-3xl font-bold">Termos de Serviço</h1>
                </div>

                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                    <section>
                        <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
                        <p>
                            Ao aceder e utilizar o Angola Finance, concorda em cumprir e estar vinculado a estes Termos de Serviço. Se não concordar com qualquer parte destes termos, não deverá utilizar a nossa plataforma.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
                        <p>
                            Angola Finance é uma plataforma de gestão financeira que oferece ferramentas de orçamento, poupança, investimento e educação financeira adaptadas à realidade angolana.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground">3. Contas de Utilizador</h2>
                        <p>
                            Para utilizar determinadas funcionalidades, deve criar uma conta. É responsável por manter a confidencialidade da sua conta e palavra-passe e por todas as actividades que ocorram sob a sua conta.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground">4. Assinaturas e Pagamentos</h2>
                        <p>
                            Algumas partes do serviço são pagas numa base de assinatura. Será facturado com antecedência de forma recorrente (mensal). Pode cancelar a sua assinatura a qualquer momento, mas não haverá reembolsos por períodos já pagos, excepto quando exigido por lei.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground">5. Uso Aceitável</h2>
                        <p>
                            Concorda em não utilizar a plataforma para qualquer finalidade ilegal ou proibida por estes termos. Não deverá tentar interferir com o funcionamento adequado da plataforma.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground">6. Isenção de Responsabilidade Financeira</h2>
                        <p>
                            A Angola Finance fornece ferramentas e informações para fins educativos e de planeamento. Não prestamos aconselhamento financeiro profissional ou recomendações de investimento. Todas as decisões financeiras tomadas são de sua inteira responsabilidade.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground">7. Alterações aos Termos</h2>
                        <p>
                            Reservamo-nos o direito de modificar ou substituir estes termos a qualquer momento. Se as alterações forem significativas, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência antes de os novos termos entrarem em vigor.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground">8. Limitação de Responsabilidade</h2>
                        <p>
                            Na extensão permitida pela lei aplicável, a Angola Finance não será responsável por quaisquer danos indirectos, incidentais, especiais ou consequentes resultantes do seu uso ou incapacidade de usar o serviço.
                        </p>
                    </section>

                    <p className="pt-8 text-xs italic">Última actualização: 09 de Fevereiro de 2026</p>
                </div>
            </div>
        </div>
    );
}
