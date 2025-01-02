export interface Profile {
  id: string;
  username: string;
  email?: string;
  full_name: string | null;
  age: number | null;
  phone: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Poem {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    full_name: string | null;
  };
  created_at: string;
  _count?: {
    likes: number;
    bookmarks: number;
  };
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

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  content: string;
  is_read: boolean;
  related_user_id: string | null;
  related_poem_id: string | null;
  created_at: string;
  related_user?: Profile;
  related_poem?: Poem;
}