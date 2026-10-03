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
})(typeof window!=='undefined'?window:globalThis);
