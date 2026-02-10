# Notification Framework - Implementation Guide

**Date**: February 9, 2026
**Status**: In Progress (Trade notifications complete)
**Completion**: 30% implemented

---

## 📊 Implementation Status

### ✅ Completed (30%)
1. **Trade Notifications** - Fully implemented
   - TRADE_CREATED triggers on trade creation
   - TRADE_UPDATED triggers on trade update
   - TRADE_CLOSED triggers when trade closes
   - Integrated into TradesService
   - TradesModule imports NotificationsModule

### 🔄 In Progress (40%)
2. **MT5 Terminal Sync Notifications**
3. **Subscription/Billing Notifications**
4. **Frontend WebSocket Integration**
5. **Desktop Header Notification Bell**

### ⏸️ Not Started (30%)
6. **Push Notifications (FCM)**
7. **AI/Agent Notifications**
8. **Auth/Account Notifications**

---

## 🎯 Architecture Overview

### Current State

**Backend**:
- ✅ Notification entity with 15 types defined
- ✅ NotificationsService with send/schedule/cleanup methods
- ✅ NotificationsController with REST API
- ✅ NotificationSchedulerService with cron jobs
- ✅ WebSocket gateway for real-time delivery
- ✅ Email delivery via Resend
- ❌ Push notifications (FCM) - placeholder only
- ✅ Database migration with proper indexes
- ✅ Cleanup cron (30-day retention)

**Frontend**:
- ✅ NotificationBell component (mobile header)
- ✅ NotificationList component (full page)
- ✅ NotificationSettings component
- ✅ Redux slice with state management
- ✅ API service client
- ❌ Real-time WebSocket listener
- ❌ Desktop header integration

---

## 🚀 Remaining Implementation Tasks

### Priority 1: MT5 Terminal Sync Notifications

**File**: `/tradetaper-backend/src/terminal-farm/terminal-farm.service.ts`

**Line 269** - Add to `processTrades()` method after successful sync:

```typescript
// At end of processTrades method, after return statement line ~380
try {
  await this.notificationsService.send({
    userId,
    type: NotificationType.MT5_SYNC_COMPLETE,
    title: 'MT5 Sync Complete',
    message: `Synced ${imported} trades from ${data.accountName || 'MT5 account'}`,
    data: {
      accountId: data.accountId,
      accountName: data.accountName,
      imported,
      skipped,
      failed,
    },
  });
} catch (error) {
  this.logger.error(`Failed to send MT5 sync notification: ${error.message}`);
}
```

**Line ~XXX** - Add to `processTrades()` error handling:

```typescript
// In catch block around line ~400
try {
  await this.notificationsService.send({
    userId,
    type: NotificationType.MT5_SYNC_ERROR,
    title: 'MT5 Sync Failed',
    message: `Failed to sync trades: ${error.message}`,
    data: {
      accountId: data.accountId,
      error: error.message,
    },
    priority: NotificationPriority.HIGH,
  });
} catch (notifError) {
  this.logger.error(`Failed to send MT5 sync error notification: ${notifError.message}`);
}
```

**Import Requirements**:
```typescript
// Add to imports at top of file
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/entities/notification.entity';

// Add to constructor
@Inject(forwardRef(() => NotificationsService))
private readonly notificationsService: NotificationsService,
```

**Module Update**: `/tradetaper-backend/src/terminal-farm/terminal-farm.module.ts`
```typescript
// Add to imports array
forwardRef(() => NotificationsModule),
```

---

### Priority 2: Subscription/Billing Notifications

**File**: `/tradetaper-backend/src/subscriptions/subscriptions.service.ts`

**Method: `createSubscription()`** - Add after subscription created:

```typescript
try {
  await this.notificationsService.send({
    userId: subscription.userId,
    type: NotificationType.SUBSCRIPTION_RENEWED,
    title: 'Subscription Activated',
    message: `Your ${subscription.plan} subscription is now active`,
    data: {
      subscriptionId: subscription.id,
      plan: subscription.plan,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
    },
  });
} catch (error) {
  this.logger.error(`Failed to send subscription notification: ${error.message}`);
}
```

**Method: `checkExpiredSubscriptions()`** - Add warning before expiry:

