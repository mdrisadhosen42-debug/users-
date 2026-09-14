// Jannat AI Assistant Types
export type AndroidScreen = 'main' | 'diagnostics' | 'settings' | 'voice_settings' | 'youtube' | 'facebook' | 'home';

export interface AndroidDiagnostic {
  id: string;
  title: string;
  status: string;
  description: string;
  level: 'good' | 'warning' | 'error';
  actionLabel?: string;
  isAutoFixable?: boolean;
}

export interface AssistantState {
  status: 'ready' | 'listening' | 'processing' | 'executing' | 'error';
  lastCommand: string;
  lastReply: string;
  isAccessibilityEnabled: boolean;
  hasMicPermission: boolean;
  isLocked: boolean;
}

export interface AndroidProjectFile {
  path: string;
  name: string;
  category: 'kotlin' | 'xml' | 'gradle' | 'manifest';
  content: string;
  language: string;
}
