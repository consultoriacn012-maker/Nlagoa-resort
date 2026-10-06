# 01a — Itens da v0.1 mantidos na v0.2

> Tabelas completas da v0.1 (2026-10-06) que continuam válidas e são citadas no 01 v0.2 como "da v0.1". Em caso de divergência, **o 01 v0.2 prevalece**. Ajustes já aplicados: riscos renomeados de R para **RK** (os IDs Rxx ficam reservados ao registro 02); a L2 agora é a decisão **D14**; a O5 usa recompensa não financeira.

## Lacunas L1–L14

| # | Lacuna | Consequência se não for resolvida | Como fechar | Quem decide |
|---|---|---|---|---|
| L1 | **Unidade de contagem do universo** (pessoa? reserva? UH? família? casal?) | Penetração distorcida. Uma família de 4 pessoas conta como 4 e derruba artificialmente a taxa. | Adotar a **UCD — Unidade Comercial de Decisão** (grupo familiar ou casal decisor). Proxy operacional: reserva deduplicada pelo titular (hotel), transação de ingresso (parque) e lead deduplicado (digital). | Diretoria + BI (D3) |
| L2 | **Definição de elegível** | Cada área usa um critério e os números não fecham entre si. | Critérios obrigatórios formais por produto (idade, decisores, proprietário ou não, residência, renda declarada se aplicável). DADO PENDENTE: critérios atuais da sala. | Diretoria + Salas (**D14** na v0.2) |
| L3 | **Denominador e janela dos 30%** | Meta inaplicável ou manipulável (ex.: excluir shows "incompletos" para inflar a taxa). | Ver decisão D1. Medir sempre bruta e líquida, por origem. | Diretoria (D1) |
| L4 | **Definição de venda líquida** | Sem ela, "venda líquida" vira o número que for conveniente. | Três cortes de coorte: **D+7** (pós-arrependimento), **D+90** e **D+365** (distrato/inadimplência). | Diretoria + Financeiro (D2) |
| L5 | **Chave única do cliente** (resolução de identidade entre PMS, bilheteria, CRM de vendas, Mini-Vac, leads) | Sem deduplicação, sem histórico único e sem bloqueio confiável de convertidos e opt-outs. | Golden record com regras de match: CPF quando legítimo, telefone E.164, e-mail normalizado, nome + data de nascimento. | BI/CRM + TI |
| L6 | **Propriedade do lead, atribuição e comissão** | É o maior risco organizacional. Comissão define comportamento: motores vão disputar o cliente e registrar contatos "para marcar território". | Política de distribuição com dono temporário (lock com expiração), regra de atribuição e câmara de disputa (seção B). | Diretoria (D5) |
| L7 | **Capacidade das salas** | Mais shows sem slots e closers suficientes geram espera, apresentação incompleta, queda de conversão e reclamação. | Capacidade = mesas × slots/dia × ocupação-alvo, por sala e por horário. DADO PENDENTE. | Salas + Prospecção |
| L8 | **Lista de supressão** | Abordar quem não deve ser abordado: opt-out, reclamação ou processo, cliente em distrato, proprietário fora da regra, funcionário, menor. | Supressão central sincronizada com todos os canais, consultada antes de cada abordagem. | CIP + Jurídico/DPO |
| L9 | **Custeio do benefício** (custo marginal, preço de tabela ou custo de oportunidade) | Um ingresso ou diária "grátis" custa muito diferente em dia de baixa e em dia de lotação. O ROI fica errado nos dois sentidos. | Registrar três valores por benefício (seção N). | Financeiro (D6) |
| L10 | **Guardrail de experiência** | Abordagem excessiva derruba o NPS e a reputação online do hotel e do parque, que são o negócio-mãe. | Teto de contatos por UCD por estadia e NPS comparado entre abordados e não abordados. | Diretoria (D8) |
| L11 | **Incrementalidade** | Atribuir ao pré-arrival vendas que o in-house faria de qualquer forma infla o ROI. | Grupo de controle aleatório no piloto (seção G). | BI/RevOps |
| L12 | **Portfólio e regra de produto** | Não se sabe qual produto vai para qual público. O repositório mostra "Sócio Lagoa Lovers"; a imprensa cita cotas do Lagoa Eco Towers. | Matriz produto × público × sala. DADO PENDENTE. | Diretoria + Produto |
| L13 | **Estado atual da tecnologia** | Não dá para desenhar automação sem saber qual CRM, PMS e telefonia existem e se há integração. | Inventário de sistemas (seção M). | TI + CIP |
| L14 | **Baseline** | Toda meta é chute sem 12 meses de histórico do funil. | Coleta de dados (seção final). | Gustavo |

## Riscos RK1–RK12

Probabilidade e impacto são minha avaliação qualitativa (D), não dado.

