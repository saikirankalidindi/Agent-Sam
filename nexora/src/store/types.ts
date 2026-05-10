import type React from 'react';

// store/types.ts

export type Theme = 'light' | 'dark';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export type ArtifactSectionType = 'checklist' | 'markdown' | 'accordion';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

export interface ArtifactSection {
  id: string;
  title: string; // Tab label
  type: ArtifactSectionType;
  // Only one of these will be populated based on type:
  checklistItems?: ChecklistItem[];
  markdownContent?: string;
  accordionItems?: AccordionItem[];
}

export interface Artifact {
  id: string;
  title: string;
  sections: ArtifactSection[];
  generatedAt: Date;
  isPinned: boolean;
}

export interface QuickLink {
  id: string;
  label: string;
  url: string;
  icon: React.ComponentType;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
}

// Zustand store shape
export interface AppState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Conversations
  conversations: Conversation[];
  activeConversation: Conversation | null;
  loadConversation: (id: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;

  // Streaming
  isStreaming: boolean;
  streamingMessageId: string | null;
  setStreamingState: (streaming: boolean, messageId?: string) => void;
  appendStreamChunk: (chunk: string) => void;

  // Canvas
  isCanvasOpen: boolean;
  activeArtifact: Artifact | null;
  openArtifact: (artifact: Artifact) => void;
  closeCanvas: () => void;
  updateArtifactSection: (sectionId: string, content: Partial<ArtifactSection>) => void;
  toggleChecklistItem: (sectionId: string, itemId: string) => void;

  // Pinned documents
  pinnedArtifacts: Artifact[];
  pinArtifact: (artifact: Artifact) => void;
  unpinArtifact: (artifactId: string) => void;

  // Input bar
  inputValue: string;
  setInputValue: (value: string) => void;

  // User
  user: UserProfile | null;
}
