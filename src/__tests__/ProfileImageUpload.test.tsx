import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileImageUpload } from '../components/profile/ProfileImageUpload';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' } }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test-url.com/image.jpg' } }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
    from: () => ({
      update: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
    }),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('ProfileImageUpload', () => {
  const mockProfile = {
    id: 'test-id',
    username: 'testuser',
    full_name: 'Test User',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  const mockOnImageUploaded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<ProfileImageUpload profile={mockProfile} onImageUploaded={mockOnImageUploaded} />);
    
    expect(screen.getByText(/Upload Image/i)).toBeInTheDocument();
    expect(screen.getByText(/Maximum file size: 2MB/i)).toBeInTheDocument();
  });

  it('shows remove button when profile has avatar_url', () => {
    const profileWithAvatar = {
      ...mockProfile,
      avatar_url: 'https://example.com/avatar.jpg',
    };
    
    render(<ProfileImageUpload profile={profileWithAvatar} onImageUploaded={mockOnImageUploaded} />);
    
    expect(screen.getByText(/Remove/i)).toBeInTheDocument();
  });

  // Add more tests for file upload functionality
});
