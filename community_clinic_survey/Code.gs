(function(root){
const options={
 county:['臺北市','新北市','桃園市','臺中市','臺南市','高雄市','基隆市','新竹市','嘉義市','新竹縣','苗栗縣','彰化縣','南投縣','雲林縣','嘉義縣','屏東縣','宜蘭縣','花蓮縣','臺東縣','澎湖縣','金門縣','連江縣'],
 type:['西醫','中醫','牙醫'],role:['負責醫師／經營者','受僱醫師','行政主管','經授權代填人員'],
 specialty:['不分科／一般科','家庭醫學科','內科','兒科','婦產科','耳鼻喉科','眼科','皮膚科','骨科','復健科','精神科','外科','泌尿科','神經科','其他西醫科別','中醫一般診療','中醫其他專長','一般牙科','牙科專科'],
 quality:['帳務／系統紀錄','依經驗估計','混合來源','不清楚'],
 willingness:['願意加入','傾向加入','符合條件才加入','目前不願意','尚無法判斷'],
 services:['耗材共同採購','IT／資安維護','掛號／申報等行政支援','人員培訓／備援','FHIR 資料交換與 HIS 串接','健保與商保行政協作','轉介與跨院照護協作','目前沒有需求／尚無法判斷'],
 conditions:['費用與節省透明','保留臨床自主','可保留合理流程例外','資料使用須經授權','診所參與決策','可試辦後退出','維持現有 HIS','明確服務水準與責任','不接受保險方單獨主導'],
 standard:['願意採共同支援流程','願意但須保留例外','只願共用工具，不改流程','不願意','尚無法判斷'],
 fhir:['願意授權必要資料交換','願意，但須先確認資料範圍與責任','僅接受去識別統計','不願意','不了解，需先說明'],
 insurance:['願意參與申報／給付行政協作','有條件參與，須保障臨床自主與資料權限','僅願健保相關協作','不願意','尚無法判斷'],
 his:['已有 HIS，能否交換資料不清楚','已有 HIS，廠商表示可支援 FHIR','已有 HIS，目前未支援 FHIR','無 HIS／主要紙本','不清楚']
};
const fields=[
 ['county','縣市','enum',true],['district','鄉鎮市區','text',true,30],['type','醫療類別','enum',true],['specialty','主要科別／診療領域','enum',true],['role','填答身分','enum',true],
 ['patients','每日約看診人次','number',false,0,3000],['days','每月開診天數','number',false,1,31],['doctors','醫師人數（含兼職）','number',false,1,100],['staff','非醫師人數（含兼職）','number',false,0,300],
 ['period','資料月份','month',true],['quality','數字來源','enum',true],
 ['purchase','每月耗材採購費（元）','number',false,0,10000000],['it','每月 IT 費（元）','number',false,0,3000000],['admin','每月行政人事／外包費（元）','number',false,0,10000000],['hours','每週行政與 IT 總工時（小時）','number',false,0,3000],
 ['his','現有 HIS／FHIR 狀況','enum',true],['services','需要共用的服務','multi',true],['willingness','加入意願','enum',true],['conditions','必要加入條件','multi',false],
 ['fee','每月最多願付費（元）','number',false,0,1000000],['expectedSaving','期待原支援費減少（%，未扣中心費）','number',false,0,100],['expectedHours','期待支援工時減少（%）','number',false,0,100],
 ['standard','共同流程接受程度','enum',true],['fhir','FHIR 資料交換接受程度','enum',true],['insurance','商保／健保行政協作接受程度','enum',true],['note','其他建議','text',false,500]
];
function validate(a){
 const errors=[];if(Array.isArray(a.services)&&a.services.includes('目前沒有需求／尚無法判斷')&&a.services.length>1)errors.push('需要共用的服務：沒有需求／尚無法判斷不能與其他服務同選');for(const [k,label,type,required,min,max] of fields){const v=a[k];
  if(v===null||v===undefined||(typeof v==='string'&&v.trim()==='')||(Array.isArray(v)&&!v.length)){if(required)errors.push(label+'尚未填寫');continue;}
  if(type==='number'&&(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||!Number.isInteger(v)))errors.push(label+'請填範圍內的整數');
  if(type==='enum'&&!options[k].includes(v))errors.push(label+'選項不正確');
  if(type==='multi'&&(!Array.isArray(v)||v.some(x=>!options[k].includes(x))||new Set(v).size!==v.length))errors.push(label+'選項不正確');
  if(type==='text'&&(typeof v!=='string'||v.trim().length>min))errors.push(label+'內容過長');
  if(type==='month'&&(typeof v!=='string'||!/^20\d\d-(0[1-9]|1[0-2])$/.test(v)||v>new Date().toISOString().slice(0,7)))errors.push(label+'須為本月或之前的有效月份');
 }
 if(a.type==='中醫'&&a.specialty&&!a.specialty.startsWith('中醫'))errors.push('主要科別／診療領域與中醫類別不符');
 if(a.type==='牙醫'&&a.specialty&&!a.specialty.includes('牙'))errors.push('主要科別／診療領域與牙醫類別不符');
 if(a.type==='西醫'&&a.specialty&&(a.specialty.startsWith('中醫')||a.specialty.includes('牙')))errors.push('主要科別／診療領域與西醫類別不符');
 return errors;
}
function scenario(a,fee){
 const baselineKnown=['purchase','it','admin'].every(k=>typeof a[k]==='number');
 const base=baselineKnown?a.purchase+a.it+a.admin:null;
 const complete=baselineKnown&&typeof a.expectedSaving==='number';
 const gross=complete?base*a.expectedSaving/100:null;
 return {base,gross,after:complete&&typeof fee==='number'?base-gross+fee:null,net:complete&&typeof fee==='number'?gross-fee:null,
 hoursBefore:typeof a.hours==='number'?a.hours:null,hoursAfter:typeof a.hours==='number'&&typeof a.expectedHours==='number'?a.hours*(1-a.expectedHours/100):null,
 monthlyVisits:typeof a.patients==='number'&&typeof a.days==='number'?a.patients*a.days:null};
}
root.SurveyCore={options,fields,validate,scenario};
})(globalThis);

