# ChildCareTimeline — tarefas para GitHub

## [Concluída] Filtrar relatório por período
**Objetivo:** permitir selecionar data inicial e final para calcular a permanência por ambiente.
**Critérios de aceite:** data final inclusiva; ambiente vigente no início do período considerado; períodos futuros permitidos; mensagem clara para intervalos inválidos.

## [Concluída] Limitar a lista inicial e oferecer histórico completo
**Objetivo:** manter a tela principal compacta sem perder acesso ao histórico.
**Critérios de aceite:** usuário escolhe 5, 10, 20 ou 50 registros; histórico completo abre em tela/janela separada.

## [Concluída] Editar e excluir transições
**Objetivo:** corrigir registros lançados com ambiente, data ou hora incorretos.
**Critérios de aceite:** selecionar registro abre formulário; salvar atualiza o mesmo ID; excluir exige confirmação; histórico e relatório são atualizados.

## [Concluída] Exportar eventos e relatório em CSV
**Objetivo:** permitir abrir os registros e os resultados do período em planilhas.
**Critérios de aceite:** exportação completa de eventos; exportação do relatório respeita filtro De/Até; campos CSV escapados corretamente.

## [Concluída] Escolher estratégia ao importar backup
**Objetivo:** evitar que uma restauração apenas acrescente registros quando o usuário pretende substituir o histórico.
**Critérios de aceite:** opção substituir tudo; opção adicionar sem duplicar IDs; cancelar preserva os dados existentes; formato JSON v1 continua aceito.

## [Concluída] Testes unitários
**Objetivo:** validar cálculos e operações essenciais antes de encerrar a atualização.
**Critérios de aceite:** testes para duração, percentuais, períodos futuros, backup, deduplicação e CSV; comando `node --test report-core.test.js` executa sem falhas.

## Fora do escopo
- Login, autenticação e cadastro de usuários.
- Sincronização/armazenamento em servidor.
- Bloqueio de datas futuras.
