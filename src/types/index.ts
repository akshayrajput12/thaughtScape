
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
  // Adding missing properties
  age?: number;
  country?: string;
  state?: string;
  city?: string;
  is_profile_completed?: boolean;
  registration_number?: string;
  whatsapp_number?: string;
  snapchat_url?: string;
  posts_count?: number;
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
  // Adding missing properties
  title?: string;
  accepted_tags?: string[];
  image_url?: string;
  likes?: { count: number }[];
  bookmarks?: { count: number }[];
  comments?: { count: number }[];
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
  // Adding missing properties
  company_name?: string;
  application_link?: string;
  allow_normal_apply?: boolean;
  allow_whatsapp_apply?: boolean;
  applications_count?: number | { count: number }[];
  milestones_count?: number | { count: number }[];
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

// Add new interfaces needed by components
export interface Tag {
  id: string;
  thought_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  name?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: Profile;
  recipient?: Profile;
}

export interface ProjectApplication {
  id: string;
  project_id: string;
  applicant_id: string;
  message: string;
  status: string;
  created_at: string;
  expected_salary?: number;
  skills?: string[];
  applicant?: Profile;
  portfolio?: string;
  experience?: string;
  education?: string;
  phone_number?: string;
  viewed_at?: string;
}

// Add any other types your application needs
