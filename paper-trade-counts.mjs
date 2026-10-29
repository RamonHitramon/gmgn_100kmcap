const validRows=(rows,asof)=>Array.isArray(rows)&&rows.length>0&&rows.every((p,i)=>Array.isArray(p)&&Number.isFinite(p[0])&&p[0]>0&&p[0]<=asof&&Number.isSafeInteger(p[1])&&Number.isSafeInteger(p[2])&&p[1]>=p[2]&&p[2]>=0&&(!i||(p[0]>=rows[i-1][0]&&p[1]>=rows[i-1][1]&&p[2]>=rows[i-1][2])));
export function mergeTradeCounts(snapshot,sidecar){
 const h=snapshot.performance_history;
 const boundaries=[snapshot.stopped_at,snapshot.updated_at].filter(t=>Number.isFinite(t)&&t>0),end=Math.min(...boundaries);
 if(!h||h.run_id!==snapshot.run_id||!sidecar||sidecar.run_id!==snapshot.run_id||!Number.isFinite(sidecar.asof)||sidecar.asof<=0||!boundaries.length||sidecar.asof>end||!Array.isArray(sidecar.series))return snapshot;
 const counts=new Map(sidecar.series.filter(s=>validRows(s.trade_counts,sidecar.asof)).map(s=>[s.id,s.trade_counts]));
 return {...snapshot,performance_history:{...h,series:(h.series||[]).map(s=>counts.has(s.id)?{...s,trade_counts:counts.get(s.id)}:s)}};
}
export function createTradeCountsLoader(fetcher=(...args)=>fetch(...args)){
 let promise;
 return async snapshot=>{
  promise??=Promise.resolve().then(()=>fetcher('./trade-counts.json?v=chart4v1')).then(r=>r.ok?r.json():null).catch(()=>null);
  return mergeTradeCounts(snapshot,await promise);
 };
}
