# Plano de Tarefas

## Objetivo
Transformar o Escala 1.0 em um produto utilizavel com fluxo principal confiavel, depois estabilizar a base tecnica e por fim evoluir com melhorias de produto.

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
- [ ] Atualizar a documentacao tecnica com fluxo de dados, convencoes do projeto, requisitos e criterios de aceite por funcionalidade.
- [ ] Preparar um checklist de release com lint, typecheck, testes e validacoes manuais do fluxo principal.

## Fase 3: Melhorias
Evoluir o produto com regras mais completas e melhor experiencia operacional.

- [ ] Adicionar suporte a inativacao de colaboradores e definir como colaboradores inativos afetam geracao e historico de escalas.
- [ ] Melhorar o gerenciamento de regras salvas com filtros, identificacao do alvo da regra e sincronizacao consistente com as escalas afetadas.

## Ordem recomendada de execucao
1. Fechar autenticacao, entidades e validacoes do fluxo principal.
2. Tornar a geracao e a edicao da escala confiaveis.
3. Tornar o fluxo de comandos IA seguro e observavel.
4. Refatorar a base para hooks, services e estrutura de pastas coerente.
5. Cobrir com testes, documentacao e checklist de release.
6. Entrar nas melhorias de produto que dependem de uma base estavel.
