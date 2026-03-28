# Release Checklist

## Objetivo
Executar uma validacao minima repetivel antes de considerar o frontend pronto para release local ou publicacao na Base44.

## Pre-condicoes
- Dependencias instaladas com `npm install`.
- Arquivo `.env.local` configurado para o ambiente que sera validado.
- Para validar autenticacao e IA reais, usar um ambiente com Base44 configurada e acesso valido ao app.

## Ordem fixa dos checks automatizados
1. `npm run lint`
2. `npm run typecheck`
3. `npm run test:unit`
4. `npm run test:integration`
5. `npm run build`

## Resultado esperado por etapa
- `npm run lint`: sem erros de ESLint.
- `npm run typecheck`: sem erros de TypeScript no projeto configurado por `jsconfig.json`.
- `npm run test:unit`: todos os cenarios de utilitarios de agenda aprovados.
- `npm run test:integration`: todos os fluxos principais de dominio aprovados.
- `npm run build`: build final gerada sem falhas.

## Rodada minima de validacao manual

### 1. Autenticacao
- Abrir a aplicacao sem sessao valida em ambiente Base44 e confirmar redirecionamento para login.
- Abrir a aplicacao com sessao valida e confirmar acesso ao dashboard.
- Se existir usuario bloqueado para o app, confirmar exibicao da tela de usuario nao registrado.

### 2. Dashboard
- Confirmar estados de carregamento, erro ou vazio de acordo com o ambiente.
- Confirmar exibicao dos indicadores principais e links para as rotas internas.

### 3. Colaboradores
- Criar um colaborador valido.
- Tentar salvar nome vazio, nome curto e nome duplicado para validar mensagens.
- Editar colaborador existente.
- Excluir colaborador com confirmacao.

### 4. Escala
- Trocar mes e ano pelo seletor e confirmar recarga do periodo.
- Gerar escala em um periodo sem registros.
- Regenerar escala em um periodo ja preenchido e confirmar aviso de reset.
- Clicar em pelo menos uma celula e confirmar persistencia da troca de turno.

### 5. Comandos IA
- Confirmar bloqueio quando nao houver colaboradores ou escalas no periodo.
- Aplicar um comando valido e verificar mensagem de sucesso ou sucesso com ressalvas.
- Confirmar que a escala foi atualizada conforme o comando aplicado.
- Confirmar que a regra foi registrada na lista de regras salvas.
- Excluir uma regra salva e confirmar que apenas o registro foi removido.

### 6. Exportacao
- Exportar a grade de um periodo com escala gerada.
- Confirmar inicio do download e nome do arquivo no formato `escala-<mes>-<ano>.png`.
- Validar visualmente se a imagem contem a grade completa.

## Falhas que bloqueiam release
- Qualquer falha em `lint`, `typecheck`, testes automatizados ou `build`.
- Erro de autenticacao em ambiente que deveria autenticar.
- Impossibilidade de criar, editar ou excluir colaborador.
- Geracao de escala criando duplicidade sem aviso ou quebrando o periodo.
- Edicao manual de turno sem persistencia ou com dados inconsistentes.
- Comandos IA aplicando alteracoes fora do periodo ou corrompendo a grade.
- Exportacao sem download ou com arquivo inutilizavel.

## Falhas que podem seguir como known issue
- Pequenos desalinhamentos visuais sem impacto funcional.
- Mensagens de feedback pouco claras, desde que a operacao principal conclua corretamente.
- Ressalvas de IA em que parte das alteracoes foi descartada, desde que o sistema preserve a consistencia da escala e informe o usuario.

## Evidencia minima do release
Registrar cada rodada com os campos abaixo:

```md
Data: YYYY-MM-DD
Responsavel:
Ambiente:
Resultado geral: aprovado | aprovado com ressalvas | reprovado

Checks automatizados:
- lint:
- typecheck:
- test:unit:
- test:integration:
- build:

Validacao manual:
- autenticacao:
- dashboard:
- colaboradores:
- escala:
- comandos IA:
- exportacao:

Observacoes:
Known issues:
```
