# Plano de Tarefas

## Objetivo
Transformar o Escala 1.0 em um produto utilizavel com fluxo principal confiavel, depois estabilizar a base tecnica e por fim evoluir com melhorias de produto.

## Estado atual
- Fase 1 concluida.
- Fase 2 fechada em documentacao e pronta para rodada seca do checklist de release.
- Fase 3 aberta e dependente de algumas decisoes de modelagem que ainda nao estao fechadas.

## Fase 1: MVP
Entregar o fluxo principal funcionando de ponta a ponta com previsibilidade para uso interno.

- [x] Validar a estrutura atual do frontend e alinhar nomes de pastas, arquivos e imports para uma convencao unica antes de evoluir funcionalidades.
- [x] Revisar a configuracao de autenticacao e garantir o comportamento de redirecionamento para login e tratamento de usuario nao registrado.
- [x] Mapear e documentar as entidades Employee, Schedule e ScheduleRule com seus campos obrigatorios, relacoes e restricoes operacionais.
- [x] Implementar validacoes de formulario no cadastro e edicao de colaboradores, incluindo obrigatoriedade de nome e tratamento de erros de persistencia.
- [x] Reforcar a geracao de escala mensal para evitar duplicidade, tratar meses ja existentes e proteger contra falhas parciais na recriacao.
- [x] Adicionar regras de validacao na edicao manual de turnos para garantir consistencia do estado salvo por dia.
- [x] Estruturar o fluxo de comandos em linguagem natural com validacao de entrada, tratamento de erro da IA e exibicao de feedback claro ao usuario.
- [x] Implementar estados de carregamento, vazio e erro de forma padronizada nas paginas principais.

## Fase 2: Estabilizacao
Reduzir acoplamento, melhorar manutencao e criar seguranca para evolucao do sistema.

- [x] Refatorar a camada de acesso a dados para centralizar chamadas Base44 em services ou hooks dedicados.
- [x] Refatorar as paginas para separar UI de logica de negocio, extraindo hooks para dashboard, colaboradores, escala e comandos.
- [x] Definir uma estrutura de pastas mais clara para pages, components, hooks, services e lib conforme a arquitetura sugerida.
- [x] Revisar o componente de exportacao para garantir captura correta da grade, nomeacao padrao do arquivo e comportamento estavel em telas menores.
- [x] Criar testes unitarios para utilitarios de agenda, incluindo calculo de dias do mes, finais de semana, contagem de turnos e geracao da escala vazia.
- [x] Criar testes de integracao para os fluxos principais: colaboradores, geracao da escala, edicao manual, comandos IA e exclusao de regras.
- [x] Atualizar a documentacao tecnica com fluxo de dados, convencoes do projeto, requisitos e criterios de aceite por funcionalidade.
  - [x] Criar `docs/fluxo-de-dados.md` descrevendo o caminho App -> pages -> hooks -> services -> Base44.
  - [x] Consolidar no `README.md` o setup real do projeto, scripts disponiveis e variaveis de ambiente obrigatorias.
  - [x] Revisar `docs/estrutura-de-pastas.md` para deixar explicito o que e codigo canonico, legado e fora de escopo.
  - [x] Criar `docs/criterios-de-aceite.md` conectando cada requisito do EARS aos fluxos de tela e aos testes existentes.
  - [x] Registrar limitacoes conhecidas do fluxo atual, principalmente em autenticacao Base44, regras salvas e legado com nomes traduzidos.
- [x] Preparar um checklist de release com lint, typecheck, testes e validacoes manuais do fluxo principal.
  - [x] Criar `docs/release-checklist.md` com a ordem fixa: `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration`, `npm run build`.
  - [x] Definir uma rodada de validacao manual minima para login, dashboard, CRUD de colaboradores, geracao da escala, edicao manual, comandos IA e exportacao.
  - [x] Definir quais falhas bloqueiam release e quais podem seguir como known issues.
  - [x] Prever um formato simples de evidencias do release, com data, responsavel, resultado e observacoes.

### Criterio de conclusao da Fase 2
- Toda funcionalidade principal precisa ter requisito documentado, fluxo descrito e cobertura minima por teste automatizado ou checklist manual.
- O projeto precisa poder passar por um release local repetivel usando apenas scripts do `package.json` e um checklist documentado.

## Fase 3: Melhorias
Evoluir o produto com regras mais completas e melhor experiencia operacional.

- [ ] Adicionar suporte a inativacao de colaboradores e definir como colaboradores inativos afetam geracao e historico de escalas.
  - [ ] Fechar a regra de negocio para colaboradores inativos em listas, dashboard, geracao de novas escalas e historico antigo.
  - [ ] Ajustar o CRUD de colaboradores para permitir alternar `active` sem excluir o registro.
  - [ ] Garantir que a geracao mensal ignore inativos sem quebrar escalas historicas ja criadas.
  - [ ] Definir como comandos IA e regras salvas tratam colaboradores inativos.
  - [ ] Cobrir a mudanca com testes unitarios e de integracao.
- [ ] Melhorar o gerenciamento de regras salvas com filtros, identificacao do alvo da regra e sincronizacao consistente com as escalas afetadas.
  - [ ] Exibir metadados minimos por regra: periodo, alvo, texto, status e data de criacao.
  - [ ] Permitir filtrar por colaborador, periodo e status da regra.
  - [ ] Decidir se a regra salva continua sendo apenas historico ou se passa a participar da reconstituicao da escala.
  - [ ] Caso a regra afete sincronizacao futura, definir estrategia para reprocessamento ao regenerar o mes.
  - [ ] Cobrir exclusao, listagem e sincronizacao com testes de integracao.

### Criterio de conclusao da Fase 3
- O sistema deve conseguir diferenciar colaborador ativo de inativo sem perda de historico.
- Regras salvas devem ter semantica clara para o usuario: historico simples ou insumo de reprocessamento, sem comportamento ambiguo.

## Decisoes abertas antes de executar a Fase 3
- [ ] Definir se `Employee.name` deve ser tratado como unico no fluxo de negocio.
- [ ] Definir se `ScheduleRule` deve sempre persistir `employee_id` quando houver alvo individual.
- [ ] Definir se regras salvas devem ser reaplicadas automaticamente quando uma escala do mes for regenerada.
- [ ] Definir a politica de cascata entre exclusao de colaborador, escalas existentes e regras historicas.

## Proximo ciclo recomendado
1. Executar uma rodada seca do `docs/release-checklist.md`.
2. Fechar as decisoes de modelagem que impactam inativacao e regras salvas.
3. Implementar inativacao de colaboradores com cobertura de testes.
4. Evoluir o gerenciamento de regras salvas depois que a semantica estiver decidida.

## Ordem recomendada de execucao
1. Fechar autenticacao, entidades e validacoes do fluxo principal.
2. Tornar a geracao e a edicao da escala confiaveis.
3. Tornar o fluxo de comandos IA seguro e observavel.
4. Refatorar a base para hooks, services e estrutura de pastas coerente.
5. Cobrir com testes, documentacao e checklist de release.
6. Entrar nas melhorias de produto que dependem de uma base estavel.
