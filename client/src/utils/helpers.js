import clsx from 'clsx';

export const cn = (...inputs) => {
  return clsx(inputs);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const formatTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return formatDate(date);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Generate a unique user ID with a role prefix.
 * @param {'STU'|'TCH'} prefix - Role prefix
 * @returns {string} e.g. "STU-2026-4A7F"
 */
export const generateUserId = (prefix = 'STU') => {
  const year = new Date().getFullYear();
  const hex = Math.random().toString(16).substring(2, 6).toUpperCase();
  return `${prefix}-${year}-${hex}`;
};

/**
 * Generate a random secure-looking password.
 * @returns {string} 12-char password with mixed case, digits, and symbols
 */
export const generatePassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@#$&!';
  const all = upper + lower + digits + symbols;

  // Ensure at least one of each category
  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 4; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Simulate sending credentials to a user's email.
 * In production, replace with actual email API call.
 */
export const sendCredentialsEmail = (email, userId, password, role) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[Email Sent] To: ${email} | ID: ${userId} | Role: ${role}`);
      resolve({ success: true });
    }, 1000);
  });
};
