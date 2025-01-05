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

export interface Poem {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  author: Profile;
  _count?: {
    likes: number;
    bookmarks: number;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'follow' | 'like' | 'comment' | 'message';
  content: string;
  is_read: boolean;
  related_user_id?: string;
  related_poem_id?: string;
  created_at: string;
  related_user?: Profile;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}