window.SURVEY_CONFIG = Object.freeze({
  // 完成 Apps Script 部署後，填入 /exec 網址。未設定時僅供預覽，不會送出。
  endpoint: '',
  organizer: '', // 主辦／資料管理單位
  contact: '', // 撤回與資料問題的 Email 或電話
  retention: '', // 例如：蒐集截止後 12 個月刪除原始回覆
  purpose: '評估台灣社區診所加入集中協作中心的條件、支援需求與效率期待，供單一中心規模及服務規劃使用。',
  consentVersion: '2026-09-23-v1',
  surveyVersion: 'clinic-survey-1.0'
});
