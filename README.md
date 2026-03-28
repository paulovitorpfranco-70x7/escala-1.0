# Escala 1.0

Aplicacao web para gestao de escalas mensais com dashboard, CRUD de colaboradores, geracao de escala por periodo, edicao manual de turnos, comandos em linguagem natural com IA e exportacao da grade em imagem.

## Stack
- React 18
- Vite
- Tailwind CSS
- Base44 SDK
- Node test runner para testes unitarios e de integracao

## Como executar localmente
1. Instale as dependencias com `npm install`.
2. Crie um arquivo `.env.local` na raiz do projeto.
3. Configure as variaveis de ambiente necessarias.
4. Inicie a aplicacao com `npm run dev`.

### Variaveis de ambiente
```env
VITE_BASE44_APP_ID=seu_app_id
VITE_BASE44_APP_BASE_URL=https://seu-app.base44.app
VITE_BASE44_FUNCTIONS_VERSION=opcional
```

### Modos locais suportados
- Modo Base44: com `VITE_BASE44_APP_ID` configurado, a aplicacao usa entidades reais, autenticacao e integracao de IA da Base44.
- Modo fallback: sem `VITE_BASE44_APP_ID`, o cliente usa um banco local de fallback que retorna listas vazias, nao exige autenticacao e responde a IA com uma mensagem stub. Esse modo serve para layout e navegacao, nao para validar o fluxo real.

## Scripts
- `npm run dev`: sobe o servidor local do Vite.
- `npm run build`: gera a build de producao.
- `npm run preview`: publica a build localmente para inspecao.
- `npm run lint`: executa o ESLint em modo silencioso.
- `npm run lint:fix`: corrige problemas de lint suportados automaticamente.
- `npm run typecheck`: executa `tsc -p ./jsconfig.json`.
- `npm run test:unit`: roda os testes de utilitarios de agenda.
- `npm run test:integration`: roda os testes dos fluxos principais de negocio.

## Estrutura relevante
- `src/`: codigo ativo da aplicacao.
- `tests/`: testes unitarios e de integracao do dominio.
- `docs/`: documentacao tecnica e operacional.
- `entidades/`: definicoes de entidades herdadas da Base44.

Detalhes adicionais:
- `docs/fluxo-de-dados.md`: fluxo de dados e responsabilidades por camada.
- `docs/criterios-de-aceite.md`: criterios de aceite por funcionalidade.
- `docs/estrutura-de-pastas.md`: estrutura canonica e diretorios legados.
- `docs/release-checklist.md`: roteiro de validacao antes de release.
- `docs/modelo-de-entidades.md`: modelo atual de `Employee`, `Schedule` e `ScheduleRule`.

## Limitacoes conhecidas
- A autenticacao depende da configuracao Base44 e do token salvo em URL/localStorage; no modo fallback nao ha redirecionamento real para login.
- As regras salvas funcionam hoje como historico de comandos; excluir uma regra nao desfaz alteracoes ja aplicadas na escala.
- A tela de comandos opera apenas sobre o periodo corrente carregado na sessao.
- O projeto ainda mantem diretorios legados em portugues fora da estrutura canonica; eles nao devem receber novas alteracoes.
- O `QueryClientProvider` ja existe, mas o carregamento principal de paginas ainda usa `useEffect` e estado local.
