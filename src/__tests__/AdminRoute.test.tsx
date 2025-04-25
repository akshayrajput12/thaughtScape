import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminRoute } from '../components/auth/AdminRoute';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock useAuth
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
        }),
      }),
    }),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user is admin', async () => {
    render(
      <MemoryRouter>
        <AdminRoute>
          <div data-testid="admin-content">Admin Content</div>
        </AdminRoute>
      </MemoryRouter>
    );
    
    // Initially shows loading
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // Wait for admin check to complete
    const adminContent = await screen.findByTestId('admin-content');
    expect(adminContent).toBeInTheDocument();
  });

  // Add more tests for non-admin users and loading states
});
