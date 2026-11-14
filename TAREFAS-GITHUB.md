# ChildCareTimeline — tarefas para GitHub

## Funcionalidades concluídas

### [Concluída] Filtrar relatório por período
**Objetivo:** permitir selecionar data inicial e final para calcular a permanência por ambiente.
**Critérios de aceite:** data final inclusiva; ambiente vigente no início do período considerado; períodos futuros permitidos; mensagem clara para intervalos inválidos.

### [Concluída] Limitar a lista inicial e oferecer histórico completo
**Objetivo:** manter a tela principal compacta sem perder acesso ao histórico.
**Critérios de aceite:** usuário escolhe 5, 10, 20 ou 50 registros; histórico completo abre em tela/janela separada.

### [Concluída] Editar e excluir transições
**Objetivo:** corrigir registros lançados com ambiente, data ou hora incorretos.
**Critérios de aceite:** selecionar registro abre formulário; salvar atualiza o mesmo ID; excluir exige confirmação; histórico e relatório são atualizados.

### [Concluída] Exportar eventos e relatório em CSV
**Objetivo:** permitir abrir os registros e os resultados do período em planilhas.
**Critérios de aceite:** exportação completa de eventos; exportação do relatório respeita filtro De/Até; campos CSV escapados corretamente.

### [Concluída] Escolher estratégia ao importar backup
**Objetivo:** evitar que uma restauração apenas acrescente registros quando o usuário pretende substituir o histórico.
**Critérios de aceite:** opção substituir tudo; opção adicionar sem duplicar IDs; cancelar preserva os dados existentes; formato JSON v1 continua aceito.

### [Concluída] Testes unitários
**Objetivo:** validar cálculos e operações essenciais antes de encerrar a atualização.
**Critérios de aceite:** testes para duração, percentuais, períodos futuros, backup v1/v2, deduplicação, locais personalizados e CSV.
**Validação local:** 18 testes aprovados; 0 falhas. Comando: `node --test report-core.test.js`.

### [Concluída] Gerenciamento de locais
**Objetivo:** permitir personalizar os locais disponíveis nos registros.
**Critérios de aceite:** editar Pai, Mãe, Avó e Escola; adicionar novos locais; excluir locais da lista ativa sem apagar sua identificação em registros históricos; impedir exclusão do último local ativo; manter compatibilidade com backup JSON v1 e v2.

## Qualidade e automação

### [Concluída] GitHub Actions — testes automáticos
**Objetivo:** executar testes e verificações de sintaxe automaticamente no GitHub.
**Configuração:** `.github/workflows/testes.yml`.
**Gatilhos:** push para `main`, pull request direcionado a `main` e execução manual.
**Validação:** workflow executado com sucesso; 18 testes aprovados; verificações `node --check app.js` e `node --check sw.js` aprovadas.

## Validações manuais

### [Concluída] Backup JSON no modo offline
**Objetivo:** validar exportação e restauração de backup sem conexão.
**Validação:** exportação JSON offline; importação offline com substituição dos registros; conferência do histórico após atualizar a página; persistência dos dados e locais personalizados após F5; retorno ao funcionamento online. Todos os passos confirmados pelo usuário.

## Fora do escopo aprovado
- Login, autenticação e cadastro de usuários.
- Sincronização/armazenamento em servidor.
- Bloqueio de datas futuras.
- Novas funcionalidades não aprovadas antes da conclusão da validação.
