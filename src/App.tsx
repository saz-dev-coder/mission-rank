import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { WelcomePage } from './pages/WelcomePage';
import { OnboardingPage } from './pages/OnboardingPage';
import { TodayDashboard } from './pages/TodayDashboard';
import { WeeklyPlannerPage } from './pages/WeeklyPlannerPage';
import { FocusModePage } from './pages/FocusModePage';
import { AllTasksPage } from './pages/AllTasksPage';
import { ProgressPage } from './pages/ProgressPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TaskModal } from './components/TaskModal';

const AppContent: React.FC = () => {
  const { profile, currentView } = useApp();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // If no profile, handle Welcome & Onboarding
  if (!profile) {
    if (currentView === 'onboarding') {
      return <OnboardingPage />;
    }
    return <WelcomePage />;
  }

  // Render view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'today':
        return <TodayDashboard />;
      case 'planner':
        return <WeeklyPlannerPage />;
      case 'focus':
        return <FocusModePage />;
      case 'tasks':
        return <AllTasksPage />;
      case 'progress':
        return <ProgressPage />;
      case 'reviews':
        return <ReviewsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'onboarding':
        return <OnboardingPage />;
      default:
        return <TodayDashboard />;
    }
  };

  const isLight = profile?.theme === 'light';

  return (
    <div className={`min-h-screen ${isLight ? 'bg-[#F8FAFC] text-[#0F172A]' : 'bg-[#0B1020] text-[#F8FAFC]'} app-container antialiased flex flex-col selection:bg-pink-500/30 selection:text-white`}>
      {/* Background ambient gradient glow accents: Pink, Red, Neon Green, Yellow, Dark Blue */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top-left Pink / Rose ambient aura */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-pink-600/10 blur-[120px]" />
        {/* Top-right Neon Green / Teal ambient aura */}
        <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-[130px]" />
        {/* Center Yellow / Amber soft aura */}
        <div className="absolute top-1/2 left-1/3 w-96 h-96 rounded-full bg-amber-500/5 blur-[140px]" />
        {/* Bottom Dark Blue / Indigo grounding aura */}
        <div className="absolute -bottom-32 right-1/4 w-[30rem] h-[30rem] rounded-full bg-blue-700/10 blur-[140px]" />
      </div>

      {/* Navigation Layout */}
      <Navigation onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 lg:pl-64 flex flex-col">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-4 lg:pt-20 pb-20 lg:pb-12 max-w-7xl w-full mx-auto">
          {renderCurrentView()}
        </main>
      </div>

      {/* Global Quick Add Task Modal */}
      <TaskModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
