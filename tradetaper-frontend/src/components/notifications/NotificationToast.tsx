import React from 'react';
import { toast, Toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Notification } from '@/services/notificationService';
import { getNotificationStyle } from '@/utils/notificationUtils';
import { formatDistanceToNow } from 'date-fns';
import { FaTimes } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { markNotificationAsRead } from '@/store/features/notificationsSlice';

interface NotificationToastProps {
  t: Toast;
  notification: Notification;
}

export default function NotificationToast({ t, notification }: NotificationToastProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const style = getNotificationStyle(notification);

  const handleClick = () => {
    toast.dismiss(t.id);
    if (notification.status !== 'read') {
      dispatch(markNotificationAsRead(notification.id));
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <div
      className={`${
        t.visible ? 'animate-in slide-in-from-top-2 fade-in duration-300' : 'animate-out bg-transparent border-transparent text-transparent fade-out duration-300 pointer-events-none'
      } max-w-sm w-full bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 pointer-events-auto flex hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer group`}
      onClick={handleClick}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${style.bg} ${style.color}`}>
              {style.icon}
            </div>
          </div>
          <div className="ml-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {style.title || notification.title}
              </p>
              {style.badge && (
                <span className={`${style.bg} ${style.color} px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-current/10`}>
                  {style.badge}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 mt-2 font-medium">
              Just now
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200 dark:border-gray-700">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(t.id);
          }}
          className="w-full border-none border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
