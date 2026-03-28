# Estrutura de Pastas

## Estrutura canonica

O codigo ativo do projeto deve ficar apenas nestes diretorios:

```text
src/
  API/         clientes e adaptadores de integracao externa
  components/  componentes visuais reutilizaveis
    schedule/  componentes da grade e acoes da escala
    ui/        componentes base de interface
  hooks/       hooks por pagina ou comportamento reutilizavel
  lib/         utilitarios, contexto, configuracao e regras compartilhadas
  pages/       telas de rota
  services/    acesso a dados e integracoes encapsuladas
```

Arquivos e diretorios de apoio ao codigo ativo:

- `tests/`: testes unitarios e de integracao do dominio.
- `docs/`: documentacao tecnica, operacional e de release.
- `entidades/`: referencias herdadas da modelagem Base44.

## Regras de organizacao

- `pages` deve conter composicao de UI e delegar estado, efeitos e handlers para `hooks`.
- `hooks` deve conter logica de pagina e orquestracao entre `services`, `lib` e `toast`.
- `services` deve concentrar acesso ao Base44 e outras integracoes externas.
- `components` deve conter apenas apresentacao reutilizavel, sem acesso direto ao Base44.
- `lib` deve concentrar contexto global, utilitarios puros e configuracoes transversais.
- `API` deve conter clientes base e adaptadores de integracao compartilhados.

## Diretorios legados

Os diretorios abaixo permanecem no repositorio apenas como legado e nao devem receber novas alteracoes:

- `src/biblioteca`
- `src/componentes`
- `src/ganchos`
- `src/paginas` (corresponde a pasta legada com acento no filesystem)
- `src/utilitarios` (corresponde a pasta legada com acento no filesystem)

Esses caminhos estao fora da estrutura canonica e foram excluidos do escopo principal de validacao para nao competir com a aplicacao ativa.

## Fora do escopo do codigo fonte

- `dist/`: artefatos de build gerados localmente.
- `node_modules/`: dependencias instaladas.
- `.git/`: metadados de versionamento.

Nenhum desenvolvimento novo deve ser iniciado nesses diretorios.