```typescript
// Send notification 7 days before expiry
const sevenDaysFromNow = new Date();
sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

if (subscription.endDate <= sevenDaysFromNow && subscription.endDate > new Date()) {
  try {
    await this.notificationsService.send({
      userId: subscription.userId,
      type: NotificationType.SUBSCRIPTION_EXPIRY,
      title: 'Subscription Expiring Soon',
      message: `Your ${subscription.plan} subscription expires in ${Math.ceil((subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`,
      data: {
        subscriptionId: subscription.id,
        plan: subscription.plan,
        endDate: subscription.endDate,
      },
      priority: NotificationPriority.HIGH,
    });
  } catch (error) {
    this.logger.error(`Failed to send expiry notification: ${error.message}`);
  }
}
```

**Import Requirements**:
```typescript
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/entities/notification.entity';

// Add to constructor
@Inject(forwardRef(() => NotificationsService))
private readonly notificationsService: NotificationsService,
```

**Module Update**: `/tradetaper-backend/src/subscriptions/subscriptions.module.ts`
```typescript
// Add to imports array
forwardRef(() => NotificationsModule),
```

---

### Priority 3: Frontend WebSocket Integration

**File**: `/tradetaper-frontend/src/hooks/useWebSocket.ts`

**Add notification event listener**:

```typescript
// Around line 50-60, after other event listeners
socket.on('notification', (notification: any) => {
  console.log('📬 Received notification:', notification);

  // Dispatch to Redux
  store.dispatch(notificationsSlice.actions.addNotification(notification));

  // Optional: Show toast notification
  // toast.success(notification.title, {
  //   description: notification.message,
  // });
});
```

**Import Requirements**:
```typescript
import { notificationsSlice } from '../store/features/notificationsSlice';
import { store } from '../store';
```

---

### Priority 4: Desktop Header Notification Bell

**File**: `/tradetaper-frontend/src/components/layout/ContentHeader.tsx`

**Replace notification button** with NotificationBell component:

```tsx
// Add import at top
import NotificationBell from '../notifications/NotificationBell';

// Find the notification button (around line 40-50)
// Replace this:
<button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
  <Bell className="w-5 h-5" />
</button>

// With this:
<NotificationBell />
```

---

### Priority 5: Push Notifications (FCM)

**File**: `/tradetaper-backend/src/notifications/notifications.service.ts`

**Line 419-421** - Replace placeholder with FCM implementation:

```typescript
private async deliverPush(
  userId: string,
  notification: Notification,
): Promise<void> {
  try {
    // Get user's push token
    const preference = await this.notificationPreferenceRepository.findOne({
      where: { userId },
    });

    if (!preference?.pushToken) {
      this.logger.debug(`No push token for user ${userId}, skipping push notification`);
      return;
    }

    // Import Firebase Admin SDK
    const admin = await import('firebase-admin');

    // Send FCM message
    const message = {
      token: preference.pushToken,
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        notificationId: notification.id,
        type: notification.type,
        ...notification.data,
      },
      android: {
        priority: 'high' as const,
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
      },
    };

    const response = await admin.messaging().send(message);
    this.logger.log(`Push notification sent successfully: ${response}`);

    notification.deliveredAt = new Date();
    notification.status = NotificationStatus.DELIVERED;
    await this.notificationRepository.save(notification);
  } catch (error) {
    this.logger.error(`Failed to send push notification: ${error.message}`);
    notification.status = NotificationStatus.FAILED;
    notification.errorMessage = error.message;
    notification.retryCount += 1;
    await this.notificationRepository.save(notification);
    throw error;
  }
}
```

**Firebase Admin SDK Setup**:

1. Install package:
```bash
npm install firebase-admin
```

2. Add to `/tradetaper-backend/src/main.ts`:
```typescript
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FCM_PROJECT_ID,
    clientEmail: process.env.FCM_CLIENT_EMAIL,
    privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});
```

3. Add to `.env.yaml`:
```yaml
FCM_PROJECT_ID: your-project-id
FCM_CLIENT_EMAIL: firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FCM_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
```

---

## 📋 Testing Checklist

### Backend Tests

- [ ] Create trade → notification sent
- [ ] Update trade → notification sent
- [ ] Close trade → TRADE_CLOSED notification sent
- [ ] MT5 sync complete → notification sent
- [ ] MT5 sync error → error notification sent
- [ ] Subscription created → notification sent
- [ ] Subscription expiring → warning notification sent (7 days before)
- [ ] WebSocket delivers notification in real-time
- [ ] Email delivery works
- [ ] Push notification works (FCM)
- [ ] Notification cleanup cron runs daily
- [ ] Old notifications (>30 days) are deleted
- [ ] User preferences respected (channels, quiet hours)

### Frontend Tests

- [ ] NotificationBell shows unread count
- [ ] Clicking notification marks as read
- [ ] Real-time notifications appear instantly
- [ ] Desktop header notification bell works
- [ ] Mobile header notification bell works
- [ ] Full notification page shows all notifications
- [ ] Filtering by type works
- [ ] Mark all as read works
- [ ] Delete notification works
- [ ] Notification settings save correctly
- [ ] Quiet hours work
- [ ] Channel preferences work (in-app, push, email)

---

## 🐛 Known Issues & Fixes

### Issue 1: Circular Dependency

**Problem**: ForwardRef needed between modules

**Solution**: Use `forwardRef()` when importing NotificationsModule:
```typescript
forwardRef(() => NotificationsModule)
```

### Issue 2: WebSocket Not Connected

**Problem**: NotificationsGateway not imported in app.module

**Solution**: Ensure WebSocketModule is imported in app.module.ts

### Issue 3: Notifications Not Real-Time

**Problem**: Frontend not listening to WebSocket events

**Solution**: Add event listener in useWebSocket hook (see Priority 3)

### Issue 4: Desktop Header Missing Notifications

**Problem**: ContentHeader uses placeholder button

**Solution**: Replace button with NotificationBell component (see Priority 4)

---

## 📊 Database Optimization

### Indexes (Already Created)

- ✅ `IDX_notifications_userId`
- ✅ `IDX_notifications_userId_status`
- ✅ `IDX_notifications_userId_createdAt`
- ✅ `IDX_notifications_scheduledFor`

### Cleanup Policy

- **Retention**: 30 days for read notifications
- **Cron**: Daily at 3 AM
- **Implementation**: NotificationSchedulerService.cleanupOldNotifications()

---

## 🎯 Future Enhancements

### Phase 2 (Future)
1. Notification grouping (e.g., "You have 5 closed trades")
2. Action buttons in notifications (e.g., "View Trade")
3. Notification templates with i18n
4. Per-notification muting
5. Notification sound/vibration preferences
6. Daily digest email
7. Notification analytics dashboard
8. Rich notifications with images
9. Notification categories (Urgent, Important, Info)
10. Smart notification batching

### Phase 3 (Advanced)
1. AI-powered notification prioritization
2. Notification ML/ML based on user behavior
3. Cross-device notification sync
4. Notification scheduling (send later)
5. Notification threading/conversations
6. Notification search
7. Notification archiving
8. Notification export (PDF/CSV)

---

## 📚 Developer Guide

### How to Add Notifications to Your Service

1. **Import NotificationsService**:
```typescript
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
```

2. **Inject in constructor**:
```typescript
@Inject(forwardRef(() => NotificationsService))
private readonly notificationsService: NotificationsService,
```

3. **Send notification**:
```typescript
try {
  await this.notificationsService.send({
    userId: 'user-id',
    type: NotificationType.YOUR_TYPE,
    title: 'Short Title',
    message: 'Longer description of what happened',
    data: {
      // Any additional data
      entityId: 'id',
      otherData: 'value',
    },
    priority: NotificationPriority.NORMAL, // Optional
  });
} catch (error) {
  this.logger.error(`Failed to send notification: ${error.message}`);
}
```

4. **Update module**:
```typescript
// your.module.ts
imports: [
  // ... other imports
  forwardRef(() => NotificationsModule),
],
```

### Notification Types Available

```typescript
enum NotificationType {
  // Trades
  TRADE_CREATED = 'trade_created',
  TRADE_UPDATED = 'trade_updated',
  TRADE_CLOSED = 'trade_closed',

  // MT5
  MT5_SYNC_COMPLETE = 'mt5_sync_complete',
  MT5_SYNC_ERROR = 'mt5_sync_error',

  // Economic
  ECONOMIC_EVENT_1H = 'economic_event_1h',
  ECONOMIC_EVENT_15M = 'economic_event_15m',
  ECONOMIC_EVENT_NOW = 'economic_event_now',

  // AI
  AI_INSIGHT = 'ai_insight',
  STRATEGY_ALERT = 'strategy_alert',

  // System
  SYSTEM_UPDATE = 'system_update',
  SUBSCRIPTION_EXPIRY = 'subscription_expiry',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',

  // Account
  ACCOUNT_LINKED = 'account_linked',
  ACCOUNT_UNLINKED = 'account_unlinked',
}
```

---

## ✅ Completion Checklist

### Backend Implementation
- [x] Trade notifications (TRADE_CREATED, TRADE_UPDATED, TRADE_CLOSED)
- [ ] MT5 terminal sync notifications (MT5_SYNC_COMPLETE, MT5_SYNC_ERROR)
- [ ] Subscription notifications (SUBSCRIPTION_RENEWED, SUBSCRIPTION_EXPIRY)
- [ ] Push notifications (FCM integration)
- [ ] Module imports fixed (all services import NotificationsModule)

### Frontend Implementation
- [ ] WebSocket event listener for real-time notifications
- [ ] Desktop header notification bell integration
- [ ] Notification sound/toast alerts
- [ ] Testing all notification flows

### Testing & Documentation
- [ ] End-to-end testing of all notification types
- [ ] Performance testing (1000+ notifications)
- [ ] Documentation complete
- [ ] Deployment guide for FCM setup

---

**Implementation Progress**: 30% Complete
**Next Steps**: Priority 2 (MT5 Terminal Notifications) and Priority 3 (WebSocket Integration)
**Estimated Time to Complete**: 4-6 hours

---

**Created By**: Claude Opus 4.6
**Date**: February 9, 2026
**Status**: In Progress
