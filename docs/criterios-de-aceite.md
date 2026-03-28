# Criterios de Aceite

Este documento conecta os requisitos funcionais ao comportamento implementado hoje e ao tipo de validacao esperado para cada fluxo.

## 1. Controle de acesso autenticado
- Ao abrir a aplicacao com Base44 configurada e sem sessao valida, o sistema deve impedir acesso silencioso ao conteudo interno e tentar redirecionar para login.
- Ao abrir a aplicacao com token valido, o sistema deve liberar as rotas internas sem exibir tela de erro.
- Evidencia atual: validacao manual em ambiente Base44.

## 2. Tratamento de usuario nao registrado
- Quando a Base44 responder `user_not_registered`, o sistema deve exibir a tela especifica de usuario nao habilitado.
- O usuario nao deve ver dashboard, escala, colaboradores ou comandos enquanto esse erro estiver ativo.
- Evidencia atual: validacao manual em ambiente Base44.

## 3. Visualizacao do painel de controle
- A tela inicial deve mostrar cards de colaboradores, escalas do mes atual, regras ativas e total de folgas.
- O painel deve tratar estados de carregamento, erro e vazio com mensagens e acoes coerentes.
- A tela deve oferecer atalhos para colaboradores, escala e comandos IA.
- Evidencia atual: validacao manual.

## 4. Cadastro de colaborador
- O sistema deve exigir nome preenchido, com no minimo 3 caracteres e sem duplicidade por nome normalizado.
- O cargo salvo deve pertencer ao conjunto permitido pelo formulario.
- Ao salvar um novo colaborador valido, o sistema deve persistir `name` em caixa alta, definir `active: true`, atualizar a lista e exibir confirmacao.
- Evidencia atual: `npm run test:integration` cobre criacao.

## 5. Edicao de colaborador
- Ao editar um colaborador existente, o sistema deve reaplicar as mesmas validacoes de nome e cargo do cadastro.
- A atualizacao deve persistir os novos dados e refletir a mudanca imediatamente na lista.
- O dialogo deve fechar apenas apos sucesso da operacao.
- Evidencia atual: `npm run test:integration` cobre edicao.

## 6. Exclusao de colaborador
- O sistema deve solicitar confirmacao antes da exclusao.
- Ao confirmar, o registro deve ser removido e a lista deve ser recarregada.
- Falhas de exclusao devem ser comunicadas por toast destrutivo.
- Evidencia atual: `npm run test:integration` cobre exclusao; confirmacao visual segue validacao manual.

## 7. Geracao da escala mensal
- O sistema deve impedir geracao quando nao houver colaboradores ativos.
- Ao gerar um periodo, deve existir no maximo uma escala por colaborador ativo para o mes/ano selecionado.
- Todos os dias validos do mes devem ser inicializados com turno `T`.
- Duplicidades e escalas obsoletas devem ser limpas no final da regeneracao, com rollback best effort em falhas criticas.
- Evidencia atual: `npm run test:integration` cobre regeneracao e limpeza logica.

## 8. Navegacao por periodo da escala
- Ao trocar mes ou ano, a tela deve recarregar colaboradores ativos e escalas daquele periodo.
- Se nao houver escalas no periodo, a tela deve exibir estado vazio com acao para gerar a escala.
- O cabecalho e a grade devem refletir o novo periodo selecionado.
- Evidencia atual: validacao manual.

## 9. Edicao manual de turno diario
- O clique em uma celula valida deve alternar o turno em ciclo `T -> F -> M -> T`.
- O sistema deve bloquear edicao de dias fora do periodo ou de escalas inconsistentes.
- A interface deve aplicar atualizacao otimista e desfazer a mudanca se a persistencia falhar.
- Evidencia atual: `npm run test:integration` cobre persistencia do turno; protecoes visuais e rollback seguem validacao manual.

## 10. Aplicacao de comandos em linguagem natural
- O sistema deve rejeitar comandos vazios, curtos demais ou enviados sem colaboradores/escalas disponiveis.
- A IA deve ser chamada com contexto do periodo atual e com schema JSON esperado.
- O sistema deve aplicar apenas alteracoes validas, descartar dias/turnos invalidos, informar ressalvas e preservar a escala quando uma alteracao nao puder ser aproveitada.
- Se ao menos uma escala for atualizada, o sistema deve registrar a regra aplicada.
- Evidencia atual: `npm run test:integration` cobre validacao, aplicacao parcial e persistencia de regra.

## 11. Gerenciamento de regras salvas
- A tela de comandos deve listar ate 20 regras salvas ordenadas pela data mais recente.
- Cada regra deve exibir texto, alvo resumido e data de criacao.
- Ao excluir uma regra, o sistema deve remover apenas o registro da regra e atualizar a lista sem reverter a escala.
- Evidencia atual: `npm run test:integration` cobre exclusao de regra; ordenacao e exibicao seguem validacao manual.

## 12. Exportacao visual da escala
- Ao exportar, o sistema deve capturar a grade completa visivel do periodo selecionado, mesmo em tabelas com scroll horizontal.
- O download deve iniciar em formato PNG com nome saneado a partir de `escala-<mes>-<ano>`.
- Falhas de captura devem ser comunicadas por toast destrutivo.
- Evidencia atual: validacao manual.

## Cobertura automatizada atual
- `npm run test:unit`: cobre utilitarios de agenda em `src/lib/scheduleUtils.js`.
- `npm run test:integration`: cobre fluxos de colaborador, regeneracao de escala, edicao manual persistida, aplicacao de comandos IA e exclusao de regras.

## Lacunas de validacao que permanecem manuais
- Autenticacao real com Base44 e redirecionamento para login.
- Tela de usuario nao registrado.
- Estados visuais do dashboard.
- Navegacao por periodo na grade.
- Exportacao da imagem em diferentes larguras de tela.
