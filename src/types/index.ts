import type { ProjectExtension } from './extension';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio?: string;
  website?: string;
  college?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  is_following?: boolean;
  followers_count?: number;
  following_count?: number;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Thought {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  author?: Profile;
  is_liked?: boolean;
}

export interface Project extends ProjectExtension {
  id: string;
  title: string;
  description: string;
  author_id: string;
  budget: number;
  min_budget?: number;
  max_budget?: number;
  deadline?: string;
  created_at: string;
  updated_at?: string;
  status: "open" | "closed" | "in_progress";
  required_skills?: string[];
  job_type?: string;
  experience_level?: string;
  location?: string;
  is_featured?: boolean;
  author?: Profile;
}

export interface Comment {
  id: string;
  thought_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
  related_user_id?: string;
  related_thought_id?: string;
  related_comment_id?: string;
  related_user?: Profile;
}

// Add any other types your application needs
