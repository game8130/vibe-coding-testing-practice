import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DashboardPage } from './DashboardPage';
import * as AuthContextModule from '../context/AuthContext';
import { productApi } from '../api/productApi';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockUseAuth = vi.spyOn(AuthContextModule, 'useAuth');
const mockGetProducts = vi.spyOn(productApi, 'getProducts');

const mockAdminUser = { id: 1, email: 'admin@t.com', username: 'AdminUser', role: 'admin' };
const mockNormalUser = { id: 2, email: 'user@t.com', username: 'NormalUser', role: 'user' };

const defaultAuthContext = {
    login: vi.fn(),
    logout: vi.fn(),
    clearAuthExpiredMessage: vi.fn(),
    isAuthenticated: true,
    isLoading: false,
    user: mockAdminUser,
    authExpiredMessage: null,
};

const mockProducts = [
    { id: 1, name: 'Product A', description: 'Desc A', price: 100 },
    { id: 2, name: 'Product B', description: 'Desc B', price: 200 }
];

const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('DashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue(defaultAuthContext);
        mockGetProducts.mockResolvedValue(mockProducts);
    });

    describe('Rendering & Data Fetching (渲染與資料獲取測試)', () => {
        it('初始渲染時，應顯示載入中（loading）狀態', () => {
            // Need a pending promise so isLoading remains true initially
            mockGetProducts.mockReturnValue(new Promise(() => {}));
            renderWithRouter(<DashboardPage />);
            
            expect(screen.getByText('載入商品中...')).toBeInTheDocument();
            expect(screen.queryByText('Product A')).not.toBeInTheDocument();
        });

        it('成功獲取商品資料後，應正確渲染商品列表，並隱藏載入中狀態', async () => {
            renderWithRouter(<DashboardPage />);
            
            // Should hide loading eventually
            await waitFor(() => {
                expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
            });
            
            expect(screen.getByText('Product A')).toBeInTheDocument();
            expect(screen.getByText('Desc A')).toBeInTheDocument();
            expect(screen.getByText('NT$ 100')).toBeInTheDocument();
            
            expect(screen.getByText('Product B')).toBeInTheDocument();
        });

        it('API 回傳錯誤（非 401 狀態碼）時，應顯示錯誤訊息', async () => {
            mockGetProducts.mockRejectedValue({
                response: { status: 500, data: { message: 'Server Error' } }
            });
            
            renderWithRouter(<DashboardPage />);
            
            expect(await screen.findByText('Server Error')).toBeInTheDocument();
        });

        it('API 回傳 401 狀態碼時，不應設定錯誤訊息（由攔截器處理）', async () => {
            mockGetProducts.mockRejectedValue({
                response: { status: 401, data: { message: 'Unauthorized' } }
            });
            
            renderWithRouter(<DashboardPage />);
            
            await waitFor(() => {
                expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
            });
            
            expect(screen.queryByText('Unauthorized')).not.toBeInTheDocument();
            expect(screen.queryByText('無法載入商品資料')).not.toBeInTheDocument();
        });
    });

    describe('Roles & Authorization (角色與權限測試)', () => {
        it('若使用者角色為 admin，應顯示「管理後台」連結與「管理員」徽章', async () => {
            renderWithRouter(<DashboardPage />);
            await screen.findByText("Product A"); // wait for data load
            
            expect(screen.getByText('🛠️ 管理後台')).toBeInTheDocument();
            // User section has a span indicating the role badge
            expect(screen.getByText('管理員')).toBeInTheDocument();
        });

        it('若使用者角色非 admin，不應顯示「管理後台」連結，並顯示「一般用戶」徽章', async () => {
            mockUseAuth.mockReturnValue({ ...defaultAuthContext, user: mockNormalUser });
            renderWithRouter(<DashboardPage />);
            await screen.findByText("Product A"); // wait for data load
            
            expect(screen.queryByText('🛠️ 管理後台')).not.toBeInTheDocument();
            expect(screen.getByText('一般用戶')).toBeInTheDocument();
        });

        it('應正確顯示使用者的 username 與頭像（字首）', async () => {
            renderWithRouter(<DashboardPage />);
            await screen.findByText("Product A"); // wait for data load
            
            expect(screen.getByText('Welcome, AdminUser 👋')).toBeInTheDocument();
            // Avatar should use the first character of username 'AdminUser' -> 'A'
            const avatar = screen.getByText('A');
            expect(avatar).toHaveClass('avatar');
        });
    });

    describe('Interactions (互動測試)', () => {
        it('點擊「登出」按鈕時，應呼叫 logout 函式並導向至 /login (包含 replace: true 與 state: null)', async () => {
            const mockLogout = vi.fn();
            mockUseAuth.mockReturnValue({ ...defaultAuthContext, logout: mockLogout });
            
            renderWithRouter(<DashboardPage />);
            await screen.findByText("Product A"); // wait for data load
            
            const logoutBtn = screen.getByRole('button', { name: '登出' });
            fireEvent.click(logoutBtn);
            
            expect(mockLogout).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });
});
