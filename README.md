# ChildCareTimeline

PWA offline-first para registrar transições entre ambientes (Pai, Mãe, Avó e Escola) e calcular o tempo de permanência em cada um.

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
- Cadastro de transições, inclusive em datas futuras para simulações
- Relatório por período, com duração e percentual por ambiente
- Lista inicial configurável e histórico completo
- Edição e exclusão de transições
- Exportação de eventos e relatório em CSV
- Backup JSON e importação com opção de substituir tudo ou adicionar registros
- Persistência local e uso offline

## Dados e privacidade
Os registros ficam somente no armazenamento local do navegador/dispositivo, na chave `tempo-por-ambiente.events.v1`. Não há login, contas, nem sincronização entre dispositivos. Faça backups regulares antes de limpar os dados do navegador ou trocar de aparelho.

## Testes
Requer Node.js 18 ou superior:
```bash
node --test report-core.test.js
```
Consulte `README-UPGRADE.txt` para instruções de atualização no cPanel.
