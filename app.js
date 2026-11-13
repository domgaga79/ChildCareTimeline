'use strict';

const ENVIRONMENTS = [
  { id: 'pai', label: 'Pai' }, { id: 'mae', label: 'Mãe' },
  { id: 'avo', label: 'Avó' }, { id: 'escola', label: 'Escola' }
];
const STORAGE_KEY = 'tempo-por-ambiente.events.v1';
const BACKUP_FORMAT = 'ChildCareTimelineBackup';
const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
const $ = selector => document.querySelector(selector);

const form = $('#transition-form'), environmentInput = $('#environment');
const dateInput = $('#date'), timeInput = $('#time'), noteInput = $('#note');
const message = $('#form-message'), reportPeriod = $('#report-period');
const reportResults = $('#report-results'), reportFromInput = $('#report-from');
const reportToInput = $('#report-to'), eventList = $('#event-list');
const eventCount = $('#event-count'), historyLimit = $('#history-limit');
const fullHistoryDialog = $('#full-history-dialog'), fullEventList = $('#full-event-list');
const eventDialog = $('#event-dialog'), editForm = $('#edit-event-form');
const importDialog = $('#import-choice-dialog');
const backupMessage = $('#backup-message'), importInput = $('#backup-file');
let editingId = null, pendingImport = null;

