import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {createTradeCountsLoader,mergeTradeCounts} from './paper-trade-counts.mjs?v=chart4v1';
const s={run_id:'R3',stopped_at:400,updated_at:450,performance_history:{run_id:'R3',asof:400,series:[{id:'tp20',points:[[100,0]]},{id:'tp100',disabled_at:250}]},positions:[{closed:200}]};
const c={run_id:'R3',started_at:100,asof:400,basis:'full ledger',series:[{id:'tp20',trade_counts:[[100,0,0],[200,225,3],[400,225,7]]}]};
test('archive sidecar merges only matching ledger series without mutating frozen snapshot',()=>{
 const out=mergeTradeCounts(s,c);assert.deepEqual(out.performance_history.series[0].trade_counts,c.series[0].trade_counts);assert.equal(out.positions,s.positions);assert.equal(out.performance_history.series[0].points,s.performance_history.series[0].points);assert.equal(s.performance_history.series[0].trade_counts,undefined);assert.equal(out.performance_history.series[1].trade_counts,undefined);
 for(const invalid of [null,{...c,run_id:'R4'},{...c,asof:401},{...c,asof:null},{...c,series:[{id:'tp20',trade_counts:[[100,1.2,0]]}]}])assert.equal(mergeTradeCounts(s,invalid).performance_history.series[0].trade_counts,undefined);
});
test('archive resource is fetched once per page; failed fetch remains explicitly missing',async()=>{
 let n=0;const load=createTradeCountsLoader(async url=>{n++;assert.equal(url,'./trade-counts.json?v=chart4v1');return {ok:true,json:async()=>c}});const [a,b]=await Promise.all([load(s),load(s)]);assert.equal(n,1);assert.deepEqual(a,b);await load(s);assert.equal(n,1);
 let bad=0;const missing=createTradeCountsLoader(async()=>{bad++;throw Error('offline')});assert.equal((await missing(s)).performance_history.series[0].trade_counts,undefined);await missing(s);assert.equal(bad,1);
});
test('refresh awaits counts before rendering but leaves original frozen feed endpoint intact',async()=>{
 const source=await readFile(new URL('./paper.mjs',import.meta.url),'utf8');assert.match(source,/state=await loadTradeCounts\(s\)/);assert.match(source,/mcap-call-report-2026-10-25\/refs\/heads\/paper-feed\/live-paper.json/);
});
