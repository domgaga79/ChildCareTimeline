'use strict';

// Para alterar os ambientes, edite somente este array.
const ENVIRONMENTS = [
  { id: 'pai', label: 'Pai' },
  { id: 'mae', label: 'Mãe' },
  { id: 'avo', label: 'Avó' },
  { id: 'escola', label: 'Escola' }
];

const STORAGE_KEY = 'tempo-por-ambiente.events.v1';
const BACKUP_FORMAT = 'ChildCareTimelineBackup';
const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

const form = document.querySelector('#transition-form');
const environmentInput = document.querySelector('#environment');
const dateInput = document.querySelector('#date');
const timeInput = document.querySelector('#time');
const noteInput = document.querySelector('#note');
const message = document.querySelector('#form-message');
const reportPeriod = document.querySelector('#report-period');
const reportResults = document.querySelector('#report-results');
const eventList = document.querySelector('#event-list');
const eventCount = document.querySelector('#event-count');
const backupButton = document.querySelector('#export-backup');
const importButton = document.querySelector('#import-backup');
const importInput = document.querySelector('#backup-file');
const backupMessage = document.querySelector('#backup-message');

function localDateTimeParts(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`
  };
}

function setDateTimeDefaults() {
  const now = localDateTimeParts();
  dateInput.value = now.date;
  timeInput.value = now.time;
}

function readEvents() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.filter(event =>
      event && typeof event.id === 'string' &&
      ENVIRONMENTS.some(env => env.id === event.environment) &&
      Number.isFinite(Date.parse(event.at))
    ) : [];
  } catch (error) {
    console.error('Não foi possível ler os registros locais.', error);
    return [];
  }
}

function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function environmentName(id) {
  return ENVIRONMENTS.find(environment => environment.id === id)?.label || id;
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date);
}

function formatDuration(milliseconds) {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${minutes}min`);
  return parts.join(' ');
}

function renderHistory(events) {
  const ordered = [...events].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  eventCount.textContent = `${ordered.length} ${ordered.length === 1 ? 'registro' : 'registros'}`;
  eventList.replaceChildren();

  if (!ordered.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhuma transição registrada.';
    eventList.append(empty);
    return;
  }

  for (const event of ordered) {
    const item = document.createElement('li');
    item.className = 'event-item';
    const place = document.createElement('span');
    place.className = 'event-place';
    place.textContent = environmentName(event.environment);
    const date = document.createElement('time');
    date.className = 'event-date';
    date.dateTime = event.at;
    date.textContent = formatDateTime(new Date(event.at));
    item.append(place, date);
    if (event.note) {
      const note = document.createElement('p');
      note.className = 'event-note';
      note.textContent = event.note;
      item.append(note);
    }
    eventList.append(item);
  }
}

function renderReport(events, now = new Date()) {
  const ordered = [...events]
    .filter(event => Date.parse(event.at) <= now.getTime())
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  reportResults.replaceChildren();

  if (!ordered.length) {
    reportPeriod.textContent = 'Adicione a primeira transição para iniciar.';
    return;
  }

  const first = new Date(ordered[0].at);
  const totalMs = now.getTime() - first.getTime();
  reportPeriod.textContent = `Período: ${formatDateTime(first)} a ${formatDateTime(now)}`;

  const totals = new Map(ENVIRONMENTS.map(environment => [environment.id, 0]));
  for (let index = 0; index < ordered.length; index += 1) {
    const start = Date.parse(ordered[index].at);
    const end = index + 1 < ordered.length ? Date.parse(ordered[index + 1].at) : now.getTime();
    totals.set(ordered[index].environment, totals.get(ordered[index].environment) + Math.max(0, end - start));
  }

  for (const environment of ENVIRONMENTS) {
    const milliseconds = totals.get(environment.id);
    if (!milliseconds && totalMs > 0) continue;
    const percentage = totalMs > 0 ? (milliseconds / totalMs) * 100 : 0;
    const row = document.createElement('div');
    row.className = 'report-row';
    const name = document.createElement('span');
    name.className = 'report-name';
    name.textContent = environment.label;
    const value = document.createElement('span');
    value.className = 'report-value';
    value.textContent = `${formatDuration(milliseconds)} (${percentage.toFixed(1).replace('.', ',')}%)`;
    const bar = document.createElement('div');
    bar.className = 'report-percent';
    const fill = document.createElement('span');
    fill.style.width = `${Math.min(100, percentage)}%`;
    bar.append(fill);
    row.append(name, value, bar);
    reportResults.append(row);
  }
}

