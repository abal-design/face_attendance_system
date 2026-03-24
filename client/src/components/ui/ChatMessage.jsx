import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check } from 'lucide-react';

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const ChatMessage = ({ message, compact = false }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API might fail silently
    }
  };

  const iconSize = compact ? 'w-5 h-5' : 'w-6 h-6';
  const innerIconSize = compact ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const labelSize = compact ? 'text-[11px]' : 'text-xs';
  const textSize = compact ? 'text-[13px]' : 'text-sm';
  const padClass = compact ? 'px-3 py-2.5' : 'px-4 py-3';
  const maxWidthClass = compact ? 'max-w-[85%]' : 'max-w-[85%] sm:max-w-[72%]';

  return (
    <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`${maxWidthClass} rounded-2xl ${padClass} shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-purple-600 to-primary-600 text-white rounded-br-md'
            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md border border-slate-200 dark:border-slate-700'
        }`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5">
            <div
              className={`${iconSize} rounded-full flex items-center justify-center ${
                isUser
                  ? 'bg-white/20'
                  : 'bg-primary-100 dark:bg-primary-900/30'
              }`}
            >
              {isUser ? (
                <User className={innerIconSize} />
              ) : (
                <Bot className={`${innerIconSize} text-primary-600 dark:text-primary-400`} />
              )}
            </div>
            <span
              className={`${labelSize} font-semibold ${
                isUser ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {isUser ? 'You' : 'AI Assistant'}
            </span>
            {message.timestamp && (
              <span
                className={`${labelSize} ${
                  isUser ? 'text-white/40' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                · {formatTime(message.timestamp)}
              </span>
            )}
          </div>

          {/* Copy button (assistant only) */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              title={copied ? 'Copied!' : 'Copy message'}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          )}
        </div>

        {/* Message content */}
        {isUser ? (
          <p className={`${textSize} leading-relaxed whitespace-pre-wrap`}>
            {message.content}
          </p>
        ) : (
          <div className={`${textSize} leading-relaxed chat-markdown`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                h1: ({ children }) => <h4 className="font-bold text-base mb-1 mt-2 first:mt-0">{children}</h4>,
                h2: ({ children }) => <h5 className="font-bold text-sm mb-1 mt-2 first:mt-0">{children}</h5>,
                h3: ({ children }) => <h6 className="font-semibold text-sm mb-1 mt-1.5 first:mt-0">{children}</h6>,
                code: ({ inline, children }) =>
                  inline ? (
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[12px] font-mono">
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 overflow-x-auto mb-2 text-[12px] font-mono">
                      <code>{children}</code>
                    </pre>
                  ),
                a: ({ href, children }) => (
                  <a href={href} className="text-primary-500 hover:underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-3 border-primary-400 pl-3 italic text-slate-600 dark:text-slate-400 mb-2">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