| # | Risco | Prob. | Impacto | Sinal de alerta (KPI) | Mitigação |
|---|---|---|---|---|---|
| RK1 | **LGPD: uso de dados da reserva fora da finalidade** ou compartilhamento entre empresas do grupo sem base legal | Média | Alto | Reclamações de titular, pedidos de exclusão, notificação da ANPD | Mapeamento de tratamentos, teste de balanceamento (LIA), aviso de privacidade na reserva, opt-out em todo contato. **VALIDAR COM JURÍDICO/DPO.** |
| RK2 | **Plataforma: bloqueio do número de WhatsApp** por disparo sem opt-in | Média | Alto | Queda da *quality rating* e bloqueios reportados | Somente templates aprovados, opt-in registrado, WhatsApp oficial via BSP, nunca o celular pessoal do captador. |
| RK3 | **Telemarketing sem prefixo 0303**, se a ligação de pré-chegada com oferta for enquadrada como telemarketing ativo | Média | Médio | Bloqueios e reclamações | Avaliar o enquadramento. **VALIDAR COM JURÍDICO.** |
| RK4 | **CDC: arrependimento (art. 49) e práticas abusivas** | Alta no mercado | Alto | Arrependimento D+7, reclamações em Procon e Reclame Aqui, ações judiciais | Transparência na abordagem ("é uma apresentação comercial de X minutos"), auditoria de promessas, welcome call, remuneração sobre venda líquida. |
| RK5 | **Canibalização entre motores** e dupla comissão | Alta | Médio | Mesmo cliente com dois "donos", disputas, contatos duplicados | Política de propriedade do lead e consulta antes de abordar. |
| RK6 | **Inflação de indicadores** (contatos fantasmas, agendamento sem confirmação) | Alta | Médio | Show rate caindo enquanto agendamentos sobem; contatos sem evidência | Evidência sistêmica de contato (log de ligação ou mensagem), auditoria amostral, nunca remunerar só contato. |
| RK7 | **Brinde como custo oculto** e "turista de brinde" | Alta | Médio | Custo de benefício por venda líquida subindo; show alto com conversão baixa | Política de benefícios, voucher nominal, alçadas, ROI por benefício. |
| RK8 | **Degradação da experiência** do hóspede e do visitante | Média | Alto | NPS de abordados vs não abordados, menções a "abordagem" em reviews | Teto de pressão de contato e convite contextual em vez de abordagem de rua. |
| RK9 | **Sala sobrecarregada** | Média | Médio | Espera > X min, apresentações incompletas, ocupação da sala > Y% | Agenda de slots compartilhada e priorização por score quando houver escassez. |
| RK10 | **Qualidade de dado ruim** (OTA sem telefone, cadastro incompleto) | Alta | Alto | Cobertura de dados por canal de reserva | Métrica de completude por canal e ações na reserva direta. |
| RK11 | **Resistência organizacional** (recepção, reservas e parque respondem a outras diretorias) | Alta | Médio | SLAs de handoff descumpridos | RACI aprovado pela Diretoria, metas compartilhadas e incentivo validado com RH e Jurídico trabalhista. |
| RK12 | **Excesso de engenharia** (score e IA antes de existir dado) | Média | Médio | Projeto de tecnologia sem KPI de negócio | Ondas: regras simples, depois modelo estatístico, depois IA (seção S). |

## Oportunidades O1–O9

| # | Oportunidade | Lógica | Dado para dimensionar | Como testar |
|---|---|---|---|---|
| O1 | **Pré-arrival com agenda reservada** | Cliente chega conhecido, com benefício definido e horário pré-reservado. Reduz abordagem de rua e aumenta o show. | Reservas futuras por canal, antecedência e completude de contato | Piloto em uma UN com controle aleatório |
| O2 | **Hóspede recorrente** | Quem volta a Caldas Novas já demonstra o comportamento que a multipropriedade monetiza (viajar ao mesmo destino com frequência). | Frequência de estadias por titular nos últimos 24–36 meses | Comparar conversão de recorrentes e de primeira estadia |
| O3 | **Visitante day-use do parque** | É um universo grande, hoje provavelmente fora do funil por falta de identificação. | Volume de ingressos e % com contato identificado | Captura com opt-in na compra online e convite para Mini-Vac |
| O4 | **Pipeline de quem não fechou** (show sem venda e engajado sem agenda) | Nutrição pós-estadia com nova experiência. O Mini-Vac pode ser o produto de reentrada. | Volume de shows sem venda por mês e motivos de perda | Cadência pós-estadia com controle |
| O5 | **Proprietários: upgrade e indicação** (dentro das regras do produto) | Nos EUA, a maior parte das vendas vem de quem já é proprietário (E: HGV, 70% das contract sales de 2023). | Base de proprietários, regras do produto, histórico de upgrades | Programa de indicação **recompensado (não financeiro)** após a venda líquida (v0.2). Benchmark nacional: Aviva, ~90% das vendas do produto In Casa vêm de membros (03) |
| O6 | **Benefícios com custo de oportunidade baixo** | Upgrade, late check-out e experiências em dias de baixa ocupação custam quase nada e têm alto valor percebido. | Ocupação diária por UN | A/B de benefício por faixa de ocupação |
| O7 | **Lookalike de compradores líquidos** | Usar o perfil de quem comprou e permaneceu para priorizar o universo. | 12–24 meses de vendas com status de permanência | Score v0 por regras, validado em coorte posterior |
| O8 | **IA em conversas** | Resumo automático, QA de promessas e extração de objeções. Ganho rápido e baixo risco. | Gravações e conversas com base legal | Piloto de 30 dias com amostra auditada |
| O9 | **Mini-Vac como "segunda chance"** do in-house | Quem não pôde ver a apresentação na estadia volta com pacote. Benchmark: a HGV acompanha "package activations" como pipeline de tours (E). | Estoque de pacotes, ativação e expiração | Coorte de pacotes por origem |
