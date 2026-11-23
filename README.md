# ChildCareTimeline

PWA offline-first para registrar transições entre locais personalizáveis e calcular a duração e as noites de permanência em cada um.

## Tecnologias
- HTML, CSS e JavaScript sem frameworks
- `localStorage` para persistência local
- Service Worker para funcionamento offline e atualização de cache
- Web App Manifest para instalação como PWA

## Executar localmente
Service Workers exigem `localhost` ou HTTPS. Com Python instalado:
```bash
python -m http.server 8000
```
Acesse `http://localhost:8000`.

## Funcionalidades
- Gerenciamento de locais: adicionar, renomear e excluir das opções de novos registros; o histórico preserva os locais excluídos
- Cadastro de transições, inclusive em datas futuras para simulações
- Relatório por período, com tempo total por ambiente e opção de contar apenas noites
- Lista inicial configurável e histórico completo
- Edição e exclusão de transições
- Exportação de eventos e relatório em CSV
- Backup JSON versão 2 com locais e registros; compatível com backups antigos versão 1
- Importação com opção de substituir tudo ou adicionar registros e locais novos
- Persistência local e uso offline

## Dados e privacidade
Os registros ficam somente no armazenamento local do navegador/dispositivo, na chave `tempo-por-ambiente.events.v1`. Não há login, contas, nem sincronização entre dispositivos. Faça backups regulares antes de limpar os dados do navegador ou trocar de aparelho.

## Testes
Requer Node.js 18 ou superior:
```bash
node --test report-core.test.js
```
## Relatório e exportação

O filtro inclui a data final. O relatório mostra por padrão a duração e o percentual por ambiente, a partir do primeiro registro disponível quando o período começa antes do histórico. Marque **Contar apenas noites** para mudar a unidade do relatório e do CSV. Nesse modo, cada data conta uma noite usando o local ativo à meia-noite que inicia essa data, no fuso do dispositivo. Uma transição exatamente à meia-noite já conta para o novo local. As noites sem histórico aparecem como **Sem registro** e entram no total do período. Datas futuras podem ser usadas para simular.

O relatório sinaliza registros consecutivos no mesmo local e permanências acima do limite configurável, inicialmente 72 horas. Uma repetição não reinicia a permanência. Os alertas mostram as datas para conferência manual.

Os CSVs usam vírgula como separador e ponto decimal. O CSV de eventos usa `dd-MM-yyyy HH:mm:ss` e contém ambiente, data e hora e observação.

## Deploy no cPanel

O job de deploy roda após a aprovação dos testes em pushes para `main`, quando a variável de repositório `CPANEL_DEPLOY_ENABLED` vale `true`. O servidor precisa aceitar SSH a partir do runner do GitHub e ter `rsync` instalado.

Configure o ambiente `production` em Settings → Environments. Cadastre as variáveis `CPANEL_HOST`, `CPANEL_PORT` (opcional, padrão 22), `CPANEL_USER` e `CPANEL_DOCUMENT_ROOT` (caminho absoluto do subdomínio). Cadastre os secrets `CPANEL_SSH_KEY` (chave dedicada cuja pública foi autorizada no cPanel) e `CPANEL_KNOWN_HOSTS` (chave pública do servidor verificada, no formato OpenSSH). Ative o job após configurar o ambiente.
