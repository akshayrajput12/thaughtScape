
export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  age?: number;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  bio?: string;
  avatar_url?: string;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
  is_profile_completed?: boolean;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  budget: number;
  deadline: string;
  attachment_url?: string;
  status: 'open' | 'closed' | 'in_progress';
  author_id: string;
  notifications_count?: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
  _count?: {
    comments: number;
    applications: number;
  };
}

export interface ProjectApplication {
  id: string;
  project_id: string;
  applicant_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  viewed_at?: string;
  created_at: string;
  applicant?: Profile;
}
