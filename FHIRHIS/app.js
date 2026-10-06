'use strict';
const SHEET_ID='1KehyBRCJJFHgRypfnB6jPt5pM-Ji-xdv0xP_UE6Rq9s';
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inline(s){return escapeHTML(s).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');}
function md(s){
 const lines=String(s||'').replace(/\r/g,'').split('\n');let out='',i=0;
 while(i<lines.length){let l=lines[i];if(!l.trim()){i++;continue;}
 if(/^\|/.test(l)&&/^\|[\s:|\-]+\|\s*$/.test(lines[i+1]||'')){
 const cells=x=>x.trim().replace(/^\||\|$/g,'').split(/\s+\|\s+|(?<=-)\|(?=-)/);
 out+='<div class="tablewrap"><table><thead><tr>'+cells(l).map(c=>'<th>'+inline(c)+'</th>').join('')+'</tr></thead><tbody>';i+=2;
 while(i<lines.length&&/^\|/.test(lines[i])){out+='<tr>'+cells(lines[i++]).map(c=>'<td>'+inline(c)+'</td>').join('')+'</tr>';}
 out+='</tbody></table></div>';continue;}
 const h=l.match(/^(#{1,6})\s+(.+)$/);if(h){const level=Math.max(3,h[1].length);out+=`<h${level}>${inline(h[2])}</h${level}>`;i++;continue;}
 if(/^\s*- /.test(l)){out+='<ul>';while(i<lines.length){if(!lines[i].trim()){i++;continue;}if(!/^\s*- /.test(lines[i]))break;out+='<li>'+inline(lines[i++].replace(/^\s*- /,''))+'</li>';}out+='</ul>';continue;}
 if(/^>/.test(l)){out+='<blockquote>'+inline(l.replace(/^>\s*/,''))+'</blockquote>';i++;continue;}
 let p=[];while(i<lines.length&&lines[i].trim()&&!/^#{1,6} |^- |^\|/.test(lines[i]))p.push(lines[i++]);if(!p.length)p.push(lines[i++]);out+='<p>'+inline(p.join('\n'))+'</p>';
 }return out;
}
function day(value){
 const s=String(value??'');let m=s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);if(!m)return NaN;
 const y=+m[1],mo=+m[2],d=+m[3],date=new Date(Date.UTC(y,mo-1,d));return date.getUTCFullYear()===y&&date.getUTCMonth()===mo-1&&date.getUTCDate()===d?+date:NaN;
}
function selectLatest(payload){
 if(payload.status!=='ok'||!payload.table)throw Error('Google Sheet 未傳回可讀取的資料。');
 const cell=c=>c?.f??c?.v??'';let rows=payload.table.rows.map(r=>r.c.map(cell));
 let head=payload.table.cols.map(c=>c.label),start=0;
 if(!head.includes('迄日')){start=rows.findIndex(r=>r.includes('迄日')&&r.includes('週報全文'));if(start<0)throw Error('缺少「迄日」或「週報全文」欄位。');head=rows[start++];}
 const keys=['期別','起日','迄日','主管摘要','週報全文','來源連結'];if(keys.some(k=>!head.includes(k)))throw Error('試算表欄位不完整。');
 const reports=rows.slice(start).filter(r=>r.some(Boolean)).map((r,i)=>({...Object.fromEntries(keys.map(k=>[k,String(r[head.indexOf(k)]??'')])),index:i}));
 if(!reports.length)throw Error('試算表目前沒有週報內容。');
 if(reports.some(r=>!Number.isFinite(day(r['迄日']))))throw Error('有週報缺少有效迄日，請以 YYYY-MM-DD 填寫。');
 reports.sort((a,b)=>day(b['迄日'])-day(a['迄日'])||(day(b['起日'])-day(a['起日'])||0)||b.index-a.index);
 const report=reports[0];if(!report['週報全文'].trim())throw Error('最新一期尚未填寫週報全文。');return report;
}
function renderReport(r){
 document.querySelector('.eyebrow').innerHTML='最新一期 <span>'+escapeHTML(r['期別']||`${r['起日']}～${r['迄日']}`)+'</span>';
 document.title='醫療健康數據週報｜'+(r['期別']||r['迄日']);
 const check=r['週報全文'].match(/查核(?:日|截至)[:：\s]*(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
 document.querySelector('.meta').textContent=check?'原稿查核日 '+check[1]:`涵蓋期間 ${r['起日']}～${r['迄日']}`;
 const parts=r['主管摘要'].split(/^\s*-\s+/m).filter(x=>x.trim());
 let html='<section id="brief"><div class="sectionhead"><div><span class="kicker">THE WEEK AT A GLANCE</span><h2>本期焦點</h2></div></div><div class="briefgrid">';
 parts.forEach((p,i)=>{const m=p.match(/^\*\*(.*?)\*\*([\s\S]*)/);html+=`<article class="brief c${i%4}"><span class="tag">焦點 ${String(i+1).padStart(2,'0')}</span>${m?'<h3>'+inline(m[1])+'</h3><p>'+inline(m[2])+'</p>':md(p)}</article>`;});html+='</div></section>';
 const blocks=r['週報全文'].split(/^##\s+/m);let nav='<a href="#brief">本期焦點</a>';
 if(blocks[0].trim())html+='<details class="original-note"><summary>本期編輯說明</summary>'+md(blocks[0].replace(/^# .+\n/,''))+'</details>';
 blocks.slice(1).forEach((block,i)=>{const n=block.indexOf('\n'),title=n<0?block:block.slice(0,n),text=n<0?'':block.slice(n+1);if(/主管摘要/.test(title)&&parts.length)return;const id='section'+i;nav+=`<a href="#${id}">${escapeHTML(title.replace(/^[一二三四五六七八九十\d]+[、.．]\s*/,''))}</a>`;html+=`<section id="${id}" class="dynamic-section ${/行動/.test(title)?'actions':/管理判斷/.test(title)?'closing':''}"><div class="sectionhead"><h2>${escapeHTML(title)}</h2></div>${md(text)}</section>`;});
 if(r['來源連結'].trim()){html+='<details class="source-list"><summary>本期來源總覽</summary><ul>';for(const line of r['來源連結'].split('\n')){const m=line.match(/^(.*?)(https?:\/\/\S+)$/);html+='<li>'+(m?`<a href="${escapeHTML(m[2])}" target="_blank" rel="noopener noreferrer">${escapeHTML(m[1].replace(/[：:]$/,''))||escapeHTML(m[2])}</a>`:escapeHTML(line))+'</li>';}html+='</ul></details>';}
 document.getElementById('report').innerHTML=html;document.querySelector('nav').innerHTML=nav;
}
let pending=false,lastSuccess=null,serial=0;
function refresh(){
 if(pending)return;pending=true;const status=document.getElementById('sync-status'),button=document.getElementById('refresh');button.disabled=true;status.textContent='正在讀取 Google Sheet 最新內容…';
 const callback='weeklyResponse'+(++serial),script=document.createElement('script');let timer;
 function done(){clearTimeout(timer);script.remove();delete window[callback];pending=false;button.disabled=false;}
 function failed(message){done();status.textContent=message+(lastSuccess?' 目前保留上次成功內容（'+lastSuccess+'）。':' 請確認 Google Sheet 仍開放讀取後重試。');status.dataset.state='error';}
 window[callback]=payload=>{try{const r=selectLatest(payload);renderReport(r);lastSuccess=new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false});done();status.dataset.state='success';status.textContent='已同步 · '+lastSuccess+'（台灣時間）';}catch(e){failed(e.message);}};
 script.src=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?gid=0&headers=1&tqx=${encodeURIComponent('out:json;responseHandler:'+callback)}&tq=${encodeURIComponent('select A,B,C,D,E,F')}&_=${Date.now()}`;
 script.onerror=()=>failed('暫時無法連線到 Google Sheet。');timer=setTimeout(()=>failed('讀取逾時，請稍後重試。'),20000);document.head.append(script);
}
if(typeof document!=='undefined'){document.getElementById('refresh').addEventListener('click',refresh);refresh();setInterval(()=>{if(!document.hidden)refresh();},300000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});}
if(typeof module!=='undefined')module.exports={selectLatest,md,inline};
