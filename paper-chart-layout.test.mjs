import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
class Node{constructor(tag){this.tag=tag;this.children=[];this.style={};this.dataset={};}append(...n){this.children.push(...n)}prepend(...n){this.children.unshift(...n)}replaceChildren(...n){this.children=n}setAttribute(k,v){this[k]=v}}
const text=n=>[n.textContent||'',...n.children.map(text)].join(' ');
const all=n=>[n,...n.children.flatMap(all)];
test('four plots keep identical geometry, distinct step count lines, integer tooltips and shared toggles',async()=>{
 const root=new Node('section'),old=globalThis.document;globalThis.document={getElementById:()=>root,createElement:t=>new Node(t),createElementNS:(_,t)=>new Node(t)};
 try{const {updateCharts}=await import('./paper-charts.mjs?layout-test');updateCharts({run_id:'x',wallets:[{id:'tp20',cash_sol:.8}],performance_history:{run_id:'x',started_at:100,asof:400,series:[{id:'tp20',name:'TP20',points:[[100,0,0,1],[400,.2,0,.8]],realized:[[100,0],[400,.1]],trade_counts:[[100,0,0],[200,7,0],[400,7,3]]}]}});
 const cards=root.children[2].children;assert.equal(cards.length,4);
 const svgs=cards.map(c=>all(c).find(n=>n.tag==='svg'));assert.equal(new Set(svgs.map(s=>s.viewBox)).size,1);
 const rects=svgs.map(s=>all(s).find(n=>n.tag==='rect'));assert.equal(new Set(rects.map(r=>JSON.stringify([r.x,r.y,r.width,r.height]))).size,1);
 for(const c of cards)assert.equal(c.children[0].className,'chart-header');
 const counts=cards[3],paths=all(counts).filter(n=>n.tag==='path');assert.equal(paths.length,2);assert.equal(paths[0].stroke,paths[1].stroke);assert.equal(paths[1]['stroke-dasharray'],'6 4');assert.match(paths[0].d,/H/);
 const plot=counts.children.at(-1);plot.onkeydown({key:'ArrowLeft',preventDefault(){}});assert.match(text(plot),/Bought 7 · Closed 0/);assert.doesNotMatch(text(counts).replaceAll('TP +20%','strategy'),/SOL|%/);
 root.children[1].children[0].onclick();assert.equal(all(root.children[2].children[3]).filter(n=>n.tag==='path').length,0);
 }finally{globalThis.document=old}
});
test('layout stays one column with responsive bounded SVG and natural synchronized header sizing',async()=>{
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8'),source=await readFile(new URL('./paper-charts.mjs',import.meta.url),'utf8');
 assert.match(html,/\.chart-grid\{[^}]*grid-template-columns:minmax\(0,1fr\)/);assert.match(html,/\.chart-header\{[^}]*min-height:var\(--chart-header-height/);assert.match(source,/ResizeObserver/);assert.match(source,/getBoundingClientRect/);
});
