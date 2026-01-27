'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, X, Copy, Check, Minimize2, Maximize2 } from 'lucide-react';
import {
  generateAIResponse,
  simulateAIDelay,
  type AcademicYear,
} from '@/lib/data';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  codeBlock?: {
    language: string;
    code: string;
  };
}

interface AIChatProps {
  academicYear?: AcademicYear;
  autoMaximize?: boolean;
}

type ChatSize = 'minimized' | 'normal' | 'maximized';

interface Feedback {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function AIChat({ academicYear = '1st', autoMaximize = false }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI Problem Solver for ${academicYear} year students. I can help you with project ideas, complete working code examples, debugging help, and best practices. What would you like help with?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(autoMaximize);
  const [chatSize, setChatSize] = useState<ChatSize>(autoMaximize ? 'maximized' : 'normal');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({
      id: Date.now().toString(),
      type,
      message,
    });
  };

  const handleSend = async () => {
    if (!input.trim()) {
      showFeedback('info', 'Please type a question first');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    showFeedback('info', 'AI is thinking...');

    // Simulate AI delay and generate response
    await simulateAIDelay();

    const aiResponse = generateAIResponse(academicYear, input);
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
    showFeedback('success', 'Response generated successfully!');
  };

  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    showFeedback('success', 'Code copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickSuggestions = [
    { title: 'Give me complete working code', icon: '📝' },
    { title: 'How to debug errors', icon: '🐛' },
    { title: 'Project ideas for my year', icon: '💡' },
  ];

  const sizeClasses = {
    minimized: 'max-h-20',
    normal: 'max-h-96',
    maximized: 'max-h-screen',
  };

  return (
    <div className="space-y-4">
      {/* Feedback Notification */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg smooth-transition transform origin-top-right animate-in fade-in slide-in-from-right-2 duration-300 z-50 ${
            feedback.type === 'success'
              ? 'bg-green-500/20 border border-green-500/50 text-green-700'
              : feedback.type === 'error'
                ? 'bg-red-500/20 border border-red-500/50 text-red-700'
                : 'bg-blue-500/20 border border-blue-500/50 text-blue-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' && <Check className="w-4 h-4" />}
            {feedback.type === 'error' && <X className="w-4 h-4" />}
            {feedback.type === 'info' && <Loader2 className="w-4 h-4 animate-spin" />}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
        </div>
      )}

      {!isOpen ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickSuggestions.map((suggestion) => (
            <Button
              key={suggestion.title}
              variant="outline"
              className="justify-start h-auto py-3 smooth-button hover:bg-accent/10 group bg-transparent"
              onClick={() => {
                setInput(suggestion.title);
                setIsOpen(true);
              }}
            >
              <span className="mr-2 text-lg group-hover:scale-125 smooth-transition">
                {suggestion.icon}
              </span>
              <span className="text-left text-sm">{suggestion.title}</span>
            </Button>
          ))}
        </div>
      ) : (
        <Card className={`space-y-4 bg-card/50 backdrop-blur-sm border-primary/20 smooth-transition ${chatSize === 'minimized' ? 'p-3' : 'p-4'}`}>
          <div className="flex justify-between items-center pb-2 border-b">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="font-semibold text-primary text-sm md:text-base">
                AI Problem Solver {chatSize !== 'minimized' && `- ${academicYear} Year`}
              </h3>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setChatSize(chatSize === 'minimized' ? 'normal' : 'minimized')}
                className="smooth-transition hover:bg-primary/20"
                title={chatSize === 'minimized' ? 'Maximize' : 'Minimize'}
              >
                {chatSize === 'minimized' ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setChatSize(chatSize === 'maximized' ? 'normal' : 'maximized')}
                className="smooth-transition hover:bg-primary/20"
                title={chatSize === 'maximized' ? 'Restore' : 'Fullscreen'}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false);
                  setChatSize('normal');
                }}
                className="smooth-transition hover:bg-red-500/20 text-red-500 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {chatSize !== 'minimized' && (
            <>
              <ScrollArea className={`pr-4 smooth-transition ${sizeClasses[chatSize]}`}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 animate-fadeIn ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-md px-4 py-3 rounded-lg smooth-transition ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-none shadow-lg'
                            : 'bg-secondary text-secondary-foreground rounded-bl-none'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content.split('\n').map((line, idx) => {
                            if (line.includes('```')) return null;
                            return (
                              <p key={idx} className="mb-2">
                                {line}
                              </p>
                            );
                          })}
                        </div>

                        {/* Code block display */}
                        {message.content.includes('```') && (
                          <div className="mt-3 bg-black/30 rounded p-3 text-xs font-mono border border-white/10">
                            {message.content
                              .split('```')
                              .filter((block, idx) => idx % 2 === 1)
                              .map((codeBlock, idx) => {
                                const lines = codeBlock.trim().split('\n');
                                const language = lines[0] || 'code';
                                const code = lines.slice(1).join('\n');
                                return (
                                  <div
                                    key={idx}
                                    className="relative group"
                                  >
                                    <div className="flex justify-between items-center mb-2 opacity-75">
                                      <span className="text-xs text-white/70 font-semibold">
                                        {language.toUpperCase()}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 smooth-transition hover:bg-white/20"
                                        onClick={() =>
                                          copyToClipboard(code, message.id)
                                        }
                                      >
                                        {copiedId === message.id ? (
                                          <Check className="w-3 h-3 text-green-400" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </Button>
                                    </div>
                                    <pre className="overflow-x-auto text-white/90">
                                      <code>{code}</code>
                                    </pre>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start gap-2 items-center">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-secondary-foreground" />
                      </div>
                      <span className="text-xs text-secondary-foreground animate-pulse">
                        AI is thinking...
                      </span>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="flex gap-2 border-t pt-3">
                <Input
                  placeholder="Ask about code, debugging, or project ideas..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                  className="smooth-transition"
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="smooth-button bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </>
          )}

          {chatSize === 'minimized' && (
            <div className="text-xs text-muted-foreground text-center py-1">
              Click maximize to start chatting
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
