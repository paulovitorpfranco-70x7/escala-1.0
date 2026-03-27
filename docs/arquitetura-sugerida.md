# Sugestao de Arquitetura Clean Code

## Estrutura proposta para frontend web
- **Components Layer:** componentes de interface reutilizaveis e preferencialmente burros.
- **Containers/Pages:** paginas e componentes inteligentes conectados ao estado e aos fluxos do produto.
- **Services/Hooks:** encapsular chamadas de API, integracoes Base44 e logica de negocio em hooks e servicos dedicados.
- **Store:** usar gerenciamento de estado global apenas quando houver necessidade real de compartilhamento transversal.

## Praticas recomendadas
- Separacao clara de responsabilidades.
- Uso de custom hooks para regras de negocio e efeitos.
- UI desacoplada da persistencia sempre que possivel.
- Evoluir a estrutura conforme a complexidade real do produto.