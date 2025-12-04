import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../Login';
import { AuthContext } from '../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock AuthContext
const mockLogin = vi.fn().mockResolvedValue({ success: true });
const mockAuthContext = {
    login: mockLogin,
    user: null
};

const renderLogin = () => {
    return render(
        <AuthContext.Provider value={mockAuthContext}>
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        </AuthContext.Provider>
    );
};

describe('Login Component', () => {
    it('renders login form correctly', () => {
        renderLogin();

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });

    it('handles input changes', () => {
        renderLogin();

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/senha/i);

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(emailInput.value).toBe('test@example.com');
        expect(passwordInput.value).toBe('password123');
    });

    it('submits form with credentials', async () => {
        renderLogin();

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
});
