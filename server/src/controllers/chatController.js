import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import env from '../config/env.js';
import { sendSuccess } from '../utils/response.js';
import { Notification, User } from '../models/index.js';

const MAX_MESSAGE_LENGTH = 1500;
const MAX_HISTORY_MESSAGES = 12;

/* ─── Role context ─── */

const roleContext = {
  admin:
    'You support an administrator who oversees the entire institution — managing students, teachers, departments, attendance analytics, system settings, and report generation.',
  teacher:
    'You support a teacher who marks attendance (including AI face-recognition mode), manages class rosters, generates reports, and plans schedules.',
  student:
    'You support a student who views their attendance records, tracks performance trends, and builds study/class routines.',
};

const roleCapabilities = {
  admin: [
    'View system-wide dashboards with attendance trends',
    'Manage students: add, edit, import via CSV, deactivate',
    'Manage teachers: assign to departments and classes',
    'Manage departments and class sections',
    'View analytics: department-wise, class-wise, teacher-wise attendance',
    'Generate and export reports (PDF/CSV)',
    'Receive AI-escalated support requests from users',
    'Configure system settings',
  ],
  teacher: [
    'Mark attendance manually or via AI face-recognition camera',
    'View class rosters and student details',
    'Generate class-level attendance reports',
    'Manage weekly schedule / timetable',
    'View dashboard with class attendance summaries',
    'Ask AI for classroom workflow help',
  ],
  student: [
    'View personal attendance dashboard (overall %, classes attended, absent days)',
    'View attendance history with date-wise records',
    'See monthly performance trends',
    'Ask AI for study planning and attendance improvement tips',
    'View profile and update settings',
  ],
};

/* ─── Helpers ─── */

const sanitizeHistory = (history = []) => {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
    .map((item) => ({
      role: item.role,
      content: String(item.content || '').slice(0, MAX_MESSAGE_LENGTH),
    }))
    .filter((item) => item.content.trim().length > 0)
    .slice(-MAX_HISTORY_MESSAGES);
};

const normalizeText = (text = '') =>
  String(text).toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

const getLastAssistantMessage = (history = []) => {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i]?.role === 'assistant') return history[i].content;
  }
  return '';
};

const isNearDuplicateReply = (next = '', prev = '') => {
  if (!next || !prev) return false;
  const a = normalizeText(next);
  const b = normalizeText(prev);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
};

const shouldEscalateByMessage = (message = '') => {
  const normalized = normalizeText(message);
  const signals = [
    'not working', 'cant solve', 'cannot solve', 'need admin', 'need human',
    'talk to admin', 'connect admin', 'support', 'problem not solved',
    'issue not solved', 'bug', 'error keeps', 'still broken',
  ];
  return signals.some((s) => normalized.includes(s));
};

const isUncertainReply = (reply = '') => {
  const normalized = normalizeText(reply);
  const patterns = ['i cant', 'i cannot', 'not sure', 'unable to', 'do not know', 'dont know'];
  return patterns.some((p) => normalized.includes(p));
};

const buildAlternativeFollowUp = (role = 'student') => {
  if (role === 'admin') {
    return '💡 **Tip:** Share the specific metric, time range, and department so I can give a concrete action plan.';
  }
  if (role === 'teacher') {
    return '💡 **Tip:** Tell me the class, section, and the exact step that failed — I\'ll give a precise fix.';
  }
  return '💡 **Tip:** Share your class context and exact difficulty so I can build a personalized plan.';
};

/* ─── System prompt builder ─── */

