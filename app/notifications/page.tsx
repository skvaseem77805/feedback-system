'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiNotifications, apiMarkNotificationRead, apiAcceptCollaboration, apiRejectCollaboration, apiClearNotifications } from '@/lib/api';
import type { ApiNotification } from '@/lib/api';
import { getCurrentStudentId } from '@/lib/statsTracker';

function getRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  } catch {
    return 'Recently';
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const currentStudentId = getCurrentStudentId();

  useEffect(() => {
    if (!currentStudentId) {
      router.push('/auth');
      return;
    }

    const loadNotifications = async () => {
      try {
        setLoading(true);
        const data = await apiNotifications(currentStudentId);
        setNotifications(data);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setError('Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [currentStudentId, router]);

  const handleMarkAsRead = async (id: string) => {
    try {
      // Find the notification to check if it's already read
      const notif = notifications.find(n => n.id === id);
      if (notif && !notif.isRead) {
        await apiMarkNotificationRead(id);
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
        window.dispatchEvent(new CustomEvent('notifications-changed'));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleAcceptCollab = async (id: string) => {
    try {
      await apiAcceptCollaboration(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      window.dispatchEvent(new CustomEvent('notifications-changed'));
    } catch (err) {
      console.error('Failed to accept collaboration request:', err);
    }
  };

  const handleRejectCollab = async (id: string) => {
    try {
      await apiRejectCollaboration(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      window.dispatchEvent(new CustomEvent('notifications-changed'));
    } catch (err) {
      console.error('Failed to reject collaboration request:', err);
    }
  };

  const handleClearAll = async () => {
    if (!currentStudentId) return;
    try {
      setLoading(true);
      await apiClearNotifications(currentStudentId);
      setNotifications([]);
      setShowClearConfirm(false);
      window.dispatchEvent(new CustomEvent('notifications-changed'));
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      setError('Failed to clear notifications.');
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'read') return n.isRead;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-left">
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with requests and activity on your profile and projects.
            </p>
          </div>
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white shrink-0 sm:self-center self-start"
              onClick={() => setShowClearConfirm(true)}
            >
              🗑️ Clear All
            </Button>
          )}
        </div>

        {error && (
          <Card className="p-6 text-center border-red-500/20 bg-red-500/5 mb-6">
            <p className="text-red-500 font-medium">{error}</p>
          </Card>
        )}

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {notifications.some(n => !n.isRead) && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white leading-none">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 outline-none">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground animate-pulse">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card className="p-12 text-center border-dashed">
                <div className="text-4xl mb-4">🔔</div>
                <h3 className="font-semibold text-lg text-muted-foreground mb-1">No notifications yet</h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'all'
                    ? "We'll notify you when someone interacts with your projects."
                    : activeTab === 'unread'
                    ? 'You have read all your notifications!'
                    : "No read notifications found."}
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id)}
                    className={`p-4 rounded-xl border smooth-transition cursor-pointer relative flex gap-4 text-left ${
                      notif.isRead
                        ? 'bg-card/50 border-border/50 opacity-80 hover:bg-card/70'
                        : 'bg-card/90 border-primary/20 shadow-sm hover:border-primary/50 hover:bg-card'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {notif.senderAvatar ? (
                        <img
                          src={notif.senderAvatar}
                          alt={notif.senderName || 'Sender'}
                          className="w-12 h-12 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl">
                          👤
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-sm text-foreground">
                          {notif.senderName || 'Unknown Student'}
                        </h4>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {getRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-primary/80">
                        {notif.title}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {notif.message}
                      </p>

                      {!notif.isRead && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-500 font-medium pt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Unread
                        </div>
                      )}

                      {/* Action buttons for COLLAB_REQUEST if unread */}
                      {!notif.isRead && notif.type === 'COLLAB_REQUEST' && (
                        <div className="flex items-center gap-3 pt-3" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white gap-1"
                            onClick={() => handleAcceptCollab(notif.id)}
                          >
                            ✅ Accept
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white gap-1"
                            onClick={() => handleRejectCollab(notif.id)}
                          >
                            ❌ Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="max-w-md w-full mx-4 p-6 space-y-6 shadow-2xl border border-white/10 text-left bg-card">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Clear all notifications?</h3>
              <p className="text-sm text-muted-foreground mt-2">
                This will delete all of your notifications. This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleClearAll}
              >
                Clear All
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
