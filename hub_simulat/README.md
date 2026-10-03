# 社區診所模擬器｜網路部署版

本套件延續最新整合版：上方為原始每家診所支援成本淨節省曲線；下方為在宅營運損益的平滑平均趨勢與實際階梯線，保留參數雙向同步、情境保存及 CSV 匯出。

## 檔案
- index.html：網站入口。
- styles.css：版面與字型樣式。
- app.js：原始診所支援成本模型。
- care-model.js：在宅損益模型與雙向連動。
- assets/fonts/：本機字型資源，不需要外部 CDN。
- .nojekyll：GitHub Pages 靜態檔案標記。
- robots.txt：請搜尋引擎不要索引，不是存取控制。

## GitHub Pages 部署
1. 解壓縮，把 index.html、兩個 JS、styles.css、assets 資料夾、.nojekyll、robots.txt 放到準備發布的儲存庫根目錄。不要只上傳 ZIP；請保留 assets 內的檔案路徑。
2. 儲存庫 Settings → Pages → Build and deployment → Source 選 Deploy from a branch。
3. 選擇存放檔案的分支（例如 main）及 /(root)，按 Save。
4. 等待發布完成，以 Pages 顯示的網址開啟。專案子路徑也可使用，所有資源均採相對路徑。
5. 後續更新時一起上傳所有變動檔案；必要時修改 index.html 中 ?v=web-1 的版本字串，避免載入舊快取。

官方說明（2026-10-03 查閱）：
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 一般網站伺服器
將上述檔案放入網站目錄，預設入口設為 index.html 即可；不需要 npm、編譯、資料庫或後端 API。建議以 HTTPS 提供服務。

## 本機預覽
在解壓縮目錄執行 `python -m http.server 8000`，開啟 http://localhost:8000 。此命令僅供本機預覽，部署時無須執行。

## 資料保存與使用範圍
- 試算在瀏覽器內完成；本套件沒有上傳試算資料的程式。
- 情境使用 localStorage，依網站來源及瀏覽器隔離。同一瀏覽器內同網域的不同路徑可能共用儲存鍵。
- 從離線 HTML 換到網站，原先瀏覽器保存的情境不會自動搬移；請先匯出 CSV 備份。現有 CSV 匯出並非可自動匯入的備份格式。
- 此版沒有帳號、密碼或伺服器端權限驗證；一般 GitHub Pages 發布會讓取得網址者可讀取頁面及程式碼。若需限制訪客，應置於具身分驗證的網站服務後方；私人儲存庫或 noindex 不等於網站登入保護。
- 所有預設參數仍是示範假設。平均趨勢採連續容量近似，實際線採整數配置；打平點依實際公式計算。
- 本次是製作部署套件，尚未發布到任何網域或變更既有網站。

## 檢查結果
樣式與程式由最新單檔版拆出，兩個模型程式碼保持完全一致；已檢查 JavaScript 語法及相對資源完整性。部署後請確認入口、診所數同步、雙線、CSV 下載及手機版顯示。
