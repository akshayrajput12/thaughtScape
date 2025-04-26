
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { MemoryRouter } from 'react-router-dom';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminDashboardButton', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('shows admin button for admin users when viewing own profile', () => {
    const mockProfile = {
      id: 'test-id',
      username: 'testuser',
      full_name: 'Test User',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      is_admin: true,
    };
    
    render(
      <MemoryRouter>
        <ProfileHeader
          profile={mockProfile}
          isOwnProfile={true}
          isEditing={false}
          onEditClick={() => {}}
          isFollowing={false}
          isBlocked={false}
          isBlockedByUser={false}
          onFollowToggle={() => {}}
          onBlock={() => {}}
          onUnblock={() => {}}
          onMessage={() => {}}
          postsCount={0}
          followersCount={0}
          followingCount={0}
          isAdmin={true}
        />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
  });

  it('does not show admin button for non-admin users', () => {
    const mockProfile = {
      id: 'test-id',
      username: 'testuser',
      full_name: 'Test User',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };
    
    render(
      <MemoryRouter>
        <ProfileHeader
          profile={mockProfile}
          isOwnProfile={true}
          isEditing={false}
          onEditClick={() => {}}
          isFollowing={false}
          isBlocked={false}
          isBlockedByUser={false}
          onFollowToggle={() => {}}
          onBlock={() => {}}
          onUnblock={() => {}}
          onMessage={() => {}}
          postsCount={0}
          followersCount={0}
          followingCount={0}
          isAdmin={false}
        />
      </MemoryRouter>
    );
    
    expect(screen.queryByText(/Admin Panel/i)).not.toBeInTheDocument();
  });

  it('navigates to admin panel when admin button is clicked', () => {
    const mockProfile = {
      id: 'test-id',
      username: 'testuser',
      full_name: 'Test User',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      is_admin: true,
    };
    
    render(
      <MemoryRouter>
        <ProfileHeader
          profile={mockProfile}
          isOwnProfile={true}
          isEditing={false}
          onEditClick={() => {}}
          isFollowing={false}
          isBlocked={false}
          isBlockedByUser={false}
          onFollowToggle={() => {}}
          onBlock={() => {}}
          onUnblock={() => {}}
          onMessage={() => {}}
          postsCount={0}
          followersCount={0}
          followingCount={0}
          isAdmin={true}
        />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText(/Admin Panel/i));
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });
});