const buildSystemPrompt = (user) => {
  const role = user?.role || 'student';
  const roleLine = roleContext[role] || roleContext.student;
  const capabilities = roleCapabilities[role] || roleCapabilities.student;
  const now = new Date().toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  return [
    '# FaceAttend AI Assistant',
    '',
    'You are the built-in AI assistant for **FaceAttend**, an AI-powered school attendance management platform with face-recognition technology.',
    '',
    `## Role Context`,
    roleLine,
    '',
    `## Current User`,
    `- **Name:** ${user?.name || 'User'}`,
    `- **Role:** ${role}`,
    `- **Date/Time:** ${now}`,
    '',
    `## Platform Capabilities (${role})`,
    ...capabilities.map((c) => `- ${c}`),
    '',
    '## Response Guidelines',
    '- Format responses with **markdown**: use bold, bullet points, numbered steps, and headers when helpful.',
    '- Be **concise but thorough** — aim for 2-4 short paragraphs or a focused step list.',
    '- Give **actionable, practical advice** with clear next steps.',
    '- When explaining workflows, use numbered steps.',
    '- If the user seems frustrated, acknowledge it and offer a clear path forward.',
    '- For questions outside of education/attendance, still help briefly and politely.',
    '- Never fabricate data or statistics — say "I don\'t have access to live data" and suggest where to find it in the platform.',
    '- Use emoji sparingly for friendliness (✅, 📊, 📝, etc.).',
  ].join('\n');
};

/* ─── Smart fallback engine ─── */

