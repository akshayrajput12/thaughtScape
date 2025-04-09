
export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  full_name?: string;
  bio?: string;
  website?: string;
  email?: string;
  is_admin?: boolean;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
  created_at?: string;
  updated_at?: string;
  city?: string;
  state?: string;
  country?: string;
  genres?: string[];
  is_profile_completed?: boolean;
  whatsapp_number?: string;
  // Adding missing properties
  age?: number;
  phone?: string;
  college?: string;
  registration_number?: string;
}

export interface Thought {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  author_id: string;
  author?: Profile;
  image_url?: string;
  comments_count?: number;
  likes_count?: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  // Adding properties needed for PoemsList
  likes?: { count: number }[];
  bookmarks?: { count: number }[];
  comments?: { count: number }[];
  accepted_tags?: string[];
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  thought_id: string;
  user?: Profile;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  content: string;
  created_at: string;
  user_id: string;
  related_thought_id?: string;
  related_user_id?: string;
  is_read?: boolean;
  related_user?: Profile;
  related_thought?: Thought;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
  sender?: Profile;
  receiver?: Profile;
  is_request?: boolean;
  request_status?: 'pending' | 'accepted' | 'rejected';
}

export interface Project {
  id: string;
  title: string;
  description: string;
  budget?: number;
  min_budget?: number;
  max_budget?: number;
  deadline?: string;
  created_at: string;
  updated_at?: string;
  author_id: string;
  author?: Profile;
  status?: 'open' | 'in_progress' | 'closed';
  required_skills?: string[];
  notifications_count?: number;
  attachment_url?: string;
  allow_normal_apply?: boolean;
  allow_whatsapp_apply?: boolean;
  // Adding missing property
  applications_count?: number | { count: number }[];
}

export interface ProjectApplication {
  id: string;
  project_id: string;
  applicant_id: string;
  message: string;
  created_at: string;
  // Changing 'approved' to 'accepted' to match the code
  status?: 'pending' | 'accepted' | 'rejected';
  viewed_at?: string;
  project?: Project;
  applicant?: Profile;
  phone_number?: string;
  experience?: string;
  portfolio?: string;
}

export interface CallLog {
  id: string;
  caller_id: string;
  recipient_id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  status: 'missed' | 'answered' | 'rejected' | 'ongoing';
  call_type: 'audio' | 'video';
  caller?: Profile;
  recipient?: Profile;
}

// Adding missing Tag type
export interface Tag {
  id: string;
  name: string;
  created_at?: string;
  user_id?: string;
  thought_id?: string;
  status?: string;
}

// Adding UserApplication type
export interface UserApplication {
  project_id: string;
  status: 'pending' | 'accepted' | 'rejected';
}
