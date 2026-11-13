'use strict';

function calculateResidence(events, startMs, endMs) {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs)
    return { totals: {}, totalMs: 0, actualStartMs: null, endMs };
  const ordered = events
    .filter(event => event && typeof event.environment === 'string' && Number.isFinite(Date.parse(event.at)))
    .map(event => ({ environment: event.environment, at: Date.parse(event.at) }))
    .filter(event => event.at < endMs)
    .sort((a, b) => a.at - b.at);
  const totals = {};
  if (!ordered.length) return { totals, totalMs: 0, actualStartMs: null, endMs };
  let activeIndex = -1;
  for (let i = 0; i < ordered.length; i++) {
    if (ordered[i].at <= startMs) activeIndex = i;
    else break;
  }
  let cursor, activeEnvironment, nextIndex;
  if (activeIndex >= 0) {
    cursor = startMs; activeEnvironment = ordered[activeIndex].environment; nextIndex = activeIndex + 1;
  } else {
    cursor = ordered[0].at; activeEnvironment = ordered[0].environment; nextIndex = 1;
  }
  const actualStartMs = cursor;
  for (let i = nextIndex; i < ordered.length; i++) {
    const event = ordered[i];
    if (event.at < cursor) continue;
    totals[activeEnvironment] = (totals[activeEnvironment] || 0) + event.at - cursor;
    cursor = event.at; activeEnvironment = event.environment;
  }
  if (endMs > cursor) totals[activeEnvironment] = (totals[activeEnvironment] || 0) + endMs - cursor;
  return { totals, totalMs: Math.max(0, endMs - actualStartMs), actualStartMs, endMs };
}

function calculatePercentages(totals, totalMs) {
  const result = {};
  for (const [environment, milliseconds] of Object.entries(totals || {}))
    result[environment] = totalMs > 0 ? (milliseconds / totalMs) * 100 : 0;
  return result;
}

function validateBackup(payload, environments, format = 'ChildCareTimelineBackup', version = 1) {
  if (!payload || payload.format !== format || payload.version !== version ||
      !Array.isArray(payload.events) || payload.events.length > 100000)
    throw new Error('Arquivo de backup inválido ou versão não compatível.');
  const seen = new Set();
  return payload.events.filter(event => {
    if (!event || typeof event.id !== 'string' || !event.id ||
        !environments.includes(event.environment) || typeof event.at !== 'string' ||
        !Number.isFinite(Date.parse(event.at)) ||
        (event.note !== undefined && typeof event.note !== 'string'))
      throw new Error('O backup contém um registro inválido. Nenhum dado foi importado.');
    if (seen.has(event.id)) return false;
    seen.add(event.id); return true;
  }).map(event => ({
    id: event.id, environment: event.environment,
    at: new Date(event.at).toISOString(),
    note: typeof event.note === 'string' ? event.note.slice(0, 1000) : ''
  }));
}

function mergeEvents(existing, imported) {
  const ids = new Set(existing.map(event => event.id));
  const additions = imported.filter(event => !ids.has(event.id));
  return { events: [...existing, ...additions], added: additions.length, duplicates: imported.length - additions.length };
}

function toCsv(rows) {
  return rows.map(row => row.map(value => {
    const text = String(value ?? '');
    return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }).join(';')).join('\r\n');
}

if (typeof module !== 'undefined' && module.exports)
  module.exports = { calculateResidence, calculatePercentages, validateBackup, mergeEvents, toCsv };
if (typeof globalThis !== 'undefined')
  globalThis.ChildCareReport = { calculateResidence, calculatePercentages, validateBackup, mergeEvents, toCsv };