function localDateTimeParts(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return { date: `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}` };
}
function setDateTimeDefaults() {
  const now = localDateTimeParts(); dateInput.value = now.date; timeInput.value = now.time;
}
function readEvents() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(event => event && typeof event.id === 'string' &&
      ENVIRONMENTS.some(env => env.id === event.environment) && Number.isFinite(Date.parse(event.at))) : [];
  } catch (error) { console.error('Erro ao ler registros locais.', error); return []; }
}
function saveEvents(events) { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); }
function environmentName(id) { return ENVIRONMENTS.find(env => env.id === id)?.label || id; }
function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' }).format(date);
}
function formatDateTime(date) {
  return new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit' }).format(date);
}
function formatDuration(ms) {
  const mins = Math.max(0, Math.floor(ms / 60000)), days = Math.floor(mins/1440);
  const hours = Math.floor((mins%1440)/60), minutes = mins%60, parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${minutes}min`); return parts.join(' ');
}
function dateInputStart(value) {
  if (!value) return null;
  const [y,m,d] = value.split('-').map(Number);
  const date = new Date(y,m-1,d,0,0,0,0); return Number.isNaN(date.getTime()) ? null : date.getTime();
}
function dateInputEndExclusive(value) {
  if (!value) return null;
  const [y,m,d] = value.split('-').map(Number);
  const date = new Date(y,m-1,d+1,0,0,0,0); return Number.isNaN(date.getTime()) ? null : date.getTime();
}
function createEventButton(event) {
  const item = document.createElement('li'); item.className = 'event-item';
  const button = document.createElement('button'); button.type = 'button';
  button.className = 'event-open'; button.setAttribute('aria-label', `Editar registro: ${environmentName(event.environment)}, ${formatDateTime(new Date(event.at))}`);
  const place = document.createElement('span'); place.className = 'event-place'; place.textContent = environmentName(event.environment);
  const date = document.createElement('time'); date.className = 'event-date'; date.dateTime = event.at;
  date.textContent = formatDateTime(new Date(event.at)); button.append(place,date); button.addEventListener('click', () => openEdit(event.id));
  item.append(button);
  if (event.note) { const note = document.createElement('p'); note.className='event-note'; note.textContent=event.note; item.append(note); }
  return item;
}
function renderEventList(target, events, limit = Infinity) {
  target.replaceChildren();
  if (!events.length) { const empty=document.createElement('li'); empty.className='empty-state'; empty.textContent='Nenhuma transição registrada.'; target.append(empty); return; }
  events.slice(0,limit).forEach(event => target.append(createEventButton(event)));
}
function renderHistory(events) {
  const ordered=[...events].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
  eventCount.textContent=`${ordered.length} ${ordered.length===1?'registro':'registros'}`;
  renderEventList(eventList,ordered,Number(historyLimit.value)||10);
  renderEventList(fullEventList,ordered);
}
function renderReport(events, now = new Date()) {
  reportResults.replaceChildren();
  const from=reportFromInput.value, to=reportToInput.value;
  if (from && to && from>to) { reportPeriod.textContent='O início do período não pode ser posterior ao fim.'; return null; }
  const ordered=[...events].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  if (!ordered.length) { reportPeriod.textContent='Adicione a primeira transição para iniciar.'; return null; }
  const start=dateInputStart(from) ?? Date.parse(ordered[0].at);
  const end=dateInputEndExclusive(to) ?? now.getTime();
  if (end<=start) { reportPeriod.textContent='O período selecionado ainda não possui duração para calcular.'; return null; }
  const result=ChildCareReport.calculateResidence(events,start,end);
  if (!result.totalMs) { reportPeriod.textContent='Não há transições registradas dentro do período selecionado.'; return null; }
  const range=`${from?formatDate(new Date(result.actualStartMs)):formatDateTime(new Date(result.actualStartMs))} a ${to?formatDate(new Date(end-1)):formatDateTime(new Date(end))}`;
  reportPeriod.textContent=`Período calculado: ${range}${result.actualStartMs>start?' (a partir do primeiro registro disponível)':''}`;
  const percentages=ChildCareReport.calculatePercentages(result.totals,result.totalMs);
  for (const env of ENVIRONMENTS) {
    const ms=result.totals[env.id]||0; if (!ms && result.totalMs>0) continue;
    const pct=percentages[env.id]||0;
    const row=document.createElement('div'); row.className='report-row';
    const name=document.createElement('span'); name.className='report-name'; name.textContent=env.label;
    const value=document.createElement('span'); value.className='report-value';
    value.textContent=`${formatDuration(ms)} (${pct.toFixed(1).replace('.',',')}%)`;
    const bar=document.createElement('div'); bar.className='report-percent';
    const fill=document.createElement('span'); fill.style.width=`${Math.min(100,pct)}%`; bar.append(fill);
    row.append(name,value,bar); reportResults.append(row);
  }
  return { result, start, end };
}
function render() { const events=readEvents(); renderHistory(events); renderReport(events); }
function downloadFile(filename, content, type) {
  const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob);
  const link=document.createElement('a'); link.href=url; link.download=filename;
  document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportBackup() {
  const events=readEvents(), payload={format:BACKUP_FORMAT,version:BACKUP_VERSION,exportedAt:new Date().toISOString(),events};
  downloadFile(`childcaretimeline-backup-${localDateTimeParts().date}.json`,JSON.stringify(payload,null,2),'application/json');
  backupMessage.textContent=`${events.length} registros exportados. Guarde o arquivo em local seguro.`;
}
function exportEventsCsv() {
  const events=[...readEvents()].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  const rows=[['ID','Ambiente','Data e hora','Observação'],...events.map(e=>[e.id,environmentName(e.environment),formatDateTime(new Date(e.at)),e.note||''])];
  downloadFile(`childcaretimeline-eventos-${localDateTimeParts().date}.csv`,'\uFEFF'+ChildCareReport.toCsv(rows),'text/csv;charset=utf-8');
  backupMessage.textContent=`CSV exportado com ${events.length} registros.`;
}
function exportReportCsv() {
  const events=readEvents(), range=renderReport(events);
  if (!range) { backupMessage.textContent='Não há um relatório válido para exportar. Verifique o período selecionado.'; return; }
  const rows=[['Ambiente','Duração (minutos)','Percentual']];
  for (const env of ENVIRONMENTS) {
    const ms=range.result.totals[env.id]||0;
    if (ms || range.result.totalMs) rows.push([env.label,Math.floor(ms/60000),(ms/range.result.totalMs*100).toFixed(2).replace('.',',')+'%']);
  }
  rows.push(['Total',Math.floor(range.result.totalMs/60000),'100%']);
  rows.unshift(['Período',`${reportFromInput.value?formatDate(new Date(range.result.actualStartMs)):formatDateTime(new Date(range.result.actualStartMs))} até ${reportToInput.value?formatDate(new Date(range.end-1)):formatDateTime(new Date(range.end))}`,'']);
  downloadFile(`childcaretimeline-relatorio-${localDateTimeParts().date}.csv`,'\uFEFF'+ChildCareReport.toCsv(rows),'text/csv;charset=utf-8');
  backupMessage.textContent='Relatório do período exportado em CSV.';
}
function openEdit(id) {
  const event=readEvents().find(item=>item.id===id); if (!event) return;
  editingId=id; const date=new Date(event.at), parts=localDateTimeParts(date);
  $('#edit-environment').value=event.environment; $('#edit-date').value=parts.date;
  $('#edit-time').value=parts.time; $('#edit-note').value=event.note||'';
  $('#edit-message').textContent=''; eventDialog.showModal();
}
function closeEdit() { editingId=null; eventDialog.close(); }
function populateEnvironmentSelect(select) {
  select.replaceChildren();
  ENVIRONMENTS.forEach(env=>{const option=document.createElement('option');option.value=env.id;option.textContent=env.label;select.append(option);});
}
async function importBackup(file) {
  if (!file) return;
  if (file.size>MAX_BACKUP_BYTES) throw new Error('O arquivo excede o limite de 5 MB.');
  const payload=JSON.parse(await file.text());
  const imported=ChildCareReport.validateBackup(payload,ENVIRONMENTS.map(env=>env.id),BACKUP_FORMAT,BACKUP_VERSION);
  pendingImport=imported;
  if (typeof importDialog.showModal==='function') importDialog.showModal();
  else {
    const replace=window.confirm(`O backup contém ${imported.length} registros. OK para substituir tudo; Cancelar para escolher adicionar.`);
    if (replace) applyImport('replace');
    else if (window.confirm('Deseja adicionar os registros novos sem apagar os atuais?')) applyImport('add');
    else backupMessage.textContent='Importação cancelada.';
  }
}
function applyImport(mode) {
  if (!pendingImport) return;
  const existing=readEvents();
  if (mode==='replace') {
    try { saveEvents(pendingImport); render(); backupMessage.textContent=`Histórico substituído por ${pendingImport.length} registros do backup.`; }
    catch(error) { backupMessage.textContent='Não foi possível gravar o backup. Os dados anteriores foram preservados.'; }
  } else {
    const merged=ChildCareReport.mergeEvents(existing,pendingImport);
    try { saveEvents(merged.events); render(); backupMessage.textContent=`${merged.added} registros adicionados; ${merged.duplicates} duplicados ignorados.`; }
    catch(error) { backupMessage.textContent='Não foi possível gravar o backup. Os dados anteriores foram preservados.'; }
  }
  pendingImport=null; if (importDialog.open) importDialog.close();
}
populateEnvironmentSelect(environmentInput); populateEnvironmentSelect($('#edit-environment'));
setDateTimeDefaults(); render();

form.addEventListener('submit',event=>{
  event.preventDefault(); message.textContent='';
  const dateTime=new Date(`${dateInput.value}T${timeInput.value}`);
  if (!dateInput.value||!timeInput.value||Number.isNaN(dateTime.getTime())) {message.textContent='Informe uma data e hora válidas.';return;}
  const events=readEvents(); events.push({id:crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`,
    environment:environmentInput.value,at:dateTime.toISOString(),note:noteInput.value.trim()});
  try {saveEvents(events);noteInput.value='';setDateTimeDefaults();message.textContent='Transição adicionada.';render();}
  catch(error){console.error(error);message.textContent='Não foi possível salvar. Verifique o espaço disponível no navegador.';}
});
$('#refresh-report').addEventListener('click',render);
$('#apply-report-filter').addEventListener('click',render);
$('#clear-report-filter').addEventListener('click',()=>{reportFromInput.value='';reportToInput.value='';render();});
historyLimit.addEventListener('change',()=>renderHistory(readEvents()));
$('#open-full-history').addEventListener('click',()=>fullHistoryDialog.showModal());
$('#close-full-history').addEventListener('click',()=>fullHistoryDialog.close());
$('#cancel-edit').addEventListener('click',closeEdit);
editForm.addEventListener('submit',event=>{
  event.preventDefault(); if (!editingId) return;
  const dateTime=new Date(`${$('#edit-date').value}T${$('#edit-time').value}`);
  if (!$('#edit-date').value||!$('#edit-time').value||Number.isNaN(dateTime.getTime())) {$('#edit-message').textContent='Informe uma data e hora válidas.';return;}
  const events=readEvents(), index=events.findIndex(item=>item.id===editingId); if(index<0){closeEdit();return;}
  events[index]={...events[index],environment:$('#edit-environment').value,at:dateTime.toISOString(),note:$('#edit-note').value.trim()};
  try {saveEvents(events);closeEdit();render();backupMessage.textContent='Registro atualizado.';}
  catch(error){$('#edit-message').textContent='Não foi possível salvar a alteração.';}
});
$('#delete-event').addEventListener('click',()=>{
  if (!editingId||!window.confirm('Tem certeza de que deseja excluir esta transição? Esta ação não pode ser desfeita.')) return;
  try {saveEvents(readEvents().filter(item=>item.id!==editingId));closeEdit();render();backupMessage.textContent='Registro excluído.';}
  catch(error){$('#edit-message').textContent='Não foi possível excluir o registro.';}
});
$('#export-backup').addEventListener('click',exportBackup);
$('#export-events-csv').addEventListener('click',exportEventsCsv);
$('#export-report-csv').addEventListener('click',exportReportCsv);
$('#import-backup').addEventListener('click',()=>importInput.click());
importInput.addEventListener('change',async()=>{
  backupMessage.textContent='';
  try {await importBackup(importInput.files[0]);}
  catch(error){console.error(error);backupMessage.textContent=error.message||'Não foi possível ler o arquivo de backup.';}
  finally {importInput.value='';}
});
$('#replace-import').addEventListener('click',()=>applyImport('replace'));
$('#add-import').addEventListener('click',()=>applyImport('add'));
$('#cancel-import').addEventListener('click',()=>{pendingImport=null;importDialog.close();backupMessage.textContent='Importação cancelada. Seus registros foram preservados.';});

if ('serviceWorker' in navigator && location.protocol!=='file:') {
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(error=>console.error('Falha ao registrar o modo offline.',error)));
}
