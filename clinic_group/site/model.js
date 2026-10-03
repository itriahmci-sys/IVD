export const norm=s=>String(s??'').toLocaleLowerCase().replaceAll('台','臺').replace(/\s+/g,' ').trim();
export function selectGroups(groups, f={}) {
 const words=norm(f.query).split(' ').filter(Boolean);
 return groups.filter(g=>!f.area||g.area===f.area).map(g=>{
  const hospitalOK=!f.hospital||g.hospitals.some(h=>h.name===f.hospital&&(f.hospitalMode==='any'||h.rank==='一'));
  if(!hospitalOK)return null;
  const meta=norm([g.name,g.code,g.hotline,g.doctor,...g.centers.map(c=>c.name+' '+c.code),...g.hospitals.map(h=>h.name+' '+h.code)].join(' '));
  const clinics=g.clinics.filter(c=>(!f.county||c.county===f.county)&&(!f.hospital||f.hospitalMode==='any'||c.first===f.hospital)&&words.every(w=>(meta+' '+norm([c.name,c.id,c.county,c.district,c.sourceName,c.sourceCounty].join(' '))).includes(w)));
  return clinics.length?{...g,visible:clinics}:null;
 }).filter(Boolean).sort((a,b)=>f.sort==='asc'?a.clinics.length-b.clinics.length||a.code.localeCompare(b.code):f.sort==='name'?a.name.localeCompare(b.name,'zh-Hant'):b.clinics.length-a.clinics.length||a.code.localeCompare(b.code));
}
export function summarize(groups){
 const map=new Map(), ids=new Set(), counties=new Set(), districts=new Set();let records=0;
 for(const g of groups) for(const c of g.visible??g.clinics){
  records++;ids.add(c.id);counties.add(c.county);districts.add(c.county+' '+c.district);
  if(!map.has(c.first))map.set(c.first,{name:c.first,codes:new Set(),ids:new Set(),groups:new Set(),regions:new Map(),counties:new Map()});
  const h=map.get(c.first);h.codes.add(c.firstCode);h.ids.add(c.id);h.groups.add(g.id);
  for(const [m,key] of [[h.regions,c.county+' '+c.district],[h.counties,c.county]]){if(!m.has(key))m.set(key,new Set());m.get(key).add(c.id);}
 }
 const hospitals=[...map.values()].map(h=>({name:h.name,codes:[...h.codes].sort(),clinicCount:h.ids.size,groupCount:h.groups.size,regions:Object.fromEntries([...h.regions].sort().map(([k,v])=>[k,v.size])),counties:Object.fromEntries([...h.counties].sort((a,b)=>b[1].size-a[1].size).map(([k,v])=>[k,v.size]))})).sort((a,b)=>b.clinicCount-a.clinicCount||a.name.localeCompare(b.name,'zh-Hant'));
 return {records,clinics:ids.size,groups:groups.length,counties:counties.size,districts:districts.size,hospitals};
}
export function csvText(headers,rows){return '\uFEFF'+[headers,...rows].map(r=>r.map(c=>'"'+String(c??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"').join(',')).join('\r\n');}
