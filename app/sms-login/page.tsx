'use client';

import React from "react"

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Building2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function SMSLoginPage() {
  const [activeTab, setActiveTab] = useState('student');
  const [studentId, setStudentId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate login delay
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setPassword('');
        setStudentId('');
        setStaffId('');
        setAdminId('');
      }, 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative blurs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-32 -translate-y-32" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-32 translate-y-32" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <Link href="/college">
          <Button variant="ghost" size="sm" className="mb-8 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to College
          </Button>
        </Link>

        {/* Main Login Card - Glassmorphism */}
        <Card className="backdrop-blur-xl bg-white/20 border-white/30 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/50 to-secondary/50 backdrop-blur-sm px-8 py-6 text-white border-b border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-6 h-6" />
              <h1 className="text-2xl font-bold">Student Management System</h1>
            </div>
            <p className="text-sm opacity-90">Sir C.R. Reddy College of Engineering</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 px-8 pt-6 border-b border-white/20">
            {[
              { id: 'student', label: 'Student', icon: '👨‍🎓' },
              { id: 'staff', label: 'Staff', icon: '👨‍🏫' },
              { id: 'admin', label: 'Admin', icon: '⚙️' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSubmitted(false);
                  setPassword('');
                }}
                className={`px-6 py-3 font-medium transition-all duration-300 flex items-center gap-2 relative ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t" />
                )}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="px-8 py-8">
            {submitted ? (
              // Success Message
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-green-500/30 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Login Successful!</h3>
                <p className="text-white/80">Redirecting to dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
                {/* ID Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90">
                    {activeTab === 'student' && 'Student ID'}
                    {activeTab === 'staff' && 'Staff ID'}
                    {activeTab === 'admin' && 'Admin ID'}
                  </label>
                  <Input
                    type="text"
                    placeholder={
                      activeTab === 'student' ? 'e.g., CSE2024001'
                      : activeTab === 'staff' ? 'e.g., STAFF001'
                      : 'e.g., ADMIN001'
                    }
                    value={
                      activeTab === 'student' ? studentId
                      : activeTab === 'staff' ? staffId
                      : adminId
                    }
                    onChange={(e) => {
                      if (activeTab === 'student') setStudentId(e.target.value);
                      else if (activeTab === 'staff') setStaffId(e.target.value);
                      else setAdminId(e.target.value);
                    }}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50 backdrop-blur-sm"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50 backdrop-blur-sm pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white/90"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <a href="#" className="text-sm text-white/80 hover:text-white transition-colors">
                    Forgot Password?
                  </a>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-primary hover:bg-white/90 font-semibold py-3 rounded-lg transition-all duration-300"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Logging in...
                    </div>
                  ) : (
                    `Login as ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Footer Info */}
          {!submitted && (
            <div className="px-8 py-4 bg-white/10 border-t border-white/20 text-center text-sm text-white/70">
              <p>For support, contact: <strong>support@srcrce.ac.in</strong></p>
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="mt-6 backdrop-blur-xl bg-white/10 border-white/20 p-6">
          <h3 className="text-white font-semibold mb-3">Demo Credentials</h3>
          <div className="space-y-2 text-sm text-white/80">
            <p><strong>Student:</strong> CSE2024001 / password123</p>
            <p><strong>Staff:</strong> STAFF001 / password123</p>
            <p><strong>Admin:</strong> ADMIN001 / password123</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
