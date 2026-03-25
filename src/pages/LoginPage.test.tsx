import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';
import * as AuthContextModule from '../context/AuthContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Create a helper to set up the auth context mock
const mockUseAuth = vi.spyOn(AuthContextModule, 'useAuth');

const defaultAuthContext = {
    login: vi.fn(),
    logout: vi.fn(),
    clearAuthExpiredMessage: vi.fn(),
    isAuthenticated: false,
    isLoading: false,
    user: null,
    authExpiredMessage: null,
};

const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue(defaultAuthContext);
        // Reset env for test
        vi.stubEnv('VITE_API_URL', '');
    });

    describe('Rendering (渲染測試)', () => {
        it('應該正確渲染所有登入表單元件（Email、密碼輸入框與登入按鈕）', () => {
            renderWithRouter(<LoginPage />);
            expect(screen.getByLabelText(/電子郵件/)).toBeInTheDocument();
            expect(screen.getByLabelText(/密碼/)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /登入/ })).toBeInTheDocument();
        });

        it('應該渲染測試帳號提示', () => {
            renderWithRouter(<LoginPage />);
            expect(screen.getByText(/測試帳號：任意 email 格式/)).toBeInTheDocument();
        });
    });

    describe('Validation (表單驗證)', () => {
        it('輸入無效的 Email 格式時，應顯示「請輸入有效的 Email 格式」錯誤訊息', async () => {
            renderWithRouter(<LoginPage />);
            const emailInput = screen.getByLabelText(/電子郵件/);
            const button = screen.getByRole('button', { name: /登入/ });
            
            fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
            fireEvent.click(button);
            
            expect(await screen.findByText('請輸入有效的 Email 格式')).toBeInTheDocument();
        });

        it('輸入少於 8 個字元的密碼時，應顯示「密碼必須至少 8 個字元」錯誤訊息', async () => {
            renderWithRouter(<LoginPage />);
            const emailInput = screen.getByLabelText(/電子郵件/);
            const passwordInput = screen.getByLabelText(/密碼/);
            const button = screen.getByRole('button', { name: /登入/ });
            
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'short' } });
            fireEvent.click(button);
            
            expect(await screen.findByText('密碼必須至少 8 個字元')).toBeInTheDocument();
        });

        it('輸入未包含英數的密碼時，應顯示「密碼必須包含英文字母和數字」錯誤訊息', async () => {
             renderWithRouter(<LoginPage />);
            const emailInput = screen.getByLabelText(/電子郵件/);
            const passwordInput = screen.getByLabelText(/密碼/);
            const button = screen.getByRole('button', { name: /登入/ });
            
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'onlyletters' } });
            fireEvent.click(button);
            
            expect(await screen.findByText('密碼必須包含英文字母和數字')).toBeInTheDocument();           
        });

        it('輸入有效資料後，應清除原有的錯誤訊息', async () => {
            renderWithRouter(<LoginPage />);
            const emailInput = screen.getByLabelText(/電子郵件/);
            const passwordInput = screen.getByLabelText(/密碼/);
            const button = screen.getByRole('button', { name: /登入/ });
            
            // First trigger errors
            fireEvent.change(emailInput, { target: { value: 'invalid' } });
            fireEvent.click(button);
            expect(await screen.findByText('請輸入有效的 Email 格式')).toBeInTheDocument();

            // Then fix it
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } });
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.queryByText('請輸入有效的 Email 格式')).not.toBeInTheDocument();
            });
        });
    });

    describe('Authentication & API (身分驗證與 API 互動)', () => {
        it('成功登入後，應呼叫 login 函式並導向 /dashboard (replace: true)', async () => {
            const mockLogin = vi.fn().mockResolvedValue(undefined);
            mockUseAuth.mockReturnValue({ ...defaultAuthContext, login: mockLogin });

            renderWithRouter(<LoginPage />);
            
            const emailInput = screen.getByLabelText(/電子郵件/);
            const passwordInput = screen.getByLabelText(/密碼/);
            const button = screen.getByRole('button', { name: /登入/ });
            
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } });
            fireEvent.click(button);

            await waitFor(() => {
                expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'ValidPass123');
                expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
            });
        });

        it('API 登入失敗時，應顯示回傳的錯誤訊息或預設錯誤訊息「登入失敗，請稍後再試」', async () => {
            const mockLogin = vi.fn().mockRejectedValue({
                response: { data: { message: 'Custom API Error' } }
            });
            mockUseAuth.mockReturnValue({ ...defaultAuthContext, login: mockLogin });

            renderWithRouter(<LoginPage />);
            const emailInput = screen.getByLabelText(/電子郵件/);
            const passwordInput = screen.getByLabelText(/密碼/);
            const button = screen.getByRole('button', { name: /登入/ });
            
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } });
            fireEvent.click(button);

            expect(await screen.findByText('Custom API Error')).toBeInTheDocument();
        });

        it('登入請求進行中（isLoading 為 true），應顯示載入中狀態並禁用輸入框與按鈕', async () => {
            // Need a promise that doesn't resolve immediately to check loading state
            let resolveLogin: (value: unknown) => void;
            const loginPromise = new Promise((resolve) => {
                resolveLogin = resolve;
            });
            const mockLogin = vi.fn().mockReturnValue(loginPromise);
            mockUseAuth.mockReturnValue({ ...defaultAuthContext, login: mockLogin });

            renderWithRouter(<LoginPage />);

            const emailInput = screen.getByLabelText(/電子郵件/);
            const passwordInput = screen.getByLabelText(/密碼/);
            const button = screen.getByRole('button', { name: /登入/ });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'ValidPass123' } });
            fireEvent.click(button);

            // Wait for re-render
            await waitFor(() => {
                 expect(button).toBeDisabled();
            });
            expect(emailInput).toBeDisabled();
            expect(passwordInput).toBeDisabled();
            expect(screen.getByText(/登入中\.\.\./)).toBeInTheDocument();
            
            // Clean up promise
            resolveLogin!(undefined);
        });

        it('如果存在 authExpiredMessage，應在畫面顯示錯誤訊息並呼叫 clearAuthExpiredMessage', () => {
            const mockClearAuthExpiredMessage = vi.fn();
            mockUseAuth.mockReturnValue({
                ...defaultAuthContext,
                authExpiredMessage: '登入已過期',
                clearAuthExpiredMessage: mockClearAuthExpiredMessage
            });

            renderWithRouter(<LoginPage />);

            expect(screen.getByText('登入已過期')).toBeInTheDocument();
            expect(mockClearAuthExpiredMessage).toHaveBeenCalled();
        });

        it('若已經 isAuthenticated 為 true，渲染時應直接導向 /dashboard', () => {
            mockUseAuth.mockReturnValue({
                ...defaultAuthContext,
                isAuthenticated: true
            });

            renderWithRouter(<LoginPage />);

            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        });
    });
});
