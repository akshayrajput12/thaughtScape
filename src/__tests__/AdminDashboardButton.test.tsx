import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { BrowserRouter } from 'react-router-dom';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
      }),
    },
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

describe('Admin Dashboard Button', () => {
  const mockProfile = {
    id: 'test-id',
    username: 'testuser',
    full_name: 'Test User',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows admin dashboard button for admin users on their own profile', () => {
    render(
      <BrowserRouter>
        <ProfileHeader
          profile={mockProfile}
          isOwnProfile={true}
          isFollowing={false}
          onFollowToggle={() => {}}
          postsCount={0}
          followersCount={0}
          followingCount={0}
          isAdmin={true}
        />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
  });

  it('does not show admin dashboard button for non-admin users', () => {
    render(
      <BrowserRouter>
        <ProfileHeader
          profile={mockProfile}
          isOwnProfile={true}
          isFollowing={false}
          onFollowToggle={() => {}}
          postsCount={0}
          followersCount={0}
          followingCount={0}
          isAdmin={false}
        />
      </BrowserRouter>
    );
    
    expect(screen.queryByText(/Admin Dashboard/i)).not.toBeInTheDocument();
  });

  it('navigates to admin dashboard when button is clicked', async () => {
    render(
      <BrowserRouter>
        <ProfileHeader
          profile={mockProfile}
          isOwnProfile={true}
          isFollowing={false}
          onFollowToggle={() => {}}
          postsCount={0}
          followersCount={0}
          followingCount={0}
          isAdmin={true}
        />
      </BrowserRouter>
    );
    
    const adminButton = screen.getByText(/Admin Dashboard/i);
    fireEvent.click(adminButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });
});
