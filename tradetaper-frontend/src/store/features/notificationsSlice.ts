import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import notificationService, {
  Notification,
  NotificationPreference,
  NotificationsResponse,
  NotificationFilter,
} from '@/services/notificationService';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  preferences: NotificationPreference | null;
  isLoading: boolean;
  isLoadingPreferences: boolean;
  error: string | null;
  hasMore: boolean;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  total: 0,
  preferences: null,
  isLoading: false,
  isLoadingPreferences: false,
  error: null,
  hasMore: true,
};

// Async thunks
export const fetchNotifications = createAsyncThunk<
  NotificationsResponse,
  NotificationFilter | undefined
>('notifications/fetchNotifications', async (filter = {}) => {
  return notificationService.getNotifications(filter);
});

export const fetchUnreadCount = createAsyncThunk<number>(
  'notifications/fetchUnreadCount',
  async () => {
    return notificationService.getUnreadCount();
  }
);

export const markNotificationAsRead = createAsyncThunk<Notification, string>(
  'notifications/markAsRead',
  async (id) => {
    return notificationService.markAsRead(id);
  }
);

export const markAllNotificationsAsRead = createAsyncThunk<{ markedAsRead: number }>(
  'notifications/markAllAsRead',
  async () => {
    return notificationService.markAllAsRead();
  }
);

export const deleteNotification = createAsyncThunk<string, string>(
  'notifications/delete',
  async (id) => {
    await notificationService.deleteNotification(id);
    return id;
  }
);

export const fetchPreferences = createAsyncThunk<NotificationPreference>(
  'notifications/fetchPreferences',
  async () => {
    return notificationService.getPreferences();
  }
);

export const updatePreferences = createAsyncThunk<
  NotificationPreference,
  Partial<NotificationPreference>
>('notifications/updatePreferences', async (updates) => {
  return notificationService.updatePreferences(updates);
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Real-time notification from WebSocket
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Add to the beginning of the list
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
      state.total += 1;
    },
    
    // Update notification from WebSocket (e.g., marked as read elsewhere)
    updateNotification: (state, action: PayloadAction<Notification>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        state.notifications[index] = action.payload;
      }
    },
    
    // Handle read event from WebSocket
    notificationRead: (state, action: PayloadAction<{ id: string }>) => {
      const notification = state.notifications.find(n => n.id === action.payload.id);
      if (notification && notification.status !== 'read') {
        notification.status = 'read';
        notification.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    // Handle all read event from WebSocket
    allNotificationsRead: (state) => {
      state.notifications.forEach(n => {
        if (n.status !== 'read') {
          n.status = 'read';
          n.readAt = new Date().toISOString();
        }
      });
      state.unreadCount = 0;
    },
    
    // Clear notifications
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.total = 0;
      state.hasMore = true;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        // If offset is 0, replace; otherwise append
        const isFirstPage = action.meta.arg?.offset === 0 || action.meta.arg?.offset === undefined;
        if (isFirstPage) {
          state.notifications = action.payload.notifications;
        } else {
          state.notifications = [...state.notifications, ...action.payload.notifications];
        }
        state.total = action.payload.total;
        state.unreadCount = action.payload.unreadCount;
        state.hasMore = state.notifications.length < action.payload.total;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      });

    // Fetch unread count
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });

    // Mark as read
    builder
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload.id);
        if (index !== -1) {
          state.notifications[index] = action.payload;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });

    // Mark all as read
    builder
      .addCase(markAllNotificationsAsRead.fulfilled, (state, action) => {
        state.notifications.forEach(n => {
          if (n.status !== 'read') {
            n.status = 'read';
            n.readAt = new Date().toISOString();
          }
        });
        state.unreadCount = 0;
      });

    // Delete notification
    builder
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && notification.status !== 'read') {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(n => n.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      });

    // Fetch preferences
    builder
      .addCase(fetchPreferences.pending, (state) => {
        state.isLoadingPreferences = true;
      })
      .addCase(fetchPreferences.fulfilled, (state, action) => {
        state.isLoadingPreferences = false;
        state.preferences = action.payload;
      })
      .addCase(fetchPreferences.rejected, (state) => {
        state.isLoadingPreferences = false;
      });

    // Update preferences
    builder
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      });
  },
});

export const {
  addNotification,
  updateNotification,
  notificationRead,
  allNotificationsRead,
  clearNotifications,
  clearError,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
