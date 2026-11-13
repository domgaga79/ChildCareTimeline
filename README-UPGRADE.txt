CHILDCARETIMELINE — ATUALIZAÇÃO CONSOLIDADA

Esta atualização reúne as funcionalidades solicitadas e preserva o armazenamento local existente.

FUNCIONALIDADES
- Filtro do relatório por data inicial e final (data final inclusiva).
- Cálculo do tempo e percentual por ambiente, considerando o ambiente ativo no início do período.
- Aceita registros e simulações em datas futuras.
- Tela inicial com as últimas 5, 10, 20 ou 50 transições (configurável).
- Histórico completo em janela separada.
- Toque/clique em um registro para editar ambiente, data, hora e observação.
- Exclusão de registro com confirmação.
- Exportação de todos os eventos em CSV.
- Exportação do relatório do período selecionado em CSV.
- Backup JSON compatível com ChildCareTimelineBackup versão 1.
- Importação com escolha entre substituir todo o histórico ou adicionar registros, ignorando IDs duplicados.
- Funcionamento offline por PWA; cache atualizado para v5.

INSTALAÇÃO NO CPANEL
1. Antes de atualizar, faça backup dos arquivos atuais no cPanel.
2. Extraia este ZIP no computador.
3. Envie para a pasta pública do aplicativo, substituindo os arquivos:
   index.html, style.css, app.js, report-core.js, sw.js e manifest.json.
4. Envie também a pasta icons, mantendo os arquivos e caminhos existentes.
5. NÃO apague os dados do navegador, não limpe o localStorage e não altere a chave
   tempo-por-ambiente.events.v1.
6. Abra o aplicativo com internet, atualize a página e aguarde alguns segundos para
   o Service Worker instalar a versão nova. Se necessário, feche e abra o PWA.
7. Teste primeiro com poucos registros ou em uma cópia/backup, antes de importar
   dados reais em outro dispositivo.

BACKUP E IMPORTAÇÃO
- Exporte um backup JSON antes da atualização.
- Na restauração, escolha "Substituir tudo" para trocar o histórico atual pelo backup.
- Escolha "Adicionar registros" para manter o histórico atual e acrescentar apenas IDs novos.
- A opção substituir é destrutiva; confirme que o arquivo selecionado é o correto.

EXPORTAÇÕES
- "Exportar eventos CSV" gera a lista completa de eventos.
- "Exportar relatório CSV" exporta os totais e percentuais calculados com o filtro De/Até aplicado.
- Os CSV usam ponto e vírgula como separador, adequado às configurações regionais comuns do Excel em português.

TESTES AUTOMATIZADOS
Requer Node.js 18 ou superior. Na pasta do projeto, execute:
  node --test report-core.test.js

Os testes cobrem duração, percentual, filtro, eventos futuros, validação de backup,
deduplicação na importação e escape de CSV.

LIMITAÇÕES MANTIDAS INTENCIONALMENTE
- Não há login nem cadastro de usuários.
- Não há sincronização com servidor: os dados continuam locais em cada navegador/dispositivo.
- Datas futuras continuam permitidas.