const fallbackTopics = [
  {
    keywords: ['attendance', 'absent', 'present', 'mark attendance', 'take attendance'],
    replies: {
      admin: `📊 **Attendance Management (Admin)**\n\nHere's how to oversee attendance:\n\n1. **Dashboard** → View system-wide attendance rates by department\n2. **Analytics** → Drill into class-wise and teacher-wise breakdowns\n3. **Reports** → Generate and export attendance reports (PDF/CSV)\n4. **Alerts** → Look for classes with **<75% attendance** — they need intervention\n\n💡 Want me to help you create a weekly attendance review checklist?`,
      teacher: `✅ **Marking Attendance**\n\nTwo ways to mark attendance:\n\n1. **Manual Mode** → Select class → Pick date → Check students present\n2. **Face Recognition** → Click camera icon → System auto-identifies students\n\n**Quick tips:**\n- Verify your class roster is up-to-date before marking\n- Face mode works best with good lighting\n- You can edit past records from the attendance history\n\nNeed help with a specific step?`,
      student: `📝 **Your Attendance**\n\nHere's how to track and improve your attendance:\n\n1. **Dashboard** → See your overall attendance %, classes attended, and absent days\n2. **My Attendance** → View date-wise attendance records\n3. **History** → Check monthly trends and patterns\n\n**Improvement tips:**\n- Set a daily alarm 30 minutes before your first class\n- Aim for **90%+** attendance for best academic results\n- If you missed classes, talk to your teacher about make-up options\n\nWant a personalized attendance improvement plan?`,
    },
  },
  {
    keywords: ['report', 'export', 'pdf', 'csv', 'download', 'analytics'],
    replies: {
      admin: `📊 **Reports & Analytics**\n\nYou can generate comprehensive reports:\n\n1. Go to **Reports** section in the sidebar\n2. Select **date range**, **department**, and **class**\n3. Choose export format: **PDF** or **CSV**\n\n**Key metrics to track:**\n- Department-wise attendance averages\n- Month-over-month trends\n- Individual students with <75% attendance\n- Teacher compliance rates\n\nWant me to suggest a report template?`,
      teacher: `📝 **Class Reports**\n\nTo generate your class report:\n\n1. Navigate to **Reports** in the sidebar\n2. Select your **class and section**\n3. Choose **date range** for the report\n4. Click **Generate** → Download as PDF or CSV\n\n**Useful report types:**\n- Weekly class summary\n- Individual student attendance cards\n- Trend analysis (which days have lowest attendance)\n\nNeed help interpreting your data?`,
      student: `📊 **Your Attendance Reports**\n\nYou can view your attendance data:\n\n1. **Dashboard** → Quick overview with this month's stats\n2. **My Attendance** → Detailed calendar view\n3. **History** → Filterable date-wise records\n\n**Reading your stats:**\n- **Green** = Present days\n- **Red** = Absent days\n- Track your **monthly trend** to spot patterns\n\nWant tips on how to improve your numbers?`,
    },
  },
  {
    keywords: ['face', 'recognition', 'camera', 'photo', 'detect', 'scan'],
    replies: {
      admin: `🤖 **Face Recognition System**\n\nThe AI face-recognition feature allows automated attendance:\n\n- Teachers activate camera mode from the attendance screen\n- System identifies students from enrolled face data\n- Matches are logged as present automatically\n\n**Admin actions:**\n- Ensure student photos are uploaded and up-to-date\n- Monitor recognition accuracy in analytics\n- Address any misidentification reports from teachers`,
      teacher: `📸 **Face Recognition Attendance**\n\nTo use AI face-recognition:\n\n1. Go to **Mark Attendance**\n2. Select your **class and date**\n3. Click the **camera icon** to activate face mode\n4. Point the camera at students — system identifies them automatically\n5. Review results and **confirm** the attendance\n\n**Tips for best results:**\n- Ensure good lighting (natural light is best)\n- Ask students to face the camera briefly\n- You can manually correct any mismatches\n\nHaving trouble with face detection?`,
      student: `📸 **Face Recognition**\n\nYour teacher uses AI face-recognition to mark attendance automatically:\n\n- Make sure your **profile photo** is clear and up-to-date\n- When the camera is active, **face it briefly** so the system can identify you\n- If the system doesn't recognize you, your teacher can mark you manually\n\n**Tips:** Good lighting and facing the camera directly help with accuracy.`,
    },
  },
  {
    keywords: ['schedule', 'timetable', 'class time', 'weekly', 'routine'],
    replies: {
      admin: `🗓️ **Schedule Management**\n\nSchedules are managed at the teacher/class level:\n\n1. Teachers set up their weekly timetable\n2. Students see their class schedule based on enrollment\n3. Attendance windows align with scheduled class times\n\n**Admin oversight:**\n- Review schedule conflicts across departments\n- Ensure coverage for all class sections\n- Monitor teacher schedule compliance`,
      teacher: `🗓️ **Your Schedule**\n\nManage your weekly timetable:\n\n1. Go to **Schedule** in the sidebar\n2. **Add/edit** class slots for each day of the week\n3. Set **start and end times** for each session\n\n**Tips:**\n- Keep your schedule current — it affects attendance windows\n- Add buffer time between classes\n- Mark any cancelled sessions\n\nNeed help planning your weekly routine?`,
      student: `🗓️ **Class Schedule & Routine**\n\nTo build a great daily routine:\n\n1. **Check your class schedule** for fixed time slots\n2. **Block study time** around your classes (30-60 min sessions)\n3. **Add preparation buffers** — be ready 10 min before each class\n\n**Sample routine:**\n- ☀️ Morning: Review yesterday's notes\n- 📚 Between classes: Quick revision\n- 🌙 Evening: Homework + next-day prep\n\nWant me to create a customized schedule for you?`,
    },
  },
  {
    keywords: ['student', 'students', 'manage student', 'add student', 'import'],
    replies: {
      admin: `👨‍🎓 **Student Management**\n\nYou can manage students from the **Students** section:\n\n1. **Add individually** → Fill in name, email, department, class\n2. **Bulk import** → Upload a CSV file with student data\n3. **Edit/Deactivate** → Update details or deactivate inactive students\n\n**CSV Import format:**\n\`Name, Email, Department, Class, Section\`\n\nNeed help with the import process?`,
      teacher: `👨‍🎓 **Your Students**\n\nView and manage your class students:\n\n1. Go to **My Students** in the sidebar\n2. See the full roster for each class\n3. View individual student attendance stats\n\n**Quick actions:**\n- Check student attendance percentage\n- Identify students who need intervention\n- View contact details for follow-up`,
      student: `👤 **Your Profile**\n\nYou can manage your profile from **Settings**:\n\n- Update your display name and contact info\n- Upload/update your **profile photo** (used for face recognition)\n- View your department and class information\n\nNeed to update something specific?`,
    },
  },
  {
    keywords: ['teacher', 'teachers', 'manage teacher', 'assign'],
    replies: {
      admin: `👩‍🏫 **Teacher Management**\n\nManage teachers from the **Teachers** section:\n\n1. **Add** new teachers with their details\n2. **Assign** teachers to departments and classes\n3. **View** their attendance marking activity\n4. **Edit/Deactivate** as needed\n\n**Best practices:**\n- Assign teachers to classes before the term starts\n- Review teacher attendance compliance monthly\n- Ensure backup teacher assignments for coverage`,
      teacher: `👩‍🏫 **Your Teaching Profile**\n\nYour profile includes:\n- Assigned classes and sections\n- Department affiliation\n- Schedule and timetable\n\nGo to **Settings** to update your personal information. For class assignment changes, contact your admin.`,
      student: `👩‍🏫 **Your Teachers**\n\nYou can see your teachers' information through your class details. If you need to contact a teacher about attendance or schedule issues, check with your department admin.`,
    },
  },
  {
    keywords: ['department', 'departments', 'section', 'class section'],
    replies: {
      admin: `🏢 **Department Management**\n\nManage departments from the **Departments** section:\n\n1. **Create** departments (e.g., Computer Science, Mathematics)\n2. **Add classes/sections** under each department\n3. **Assign** teachers and students\n4. **View** department-level analytics\n\n**Tips:**\n- Keep naming consistent (e.g., "CS-A", "CS-B")\n- Review department attendance trends monthly\n- Compare department performance in analytics`,
      teacher: `🏢 **Your Department**\n\nYou're assigned to a department with specific classes. View your department info in your profile. For changes, contact your admin.\n\n**From your dashboard,** you can see attendance trends for your assigned classes within the department.`,
      student: `🏢 **Your Department**\n\nYour department and class section determine your schedule and attendance tracking. This info is visible on your profile dashboard.\n\nIf your department info seems incorrect, contact your teacher or admin.`,
    },
  },
  {
    keywords: ['setting', 'settings', 'configure', 'preference', 'theme', 'dark mode', 'notification'],
    replies: {
      admin: `⚙️ **System Settings**\n\nConfigure the platform from **Settings**:\n\n- **General** → System name, timezone, academic year\n- **Notifications** → Configure alert thresholds\n- **Security** → Password policies, session timeout\n\nThese settings apply system-wide.`,
      teacher: `⚙️ **Your Settings**\n\nCustomize your experience in **Settings**:\n\n- **Profile** → Update name, email, and photo\n- **Notifications** → Choose which alerts you receive\n- **Theme** → Toggle dark/light mode (click the moon icon in the navbar)\n\nNeed to change something specific?`,
      student: `⚙️ **Your Settings**\n\nCustomize your experience in **Settings**:\n\n- **Profile** → Update your name and photo\n- **Notifications** → Manage your alert preferences\n- **Theme** → Toggle dark/light mode from the navbar\n\nNeed help with a specific setting?`,
    },
  },
  {
    keywords: ['dashboard', 'home', 'overview', 'stats', 'summary'],
    replies: {
      admin: `📊 **Admin Dashboard**\n\nYour dashboard shows:\n\n- **Total students, teachers, departments** at a glance\n- **System-wide attendance rate** (current month)\n- **Recent activity** and alerts\n- **Quick links** to common actions\n\nUse the dashboard as your daily starting point — check for any departments below target attendance.`,
      teacher: `📊 **Teacher Dashboard**\n\nYour dashboard displays:\n\n- **Today's classes** and attendance status\n- **Class-wise attendance rates**\n- **Recent attendance records**\n- **Quick action** to mark attendance\n\nStart each day here to see which classes need attendance.`,
      student: `📊 **Your Dashboard**\n\nYour dashboard shows:\n\n- **Overall attendance %** — aim for 90%+\n- **Classes attended** vs **total classes**\n- **Absent days** count\n- **Monthly trend** chart\n\nCheck your dashboard daily to stay on track!`,
    },
  },
  {
    keywords: ['password', 'login', 'forgot', 'reset', 'access', 'account'],
    replies: {
      admin: `🔐 **Account & Access**\n\nFor password/account issues:\n\n- You can reset user passwords from the user management screens\n- Check that the user's account is **active** (not deactivated)\n- Verify their role and permissions\n\nFor your own password, go to **Settings → Security**.`,
      teacher: `🔐 **Account & Access**\n\nIf you're having login issues:\n\n1. Make sure you're using the correct email\n2. Try resetting your password from the login page\n3. Contact your admin if the issue persists\n\nTo change your password: **Settings → Security → Change Password**`,
      student: `🔐 **Account & Access**\n\nIf you're having trouble logging in:\n\n1. Double-check your **email and password**\n2. Use the **"Forgot Password"** link on the login page\n3. If still stuck, ask your teacher or admin for help\n\nTo change your password: **Settings → Security**`,
    },
  },
  {
    keywords: ['notification', 'alert', 'bell', 'notify', 'message'],
    replies: {
      admin: `🔔 **Notifications**\n\nAs an admin, you receive:\n\n- **Support requests** from users (via AI chat escalation)\n- **Low attendance alerts** for classes below threshold\n- **System alerts** for important events\n\nManage notification preferences in **Settings → Notifications**. Click the bell icon in the navbar to see recent notifications.`,
      teacher: `🔔 **Notifications**\n\nYou'll receive notifications for:\n\n- **Schedule reminders** for upcoming classes\n- **Attendance alerts** for unmarked sessions\n- **Admin announcements**\n\nClick the **bell icon** in the top navbar to view them. Manage preferences in **Settings**.`,
      student: `🔔 **Notifications**\n\nYou'll receive notifications about:\n\n- **Attendance updates** when marked\n- **Important announcements** from teachers/admin\n\nClick the **bell icon** in the top navbar to check them.`,
    },
  },
  {
    keywords: ['help', 'how to', 'guide', 'tutorial', 'what can you do', 'features'],
    replies: {
      admin: `🤖 **I can help you with:**\n\n- 📊 **Analytics** — Understanding attendance data and trends\n- 👥 **Management** — Students, teachers, departments\n- 📝 **Reports** — Generating and exporting data\n- ⚙️ **Settings** — System configuration\n- 🔔 **Alerts** — Setting up attendance thresholds\n- 📸 **Face Recognition** — Troubleshooting AI attendance\n\nJust ask about any topic — I'll give you step-by-step guidance!`,
      teacher: `🤖 **I can help you with:**\n\n- ✅ **Attendance** — Manual marking or face-recognition mode\n- 👨‍🎓 **Students** — Viewing rosters and individual stats\n- 📝 **Reports** — Generating class reports\n- 🗓️ **Schedule** — Managing your timetable\n- 📸 **Face Recognition** — Camera mode tips\n\nWhat would you like help with?`,
      student: `🤖 **I can help you with:**\n\n- 📊 **Attendance** — Understanding your stats\n- 📈 **Improvement** — Tips to boost attendance\n- 🗓️ **Routine** — Building a study schedule\n- ⚙️ **Settings** — Profile and preferences\n- 🔐 **Account** — Login and password issues\n\nJust ask me anything!`,
    },
  },
];

