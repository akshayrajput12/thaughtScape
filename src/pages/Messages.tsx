
import React from 'react';
import { MessageLayout } from '@/components/messages/MessageLayout';
import { useMessagesProvider } from '@/components/messages/MessagesProvider';

const Messages = () => {
  const messagesProvider = useMessagesProvider();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <MessageLayout 
        {...messagesProvider}
        onTabChange={messagesProvider.setActiveTab}
      />
    </div>
  );
};

export default Messages;