function render() {
  const events = readEvents();
  renderHistory(events);
  renderReport(events);
}

function exportBackup() {
  const payload = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    events: readEvents()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `childcaretimeline-backup-${localDateTimeParts().date}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  backupMessage.textContent = `${payload.events.length} registros exportados. Guarde o arquivo em local seguro.`;
}

function validateBackup(payload) {
  if (!payload || payload.format !== BACKUP_FORMAT ||
      payload.version !== BACKUP_VERSION || !Array.isArray(payload.events) ||
      payload.events.length > 100000) {
    throw new Error('Arquivo de backup inválido ou versão não compatível.');
  }

  const seenIds = new Set();
  return payload.events.filter(event => {
    if (!event || typeof event.id !== 'string' || !event.id ||
        !ENVIRONMENTS.some(environment => environment.id === event.environment) ||
        typeof event.at !== 'string' || !Number.isFinite(Date.parse(event.at)) ||
        (event.note !== undefined && typeof event.note !== 'string')) {
      throw new Error('O backup contém um registro inválido. Nenhum dado foi importado.');
    }
    if (seenIds.has(event.id)) return false;
    seenIds.add(event.id);
    return true;
  }).map(event => ({
      id: event.id,
      environment: event.environment,
      at: new Date(event.at).toISOString(),
      note: typeof event.note === 'string' ? event.note.slice(0, 1000) : ''
    }));
}

async function importBackup(file) {
  if (!file) return;
  if (file.size > MAX_BACKUP_BYTES) {
    throw new Error('O arquivo excede o limite de 5 MB.');
  }

  const payload = JSON.parse(await file.text());
  const imported = validateBackup(payload);
  const existing = readEvents();
  const knownIds = new Set(existing.map(event => event.id));
  const uniqueImported = imported.filter(event => !knownIds.has(event.id));

  if (!uniqueImported.length) {
    backupMessage.textContent = 'Nenhum registro novo encontrado. Seu histórico foi mantido.';
    return;
  }

  const accepted = window.confirm(
    `O backup contém ${imported.length} registros. ${uniqueImported.length} são novos. ` +
    'Deseja adicionar os novos registros sem apagar os atuais?'
  );
  if (!accepted) {
    backupMessage.textContent = 'Importação cancelada. Seus registros foram preservados.';
    return;
  }

  // Gravação única: se falhar, os registros anteriores permanecem intactos.
  saveEvents([...existing, ...uniqueImported]);
  render();
  backupMessage.textContent =
    `${uniqueImported.length} registros importados. ${imported.length - uniqueImported.length} duplicados ignorados.`;
}

for (const environment of ENVIRONMENTS) {
  const option = document.createElement('option');
  option.value = environment.id;
  option.textContent = environment.label;
  environmentInput.append(option);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  message.textContent = '';
  const dateTime = new Date(`${dateInput.value}T${timeInput.value}`);
  if (!dateInput.value || !timeInput.value || Number.isNaN(dateTime.getTime())) {
    message.textContent = 'Informe uma data e hora válidas.';
    return;
  }
  if (dateTime.getTime() > Date.now()) {
    message.textContent = 'Não é permitido registrar uma data ou hora futura.';
    return;
  }

  const events = readEvents();
  events.push({
    id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    environment: environmentInput.value,
    at: dateTime.toISOString(),
    note: noteInput.value.trim()
  });

  try {
    saveEvents(events);
    noteInput.value = '';
    setDateTimeDefaults();
    message.textContent = 'Transição adicionada.';
    render();
  } catch (error) {
    console.error('Não foi possível salvar o registro.', error);
    message.textContent = 'Não foi possível salvar. Verifique o espaço disponível no navegador.';
  }
});

document.querySelector('#refresh-report').addEventListener('click', render);
backupButton.addEventListener('click', exportBackup);
importButton.addEventListener('click', () => importInput.click());
importInput.addEventListener('change', async () => {
  backupMessage.textContent = '';
  try {
    await importBackup(importInput.files[0]);
  } catch (error) {
    console.error('Falha ao importar backup.', error);
    backupMessage.textContent = error.message || 'Não foi possível ler o arquivo de backup.';
  } finally {
    importInput.value = '';
  }
});

setDateTimeDefaults();
render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(error => {
      console.error('Falha ao registrar o modo offline.', error);
    });
  });
}
