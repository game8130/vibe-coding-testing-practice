# DashboardPage 測試案例

## Rendering & Data Fetching (渲染與資料獲取測試)
- [x] 初始渲染時，應顯示載入中（loading）狀態
- [x] 成功獲取商品資料後，應正確渲染商品列表，並隱藏載入中狀態
- [x] API 回傳錯誤（非 401 狀態碼）時，應顯示錯誤訊息
- [x] API 回傳 401 狀態碼時，不應設定錯誤訊息（由攔截器處理）

## Roles & Authorization (角色與權限測試)
- [x] 若使用者角色為 admin，應顯示「管理後台」連結與「管理員」徽章
- [x] 若使用者角色非 admin，不應顯示「管理後台」連結，並顯示「一般用戶」徽章
- [x] 應正確顯示使用者的 username 與頭像（字首）

## Interactions (互動測試)
- [x] 點擊「登出」按鈕時，應呼叫 logout 函式並導向至 /login (包含 replace: true 與 state: null)
