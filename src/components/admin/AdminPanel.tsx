import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminExamsView } from './AdminExamsView';
import { AdminQuestionBankView } from './AdminQuestionBankView';
import { AdminStudentsView } from './AdminStudentsView';
import { AdminLeaderboardView } from './AdminLeaderboardView';
import { AdminAnnouncementsView } from './AdminAnnouncementsView';
import { AdminChallengesView } from './AdminChallengesView';
import { AdminAnalyticsView } from './AdminAnalyticsView';
import { AdminAiBuilderView } from './AdminAiBuilderView';
import { AdminAuditLogsView } from './AdminAuditLogsView';
import { AdminSettingsView } from './AdminSettingsView';
import { AdminProfileView } from './AdminProfileView';
import { StoreAdminView } from './StoreAdminView';
import type { AdminTab } from '../../types';

interface AdminPanelProps {
  onExitAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExitAdmin }) => {
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');

  return (
    <AdminLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      onExitAdmin={onExitAdmin}
    >
      {currentTab === 'dashboard' && (
        <AdminDashboard
          onNavigate={(tab) => setCurrentTab(tab)}
        />
      )}

      {currentTab === 'exams' && (
        <AdminExamsView
          onOpenAiBuilder={() => setCurrentTab('ai-builder')}
        />
      )}

      {currentTab === 'questions' && (
        <AdminQuestionBankView
          onOpenAiBuilder={() => setCurrentTab('ai-builder')}
        />
      )}

      {currentTab === 'students' && <AdminStudentsView />}

      {currentTab === 'leaderboard' && <AdminLeaderboardView />}

      {currentTab === 'announcements' && <AdminAnnouncementsView />}

      {currentTab === 'challenges' && <AdminChallengesView />}

      {currentTab === 'store' && <StoreAdminView />}

      {currentTab === 'analytics' && <AdminAnalyticsView />}

      {currentTab === 'ai-builder' && (
        <AdminAiBuilderView
          onExamCreated={() => setCurrentTab('exams')}
          onQuestionSaved={() => setCurrentTab('questions')}
        />
      )}

      {currentTab === 'audit-logs' && <AdminAuditLogsView />}

      {currentTab === 'settings' && <AdminSettingsView />}

      {currentTab === 'profile' && (
        <AdminProfileView onBackToStudentApp={onExitAdmin} />
      )}
    </AdminLayout>
  );
};
