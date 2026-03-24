import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Loader2,
  Trash2,
  MessageSquare,
  MessageCircle,
  X,
} from 'lucide-react';
import ChatMessage from '@/components/ui/ChatMessage';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

const STORAGE_KEY = 'faceattend_chat_widget';

const roleTitles = {
  admin: 'Admin AI Assistant',
  teacher: 'Teacher AI Assistant',
  student: 'Student AI Assistant',
};

const starterPromptsByRole = {
  admin: [
    'Weekly attendance review checklist',
    'Identify chronic absenteeism',
    'Principal-ready report template',
  ],
  teacher: [
    'Run attendance faster for a large class',
    'Intervention plan for absent students',
    'Class-start checklist for attendance',
  ],
  student: [
    'Improve my attendance this month',
    'Daily routine for classes & revision',
    'What to do after missing classes?',
  ],
};

const createAssistantWelcome = (name, role) => ({
  id: crypto.randomUUID(),
  role: 'assistant',
  content: `Hello **${name || 'there'}**! 👋 I'm your **${roleTitles[role] || 'AI Assistant'}**. How can I help you today?`,
  timestamp: Date.now(),
});

const FloatingChatWidget = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRequestingSupport, setIsRequestingSupport] = useState(false);
  const [showSupportCta, setShowSupportCta] = useState(false);
  const [showLabel, setShowLabel] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
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

  const starterPrompts = useMemo(
    () => starterPromptsByRole[role] || starterPromptsByRole.student,
    [role]
  );

  // Initialize with user-specific welcome if no saved messages
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setMessages([createAssistantWelcome(user?.name, role)]);
      }
    } catch { /* ignore */ }
  }, [user?.name, role]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch { /* ignore */ }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isSending]);

  // Auto-hide label after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowLabel(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Clear unread when opening
  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  // Auto-resize textarea
  const handleTextareaResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 80)}px`;
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
        content:
          response.data?.reply ||
          'I could not generate a response right now. Please try again.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setShowSupportCta(Boolean(response.data?.escalateRecommended));

      // Increment unread if panel is closed
      if (!isOpen) setUnreadCount((c) => c + 1);

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
      toast.error('Unable to reach AI assistant right now.');
      setShowSupportCta(true);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            'I\'m having trouble connecting. You can retry or click **Connect Admin Support**.',
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

    const latestUserMessage =
      [...messages].reverse().find((item) => item.role === 'user')?.content ||
      input.trim();

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
          content:
            response.data?.message ||
            'Our team will help you on this problem shortly.',
          timestamp: Date.now(),
        },
      ]);
      setShowSupportCta(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not connect admin support right now'
      );
    } finally {
      setIsRequestingSupport(false);
    }
  };

  return (
    <>
      {/* ─── Floating Bubble ─── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2"
          >
            {/* "We Are Here!" label */}
            <AnimatePresence>
              {showLabel && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex items-center gap-1.5 mr-1"
                >
                  <span className="animate-wave inline-block text-2xl origin-[70%_70%]">
                    👋
                  </span>
                  <span className="font-display font-bold text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-primary-500 to-cyan-400 animate-float whitespace-nowrap italic tracking-wide">
                    We Are Here!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat bubble button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setIsOpen(true);
                setShowLabel(false);
              }}
              className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-primary-600 text-white shadow-xl shadow-purple-500/30 flex items-center justify-center hover:shadow-purple-500/50 transition-shadow duration-300"
            >
              <MessageCircle className="w-6 h-6" />

              {/* Unread badge */}
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Chat Panel ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-[9999] w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-black/40 border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
            style={{ height: '520px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-primary-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold leading-tight">
                    {roleTitle}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[11px] text-white/70">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetConversation}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  title="Clear chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Support CTA bar */}
            {showSupportCta && (
              <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2 flex-shrink-0">
                <p className="text-xs text-amber-900 dark:text-amber-200 leading-tight">
                  Need human help?
                </p>
                <button
                  onClick={handleConnectSupport}
                  disabled={isRequestingSupport}
                  className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline whitespace-nowrap flex items-center gap-1"
                >
                  {isRequestingSupport ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <MessageSquare className="w-3 h-3" />
                  )}
                  Connect Support
                </button>
              </div>
            )}

            {/* Message list */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 px-3 py-3 space-y-3 scrollbar-thin"
            >
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    <ChatMessage message={message} compact />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isSending && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs">Thinking...</span>
                  </div>
                </motion.div>
              )}

              {/* Starter prompts */}
              {messages.length <= 1 && (
                <div className="pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Try asking
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {starterPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => sendMessage(prompt)}
                        className="text-left text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 flex-shrink-0">
              <div className="flex items-end gap-2">
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
                  placeholder="Type a message..."
                  className="w-full resize-none rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isSending}
                  maxLength={1500}
                  style={{ minHeight: '36px' }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage()}
                  disabled={isSending || !input.trim()}
                  className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-primary-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-500/20 hover:shadow-purple-500/40 transition-shadow"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatWidget;
