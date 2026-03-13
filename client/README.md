# FaceAttend - AI-Powered Attendance Management System

A modern, highly polished face recognition attendance management system built with React 18, Vite, and Tailwind CSS.

## ✨ Features

### Modern UI/UX Design
- **Premium SaaS-level interface** inspired by Notion, Linear, and Vercel
- **Glassmorphism effects** and smooth animations
- **Full dark mode support** with seamless transitions
- **Responsive design** for all screen sizes
- **Framer Motion animations** for delightful micro-interactions

### Three Role-Based Portals

#### 👨‍🎓 Student Portal
- Personal attendance dashboard with animated statistics
- Radial progress charts and trend graphs
- Monthly performance tracking
- Attendance history with visual indicators
- Real-time notifications

#### 👨‍🏫 Teacher Portal
- **AI-Powered Camera Attendance System** with:
  - Live camera feed with scanning animations
  - Face detection highlight boxes
  - Real-time student recognition
  - Animated student cards
  - Manual attendance override
- Class management dashboard
- Weekly attendance overview
- Attendance reports and analytics

#### 👨‍💼 Admin Portal
- Comprehensive analytics dashboard
- System-wide statistics and KPIs
- Department distribution charts
- Growth and attendance trends
- Real-time activity feed
- Student and teacher management
- Report generation

### Technical Features
- **React 18.3.1** with modern hooks
- **Vite** for lightning-fast development
- **Tailwind CSS** with custom design system
- **React Router v6** for navigation
- **Context API** for state management
- **Axios** for API communication
- **Recharts** for beautiful data visualization
- **Framer Motion** for smooth animations
- **Lucide React** for modern icons

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## 🎨 Design System

### Colors
- **Primary:** Blue/Indigo for main actions
- **Success:** Emerald for positive states
- **Warning:** Amber for alerts
- **Danger:** Red for errors
- **Neutral:** Slate for text and backgrounds

### Typography
- **Primary Font:** Inter
- **Display Font:** Poppins
- Clean hierarchy with proper font weights

### Animations
- **Smooth transitions:** 200-300ms duration
- **Hover effects:** Card lifts, button presses
- **Page transitions:** Fade and slide animations
- **Loading states:** Skeleton loaders and spinners

## 🔐 Authentication

The app includes a mock authentication system for demonstration:

### Quick Login Credentials
- **Admin:** admin@faceattend.com / password123
- **Teacher:** teacher@faceattend.com / password123
- **Student:** student@faceattend.com / password123

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components (Sidebar, Navbar)
│   ├── dashboard/       # Dashboard-specific components
│   └── ProtectedRoute.jsx
├── contexts/            # React Context providers
│   ├── AuthContext.jsx
│   ├── ThemeContext.jsx
│   ├── ToastContext.jsx
│   └── NotificationContext.jsx
├── pages/
│   ├── auth/           # Login and Register pages
│   ├── student/        # Student portal pages
│   ├── teacher/        # Teacher portal pages
│   └── admin/          # Admin portal pages
├── utils/              # Utility functions
│   ├── api.js
│   └── helpers.js
├── App.jsx             # Main app component with routing
├── main.jsx            # App entry point
└── index.css           # Global styles

```

## 🎯 Key Components

### UI Components
- **Button:** Multiple variants with loading states
- **Card:** Glassmorphism with hover effects
- **Input:** Floating labels with validation
- **Badge:** Status indicators
- **Progress:** Animated progress bars
- **Modal:** Animated modal dialogs
- **Table:** Responsive data tables
- **Skeleton:** Loading placeholders

### Layout Components
- **Sidebar:** Collapsible with smooth animations
- **Navbar:** Sticky with search, notifications, and profile
- **DashboardLayout:** Main layout wrapper
- **Breadcrumb:** Navigation breadcrumbs

## 🌙 Dark Mode

Fully implemented dark mode with:
- Theme toggle in navbar
- Persistent theme preference
- Smooth transitions between themes
- Consistent color palette in both modes

## 📱 Responsive Design

- **Mobile-first approach**
- **Collapsible sidebar on small screens**
- **Responsive navigation**
- **Touch-optimized interactions**
- **Adaptive layouts and tables**

## 🎨 Customization

### Tailwind Configuration
Modify `tailwind.config.js` to customize:
- Color palette
- Font families
- Animation timings
- Spacing system

### Theme Context
Update `ThemeContext.jsx` for theme behavior customization

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables
Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Production Deployment

The app is production-ready and can be deployed to:
- Vercel
- Netlify
- AWS Amplify
- Any static hosting service

## 📝 Future Enhancements

- Real backend integration
- Actual face recognition API
- Advanced analytics
- Email notifications
- Export reports to PDF
- Multi-language support
- Mobile app version

## 🤝 Contributing

This is a demonstration project. Feel free to fork and customize for your needs.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Design inspiration from Notion, Linear, and Vercel
- Icons by Lucide React
- Charts by Recharts
- Animations by Framer Motion

---

**Built with ❤️ using React, Vite, and Tailwind CSS**
