
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
}

export interface Project {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  min_budget?: number;
  max_budget?: number;
  budget?: number; // Keep for backward compatibility
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
  allow_whatsapp_apply?: boolean;
  allow_normal_apply?: boolean;
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
  tagged_users?: string[]; // Add this new field
  accepted_tags?: string[]; // Add this new field
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'follow' | 'like' | 'comment' | 'message' | 'tag'; // Added 'tag' type
  content: string;
  is_read: boolean;
  related_user_id?: string;
  related_thought_id?: string;
  created_at: string;
  related_user?: Profile;
  tag_status?: 'pending' | 'accepted' | 'rejected'; // Added for tag notifications
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  is_request: boolean;
  request_status: 'pending' | 'accepted' | 'declined' | null;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface CallLog {
  id: string;
  caller_id: string;
  recipient_id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  call_type: 'audio' | 'video';
  status: 'completed' | 'missed' | 'rejected';
  created_at?: string;
}

export interface Tag {
  id: string;
  user_id: string;
  thought_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}
