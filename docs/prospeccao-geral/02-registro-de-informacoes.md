# 02 — Registro de informações (controle de versão da memória)

Regras:
- Toda informação nova entra aqui com classe, origem e data.
- Informação nova de Gustavo **prevalece** sobre histórica incompatível. A anterior não é apagada: muda para "substituída por Rxx".
- Classe B (histórico) **nunca** vira política atual sem confirmação.

Classes: **A** regra atual confirmada · **B** dado histórico · **C** diretriz da Diretoria · **D** hipótese de projeto · **E** benchmark externo · **F** pendente de validação.

| ID | Informação | Origem | Data | Classe | Observação / status |
|---|---|---|---|---|---|
| R01 | Gustavo está assumindo a operação de Prospecção Geral de clientes para multipropriedade no ecossistema Grupo Lagoa Quente (Caldas Novas/GO) | Briefing de Gustavo | 2026-10-06 | A | — |
| R02 | A atuação atual de Gustavo está concentrada na Prospecção Digital, via departamento Lagoa Experience / Mini-Vac | Briefing | 2026-10-06 | A | — |
| R03 | A visão da Diretoria é uma **Central de Prospecção Geral** integrando progressivamente 22 públicos e canais (Digital, Mini-Vac, SR, Pré-arrival, Reservas, In-house, Recepção, Hotelaria, Parque, Lazer, A&B, Base, Convidados, Proprietários, RCI, Certificados, Indicações, Remarketing, Off-site, Regional, Parcerias, Outros) | Briefing (reunião com a Diretoria) | 2026-10-06 | C | A abordagem por público ainda será definida |
| R04 | Pilar 1: percentual de penetração por unidade de negócio | Diretoria | 2026-10-06 | C | Unidade de contagem: F (decisão D3) |
| R05 | Pilar 2: meta de vendas por sala de **30%** | Diretoria | 2026-10-06 | C | **Denominador e janela: F** (decisão D1) |
| R06 | Pilar 3: aproveitar os dados das reservas para prospectar antecipadamente via SR | Diretoria | 2026-10-06 | C | Base legal: F (VALIDAR COM JURÍDICO/DPO) |
| R07 | Pilar 4: separar o escopo de brindes por espaço/canal | Diretoria | 2026-10-06 | C | — |
| R08 | Pilar 5: desenhar a estrutura completa de captação | Diretoria | 2026-10-06 | C | — |
| R09 | Pilar 6: estruturar o time de captação | Diretoria | 2026-10-06 | C | Headcount só com dados |
| R10 | Pilar 7: pensamento de penetração geral de clientes | Diretoria | 2026-10-06 | C | — |
| R11 | Os cinco motores (Reservas/Pré-arrival/SR; In-house/Ecossistema; Digital/Mini-Vac; Off-site/Regional; Base/Remarketing/Indicações) | Briefing | 2026-10-06 | D | Nomenclatura pode mudar. Proposta v0.1: motores definidos pelo momento do cliente (Mapa B) |
| R12 | Estrutura funcional (Gestor, BI/RevOps, coordenações, líderes, SDRs, concierges, captadores, qualidade, CRM/IA) | Briefing | 2026-10-06 | D | Hipótese funcional, não headcount |
| R13 | Funil conceitual (Universo → … → VGV líquido) | Briefing | 2026-10-06 | D | Adotado como método. Definições operacionais propostas no Mapa D (F até aprovação) |
| R14 | Fórmulas de penetração bruta, elegível, qualificada, em sala e em vendas | Briefing | 2026-10-06 | D | Adotadas. Unidade de contagem: F |
| R15 | Proprietários e cotistas podem ser abordados "dentro das regras de cada produto" | Briefing | 2026-10-06 | F | Regras não recebidas (decisão D7) |
| R16 | **Documento-base anexo** ao briefing | Briefing | 2026-10-06 | F | **Não recebido.** Não está no repositório nem na sessão |
| R17 | Existe uma landing page "Lagoa Parque e Hotéis / Seja Sócio Lagoa Lovers" (Next.js + Supabase) neste repositório | Código do repositório | 2026-10-06 | B | Fato do código. **F:** se está em produção e se é o canal oficial |
| R18 | O formulário da landing grava `lgpd_accepted: true` sem checkbox ou texto de consentimento | `LeadForm.tsx:17` | 2026-10-06 | B | Fato do código. Risco LGPD (Mapa J1) |
| R19 | O telefone (64) 3513-6230 e o WhatsApp 55 64 3513-6230 aparecem no site como contato | Código do repositório | 2026-10-06 | B | F: se é o canal oficial de vendas |
| R20 | O produto "Sócio Lagoa Lovers" aparece como oferta no site | Código do repositório | 2026-10-06 | B | F: natureza do produto (clube? multipropriedade?) e se está ativo |
| R21 | Lagoa Eco Towers: 480 apartamentos, operação Livá Hotéis, 6 mil cotas por fase, VGV > R$ 500 mi, "segundo empreendimento do grupo" | Imprensa (Mercado & Eventos; data a confirmar) | — | B | Histórico público. F: situação atual |
| R22 | Lagoa Termas Parque é vizinho ao Lagoa Quente Flat Hotel e é citado com cerca de 400 mil m² | Site de turismo | — | B | Fonte secundária. F |
