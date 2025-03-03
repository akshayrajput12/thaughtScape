
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Message, Profile } from '@/types';
import { useAutoScroll } from '@/components/hooks/use-auto-scroll';

interface Conversation {
  user: Profile;
  lastMessage: Message;
  unreadCount: number;
}

export function useMessagesProvider() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const userIdFromUrl = searchParams.get('user');

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messageRequests, setMessageRequests] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new messages come in
  useAutoScroll(messagesEndRef, [messages]);

  // Filter messages for the selected user
  const messagesToShow = messages.filter(
    (message) =>
      (message.sender_id === selectedUser?.id &&
        message.receiver_id === currentUserId) ||
      (message.sender_id === currentUserId &&
        message.receiver_id === selectedUser?.id)
  );

  // Check if current user is following the selected user
  const isFollowing = selectedUser ? followStatus[selectedUser.id] : false;

  // Check if message count exceeds limit for non-followers
  const messageCountExceedsLimit = 
    selectedUser && 
    messageCounts[selectedUser.id] >= 3 && 
    !isFollowing;

  // Fetch follow status
  const fetchFollowStatus = async () => {
    if (!currentUserId) return;
    
    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId);

    if (error) {
      console.error('Error fetching follows:', error);
      return;
    }

    const followMap = data.reduce((acc, item) => {
      acc[item.following_id] = true;
      return acc;
    }, {} as Record<string, boolean>);

    setFollowStatus(followMap);
  };

  // Set up Supabase subscription for real-time messages
  useEffect(() => {
    if (!currentUserId) return;

    const subscription = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Fetch sender details
          const { data: senderData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMessage.sender_id)
            .maybeSingle();
          
          if (senderData) {
            const updatedMessage = {
              ...newMessage,
              sender: senderData
            } as Message;
            
            setMessages((prev) => [...prev, updatedMessage]);
            
            // Mark as read if the sender is the currently selected user
            if (selectedUser && selectedUser.id === newMessage.sender_id) {
              markMessageAsRead(newMessage.id);
            }
            
            // Update conversations list
            fetchConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUserId, selectedUser]);

  // Fetch current user on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!user?.id) {
        navigate('/auth');
        return;
      }

      setCurrentUserId(user.id);

      // Check if there's a user ID in the URL
      if (userIdFromUrl && userIdFromUrl !== user.id) {
        const { data: userData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userIdFromUrl)
          .maybeSingle();

        if (!error && userData) {
          setSelectedUser(userData);
          setActiveTab('chats');
        }
      }
    };

    fetchCurrentUser();
  }, [navigate, user?.id, userIdFromUrl]);

  useEffect(() => {
    fetchFollowStatus();
  }, [currentUserId]);

  // Fetch conversations and message requests
  useEffect(() => {
    if (!currentUserId) return;

    fetchConversations();
    fetchMessageRequests();
  }, [currentUserId]);

  // Search for users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || !currentUserId) {
        setSearchResults([]);
        return;
      }

      const { data, error } = await supabase
        .rpc('search_users', {
          search_query: searchQuery,
          current_user_id: currentUserId
        });

      if (error) {
        console.error('Error searching users:', error);
        return;
      }

      if (data) {
        // Add required properties for Profile type
        const searchResultsWithRequiredFields = data.map((user: any) => ({
          ...user,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString(),
        })) as Profile[];
        
        setSearchResults(searchResultsWithRequiredFields);
      }
    };

    searchUsers();
  }, [searchQuery, currentUserId]);

  // Count outgoing messages per recipient
  useEffect(() => {
    const countMessages = async () => {
      if (!currentUserId) return;

      const { data, error } = await supabase
        .from('messages')
        .select('receiver_id, id')
        .eq('sender_id', currentUserId);

      if (error) {
        console.error('Error counting messages:', error);
        return;
      }

      const counts: Record<string, number> = {};
      data.forEach(msg => {
        counts[msg.receiver_id] = (counts[msg.receiver_id] || 0) + 1;
      });

      setMessageCounts(counts);
    };

    countMessages();
  }, [currentUserId, messages]);

  // Fetch messages when selected user changes
  useEffect(() => {
    if (!selectedUser || !currentUserId) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          receiver:profiles!messages_receiver_id_fkey(*)
        `)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .or(`sender_id.eq.${selectedUser.id},receiver_id.eq.${selectedUser.id}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } else if (data) {
        // Ensure data conforms to Message type
        const typedMessages = data.map(msg => {
          // Make sure request_status is of the correct type
          let typedRequestStatus: "pending" | "accepted" | "declined" | null = null;
          if (msg.request_status === 'pending') typedRequestStatus = 'pending';
          else if (msg.request_status === 'accepted') typedRequestStatus = 'accepted';
          else if (msg.request_status === 'declined') typedRequestStatus = 'declined';
          
          return {
            ...msg,
            request_status: typedRequestStatus
          } as Message;
        });
        
        setMessages(typedMessages);
        
        // Mark messages from selected user as read
        const unreadMessages = typedMessages.filter(
          msg => msg.sender_id === selectedUser.id && 
                msg.receiver_id === currentUserId && 
                !msg.is_read
        ) || [];
        
        for (const msg of unreadMessages) {
          markMessageAsRead(msg.id);
        }
      }

      setIsLoadingMessages(false);
    };

    fetchMessages();
  }, [selectedUser, currentUserId]);

  const fetchConversations = async () => {
    if (!currentUserId) return;

    // Fetch the latest message from each conversation
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*),
        receiver:profiles!messages_receiver_id_fkey(*)
      `)
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    if (!data) return;

    // Group by conversation and get the latest message
    const conversationMap = new Map<string, Conversation>();
    let unreadCountMap = new Map<string, number>();

    data.forEach(message => {
      const otherUserId = message.sender_id === currentUserId
        ? message.receiver_id
        : message.sender_id;
      
      const otherUser = message.sender_id === currentUserId
        ? message.receiver
        : message.sender;

      // Ensure message conforms to Message type
      let typedRequestStatus: "pending" | "accepted" | "declined" | null = null;
      if (message.request_status === 'pending') typedRequestStatus = 'pending';
      else if (message.request_status === 'accepted') typedRequestStatus = 'accepted';
      else if (message.request_status === 'declined') typedRequestStatus = 'declined';
      
      const typedMessage = {
        ...message,
        request_status: typedRequestStatus
      } as Message;

      // Count unread messages
      if (message.receiver_id === currentUserId && !message.is_read) {
        unreadCountMap.set(
          otherUserId,
          (unreadCountMap.get(otherUserId) || 0) + 1
        );
      }

      // Only add if this is a newer message than what we already have
      if (!conversationMap.has(otherUserId) || 
          new Date(message.created_at) > new Date(conversationMap.get(otherUserId)!.lastMessage.created_at)) {
        conversationMap.set(otherUserId, {
          user: otherUser,
          lastMessage: typedMessage,
          unreadCount: 0 // Will update this after processing all messages
        });
      }
    });

    // Update unread counts
    for (const [userId, convo] of conversationMap.entries()) {
      convo.unreadCount = unreadCountMap.get(userId) || 0;
    }

    // Convert map to array and sort by last message time (newest first)
    const conversationsArray = Array.from(conversationMap.values()).sort((a, b) => 
      new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );

    setConversations(conversationsArray);
  };

  const fetchMessageRequests = async () => {
    if (!currentUserId) return;

    // Get message requests (is_request=true, request_status=pending)
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*)
      `)
      .eq('receiver_id', currentUserId)
      .eq('is_request', true)
      .eq('request_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching message requests:', error);
      return;
    }

    if (data) {
      // Ensure data conforms to Message type
      const typedMessages = data.map(msg => ({
        ...msg,
        request_status: msg.request_status as "pending" | "accepted" | "declined" | null
      })) as Message[];
      
      setMessageRequests(typedMessages);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleSelectUser = (user: Profile) => {
    setSelectedUser(user);
    if (activeTab === 'users' || activeTab === 'requests') {
      setActiveTab('chats');
    }

    // Clear search query when selecting a user
    setSearchQuery('');
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedUser || !currentUserId) return;

    // Check if user is blocked from sending more messages
    if (messageCountExceedsLimit) {
      toast({
        title: "Message limit reached",
        description: "You can send only 3 messages to users who don't follow you",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if we need to create a new request
      let isFirstMessage = false;
      let requestStatus: 'pending' | 'accepted' | null = null;

      if (!isFollowing) {
        // Check if there are any existing messages between these users
        const { data: existingMessages, error: checkError } = await supabase
          .from('messages')
          .select('id')
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUserId})`)
          .limit(1);

        if (checkError) {
          console.error('Error checking existing messages:', checkError);
        }

        isFirstMessage = !existingMessages || existingMessages.length === 0;

        // If this is the first message and the recipient doesn't follow the sender,
        // create a message request
        if (isFirstMessage && !followStatus[selectedUser.id]) {
          requestStatus = 'pending';
        }
      }

      // Insert the new message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedUser.id,
          content: messageContent,
          is_read: false,
          is_request: isFirstMessage && !followStatus[selectedUser.id],
          request_status: requestStatus
        })
        .select()
        .single();

      if (messageError) {
        throw messageError;
      }

      // Add sender info to the message
      const { data: senderData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single();

      const newMessage = {
        ...messageData,
        sender: senderData,
        request_status: messageData.request_status as "pending" | "accepted" | "declined" | null
      } as Message;

      setMessages(prevMessages => [...prevMessages, newMessage]);
      setMessageContent('');

      // Update message counts
      setMessageCounts(prev => ({
        ...prev,
        [selectedUser.id]: (prev[selectedUser.id] || 0) + 1
      }));

      // Update conversations
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (senderId: string) => {
    try {
      // Update all pending requests from this sender to accepted
      const { error } = await supabase
        .from('messages')
        .update({ request_status: 'accepted' })
        .eq('sender_id', senderId)
        .eq('receiver_id', currentUserId)
        .eq('request_status', 'pending');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message request accepted",
      });

      // Update message requests list
      fetchMessageRequests();

      // If this is the selected user, refresh messages
      if (selectedUser && selectedUser.id === senderId) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', senderId)
          .maybeSingle();

        if (userData) {
          setSelectedUser(userData);
        }
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (senderId: string) => {
    try {
      // Update all pending requests from this sender to declined
      const { error } = await supabase
        .from('messages')
        .update({ request_status: 'declined' })
        .eq('sender_id', senderId)
        .eq('receiver_id', currentUserId)
        .eq('request_status', 'pending');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message request declined",
      });

      // Update message requests list
      fetchMessageRequests();
    } catch (error) {
      console.error('Error declining request:', error);
      toast({
        title: "Error",
        description: "Failed to decline request",
        variant: "destructive",
      });
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUserId) return;
    
    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUserId,
          following_id: userId
        });
        
      if (error) throw error;
      
      setFollowStatus(prev => ({
        ...prev,
        [userId]: true
      }));
      
      // If there were pending message requests, accept them automatically
      handleAcceptRequest(userId);
      
      toast({
        title: "Success",
        description: "User followed successfully",
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!currentUserId) return;
    
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', userId);
        
      if (error) throw error;
      
      setFollowStatus(prev => ({
        ...prev,
        [userId]: false
      }));
      
      toast({
        title: "Success",
        description: "User unfollowed successfully",
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    }
  };

  return {
    activeTab,
    setActiveTab,
    requestsCount: messageRequests.length,
    searchQuery,
    setSearchQuery,
    conversations,
    messageRequests,
    searchResults,
    selectedUser,
    onSelectUser: handleSelectUser,
    onAcceptRequest: handleAcceptRequest,
    onDeclineRequest: handleDeclineRequest,
    messagesToShow,
    isLoadingMessages,
    messages,
    messageContent,
    setMessageContent,
    handleSendMessage,
    isFollowing,
    followStatus,
    currentUserId,
    handleFollow,
    handleUnfollow,
    messagesEndRef,
    messageCountExceedsLimit
  };
}
