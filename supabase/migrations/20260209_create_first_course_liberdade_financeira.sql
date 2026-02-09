-- Curso Completo: Fundamentos da Liberdade Financeira em Angola
-- Migration para inserir o primeiro curso obrigatório

-- 1. Inserir o curso principal
DO $$
DECLARE
  v_course_id UUID;
  v_admin_id UUID;
  v_module1_id UUID;
  v_module2_id UUID;
  v_module3_id UUID;
  v_module4_id UUID;
  v_module5_id UUID;
  v_module6_id UUID;
  v_quiz_id UUID;
BEGIN
  -- Obter um admin existente para ser o autor
  SELECT user_id INTO v_admin_id FROM user_roles WHERE role = 'admin' LIMIT 1;
  
  -- Verificar se o curso já existe
  IF NOT EXISTS (SELECT 1 FROM educational_content WHERE title = 'Fundamentos da Liberdade Financeira em Angola') THEN
    
    -- Inserir o curso principal
    INSERT INTO educational_content (
      title,
      slug,
      description,
      content,
      category,
      content_type,
      difficulty_level,
      duration_minutes,
      is_premium,
      is_published,
      thumbnail_url,
      points_reward,
      author_id
    ) VALUES (
      'Fundamentos da Liberdade Financeira em Angola',
      'fundamentos-liberdade-financeira-angola',
      'Este curso é o ponto de partida para qualquer angolano que deseja sair do aperto financeiro, organizar o salário, eliminar dívidas, poupar com inteligência e começar a investir mesmo ganhando pouco. Totalmente prático, adaptado ao custo de vida, salários e oportunidades reais de Angola.',
      '<p>Bem-vindo ao curso que vai transformar a sua relação com o dinheiro! Em Angola, onde o custo de vida aumenta constantemente e os salários muitas vezes não acompanham, é fundamental aprender a gerir bem cada kwanza.</p>
      <p>Neste curso, vai aprender:</p>
      <ul>
        <li>A verdade sobre porque o dinheiro nunca chega ao fim do mês</li>
        <li>Como desenvolver uma mentalidade financeira vencedora</li>
        <li>Métodos práticos de orçamento adaptados à realidade angolana</li>
        <li>Estratégias para sair das dívidas sem desespero</li>
        <li>Como poupar mesmo com salário baixo</li>
        <li>Os primeiros passos para a liberdade financeira</li>
      </ul>',
      'financas',
      'course',
      'iniciante',
      90,
      false,
      true,
      NULL,
      100,
      v_admin_id
    ) RETURNING id INTO v_course_id;

    -- ============================================
    -- MÓDULO 1: A Realidade Financeira do Angolano
    -- ============================================
    INSERT INTO course_modules (
      course_id,
      title,
      description,
      content,
      media_type,
      duration_minutes,
      order_index,
      is_free,
      thumbnail_url
    ) VALUES (
      v_course_id,
      'A Realidade Financeira do Angolano',
      'Entender por que o dinheiro nunca chega até ao fim do mês e como a realidade económica de Angola afecta as suas finanças pessoais.',
      '<h2>Bem-vindo à Jornada da Transformação Financeira</h2>
      
      <p>Antes de aprender a gerir o dinheiro, precisamos entender a realidade em que vivemos. Em Angola, enfrentamos desafios únicos que não encontramos nos livros de finanças escritos para outros países.</p>
      
      <h3>📊 O Cenário Económico Angolano</h3>
      <p>Angola é um país com enormes recursos naturais, mas a maioria da população vive com rendimentos que mal cobrem as necessidades básicas. Alguns factos importantes:</p>
      <ul>
        <li><strong>Salário mínimo:</strong> Actualmente cerca de 32.000 Kz, insuficiente para cobrir despesas básicas em Luanda</li>
        <li><strong>Inflação:</strong> Os preços sobem constantemente, especialmente em alimentos e transportes</li>
        <li><strong>Custo de vida:</strong> Luanda está entre as cidades mais caras de África</li>
        <li><strong>Dolarização informal:</strong> Muitos bens são precificados em dólares, criando instabilidade</li>
      </ul>
      
      <h3>🏠 Onde Vai o Salário do Angolano?</h3>
      <p>Um estudo informal mostra que a maioria dos angolanos gasta assim:</p>
      <ul>
        <li><strong>Alimentação:</strong> 40-60% do salário (só em comida!)</li>
        <li><strong>Transporte:</strong> 15-25% (combustível ou táxis)</li>
        <li><strong>Renda/Habitação:</strong> 20-40%</li>
        <li><strong>Comunicações:</strong> 5-10%</li>
        <li><strong>O que sobra:</strong> Quase nada para poupança</li>
      </ul>
      
      <h3>❌ Os Erros Mais Comuns</h3>
      <ol>
        <li><strong>Viver acima das possibilidades:</strong> Comprar carro a crédito sem ter reserva</li>
        <li><strong>Gastos sociais excessivos:</strong> Festas, casamentos, funerais consomem poupanças</li>
        <li><strong>Falta de controlo:</strong> Não saber exactamente quanto entra e quanto sai</li>
        <li><strong>Crédito fácil:</strong> Aceitar prestações sem calcular o impacto total</li>
        <li><strong>Mentalidade de escassez:</strong> "O dinheiro não dá, por isso nem vale a pena tentar"</li>
      </ol>
      
      <h3>💡 A Boa Notícia</h3>
      <p>A situação difícil não significa que não há solução. Milhares de angolanos conseguem viver bem, poupar e até investir com salários modestos. A diferença está na <strong>gestão</strong>, não apenas no valor que ganham.</p>
      
      <h3>✅ O Que Vais Aprender Neste Curso</h3>
      <p>Nos próximos módulos, vamos trabalhar juntos para:</p>
      <ul>
        <li>Mudar a forma como pensas sobre dinheiro</li>
        <li>Criar um sistema simples de organização financeira</li>
        <li>Reduzir dívidas de forma estratégica</li>
        <li>Começar a poupar, mesmo que seja pouco</li>
        <li>Dar os primeiros passos para a liberdade financeira</li>
      </ul>
      
      <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-top: 20px;">
        <p><strong>📝 Reflexão:</strong> Antes de seguir para o próximo módulo, anota quanto ganhas por mês e tenta lembrar onde foi o dinheiro do mês passado. Esta consciência é o primeiro passo.</p>
      </div>',
      'text',
      15,
      0,
      true,
      NULL
    ) RETURNING id INTO v_module1_id;

    -- ============================================
    -- MÓDULO 2: Mentalidade Financeira
    -- ============================================
    INSERT INTO course_modules (
      course_id,
      title,
      description,
      content,
      media_type,
      duration_minutes,
      order_index,
      is_free,
      thumbnail_url
    ) VALUES (
      v_course_id,
      'Mentalidade Financeira: Pobre, Média ou Rica',
      'O dinheiro começa na cabeça antes de chegar à conta. Descobre como as tuas crenças afectam as tuas decisões.',
      '<h2>A Batalha Acontece na Mente Primeiro</h2>
      
      <p>Já reparaste que existem pessoas que ganham bem mas estão sempre sem dinheiro, enquanto outras com salários modestos conseguem viver com tranquilidade? A diferença está na <strong>mentalidade</strong>.</p>
      
      <h3>🧠 Os Três Tipos de Mentalidade Financeira</h3>
      
      <h4>1. Mentalidade de Sobrevivência (Pobre)</h4>
      <ul>
        <li>"Dinheiro é para gastar, senão os outros pedem"</li>
        <li>"Rico é quem roubou ou teve sorte"</li>
        <li>"Poupar para quê se a vida é curta?"</li>
        <li>"Amanhã Deus ajuda"</li>
      </ul>
      <p>Esta mentalidade mantém a pessoa num ciclo de escassez permanente.</p>
      
      <h4>2. Mentalidade da Classe Média</h4>
      <ul>
        <li>"Preciso de um bom emprego com bom salário"</li>
        <li>"Vou comprar casa e carro a crédito"</li>
        <li>"Trabalhar muito é a chave do sucesso"</li>
        <li>"A reforma vai cuidar de mim"</li>
      </ul>
      <p>Parece seguro, mas cria dependência do emprego e endividamento.</p>
      
      <h4>3. Mentalidade de Abundância (Rica)</h4>
      <ul>
        <li>"Como posso fazer o dinheiro trabalhar para mim?"</li>
        <li>"Primeiro me pago, depois pago as contas"</li>
        <li>"Invisto em conhecimento e em activos"</li>
        <li>"Crio múltiplas fontes de rendimento"</li>
      </ul>
      <p>Esta mentalidade constrói riqueza a longo prazo.</p>
      
      <h3>🇦🇴 Crenças Culturais que Afectam as Finanças em Angola</h3>
      
      <h4>A Pressão Familiar</h4>
      <p>Em Angola, quando alguém "tem", espera-se que ajude toda a família. Isso é bonito, mas pode destruir qualquer plano financeiro se não for gerido.</p>
      <p><strong>Solução:</strong> Define um valor fixo mensal para ajudar a família, tratando como uma despesa obrigatória no orçamento. Acima desse valor, a resposta é "não tenho".</p>
      
      <h4>O Status Social</h4>
      <p>"O que vão pensar de mim?" — Esta pergunta leva muitos angolanos a gastarem em carros, roupas e festas que não podem pagar.</p>
      <p><strong>Solução:</strong> Lembra-te que wealth (riqueza) é diferente de rich (aparência rica). O objectivo é ter tranquilidade, não impressionar os outros.</p>
      
      <h4>Crenças Religiosas</h4>
      <p>Algumas interpretações religiosas desencorajam o foco no dinheiro ou prometem prosperidade sem acção.</p>
      <p><strong>Solução:</strong> Fé e finanças podem coexistir. A maioria das tradições religiosas valoriza a boa administração e o trabalho honesto.</p>
      
      <h3>🔄 Como Mudar a Mentalidade</h3>
      <ol>
        <li><strong>Consciência:</strong> Identifica as crenças limitantes que tens</li>
        <li><strong>Questionamento:</strong> Pergunta "isto é verdade ou é o que sempre me disseram?"</li>
        <li><strong>Substituição:</strong> Cria novas crenças baseadas em factos e resultados</li>
        <li><strong>Prática:</strong> Toma decisões alinhadas com a nova mentalidade</li>
        <li><strong>Ambiente:</strong> Rodeia-te de pessoas com mentalidade de crescimento</li>
      </ol>
      
      <h3>📖 Frases Para Repetir Diariamente</h3>
      <ul>
        <li>"Eu mereço ter tranquilidade financeira"</li>
        <li>"Cada kwanza que poupo é um passo para a minha liberdade"</li>
        <li>"Posso ser generoso E ter reservas"</li>
        <li>"O meu futuro financeiro depende das minhas decisões de hoje"</li>
      </ul>
      
      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-top: 20px;">
        <p><strong>⚠️ Aviso:</strong> Mudar a mentalidade não acontece da noite para o dia. É um processo. Sê paciente contigo mesmo, mas mantém-te firme no caminho.</p>
      </div>',
      'text',
      15,
      1,
      true,
      NULL
    ) RETURNING id INTO v_module2_id;

    -- ============================================
    -- MÓDULO 3: Orçamento Simples
    -- ============================================
    INSERT INTO course_modules (
      course_id,
      title,
      description,
      content,
      media_type,
      duration_minutes,
      order_index,
      is_free,
      thumbnail_url
    ) VALUES (
      v_course_id,
      'Orçamento Simples Que Funciona em Angola',
      'Organizar o salário sem planilhas complicadas. Um método prático adaptado à realidade angolana.',
      '<h2>O Orçamento é o Mapa do Tesouro</h2>
      
      <p>Sem um orçamento, estás a navegar sem mapa. Vais gastar, gastar, gastar e no dia 20 do mês perguntar "para onde foi o dinheiro?"</p>
      
      <h3>📋 O Método 50/30/20 Adaptado Para Angola</h3>
      <p>O método tradicional não funciona bem em Angola porque os custos básicos consomem mais do que 50%. Aqui está a versão adaptada:</p>
      
      <h4>Proposta: Método 60/25/15</h4>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #f1f5f9;">
          <th style="padding: 12px; text-align: left;">Categoria</th>
          <th style="padding: 12px; text-align: center;">%</th>
          <th style="padding: 12px; text-align: left;">O que inclui</th>
        </tr>
        <tr>
          <td style="padding: 12px;"><strong>Necessidades</strong></td>
          <td style="padding: 12px; text-align: center;">60%</td>
          <td style="padding: 12px;">Renda, alimentação, transporte, água, luz, gás, comunicações</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 12px;"><strong>Desejos</strong></td>
          <td style="padding: 12px; text-align: center;">25%</td>
          <td style="padding: 12px;">Lazer, roupas não essenciais, restaurantes, entretenimento</td>
        </tr>
        <tr>
          <td style="padding: 12px;"><strong>Futuro</strong></td>
          <td style="padding: 12px; text-align: center;">15%</td>
          <td style="padding: 12px;">Poupança, fundo de emergência, investimentos, dívidas extra</td>
        </tr>
      </table>
      
      <h3>🧮 Exemplo Prático (Salário de 150.000 Kz)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr style="background: #dcfce7;">
          <td style="padding: 12px;"><strong>Necessidades (60%)</strong></td>
          <td style="padding: 12px; text-align: right;"><strong>90.000 Kz</strong></td>
        </tr>
        <tr>
          <td style="padding: 12px; padding-left: 24px;">• Renda</td>
          <td style="padding: 12px; text-align: right;">35.000 Kz</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 12px; padding-left: 24px;">• Alimentação</td>
          <td style="padding: 12px; text-align: right;">30.000 Kz</td>
        </tr>
        <tr>
          <td style="padding: 12px; padding-left: 24px;">• Transporte</td>
          <td style="padding: 12px; text-align: right;">15.000 Kz</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 12px; padding-left: 24px;">• Serviços (água, luz, telefone)</td>
          <td style="padding: 12px; text-align: right;">10.000 Kz</td>
        </tr>
        <tr style="background: #fef3c7;">
          <td style="padding: 12px;"><strong>Desejos (25%)</strong></td>
          <td style="padding: 12px; text-align: right;"><strong>37.500 Kz</strong></td>
        </tr>
        <tr style="background: #dbeafe;">
          <td style="padding: 12px;"><strong>Futuro (15%)</strong></td>
          <td style="padding: 12px; text-align: right;"><strong>22.500 Kz</strong></td>
        </tr>
      </table>
      
      <h3>🛠️ Como Usar o Sistema Kuanza Para Orçamentar</h3>
      <ol>
        <li><strong>Regista todos os rendimentos:</strong> Salário, biscates, rendas, etc.</li>
        <li><strong>Regista todas as despesas:</strong> Cada kwanza que sai, por mais pequeno</li>
        <li><strong>Define alertas:</strong> O sistema avisa quando estás a gastar demais numa categoria</li>
        <li><strong>Revê semanalmente:</strong> Uma vez por semana, vê como estás em relação ao plano</li>
        <li><strong>Ajusta:</strong> Não conseguiu cumprir? Analisa porquê e ajusta o próximo mês</li>
      </ol>
      
      <h3>💡 Truques Para Poupar no Dia-a-Dia</h3>
      <ul>
        <li><strong>Alimentação:</strong> Compra nos mercados populares (Roque Santeiro, Asa Branca, etc.) em vez de supermercados para produtos frescos</li>
        <li><strong>Transporte:</strong> Agrupa deslocações, usa candongueiros em vez de táxis quando possível</li>
        <li><strong>Comunicações:</strong> Compara pacotes de dados entre operadoras, usa Wi-Fi sempre que disponível</li>
        <li><strong>Compras:</strong> Evita centros comerciais, vai com lista para não comprar por impulso</li>
        <li><strong>Energia:</strong> Desliga aparelhos da tomada, usa lâmpadas LED</li>
      </ul>
      
      <h3>📅 Calendário de Pagamentos</h3>
      <p>Organiza os pagamentos por data para evitar atrasos e multas:</p>
      <ul>
        <li><strong>Dia 1-5:</strong> Renda, prestações de empréstimos</li>
        <li><strong>Dia 5-10:</strong> Contas de serviços (água, luz)</li>
        <li><strong>Dia 10-15:</strong> Poupança (trata como uma conta a pagar!)</li>
        <li><strong>Resto do mês:</strong> Despesas variáveis dentro do orçamento</li>
      </ul>
      
      <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin-top: 20px;">
        <p><strong>✅ Desafio:</strong> Esta semana, regista TODAS as tuas despesas, mesmo o café na rua. No final da semana, vais ter surpresas sobre para onde vai o dinheiro.</p>
      </div>',
      'text',
      20,
      2,
      true,
      NULL
    ) RETURNING id INTO v_module3_id;

    -- ============================================
    -- MÓDULO 4: Dívidas
    -- ============================================
    INSERT INTO course_modules (
      course_id,
      title,
      description,
      content,
      media_type,
      duration_minutes,
      order_index,
      is_free,
      thumbnail_url
    ) VALUES (
      v_course_id,
      'Dívidas: Como Sair Sem Desespero',
      'Crédito, cartões, empréstimos e prestações. Estratégias reais para ficar livre das dívidas.',
      '<h2>A Dívida é Uma Prisão Com Chave</h2>
      
      <p>Estar endividado em Angola é extremamente comum. Bancos, mutuárias, familiares, kinguilas... as dívidas podem vir de muitos lados. Mas existe um caminho para sair.</p>
      
      <h3>🔍 Primeiro Passo: Conhecer a Dívida</h3>
      <p>Muitas pessoas evitam ver o tamanho real da dívida por medo. Mas para vencer o inimigo, precisas conhecê-lo.</p>
      
      <p>Faz uma lista completa:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #f1f5f9;">
          <th style="padding: 12px; text-align: left;">Credor</th>
          <th style="padding: 12px; text-align: right;">Valor Total</th>
          <th style="padding: 12px; text-align: right;">Prestação</th>
          <th style="padding: 12px; text-align: center;">Taxa</th>
        </tr>
        <tr>
          <td style="padding: 12px;">Ex: BFA (carro)</td>
          <td style="padding: 12px; text-align: right;">2.500.000 Kz</td>
          <td style="padding: 12px; text-align: right;">85.000 Kz</td>
          <td style="padding: 12px; text-align: center;">18%</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 12px;">Ex: Cartão Visa</td>
          <td style="padding: 12px; text-align: right;">350.000 Kz</td>
          <td style="padding: 12px; text-align: right;">Mínimo</td>
          <td style="padding: 12px; text-align: center;">28%</td>
        </tr>
        <tr>
          <td style="padding: 12px;">Ex: Tio Manuel</td>
          <td style="padding: 12px; text-align: right;">200.000 Kz</td>
          <td style="padding: 12px; text-align: right;">—</td>
          <td style="padding: 12px; text-align: center;">0%</td>
        </tr>
      </table>
      
      <h3>⚔️ Duas Estratégias de Ataque</h3>
      
      <h4>Método Avalanche (Matemático)</h4>
      <p>Paga primeiro a dívida com <strong>maior taxa de juro</strong>, independentemente do valor.</p>
      <ul>
        <li><strong>Vantagem:</strong> Poupas mais dinheiro em juros no total</li>
        <li><strong>Desvantagem:</strong> Pode demorar a ver resultados visíveis</li>
      </ul>
      
      <h4>Método Bola de Neve (Psicológico)</h4>
      <p>Paga primeiro a dívida <strong>mais pequena</strong>, independentemente dos juros.</p>
      <ul>
        <li><strong>Vantagem:</strong> Vitórias rápidas que motivam a continuar</li>
        <li><strong>Desvantagem:</strong> Pode pagar mais juros no total</li>
      </ul>
      
      <p><strong>Recomendação para Angola:</strong> Usa o Método Bola de Neve. A motivação de ver dívidas a desaparecer é mais importante quando a situação é difícil.</p>
      
      <h3>🤝 Renegociação de Dívidas</h3>
      <p>Muitos angolanos não sabem que podem renegociar dívidas. Aqui está como:</p>
      <ol>
        <li><strong>Prepara-te:</strong> Sabe exactamente quanto deves e quanto podes pagar</li>
        <li><strong>Contacta o banco:</strong> Liga ou vai a uma agência, pede para falar com o gestor de recuperação</li>
        <li><strong>Propõe um plano:</strong> "Posso pagar X por mês durante Y meses"</li>
        <li><strong>Pede redução de juros:</strong> Especialmente se estás em atraso prolongado</li>
        <li><strong>Documenta tudo:</strong> Guarda cópias de acordos assinados</li>
      </ol>
      
      <h3>⚠️ Dívidas a Evitar</h3>
      <ul>
        <li><strong>Mutuárias ilegais:</strong> Juros podem chegar a 100% ao mês!</li>
        <li><strong>Cartão de crédito para consumo:</strong> Taxas de 25-30% ao ano</li>
        <li><strong>Empréstimos para festas/casamentos:</strong> O evento passa, a dívida fica</li>
        <li><strong>Comprar carro novo a crédito:</strong> O carro desvaloriza, a dívida não</li>
      </ul>
      
      <h3>✅ Dívidas "Boas" (Se Bem Geridas)</h3>
      <ul>
        <li><strong>Crédito habitação:</strong> Estás a construir património</li>
        <li><strong>Crédito para negócio:</strong> Se o negócio gera mais do que os juros</li>
        <li><strong>Educação:</strong> Aumenta a capacidade de ganhar mais</li>
      </ul>
      
      <h3>📞 Lidar Com Cobradores</h3>
      <p>Se estás a receber chamadas de cobrança:</p>
      <ul>
        <li>Mantém a calma, não te stresses</li>
        <li>Confirma que a dívida é realmente tua</li>
        <li>Propõe um pagamento que consigas cumprir</li>
        <li>Não faças promessas que não podes cumprir</li>
        <li>Pede tudo por escrito</li>
      </ul>
      
      <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin-top: 20px;">
        <p><strong>🚨 Alerta:</strong> NUNCA faças nova dívida para pagar dívida antiga, a não ser que seja para consolidar com juros muito menores. Isso é entrar num ciclo perigoso.</p>
      </div>',
      'text',
      15,
      3,
      false,
      NULL
    ) RETURNING id INTO v_module4_id;

    -- ============================================
    -- MÓDULO 5: Poupança Inteligente
    -- ============================================
    INSERT INTO course_modules (
      course_id,
      title,
      description,
      content,
      media_type,
      duration_minutes,
      order_index,
      is_free,
      thumbnail_url
    ) VALUES (
      v_course_id,
      'Poupança Inteligente Mesmo Com Salário Baixo',
      'Por que poupar é obrigatório antes de investir. Onde guardar dinheiro em Angola de forma segura.',
      '<h2>Poupar é o Primeiro Acto de Liberdade</h2>
      
      <p>Não importa quanto ganhas — se não poupas nada, nunca vais sair do aperto. A poupança é a base de tudo o que vem depois: fundo de emergência, investimentos, liberdade financeira.</p>
      
      <h3>💰 Quanto Devo Poupar?</h3>
      <p>O ideal seria 20% do rendimento, mas em Angola isso muitas vezes é impossível. Começa com o que conseguires:</p>
      <ul>
        <li><strong>Meta mínima:</strong> 5% do salário</li>
        <li><strong>Meta ideal:</strong> 15-20% do salário</li>
        <li><strong>Meta agressiva:</strong> 30%+ (quando tens rendimentos extras)</li>
      </ul>
      <p>Se ganhas 100.000 Kz e poupas 5.000 Kz por mês, em um ano tens 60.000 Kz. Parece pouco? É mais do que zero, e cria o <strong>hábito</strong>.</p>
      
      <h3>🏦 Onde Guardar a Poupança em Angola</h3>
      
      <h4>1. Conta Poupança Bancária</h4>
      <ul>
        <li><strong>Bancos:</strong> BFA, BAI, BIC, Atlântico, Standard Bank, etc.</li>
        <li><strong>Taxa:</strong> Geralmente 3-8% ao ano</li>
        <li><strong>Vantagem:</strong> Seguro, fácil acesso</li>
        <li><strong>Desvantagem:</strong> Rendimento baixo, pode não vencer inflação</li>
      </ul>
      
      <h4>2. Depósito a Prazo</h4>
      <ul>
        <li><strong>O que é:</strong> Deixas o dinheiro "preso" por 3, 6 ou 12 meses</li>
        <li><strong>Taxa:</strong> 8-15% ao ano (dependendo do prazo e valor)</li>
        <li><strong>Vantagem:</strong> Rendimento melhor</li>
        <li><strong>Desvantagem:</strong> Não podes levantar antes sem penalização</li>
      </ul>
      
      <h4>3. Kixikila (Poupança Rotativa)</h4>
      <ul>
        <li><strong>O que é:</strong> Grupo de pessoas que contribui mensalmente, cada mês um leva tudo</li>
        <li><strong>Vantagem:</strong> Pressão social ajuda a poupar, sem taxas</li>
        <li><strong>Desvantagem:</strong> Depende da honestidade do grupo</li>
        <li><strong>Dica:</strong> Só participa com pessoas de confiança absoluta</li>
      </ul>
      
      <h4>4. Dólares em Casa (Não Recomendado)</h4>
      <ul>
        <li><strong>Porque muitos fazem:</strong> Medo de desvalorização do Kwanza</li>
        <li><strong>Problema:</strong> Risco de roubo, não rende nada</li>
        <li><strong>Alternativa:</strong> Conta em moeda estrangeira no banco</li>
      </ul>
      
      <h3>🎯 O Fundo de Emergência</h3>
      <p>Antes de qualquer investimento, precisas de um <strong>fundo de emergência</strong>:</p>
      <ul>
        <li><strong>Meta inicial:</strong> 1 mês de despesas</li>
        <li><strong>Meta intermediária:</strong> 3 meses de despesas</li>
        <li><strong>Meta ideal:</strong> 6 meses de despesas</li>
      </ul>
      
      <p><strong>Exemplo:</strong> Se gastas 150.000 Kz por mês, o teu fundo de emergência ideal seria 900.000 Kz (6 meses).</p>
      
      <h3>🔄 Como Automatizar a Poupança</h3>
      <ol>
        <li><strong>Dia do salário:</strong> Transfere imediatamente para a conta poupança</li>
        <li><strong>Ordem permanente:</strong> Configura no banco para transferir automaticamente</li>
        <li><strong>Contas separadas:</strong> Mantém a poupança num banco diferente para não tocar</li>
      </ol>
      
      <h3>💡 Truques Para Poupar Mais</h3>
      <ul>
        <li><strong>Desafio das moedas:</strong> Guarda todas as moedas que recebes de troco</li>
        <li><strong>Arredondamento:</strong> Se gastaste 2.800 Kz, considera que foram 3.000 e poupa 200</li>
        <li><strong>Bónus e extras:</strong> Poupa pelo menos 50% de qualquer dinheiro extra</li>
        <li><strong>Corte temporário:</strong> Um mês sem gastos em restaurantes/lazer</li>
      </ul>
      
      <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin-top: 20px;">
        <p><strong>✅ Regra de Ouro:</strong> Paga-te a ti primeiro. No dia que receberes o salário, a primeira "conta a pagar" é a tua poupança. O resto adapta-se ao que sobra.</p>
      </div>',
      'text',
      15,
      4,
      false,
      NULL
    ) RETURNING id INTO v_module5_id;

    -- ============================================
    -- MÓDULO 6: Introdução à Liberdade Financeira
    -- ============================================
    INSERT INTO course_modules (
      course_id,
      title,
      description,
      content,
      media_type,
      duration_minutes,
      order_index,
      is_free,
      thumbnail_url
    ) VALUES (
      v_course_id,
      'Introdução à Liberdade Financeira e FIRE',
      'O que é FIRE e como aplicá-lo ao contexto angolano. Os primeiros passos para a independência financeira.',
      '<h2>O Destino Final: Liberdade Financeira</h2>
      
      <p>Liberdade financeira não significa ser milionário. Significa ter dinheiro suficiente a trabalhar por ti para que não precises depender de um patrão.</p>
      
      <h3>🔥 O Que é FIRE?</h3>
      <p><strong>FIRE</strong> = Financial Independence, Retire Early (Independência Financeira, Reforma Antecipada)</p>
      
      <p>É um movimento que defende:</p>
      <ul>
        <li>Poupar e investir uma alta percentagem do rendimento (30-70%)</li>
        <li>Viver abaixo das possibilidades</li>
        <li>Construir activos que geram rendimento passivo</li>
        <li>Alcançar a liberdade financeira antes da idade tradicional de reforma</li>
      </ul>
      
      <h3>🇦🇴 FIRE em Angola: É Possível?</h3>
      <p>A versão extrema (poupar 70%) é difícil com salários angolanos, mas os princípios aplicam-se:</p>
      <ul>
        <li><strong>Poupar consistentemente:</strong> Mesmo que 10-15%</li>
        <li><strong>Investir:</strong> Em activos que crescem ou geram renda</li>
        <li><strong>Criar múltiplos rendimentos:</strong> Não depender só do salário</li>
        <li><strong>Controlar despesas:</strong> Evitar inflação de estilo de vida</li>
      </ul>
      
      <h3>📈 O Poder do Investimento a Longo Prazo</h3>
      <p>Se investires 50.000 Kz por mês durante 20 anos com rendimento de 10% ao ano:</p>
      <ul>
        <li><strong>Total investido:</strong> 12.000.000 Kz</li>
        <li><strong>Valor final:</strong> Aproximadamente 38.000.000 Kz</li>
        <li><strong>Ganho dos juros:</strong> 26.000.000 Kz (mais do dobro!)</li>
      </ul>
      <p>Este é o poder dos <strong>juros compostos</strong>.</p>
      
      <h3>💼 Tipos de Rendimento</h3>
      <ol>
        <li><strong>Rendimento Activo:</strong> Trocas tempo por dinheiro (emprego, biscates)</li>
        <li><strong>Rendimento Passivo:</strong> O dinheiro trabalha por ti (juros, rendas, dividendos)</li>
        <li><strong>Rendimento de Negócio:</strong> Sistemas que funcionam sem a tua presença constante</li>
      </ol>
      <p>A liberdade financeira acontece quando o <strong>rendimento passivo</strong> cobre as tuas despesas.</p>
      
      <h3>🏗️ Activos vs Passivos</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #dcfce7;">
          <th style="padding: 12px; text-align: left;">Activos (põem dinheiro no bolso)</th>
        </tr>
        <tr>
          <td style="padding: 12px;">
            <ul style="margin: 0;">
              <li>Imóvel arrendado</li>
              <li>Negócio que gera lucro</li>
              <li>Investimentos (depósitos, obrigações, acções)</li>
              <li>Propriedade intelectual (livros, cursos)</li>
            </ul>
          </td>
        </tr>
        <tr style="background: #fee2e2;">
          <th style="padding: 12px; text-align: left;">Passivos (tiram dinheiro do bolso)</th>
        </tr>
        <tr>
          <td style="padding: 12px;">
            <ul style="margin: 0;">
              <li>Carro pessoal (gasolina, seguro, manutenção)</li>
              <li>Casa própria onde vives (sem gerar renda)</li>
              <li>Electrónicos de luxo</li>
              <li>Roupas de marca</li>
            </ul>
          </td>
        </tr>
      </table>
      
      <h3>🚀 Os Primeiros Passos Práticos</h3>
      <ol>
        <li><strong>Hoje:</strong> Define quanto queres poupar por mês (mesmo que pouco)</li>
        <li><strong>Esta semana:</strong> Abre uma conta poupança separada</li>
        <li><strong>Este mês:</strong> Faz a primeira transferência para poupança</li>
        <li><strong>Próximos 3 meses:</strong> Constrói o hábito, não falhe nenhum mês</li>
        <li><strong>Próximos 6 meses:</strong> Estuda opções de investimento em Angola</li>
        <li><strong>1 ano:</strong> Faz o primeiro investimento real</li>
      </ol>
      
      <h3>📚 Onde Aprender Mais</h3>
      <ul>
        <li><strong>Kuanza Finance:</strong> Continue explorando módulos avançados</li>
        <li><strong>Livros:</strong> "Pai Rico, Pai Pobre" (Robert Kiyosaki)</li>
        <li><strong>Youtube:</strong> Canais de finanças pessoais (adapte ao contexto angolano)</li>
        <li><strong>Comunidade:</strong> Junte-se a grupos de pessoas com os mesmos objectivos</li>
      </ul>
      
      <div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin-top: 20px;">
        <p><strong>🎯 O Objectivo Final:</strong> Chegar ao ponto em que trabalhas porque queres, não porque precisas. Onde o dinheiro não é uma preocupação constante. Onde tens tranquilidade para aproveitar a vida.</p>
        <p style="margin-top: 10px;"><strong>Isso é liberdade financeira. E começa hoje.</strong></p>
      </div>',
      'text',
      10,
      5,
      false,
      NULL
    ) RETURNING id INTO v_module6_id;

    -- ============================================
    -- QUIZ FINAL
    -- ============================================
    INSERT INTO course_quizzes (
      course_id,
      title,
      description,
      passing_score,
      is_final_quiz,
      is_active,
      order_index
    ) VALUES (
      v_course_id,
      'Quiz — Fundamentos da Liberdade Financeira',
      'Avaliação final do curso. Responde às perguntas para testar o teu conhecimento sobre os fundamentos da liberdade financeira em Angola.',
      70,
      true,
      true,
      0
    ) RETURNING id INTO v_quiz_id;

    -- PERGUNTAS DO QUIZ
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points, order_index)
    VALUES 
    (
      v_quiz_id,
      'Qual é a principal causa do aperto financeiro da maioria dos angolanos?',
      'multiple_choice',
      ARRAY['Ganhar pouco', 'Falta de sorte', 'Má gestão do dinheiro', 'Falta de investimentos estrangeiros'],
      'Má gestão do dinheiro',
      'Mesmo com salários baixos, a falta de organização e planeamento financeiro agrava significativamente o problema. Pessoas com rendimentos modestos que gerem bem o dinheiro vivem melhor do que quem ganha mais mas não controla as despesas.',
      10,
      0
    ),
    (
      v_quiz_id,
      'O que deve vir primeiro: investir ou poupar?',
      'multiple_choice',
      ARRAY['Investir', 'Poupar', 'Gastar em educação', 'Pedir empréstimo para investir'],
      'Poupar',
      'A poupança cria o fundo de emergência necessário para proteger os investimentos. Sem reserva, qualquer imprevisto pode obrigar a vender investimentos na pior hora ou a voltar a endividar-se.',
      10,
      1
    ),
    (
      v_quiz_id,
      'O que significa liberdade financeira?',
      'multiple_choice',
      ARRAY['Não trabalhar nunca mais', 'Ter muito dinheiro no banco', 'Viver apenas de renda passiva', 'Ter dinheiro suficiente para viver sem depender do salário'],
      'Ter dinheiro suficiente para viver sem depender do salário',
      'Liberdade financeira é quando os teus activos e rendimentos passivos cobrem as tuas despesas, dando-te a opção de trabalhar por escolha, não por necessidade.',
      10,
      2
    ),
    (
      v_quiz_id,
      'No Método 60/25/15 adaptado para Angola, os 15% destinam-se a:',
      'multiple_choice',
      ARRAY['Alimentação', 'Transporte', 'Poupança e investimentos', 'Lazer e entretenimento'],
      'Poupança e investimentos',
      'Os 15% são para construir o futuro: fundo de emergência, poupança, pagamento extra de dívidas e investimentos.',
      10,
      3
    ),
    (
      v_quiz_id,
      'Qual é a melhor estratégia para eliminar dívidas quando precisas de motivação?',
      'multiple_choice',
      ARRAY['Pagar as dívidas maiores primeiro', 'Pagar as dívidas mais pequenas primeiro (Bola de Neve)', 'Pagar só o mínimo em todas', 'Ignorar as dívidas'],
      'Pagar as dívidas mais pequenas primeiro (Bola de Neve)',
      'O Método Bola de Neve prioriza vitórias rápidas que motivam a continuar. Ver dívidas a desaparecer cria momentum psicológico para enfrentar as maiores.',
      10,
      4
    ),
    (
      v_quiz_id,
      'O que é um fundo de emergência ideal?',
      'multiple_choice',
      ARRAY['1 semana de despesas', '1 mês de despesas', '3 a 6 meses de despesas', '1 ano de despesas'],
      '3 a 6 meses de despesas',
      'Um fundo de emergência de 3 a 6 meses cobre a maioria das situações adversas: perda de emprego, doença, reparações urgentes. É a base da segurança financeira.',
      10,
      5
    ),
    (
      v_quiz_id,
      'Qual destes é um ACTIVO (põe dinheiro no teu bolso)?',
      'multiple_choice',
      ARRAY['Carro pessoal', 'Televisão nova', 'Imóvel arrendado a terceiros', 'Roupa de marca'],
      'Imóvel arrendado a terceiros',
      'Um imóvel arrendado gera rendimento passivo mensal. Os outros itens são passivos que consomem dinheiro em manutenção, depreciação ou simplesmente não geram retorno.',
      10,
      6
    ),
    (
      v_quiz_id,
      'O que significa FIRE?',
      'multiple_choice',
      ARRAY['Finanças Inteligentes para Reformados', 'Financial Independence, Retire Early', 'Fundo de Investimento para Reforma Especial', 'Focado em Investir Recursos Extras'],
      'Financial Independence, Retire Early',
      'FIRE significa Independência Financeira, Reforma Antecipada — um movimento que defende poupar e investir agressivamente para alcançar liberdade financeira mais cedo.',
      10,
      7
    ),
    (
      v_quiz_id,
      'Qual é a regra de ouro da poupança?',
      'multiple_choice',
      ARRAY['Poupar o que sobra no fim do mês', 'Pagar-se a si primeiro (poupar antes de gastar)', 'Poupar só quando há bónus', 'Guardar dinheiro debaixo do colchão'],
      'Pagar-se a si primeiro (poupar antes de gastar)',
      'Quando poupas primeiro, garantes que a poupança acontece. Esperar pelo que sobra geralmente resulta em nada sobrar.',
      10,
      8
    ),
    (
      v_quiz_id,
      'O que são juros compostos?',
      'multiple_choice',
      ARRAY['Juros que pagamos em vários empréstimos', 'Juros calculados sobre juros anteriores', 'Taxas bancárias múltiplas', 'Juros ilegais cobrados por mutuárias'],
      'Juros calculados sobre juros anteriores',
      'Juros compostos fazem o dinheiro crescer exponencialmente ao longo do tempo, porque os ganhos de cada período são reinvestidos e geram mais ganhos.',
      10,
      9
    );

    RAISE NOTICE 'Curso criado com sucesso! ID: %', v_course_id;
  ELSE
    RAISE NOTICE 'Curso já existe - operação ignorada';
  END IF;
END $$;