/* Google Apps Script V8。只接受寫入問卷，不提供原始資料讀取 API。
   先在 Google Sheet：擴充功能→Apps Script，貼上本檔，修改下列設定。 */
const SETTINGS = Object.freeze({
  allowedOrigins: ['https://itriahmci-sys.github.io'], // 只填來源，沒有儲存庫路徑
  organizer: '健康樂活與智慧醫療照護聯盟', contact: 'SmartMedHealth@itri.org.tw', retention: '資料僅供研究統計分析使用',
  consentVersion:'2026-09-23-v1',surveyVersion:'clinic-survey-1.0',
  maxRows:50000
});
const META=['server_received_at','submission_id','consent_version','survey_version','consent','elapsed_seconds','organizer','retention'];
function setup(){
 if(!SETTINGS.organizer||!SETTINGS.contact||!SETTINGS.retention||SETTINGS.allowedOrigins.some(x=>x.includes('YOUR_ACCOUNT')))throw new Error('請先完成 SETTINGS 主辦資訊與 GitHub 網址。');
 const ss=SpreadsheetApp.getActiveSpreadsheet();if(!ss)throw new Error('請從目標 Google Sheet 開啟 Apps Script 再執行。');
 PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID',ss.getId());
 const headers=META.concat(SurveyCore.fields.map(f=>f[0]));
 let sh=ss.getSheetByName('responses');if(!sh)sh=ss.insertSheet('responses');
 if(sh.getLastRow()===0){sh.appendRow(headers);sh.setFrozenRows(1);sh.getRange(1,1,1,headers.length).setBackground('#126c89').setFontColor('#ffffff').setFontWeight('bold');}
 else if(JSON.stringify(sh.getRange(1,1,1,headers.length).getValues()[0])!==JSON.stringify(headers))throw new Error('responses 欄位不符，停止以避免錯寫。請另建空白試算表。');
 if(!ss.getSheetByName('欄位說明')){const d=ss.insertSheet('欄位說明');const rows=[['欄位','中文意義','型態','必填','允許值／範圍']].concat(SurveyCore.fields.map(f=>[f[0],f[1],f[2],f[3]?'是':'否',SurveyCore.options[f[0]]?.join('；')||(f[2]==='number'?f[4]+'–'+f[5]:'') ]));d.getRange(1,1,rows.length,5).setValues(rows);d.setFrozenRows(1);d.setColumnWidths(1,5,220);d.getDataRange().setWrap(true);}
 if(!ss.getSheetByName('單一中心規劃'))buildPlanning_(ss);
 if(!ss.getSheetByName('調查說明')){const d=ss.insertSheet('調查說明');d.getRange(1,1,9,2).setValues([['項目','說明'],['主辦',SETTINGS.organizer],['聯絡',SETTINGS.contact],['保存期間',SETTINGS.retention],['同意版本',SETTINGS.consentVersion],['資料定義','自陳資料與期待，不是實際節省或正式加入承諾'],['缺漏','空白代表未知／不提供，0 代表明確為零；不可互換'],['對外呈現','只分享彙整；建議 n<5 不揭露區域／科別細分；問卷非代表性抽樣'],['資料安全','不要公開試算表，不要將試算表發布到網路；僅主辦授權分析人員可存取']]);d.setColumnWidths(1,2,360);d.getDataRange().setWrap(true);}
 return ss.getUrl();
}
function col_(key){let n=META.length+SurveyCore.fields.findIndex(f=>f[0]===key)+1,s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;}
function buildPlanning_(ss){
 const p=ss.insertSheet('單一中心規劃');const fee=col_('fee'),will=col_('willingness');
 const rows=[['單一中心規劃（費用請填報價；不預設示範成本）','輸入值／公式','說明'],['中心固定月成本 F','','元／月：不含下面已單列項目'],['每家變動月成本 v','','元／家／月'],['額外協調係數 gamma','','元／月；無此增量請明確填0'],['首組／每新增組容量 K','','家／組，正整數'],['超過首組，每組新增月成本 J','','元／月；避免與人力報價重複'],['一次性建置費 I','','元'],['攤提月數 M','','正整數'],['','', ''],['計畫診所數 N','每家全成本月費','樣本中願付費達門檻且願意／傾向／有條件者（非承諾）']];
 p.getRange(1,1,rows.length,3).setValues(rows);const ns=[5,10,15,20,30,40,50,60,80,100,150,200];
 ns.forEach((n,i)=>{const row=i+11;p.getRange(row,1).setValue(n);p.getRange(row,2).setFormula('=IF(OR(COUNT($B$2:$B$8)<7,MIN($B$2:$B$8)<0,$B$5<1,$B$8<1,MOD($B$5,1)<>0,MOD($B$8,1)<>0),"",$B$2/A'+row+'+$B$3+$B$4*(A'+row+'-1)+$B$6*MAX(0,ROUNDUP(A'+row+'/$B$5,0)-1)/A'+row+'+$B$7/$B$8/A'+row+')');
 const criteria=['願意加入','傾向加入','符合條件才加入'].map(x=>'COUNTIFS(responses!'+fee+'2:'+fee+',">="&B'+row+',responses!'+fee+'2:'+fee+',"<>",responses!'+will+'2:'+will+',"'+x+'")').join('+');p.getRange(row,3).setFormula('=IF(B'+row+'="","",'+criteria+')');});
 p.getRange(24,1,5,3).setValues([['用途','固定成本分攤與容量階梯敏感度；人數須與實際招募條件合看。',''],['限制','有條件加入者還需逐項滿足條件；同診所多人填答及樣本自選會使人數高估。',''],['範圍','問卷不收識別診所名稱，樣本人數不能直接等於獨立診所總數。',''],['公平與品質','成本最低不等於最佳；尚未計地域、科別差異、可近性與服務水準。',''],['流程','先剔除測試與重複／異常回覆、核對缺漏，再輸入成本報價；不要用期待比例直接訓練成效預測。','']]);p.setFrozenRows(1);p.setColumnWidth(1,280);p.setColumnWidth(2,320);p.setColumnWidth(3,400);p.getDataRange().setWrap(true);p.getRange('B2:B8').setBackground('#fff2cf');p.getRange('B11:B22').setNumberFormat('#,##0.00');
}
function doGet(){return ContentService.createTextOutput('Clinic survey endpoint. POST only. No response data is exposed.');}
function receipt_(p,ok,message){
 const origin=SETTINGS.allowedOrigins.includes(p.origin)?p.origin:SETTINGS.allowedOrigins[0];
 const body=JSON.stringify({type:'clinic-survey-receipt',submissionId:p.submissionId,receiptToken:p.receiptToken,ok:ok,message:message||''}).replace(/</g,'\\u003c');
 return HtmlService.createHtmlOutput('<!doctype html><html><body><p>'+ (ok?'已儲存，請返回問卷。':'未儲存，請返回問卷查看說明。')+'</p><script>window.top.postMessage('+body+','+JSON.stringify(origin)+');</script></body></html>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doPost(e){let p={};let lock;try{
 const raw=e&&e.parameter&&e.parameter.payload;if(!raw||raw.length>30000)throw new Error('資料格式或大小不正確');p=JSON.parse(raw);
 if(!SETTINGS.allowedOrigins.includes(p.origin))throw new Error('來源設定不符');
 if(!SETTINGS.organizer||!SETTINGS.contact||!SETTINGS.retention)throw new Error('主辦資訊尚未設定');
 if(p.consent!==true||p.consentVersion!==SETTINGS.consentVersion||p.surveyVersion!==SETTINGS.surveyVersion)throw new Error('同意或問卷版本不符，請重新載入');
 if(!/^[a-f0-9-]{36}$/.test(p.submissionId||'')||!/^[a-f0-9-]{36}$/.test(p.receiptToken||''))throw new Error('送出編號不正確');
 if(p.website)throw new Error('無效送出');
 if(!p.answers||typeof p.answers!=='object'||Array.isArray(p.answers))throw new Error('缺少填答資料');const errors=SurveyCore.validate(p.answers);if(errors.length)throw new Error(errors.join('；'));
 const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');if(!id)throw new Error('收件端尚未執行 setup');
 lock=LockService.getScriptLock();lock.waitLock(20000);const sh=SpreadsheetApp.openById(id).getSheetByName('responses');if(!sh)throw new Error('找不到 responses 工作表');
 const headers=META.concat(SurveyCore.fields.map(f=>f[0]));if(JSON.stringify(sh.getRange(1,1,1,headers.length).getValues()[0])!==JSON.stringify(headers))throw new Error('工作表欄位已變動，請聯絡主辦單位');
 if(sh.getLastRow()>1&&sh.getRange(2,2,sh.getLastRow()-1,1).createTextFinder(p.submissionId).matchEntireCell(true).findNext())return receipt_(p,true,'同一編號已儲存，不重複寫入');
 if(sh.getLastRow()>SETTINGS.maxRows)throw new Error('目前已停止收件，請聯絡主辦單位');
 const clean=v=>{if(v===null||v===undefined)return '';if(Array.isArray(v))v=v.join('；');if(typeof v==='number')return v;return "'"+String(v);};
 const row=[new Date().toISOString(),p.submissionId,p.consentVersion,p.surveyVersion,true,Number.isFinite(p.elapsedSeconds)?Math.max(0,Math.min(p.elapsedSeconds,604800)):'',SETTINGS.organizer,SETTINGS.retention].map(clean).concat(SurveyCore.fields.map(f=>clean(p.answers[f[0]])));
 sh.appendRow(row);SpreadsheetApp.flush();return receipt_(p,true,'已儲存');
 }catch(error){return receipt_(p,false,String(error.message||'暫時無法儲存').slice(0,250));}finally{if(lock)lock.releaseLock();}}
