# ChildCareTimeline

PWA offline-first para registrar transições entre locais personalizáveis e calcular o tempo de permanência em cada um.

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
- Relatório por período, com duração e percentual por ambiente
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
Consulte `README-UPGRADE.txt` para instruções de atualização no cPanel.