const greetingPatterns = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'greetings', 'whats up', 'sup'];
const thankPatterns = ['thank', 'thanks', 'thx', 'appreciate', 'grateful'];
const byePatterns = ['bye', 'goodbye', 'see you', 'talk later', 'gotta go'];

const getFallbackReply = ({ message, user }) => {
  const normalized = normalizeText(message);
  const role = user?.role || 'student';

  // Greeting
  if (greetingPatterns.some((g) => normalized.includes(g))) {
    return `👋 Hi **${user?.name || 'there'}**! I'm your FaceAttend AI Assistant.\n\nI can help with **attendance**, **reports**, **schedules**, **face recognition**, and more. What would you like to do today?`;
  }

  // Thanks
  if (thankPatterns.some((t) => normalized.includes(t))) {
    return `😊 You're welcome! Happy to help. If you need anything else — attendance tips, report help, schedule planning — just ask!`;
  }

  // Bye
  if (byePatterns.some((b) => normalized.includes(b))) {
    return `👋 Goodbye **${user?.name || ''}**! Have a great day. I'm always here if you need help! ✨`;
  }

  // Score topics by keyword matches
  let bestMatch = null;
  let bestScore = 0;

  for (const topic of fallbackTopics) {
    const score = topic.keywords.reduce(
      (acc, keyword) => acc + (normalized.includes(keyword) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      bestMatch = topic;
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch.replies[role] || bestMatch.replies.student;
  }

  // Generic fallback
  return `I can help with many things in FaceAttend! Here are some topics:\n\n- 📊 **Attendance** — Tracking, marking, and improving\n- 📝 **Reports** — Generating and exporting data\n- 📸 **Face Recognition** — Using AI camera mode\n- 🗓️ **Schedule** — Managing timetables and routines\n- ⚙️ **Settings** — Configuration and preferences\n\nTell me what you'd like help with and I'll give you step-by-step guidance! 🚀`;
};

/* ─── Remote AI API ─── */

const getRemoteAIReply = async ({ message, history, user }) => {
  if (!env.OPENAI_API_KEY) return null;

  const timeoutMs = env.AI_REQUEST_TIMEOUT_MS || 15000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = `${env.OPENAI_BASE_URL.replace(/\/$/, '')}/chat/completions`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        temperature: 0.4,
        max_tokens: 700,
        presence_penalty: 0.3,
        messages: [
          { role: 'system', content: buildSystemPrompt(user) },
          ...history,
          { role: 'user', content: message },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string' || !content.trim()) return null;

    return content.trim();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

/* ─── Route handlers ─── */

export const askChatbot = asyncHandler(async (req, res) => {
  const message = String(req.body?.message || '').trim();

  if (!message) {
    throw new ApiError(400, 'Message is required');
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new ApiError(400, `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`);
  }

  const history = sanitizeHistory(req.body?.history);

  const remoteReply = await getRemoteAIReply({
    message,
    history,
    user: req.user,
  });

  const baseReply = remoteReply || getFallbackReply({ message, user: req.user });
  const lastAssistantMessage = getLastAssistantMessage(history);
  const duplicated = isNearDuplicateReply(baseReply, lastAssistantMessage);

  const reply = duplicated
    ? `${baseReply}\n\n${buildAlternativeFollowUp(req.user?.role)}`
    : baseReply;

  const escalateRecommended = shouldEscalateByMessage(message) || isUncertainReply(reply);

  sendSuccess(res, {
    reply,
    escalateRecommended,
    supportHint: escalateRecommended
      ? '💬 If this doesn\'t solve it, click **Connect Admin Support** and our team will help you directly.'
      : undefined,
    source: remoteReply ? 'openai' : 'local-fallback',
  });
});

export const requestAdminSupport = asyncHandler(async (req, res) => {
  const issue = String(req.body?.issue || '').trim();

  if (issue.length > MAX_MESSAGE_LENGTH) {
    throw new ApiError(400, `Issue must be ${MAX_MESSAGE_LENGTH} characters or fewer`);
  }

  const admins = await User.findAll({
    where: { role: 'admin', isActive: true },
    attributes: ['id'],
  });

  if (admins.length === 0) {
    throw new ApiError(404, 'No active admin members are available right now');
  }

  const ticketId = `SUP-${Date.now().toString().slice(-8)}`;
  const safeIssue = issue || 'User requested direct help from the AI chat screen.';

  await Notification.bulkCreate(
    admins.map((admin) => ({
      userId: admin.id,
      title: `Support Request ${ticketId}`,
      message: `${req.user?.name || 'A user'} (${req.user?.role || 'user'}) requested help. Issue: ${safeIssue}`,
      type: 'warning',
      link: '/admin/chat',
      isRead: false,
    }))
  );

  sendSuccess(res, {
    ticketId,
    message: '✅ Admin support has been notified. Our team will help you shortly.',
  }, 201);
});
