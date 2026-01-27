'use client';

import React, { useState, useEffect } from "react"
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface FeedbackSubmission {
  id: string;
  userRole: 'student' | 'staff';
  userId: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
  resolved: boolean;
}

export default function FeedbackPage() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'staff' | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>({});

  useEffect(() => {
    // Check if user is logged in
    const type = localStorage.getItem('userType') as 'student' | 'staff' | null;
    const studentId = localStorage.getItem('studentId');
    const staffId = localStorage.getItem('staffId');

    if (!type || (type === 'student' && !studentId) || (type === 'staff' && !staffId)) {
      // Redirect to auth if not logged in
      localStorage.setItem('redirectAfterLogin', '/feedback');
      router.push('/auth');
      return;
    }

    setUserRole(type);
    setUserId(studentId || staffId || '');
  }, [router]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!message.trim()) {
      newErrors.message = 'Message is required';
    }
    if (message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !userRole) return;

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create feedback object
      const newFeedback: FeedbackSubmission = {
        id: 'feedback-' + Date.now(),
        userRole: userRole,
        userId: userId,
        subject: subject,
        message: message,
        date: new Date().toLocaleString('en-IN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        read: false,
        resolved: false,
      };

      // Get existing feedback from localStorage
      const existingFeedback = localStorage.getItem('allFeedback');
      const feedbackList: FeedbackSubmission[] = existingFeedback ? JSON.parse(existingFeedback) : [];

      // Add new feedback
      feedbackList.push(newFeedback);

      // Save back to localStorage
      localStorage.setItem('allFeedback', JSON.stringify(feedbackList));

      console.log('[v0] Feedback submitted and saved:', newFeedback);

      setIsSubmitted(true);

      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      console.error('[v0] Error submitting feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userRole) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
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

  if (isSubmitted) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <Card className="p-8 text-center space-y-6 bg-card/50 backdrop-blur-sm border-primary/20 animate-slideUp max-w-md">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center animate-in zoom-in">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Thank You!</h2>
              <p className="text-muted-foreground">
                Feedback submitted successfully. We appreciate your input and will review it shortly.
              </p>
            </div>
            <div className="pt-4 text-sm text-muted-foreground">
              Redirecting you to home in a few seconds...
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 fade-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-primary/20 smooth-transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Send Us Your Feedback
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Help us improve by sharing your thoughts or suggestions
            </p>
          </div>
        </div>

        {/* Feedback Form Card */}
        <Card className="p-6 md:p-8 bg-card/50 backdrop-blur-sm border-primary/20 slide-up space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Subject</label>
              <Input
                type="text"
                placeholder="What is your feedback about?"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (errors.subject) setErrors({ ...errors, subject: undefined });
                }}
                className={errors.subject ? 'border-red-500 focus:ring-red-500' : ''}
              />
              {errors.subject && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.subject}
                </p>
              )}
            </div>

            {/* Message Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Your Feedback</label>
              <textarea
                placeholder="Share your thoughts, suggestions, or report issues..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errors.message) setErrors({ ...errors, message: undefined });
                }}
                rows={6}
                className={`w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground smooth-transition hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary resize-none ${errors.message ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              <div className="flex justify-between items-center">
                <div>
                  {errors.message && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.message}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {message.length} characters
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 smooth-button bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
              <Link href="/">
                <Button variant="outline" className="smooth-button bg-transparent">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
            <p className="text-sm text-foreground font-medium">How your feedback is used</p>
            <p className="text-sm text-muted-foreground">
              All feedback is securely stored and reviewed by our administration team. Your input helps us continuously improve the platform.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
