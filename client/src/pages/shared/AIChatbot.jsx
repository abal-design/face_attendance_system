import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Loader2,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ChatMessage from '@/components/ui/ChatMessage';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

const STORAGE_KEY = 'faceattend_chat_fullpage';

const roleTitles = {
  admin: 'Admin AI Assistant',
  teacher: 'Teacher AI Assistant',
  student: 'Student AI Assistant',
};

const roleDescriptions = {
  admin: 'Ask about school analytics, policy decisions, and team-level attendance actions.',
  teacher: 'Ask about attendance workflow, classroom planning, and report writing.',
  student: 'Ask about attendance improvement, study routine, and schedule planning.',
};

const starterPromptsByRole = {
  admin: [
    'Give me a weekly attendance review checklist for all departments.',
    'How should I identify classes with chronic absenteeism?',
    'Create a short principal-ready report template for attendance.',
  ],
  teacher: [
    'How can I run attendance faster for a large class?',
    'Draft an intervention plan for students with frequent absence.',
    'Give me a class-start checklist before activating attendance.',
  ],
  student: [
    'Help me improve my attendance this month.',
    'Create a daily routine for classes and revision.',
    'What should I do after missing two classes?',
  ],
};

const createAssistantWelcome = (name, role) => ({
  id: crypto.randomUUID(),
  role: 'assistant',
  content: `Hello **${name || 'there'}**! 👋 I'm your **${roleTitles[role] || 'AI Assistant'}**.\n\nI can help with attendance, schedules, reports, and workflow tips. Ask me anything, or pick a starter prompt below!`,
  timestamp: Date.now(),
});

const AIChatbot = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRequestingSupport, setIsRequestingSupport] = useState(false);
  const [showSupportCta, setShowSupportCta] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return [createAssistantWelcome('', 'student')];
  });

  const listRef = useRef(null);
  const textareaRef = useRef(null);

  const role = user?.role || 'student';
  const roleTitle = roleTitles[role] || 'AI Assistant';
  const roleDescription = roleDescriptions[role] || roleDescriptions.student;

  const starterPrompts = useMemo(() => starterPromptsByRole[role] || starterPromptsByRole.student, [role]);

  // Initialize with user-specific welcome if no saved messages
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setMessages([createAssistantWelcome(user?.name, role)]);
      }
    } catch { /* ignore */ }
  }, [user?.name, role]);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch { /* ignore */ }
  }, [messages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isSending]);

  // Auto-resize textarea
  const handleTextareaResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  const sendMessage = async (rawMessage) => {
    const text = String(rawMessage || input).trim();

    if (!text || isSending) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const history = nextMessages.slice(-12).map((item) => ({
        role: item.role,
        content: item.content,
      }));

      const response = await api.post('/chat/ask', {
        message: text,
        history,
      });

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.data?.reply || 'I could not generate a response right now. Please try again.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setShowSupportCta(Boolean(response.data?.escalateRecommended));

      if (response.data?.supportHint) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.data.supportHint,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch {
      toast.error('Unable to reach AI assistant right now. Please try again.');
      setShowSupportCta(true);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'I\'m having trouble connecting right now. You can retry, or click **Connect Admin Support** and our team will help you directly.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const resetConversation = () => {
    setMessages([createAssistantWelcome(user?.name, role)]);
    setInput('');
    setShowSupportCta(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  const handleConnectSupport = async () => {
    if (isRequestingSupport) return;

    const latestUserMessage = [...messages].reverse().find((item) => item.role === 'user')?.content || input.trim();

    setIsRequestingSupport(true);
    try {
      const response = await api.post('/chat/support', {
        issue: latestUserMessage,
      });

      toast.success('Admin support request sent');
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.data?.message || 'Our team will help you on this problem shortly.',
          timestamp: Date.now(),
        },
      ]);
      setShowSupportCta(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not connect admin support right now');
    } finally {
      setIsRequestingSupport(false);
    }
  };

  const charCount = input.length;
  const showCharCount = charCount > 1200;

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-primary-700 text-white border-b-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">{roleTitle}</h1>
                <p className="text-primary-100 text-sm mt-1">{roleDescription}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={resetConversation}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Clear
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          {showSupportCta && (
            <div className="px-4 md:px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                Need human help? Connect directly to admin support.
              </p>
              <Button
                variant="secondary"
                className="sm:whitespace-nowrap"
                onClick={handleConnectSupport}
                loading={isRequestingSupport}
                icon={<MessageSquare className="w-4 h-4" />}
              >
                Connect Admin Support
              </Button>
            </div>
          )}

          <div
            ref={listRef}
            className="h-[62vh] overflow-y-auto bg-slate-50 dark:bg-slate-900 px-4 md:px-6 py-5 space-y-4 scrollbar-thin"
          >
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ChatMessage message={message} />
                </motion.div>
              ))}
            </AnimatePresence>

            {isSending && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </motion.div>
            )}

            {messages.length <= 1 && (
              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Try a starter prompt
                </p>
                <div className="flex flex-wrap gap-2">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="text-left text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 md:p-5">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    handleTextareaResize();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your message... Press Enter to send, Shift+Enter for new line"
                  className="w-full resize-none rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isSending}
                  maxLength={1500}
                  style={{ minHeight: '46px' }}
                />
                {showCharCount && (
                  <span className={`absolute right-3 bottom-1.5 text-[10px] ${charCount >= 1400 ? 'text-danger-500' : 'text-slate-400'}`}>
                    {charCount}/1500
                  </span>
                )}
              </div>
              <Button
                variant="primary"
                onClick={() => sendMessage()}
                disabled={isSending || !input.trim()}
                className="h-[46px] bg-gradient-to-r from-purple-600 to-primary-600 hover:from-purple-700 hover:to-primary-700"
                icon={isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              >
                Send
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default AIChatbot;
