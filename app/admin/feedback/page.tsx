'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Trash2, CheckCircle2, Eye, EyeOff, Clock, Search } from 'lucide-react';
import Link from 'next/link';
import { smartFilterItems } from '@/lib/smart-search';

import { apiGetFeedback, apiUpdateFeedbackStatus, apiDeleteFeedback, ApiFeedback } from '@/lib/api';

import { loadPageState, savePageState, saveScrollPosition, restoreScrollPosition } from '@/lib/state-preservation';

type FeedbackSubmission = ApiFeedback;

export default function AdminFeedbackPage() {
  const router = useRouter();
  const savedState = loadPageState('admin_feedback', {
    searchQuery: '',
    filter: 'all' as 'all' | 'unread' | 'resolved' | 'pending',
  });

  const [feedbackList, setFeedbackList] = useState<FeedbackSubmission[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery);
  const [filter, setFilter] = useState<'all' | 'unread' | 'resolved' | 'pending'>(savedState.filter);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    savePageState('admin_feedback', { searchQuery, filter });
  }, [searchQuery, filter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      if (window.scrollY > 0) {
        saveScrollPosition('admin_feedback');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchFeedbackFromDb = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await apiGetFeedback();
      if (data && Array.isArray(data.feedback)) {
        setFeedbackList(data.feedback);
      }
    } catch (err) {
      console.error('Failed to fetch feedback from database:', err);
    } finally {
      if (showLoading) setLoading(false);
      restoreScrollPosition('admin_feedback');
    }
  };

  useEffect(() => {
    // Check if user is admin
    const userType = localStorage.getItem('userType');
    if (userType !== 'admin') {
      router.push('/auth');
      return;
    }

    setIsAuthorized(true);
    fetchFeedbackFromDb(true);

    // Auto-refresh every 3 seconds for real-time updates without manual refresh
    const interval = setInterval(() => {
      fetchFeedbackFromDb(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  const toggleRead = async (id: string) => {
    const target = feedbackList.find((f) => f.id === id);
    if (!target) return;
    const newReadState = !target.read;

    // Optimistic update
    setFeedbackList((prev) =>
      prev.map((f) => (f.id === id ? { ...f, read: newReadState } : f))
    );

    try {
      await apiUpdateFeedbackStatus(id, { read: newReadState });
      await fetchFeedbackFromDb(false);
    } catch (err) {
      console.error('Failed to toggle read status:', err);
      // Revert on error
      setFeedbackList((prev) =>
        prev.map((f) => (f.id === id ? { ...f, read: target.read } : f))
      );
    }
  };

  const toggleResolved = async (id: string) => {
    const target = feedbackList.find((f) => f.id === id);
    if (!target) return;
    const newResolvedState = !target.resolved;

    // Optimistic update
    setFeedbackList((prev) =>
      prev.map((f) => (f.id === id ? { ...f, resolved: newResolvedState } : f))
    );

    try {
      await apiUpdateFeedbackStatus(id, { resolved: newResolvedState });
      await fetchFeedbackFromDb(false);
    } catch (err) {
      console.error('Failed to toggle resolved status:', err);
      // Revert on error
      setFeedbackList((prev) =>
        prev.map((f) => (f.id === id ? { ...f, resolved: target.resolved } : f))
      );
    }
  };

  const deleteFeedback = async (id: string) => {
    const targetList = feedbackList;
    setFeedbackList((prev) => prev.filter((f) => f.id !== id));

    try {
      await apiDeleteFeedback(id);
      await fetchFeedbackFromDb(false);
    } catch (err) {
      console.error('Failed to delete feedback:', err);
      setFeedbackList(targetList);
    }
  };

  const filteredFeedback = (() => {
    const categoryFiltered = feedbackList.filter((f) => {
      if (filter === 'unread') return !f.read;
      if (filter === 'resolved') return f.resolved;
      if (filter === 'pending') return !f.resolved;
      return true;
    });

    const q = searchQuery.trim();
    if (!q) return categoryFiltered;

    return smartFilterItems(categoryFiltered, q, [
      { field: 'subject', weight: 2.0 },
      { field: 'message', weight: 1.8 },
      { field: 'userId', weight: 1.5 },
      { field: 'userRole', weight: 1.2 },
    ]);
  })();

  if (!isAuthorized) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    total: feedbackList.length,
    unread: feedbackList.filter((f) => !f.read).length,
    resolved: feedbackList.filter((f) => f.resolved).length,
    pending: feedbackList.filter((f) => !f.resolved).length,
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:bg-primary/20">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Feedback Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Review and manage all student and staff feedback
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Total Feedback</p>
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Unread</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.unread}</p>
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Pending</p>
            <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Resolved</p>
            <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
          </Card>
        </div>

        {/* Search Bar & Filter Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search feedback by subject, message, user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs sm:text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {(['all', 'unread', 'resolved', 'pending'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
                className="capitalize text-xs sm:text-sm"
              >
                {f === 'all' ? 'All Feedback' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredFeedback.length === 0 ? (
            <Card className="p-8 text-center bg-card/50 backdrop-blur-sm border-primary/20">
              <p className="text-muted-foreground">No feedback to display</p>
            </Card>
          ) : (
            filteredFeedback.map((feedback) => (
              <Card
                key={feedback.id}
                className={`p-6 bg-card/50 backdrop-blur-sm border-primary/20 transition-all ${
                  !feedback.read ? 'border-l-4 border-l-yellow-500' : ''
                } ${feedback.resolved ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Top row with badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge
                        variant={feedback.userRole === 'student' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {feedback.userRole}
                      </Badge>
                      {!feedback.read && (
                        <Badge variant="destructive" className="bg-yellow-600">
                          Unread
                        </Badge>
                      )}
                      {feedback.resolved && (
                        <Badge variant="secondary" className="bg-green-600">
                          Resolved
                        </Badge>
                      )}
                    </div>

                    {/* Subject and User Info */}
                    <h3 className="text-lg font-semibold mb-2 text-foreground">
                      {feedback.subject}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      From: <span className="font-medium">{feedback.userId}</span> • {feedback.date}
                    </p>

                    {/* Message */}
                    <p className="text-foreground mb-4 leading-relaxed">
                      {feedback.message}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 min-w-fit">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRead(feedback.id)}
                      className="justify-start"
                    >
                      {feedback.read ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Mark Unread
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Mark Read
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleResolved(feedback.id)}
                      className="justify-start"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {feedback.resolved ? 'Undo Resolve' : 'Mark Resolved'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteFeedback(feedback.id)}
                      className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
