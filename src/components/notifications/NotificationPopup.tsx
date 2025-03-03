
import { useState, useEffect } from "react";
import { X, MessageSquare, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface NotificationPopupProps {
  unreadMessages: number;
  projectApplications: number;
  newProjects: number;
  isVisible: boolean;
  onClose: () => void;
}

export const NotificationPopup = ({
  unreadMessages,
  projectApplications,
  newProjects,
  isVisible,
  onClose,
}: NotificationPopupProps) => {
  const navigate = useNavigate();
  const [currentNotification, setCurrentNotification] = useState(0);
  const hasNotifications = unreadMessages > 0 || projectApplications > 0 || newProjects > 0;

  // Create an array of available notifications
  const notifications = [
    ...(unreadMessages > 0 ? [{ type: "messages", count: unreadMessages }] : []),
    ...(projectApplications > 0 ? [{ type: "applications", count: projectApplications }] : []),
    ...(newProjects > 0 ? [{ type: "projects", count: newProjects }] : []),
  ];

  useEffect(() => {
    if (notifications.length > 1) {
      const interval = setInterval(() => {
        setCurrentNotification((prev) => (prev + 1) % notifications.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [notifications.length]);

  const handleAction = (type: string) => {
    if (type === "messages") {
      navigate("/messages");
    } else {
      navigate("/freelancing");
    }
    onClose();
  };

  if (!hasNotifications || !isVisible) return null;

  const current = notifications[currentNotification];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-md"
        >
          <div className="bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="relative p-6">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-black hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              <motion.div
                key={current.type}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-start gap-4"
              >
                <div className="bg-black text-white p-3 rounded-full flex items-center justify-center">
                  {current.type === "messages" ? (
                    <MessageSquare size={24} />
                  ) : (
                    <Briefcase size={24} />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    {current.type === "messages"
                      ? "New Messages"
                      : current.type === "applications"
                      ? "Project Applications"
                      : "New Projects"}
                  </h3>
                  <p className="text-gray-700 mb-4">
                    {current.type === "messages"
                      ? `You have ${current.count} unread message${current.count > 1 ? "s" : ""}`
                      : current.type === "applications"
                      ? `You have ${current.count} new application${current.count > 1 ? "s" : ""} to review`
                      : `${current.count} new project${current.count > 1 ? "s" : ""} have been posted`}
                  </p>

                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => handleAction(current.type === "messages" ? "messages" : "freelancing")}
                      className="bg-black hover:bg-gray-800 text-white font-medium px-6 py-2 rounded-lg transition-colors"
                    >
                      {current.type === "messages" ? "View Messages" : "View Projects"}
                    </Button>

                    {notifications.length > 1 && (
                      <div className="flex gap-1">
                        {notifications.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index === currentNotification ? "bg-black" : "bg-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
