import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AdminPage } from './AdminPage';
import * as AuthContextModule from '../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockUseAuth = vi.spyOn(AuthContextModule, 'useAuth');

const defaultAuthContext = {
    login: vi.fn(),
    logout: vi.fn(),
    clearAuthExpiredMessage: vi.fn(),
    isAuthenticated: true,
    isLoading: false,
    user: { id: 1, email: 'admin@test.com', username: 'admin', role: 'admin' },
    authExpiredMessage: null,
};

const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('AdminPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue(defaultAuthContext);
    });

    describe('Rendering (渲染測試)', () => {
        it('應該正確渲染管理員專屬頁面的標題與內容', () => {
            renderWithRouter(<AdminPage />);
            expect(screen.getByText('🛠️ 管理後台')).toBeInTheDocument();
            expect(screen.getByText('管理員專屬頁面')).toBeInTheDocument();
            expect(screen.getByText('只有 admin 角色可以訪問')).toBeInTheDocument();
        });

        it('應該根據 user.role 正確顯示角色徽章（\'管理員\' 或 \'一般用戶\'）', () => {
            // Check for admin
            renderWithRouter(<AdminPage />);
            expect(screen.getByText('管理員')).toBeInTheDocument();
            
            // Check for user
            mockUseAuth.mockReturnValue({
                ...defaultAuthContext,
                user: { id: 2, email: 'user@test.com', username: 'user', role: 'user' }
            });
            renderWithRouter(<AdminPage />);
            expect(screen.getAllByText('一般用戶')[0]).toBeInTheDocument();
        });
    });

    describe('Navigation & Interactions (導覽與互動測試)', () => {
        it('點擊「返回」連結時，應導向至 /dashboard', () => {
            renderWithRouter(<AdminPage />);
            const backLink = screen.getByText('← 返回');
            expect(backLink.getAttribute('href')).toBe('/dashboard');
        });

        it('點擊「登出」按鈕時，應呼叫 logout 函式並導向至 /login (包含 replace: true 與 state: null)', () => {
            const mockLogout = vi.fn();
            mockUseAuth.mockReturnValue({ ...defaultAuthContext, logout: mockLogout });
            
            renderWithRouter(<AdminPage />);
            
            const logoutBtn = screen.getByRole('button', { name: '登出' });
            fireEvent.click(logoutBtn);
            
            expect(mockLogout).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });
});
