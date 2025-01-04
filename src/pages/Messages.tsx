import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Message, Profile } from "@/types";

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchUsername, setSearchUsername] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchMessages = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      // Get messages from the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(*),
          receiver:profiles!receiver_id(*)
        `)
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Could not fetch messages",
          variant: "destructive",
        });
        return;
      }

      setMessages(data);

      // Get unique users from messages
      const uniqueUsers = new Set();
      const messageUsers = data.reduce((acc: Profile[], message: Message) => {
        const otherUser = message.sender_id === session.user.id ? message.receiver : message.sender;
        if (otherUser && !uniqueUsers.has(otherUser.id)) {
          uniqueUsers.add(otherUser.id);
          acc.push(otherUser);
        }
        return acc;
      }, []);

      setUsers(messageUsers);
    };

    fetchMessages();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        fetchMessages
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const searchUsers = async (username: string) => {
    if (!username) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${username}%`)
      .limit(5);

    if (error) {
      toast({
        title: "Error",
        description: "Could not search users",
        variant: "destructive",
      });
      return;
    }

    setUsers(data);
  };

  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: session.user.id,
        receiver_id: selectedUser.id,
        content: newMessage.trim()
      });

    if (error) {
      toast({
        title: "Error",
        description: "Could not send message",
        variant: "destructive",
      });
      return;
    }

    setNewMessage("");
    toast({
      title: "Success",
      description: "Message sent successfully",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
        <div className="grid grid-cols-3 min-h-[600px]">
          {/* Users list */}
          <div className="border-r">
            <div className="p-4">
              <Input
                placeholder="Search users..."
                value={searchUsername}
                onChange={(e) => {
                  setSearchUsername(e.target.value);
                  searchUsers(e.target.value);
                }}
              />
            </div>
            <div className="divide-y">
              {users.map((user) => (
                <button
                  key={user.id}
                  className={`w-full p-4 text-left hover:bg-gray-50 ${
                    selectedUser?.id === user.id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="font-medium">{user.full_name || user.username}</div>
                  <div className="text-sm text-gray-500">@{user.username}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="col-span-2 flex flex-col">
            {selectedUser ? (
              <>
                <div className="p-4 border-b">
                  <h2 className="font-medium">{selectedUser.full_name || selectedUser.username}</h2>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {messages
                    .filter(m => 
                      (m.sender_id === selectedUser.id) || 
                      (m.receiver_id === selectedUser.id)
                    )
                    .map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === selectedUser.id ? 'justify-start' : 'justify-end'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.sender_id === selectedUser.id
                              ? 'bg-gray-100'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                </div>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage}>Send</Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a user to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;