'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateResidence, calculatePercentages, validateBackup, validateBackupData, mergeEvents, toCsv } = require('./report-core.js');
const ChildCareReportValidateV2 = payload => validateBackupData(payload, envs);
const at = value => Date.parse(`2026-01-01T${value}:00Z`);
const iso = value => new Date(at(value)).toISOString();
const envs = ['pai','mae','avo','escola'];

test('calcula duração entre transições e total do período', () => {
  const r=calculateResidence([{environment:'pai',at:iso('00:00')},{environment:'mae',at:iso('02:00')}],at('00:00'),at('05:00'));
  assert.deepEqual(r.totals,{pai:7200000,mae:10800000}); assert.equal(r.totalMs,18000000);
});
test('considera ambiente ativo antes do início do filtro', () => {
  const r=calculateResidence([{environment:'pai',at:iso('00:00')},{environment:'mae',at:iso('03:00')}],at('01:00'),at('05:00'));
  assert.deepEqual(r.totals,{pai:7200000,mae:7200000});
});
test('não atribui tempo anterior ao primeiro evento', () => {
  const r=calculateResidence([{environment:'escola',at:iso('02:00')}],at('00:00'),at('05:00'));
  assert.deepEqual(r.totals,{escola:10800000}); assert.equal(r.totalMs,10800000);
});
test('inclui eventos futuros e projeta último ambiente até o fim', () => {
  const r=calculateResidence([{environment:'pai',at:iso('00:00')},{environment:'escola',at:iso('04:00')}],at('00:00'),at('06:00'));
  assert.deepEqual(r.totals,{pai:14400000,escola:7200000});
});
test('retorna período vazio para intervalo inválido', () => {
  assert.equal(calculateResidence([],at('03:00'),at('02:00')).totalMs,0);
});
test('ordena eventos fora de ordem cronológica', () => {
  const r=calculateResidence([{environment:'mae',at:iso('02:00')},{environment:'pai',at:iso('00:00')}],at('00:00'),at('03:00'));
  assert.deepEqual(r.totals,{pai:7200000,mae:3600000});
});
test('percentuais refletem a proporção das durações e somam 100', () => {
  const p=calculatePercentages({pai:2,mae:1},3);
  assert.ok(Math.abs(p.pai-(200/3))<1e-10); assert.ok(Math.abs(p.mae-(100/3))<1e-10);
  assert.ok(Math.abs(Object.values(p).reduce((a,b)=>a+b,0)-100)<1e-10);
});
test('percentuais de total zero são zero', () => {
  assert.deepEqual(calculatePercentages({pai:0,mae:0},0),{pai:0,mae:0});
});
test('valida backup e normaliza data e observação ausente', () => {
  const result=validateBackup({format:'ChildCareTimelineBackup',version:1,events:[{id:'1',environment:'pai',at:iso('01:00')}]},envs);
  assert.deepEqual(result,[{id:'1',environment:'pai',at:iso('01:00'),note:''}]);
});
test('rejeita formato ou versão incompatível', () => {
  assert.throws(()=>validateBackup({format:'outro',version:1,events:[]},envs),/inválido/);
});
test('rejeita ambiente ou data inválida sem importar parcialmente', () => {
  assert.throws(()=>validateBackup({format:'ChildCareTimelineBackup',version:1,events:[{id:'x',environment:'alien',at:iso('00:00')}]},envs),/registro inválido/);
});
test('remove IDs duplicados dentro do próprio backup', () => {
  const result=validateBackup({format:'ChildCareTimelineBackup',version:1,events:[
    {id:'1',environment:'pai',at:iso('00:00')},{id:'1',environment:'mae',at:iso('01:00')}]},envs);
  assert.equal(result.length,1); assert.equal(result[0].environment,'pai');
});
test('adiciona apenas registros com IDs ainda não existentes', () => {
  const old=[{id:'1'}], incoming=[{id:'1'},{id:'2'},{id:'3'}], result=mergeEvents(old,incoming);
  assert.deepEqual(result.events,[{id:'1'},{id:'2'},{id:'3'}]); assert.equal(result.added,2); assert.equal(result.duplicates,1);
});
test('CSV escapa aspas, ponto e vírgula e quebras de linha', () => {
  assert.equal(toCsv([['nome','nota'],['Ana; Bia','disse "oi"\nhoje']]),'nome;nota\r\n"Ana; Bia";"disse ""oi""\nhoje"');
});
test('CSV mantém campos vazios', () => { assert.equal(toCsv([['a','b'],['x','']]),'a;b\r\nx;'); });

test('valida backup v2 com locais personalizados e locais arquivados', () => {
  const result=ChildCareReportValidateV2({format:'ChildCareTimelineBackup',version:2,
    environments:[{id:'pai',label:'Pai',active:true},{id:'casa-avo',label:'Casa da avó',active:false}],
    events:[{id:'1',environment:'casa-avo',at:iso('01:00')}]});
  assert.equal(result.events.length,1);
  assert.deepEqual(result.environments,[{id:'pai',label:'Pai',active:true},{id:'casa-avo',label:'Casa da avó',active:false}]);
});
test('backup v2 rejeita evento vinculado a local inexistente', () => {
  assert.throws(()=>ChildCareReportValidateV2({format:'ChildCareTimelineBackup',version:2,
    environments:[{id:'pai',label:'Pai',active:true}],
    events:[{id:'1',environment:'desconhecido',at:iso('01:00')}] }),/registro inválido/);
});
test('backup v2 exige pelo menos um local ativo', () => {
  assert.throws(()=>ChildCareReportValidateV2({format:'ChildCareTimelineBackup',version:2,
    environments:[{id:'pai',label:'Pai',active:false}],events:[]}),/pelo menos um local ativo/);
});
