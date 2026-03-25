# AdminPage 測試案例

## Rendering (渲染測試)
- [x] 應該正確渲染管理員專屬頁面的標題與內容
- [x] 應該根據 user.role 正確顯示角色徽章（'管理員' 或 '一般用戶'）

## Navigation & Interactions (導覽與互動測試)
- [x] 點擊「返回」連結時，應導向至 /dashboard
- [x] 點擊「登出」按鈕時，應呼叫 logout 函式並導向至 /login (包含 replace: true 與 state: null)
