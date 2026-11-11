# Tempo por ambiente

PWA simples para registrar transições entre ambientes e calcular o tempo de permanência em cada um.

## Tecnologias

- HTML, CSS e JavaScript vanilla
- `localStorage` para persistência local
- Service Worker para cache offline
- Web App Manifest para instalação como PWA

## Executar localmente

Service Workers exigem `localhost` ou HTTPS. Com Python instalado:

```bash
python -m http.server 8000
```

Acesse `http://localhost:8000`.

## Ambientes

Edite o array `ENVIRONMENTS` no início de `app.js`.

## Regras atuais

- Cada registro marca o início do ambiente selecionado.
- O registro seguinte encerra o período anterior.
- O relatório começa na primeira transição registrada e termina no momento da consulta.
- Registros futuros não são aceitos.
- Os dados ficam no navegador/dispositivo e não são sincronizados.

## Atenção aos dados

Limpar os dados do navegador pode apagar os registros. Esta versão ainda não tem exportação ou restauração de backup.
