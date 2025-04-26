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
  college?: string;
  registration_number?: string;
  is_following?: boolean;
  whatsapp_number?: string;
  genres?: string[];
  instagram_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  snapchat_url?: string;
  youtube_url?: string;
  portfolio_url?: string;
  github_url?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  min_budget?: number;
  max_budget?: number;
  budget?: number;
  deadline: string;
  attachment_url?: string;
  status: 'open' | 'closed' | 'in_progress';
  author_id: string;
  notifications_count?: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
  client_id?: string;
  freelancer_id?: string;
  client?: Profile;
  freelancer?: Profile;
  _count?: {
    comments: number;
    applications: number;
  };
  applications_count?: number | { count: number }[];
  milestones_count?: number | { count: number }[];
  company_name?: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  application_deadline?: string;
  allow_normal_apply?: boolean;
  allow_whatsapp_apply?: boolean;
  application_link?: string;
  is_featured?: boolean;
}

export interface ProjectApplication {
  id: string;
  project_id: string;
  applicant_id: string;
  message: string;
  phone_number?: string;
  status: 'pending' | 'accepted' | 'rejected';
  viewed_at?: string;
  created_at: string;
  applicant?: Profile;
  experience?: string;
  portfolio?: string;
  education?: string;
  skills?: string[];
  expected_salary?: number;
}

export interface Thought {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  author: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
  };
  _count?: {
    likes: number;
    bookmarks: number;
    comments?: number;
  };
  comments?: { count: number }[];
  likes?: any[];
  bookmarks?: any[];
  tagged_users?: string[];
  accepted_tags?: string[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'follow' | 'like' | 'comment' | 'message' | 'tag' | 'share';
  content: string;
  is_read: boolean;
  related_user_id?: string;
  related_thought_id?: string;
  created_at: string;
  related_user?: Profile;
  tag_status?: 'pending' | 'accepted' | 'rejected';
}

export interface Tag {
  id: string;
  thought_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface UserApplication {
  project_id: string;
  status: 'pending' | 'accepted' | 'rejected';
}

// Define Message interface for use in messages-related components
export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
  request_status?: 'pending' | 'accepted' | 'declined';
  is_request?: boolean;
  sender?: Profile;
  receiver?: Profile;
}

// Define CallLog interface for use in call-related components
export interface CallLog {
  id: string;
  call_type: 'audio' | 'video';
  status: 'completed' | 'missed' | 'rejected';
  duration?: number;
  caller_id: string;
  receiver_id: string;
  created_at: string;
  caller?: Profile;
  receiver?: Profile;
}
