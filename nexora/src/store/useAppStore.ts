import { create } from 'zustand';
import type {
  AppState,
  Theme,
  Message,
  Artifact,
  ArtifactSection,
  Conversation,
} from './types';

// ---------------------------------------------------------------------------
// Mock seed data
// ---------------------------------------------------------------------------

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Project planning session',
    createdAt: new Date('2025-01-10T09:00:00Z'),
    updatedAt: new Date('2025-01-10T09:45:00Z'),
    messages: [
      {
        id: 'msg-1-1',
        role: 'user',
        content: 'Can you help me plan the Q1 roadmap for the Nexora project?',
        timestamp: new Date('2025-01-10T09:00:00Z'),
      },
      {
        id: 'msg-1-2',
        role: 'assistant',
        content:
          "Absolutely! Let's break down the Q1 roadmap. I'll start by identifying the key milestones: scaffolding the project, implementing the core store and types, building the three-pane layout, and then iterating on each pane. Would you like me to create a structured artifact with a checklist for each phase?",
        timestamp: new Date('2025-01-10T09:01:00Z'),
      },
      {
        id: 'msg-1-3',
        role: 'user',
        content: 'Yes, please create a checklist artifact.',
        timestamp: new Date('2025-01-10T09:02:00Z'),
      },
      {
        id: 'msg-1-4',
        role: 'assistant',
        content:
          "I've created a Q1 roadmap checklist artifact in the Canvas pane. You can track progress by checking off items as you complete them.",
        timestamp: new Date('2025-01-10T09:03:00Z'),
      },
    ],
  },
  {
    id: 'conv-2',
    title: 'Zustand store design',
    createdAt: new Date('2025-01-11T14:00:00Z'),
    updatedAt: new Date('2025-01-11T14:30:00Z'),
    messages: [
      {
        id: 'msg-2-1',
        role: 'user',
        content: 'What are the best practices for structuring a Zustand store in a large React app?',
        timestamp: new Date('2025-01-11T14:00:00Z'),
      },
      {
        id: 'msg-2-2',
        role: 'assistant',
        content:
          'Great question! For large apps, I recommend splitting your store into logical slices using separate `create` calls or a single store with clearly delineated sections. Keep actions co-located with their state, use selectors to avoid unnecessary re-renders, and prefer shallow equality checks with `useShallow` for object selections.',
        timestamp: new Date('2025-01-11T14:01:00Z'),
      },
    ],
  },
  {
    id: 'conv-3',
    title: 'Accessibility review',
    createdAt: new Date('2025-01-12T10:00:00Z'),
    updatedAt: new Date('2025-01-12T10:20:00Z'),
    messages: [
      {
        id: 'msg-3-1',
        role: 'user',
        content: 'Can you review the WCAG 2.1 AA requirements for our Canvas component?',
        timestamp: new Date('2025-01-12T10:00:00Z'),
      },
      {
        id: 'msg-3-2',
        role: 'assistant',
        content:
          'For WCAG 2.1 AA compliance in the Canvas component, ensure: (1) all interactive elements have descriptive `aria-label` attributes, (2) focus is managed correctly when the canvas opens/closes, (3) tab navigation follows a logical order, (4) color contrast ratios meet 4.5:1 for normal text and 3:1 for large text, and (5) all state changes are communicated via ARIA live regions or attribute updates.',
        timestamp: new Date('2025-01-12T10:01:00Z'),
      },
    ],
  },
];

const mockArtifact: Artifact = {
  id: 'artifact-dev-1',
  title: 'Q1 Nexora Roadmap',
  isPinned: false,
  generatedAt: new Date('2025-01-10T09:03:00Z'),
  sections: [
    {
      id: 'section-checklist',
      title: 'Milestones',
      type: 'checklist',
      checklistItems: [
        { id: 'item-1', text: 'Scaffold project and install dependencies', checked: true },
        { id: 'item-2', text: 'Define TypeScript types and Zustand store', checked: true },
        { id: 'item-3', text: 'Implement theme system', checked: false },
        { id: 'item-4', text: 'Build three-pane CSS Grid layout shell', checked: false },
        { id: 'item-5', text: 'Implement Library sidebar', checked: false },
        { id: 'item-6', text: 'Implement Command Center', checked: false },
        { id: 'item-7', text: 'Implement Canvas pane', checked: false },
        { id: 'item-8', text: 'Write property-based and unit tests', checked: false },
        { id: 'item-9', text: 'Accessibility audit with axe-core', checked: false },
      ],
    },
    {
      id: 'section-markdown',
      title: 'Overview',
      type: 'markdown',
      markdownContent: `## Nexora Q1 Roadmap

Nexora is a React + TypeScript single-page application built around a **three-pane split-screen layout**.

### Goals

- Deliver a fully functional AI workflow workspace by end of Q1
- Achieve WCAG 2.1 AA accessibility compliance
- Maintain 100% property-based test coverage for all core logic

### Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 + TypeScript |
| Styling | Tailwind CSS + Shadcn/ui |
| State | Zustand |
| Testing | Vitest + fast-check |

### Timeline

- **Week 1–2**: Scaffolding, types, store, theme system
- **Week 3–4**: Layout shell, Library sidebar
- **Week 5–6**: Command Center, Canvas pane
- **Week 7–8**: Tests, accessibility audit, polish
`,
    },
    {
      id: 'section-accordion',
      title: 'Details',
      type: 'accordion',
      accordionItems: [
        {
          id: 'acc-1',
          title: 'Library Sidebar',
          content:
            'The Library sidebar provides quick links to external services, a list of recent conversations (up to 10), pinned documents, and the user profile with avatar and settings access.',
        },
        {
          id: 'acc-2',
          title: 'Command Center',
          content:
            'The Command Center is the primary conversational interface. It includes a scrollable message list with smart auto-scroll, a suggestions bar with prompt pills, and an auto-expanding input bar with slash command support.',
        },
        {
          id: 'acc-3',
          title: 'Canvas Pane',
          content:
            'The Canvas pane slides open to display structured AI-generated artifacts. It supports tabbed sections with checklist, markdown, and accordion renderers. Users can pin artifacts to the Library and download them as Markdown files.',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAppStore = create<AppState>((set, get) => ({
  // -------------------------------------------------------------------------
  // Theme
  // -------------------------------------------------------------------------
  theme: 'light',

  setTheme: (theme: Theme) => {
    set({ theme });
  },

  // -------------------------------------------------------------------------
  // Conversations
  // -------------------------------------------------------------------------
  conversations: mockConversations,
  activeConversation: mockConversations[0],

  loadConversation: (id: string) => {
    const conversation = get().conversations.find((c) => c.id === id) ?? null;
    set({ activeConversation: conversation });
  },

  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    set((state) => {
      if (!state.activeConversation) return state;

      const updatedConversation: Conversation = {
        ...state.activeConversation,
        messages: [...state.activeConversation.messages, newMessage],
        updatedAt: new Date(),
      };

      const updatedConversations = state.conversations.map((c) =>
        c.id === updatedConversation.id ? updatedConversation : c,
      );

      return {
        activeConversation: updatedConversation,
        conversations: updatedConversations,
      };
    });
  },

  // -------------------------------------------------------------------------
  // Streaming
  // -------------------------------------------------------------------------
  isStreaming: false,
  streamingMessageId: null,

  setStreamingState: (streaming: boolean, messageId?: string) => {
    set({
      isStreaming: streaming,
      streamingMessageId: streaming ? (messageId ?? null) : null,
    });
  },

  appendStreamChunk: (chunk: string) => {
    const { streamingMessageId, activeConversation } = get();

    if (!streamingMessageId || !activeConversation) return;

    set((state) => {
      if (!state.activeConversation) return state;

      const updatedMessages = state.activeConversation.messages.map((msg) =>
        msg.id === streamingMessageId
          ? { ...msg, content: msg.content + chunk }
          : msg,
      );

      const updatedConversation: Conversation = {
        ...state.activeConversation,
        messages: updatedMessages,
        updatedAt: new Date(),
      };

      const updatedConversations = state.conversations.map((c) =>
        c.id === updatedConversation.id ? updatedConversation : c,
      );

      return {
        activeConversation: updatedConversation,
        conversations: updatedConversations,
      };
    });
  },

  // -------------------------------------------------------------------------
  // Canvas
  // -------------------------------------------------------------------------
  isCanvasOpen: false,
  activeArtifact: mockArtifact,

  openArtifact: (artifact: Artifact) => {
    set({ isCanvasOpen: true, activeArtifact: artifact });
  },

  closeCanvas: () => {
    set({ isCanvasOpen: false });
  },

  updateArtifactSection: (sectionId: string, content: Partial<ArtifactSection>) => {
    set((state) => {
      if (!state.activeArtifact) return state;

      const updatedSections = state.activeArtifact.sections.map((section) =>
        section.id === sectionId ? { ...section, ...content } : section,
      );

      const updatedArtifact: Artifact = {
        ...state.activeArtifact,
        sections: updatedSections,
      };

      // Also update in pinnedArtifacts if present
      const updatedPinned = state.pinnedArtifacts.map((a) =>
        a.id === updatedArtifact.id ? updatedArtifact : a,
      );

      return {
        activeArtifact: updatedArtifact,
        pinnedArtifacts: updatedPinned,
      };
    });
  },

  toggleChecklistItem: (sectionId: string, itemId: string) => {
    set((state) => {
      if (!state.activeArtifact) return state;

      const updatedSections = state.activeArtifact.sections.map((section) => {
        if (section.id !== sectionId || !section.checklistItems) return section;

        const updatedItems = section.checklistItems.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item,
        );

        return { ...section, checklistItems: updatedItems };
      });

      const updatedArtifact: Artifact = {
        ...state.activeArtifact,
        sections: updatedSections,
      };

      // Also update in pinnedArtifacts if present
      const updatedPinned = state.pinnedArtifacts.map((a) =>
        a.id === updatedArtifact.id ? updatedArtifact : a,
      );

      return {
        activeArtifact: updatedArtifact,
        pinnedArtifacts: updatedPinned,
      };
    });
  },

  // -------------------------------------------------------------------------
  // Pinned artifacts
  // -------------------------------------------------------------------------
  pinnedArtifacts: [],

  pinArtifact: (artifact: Artifact) => {
    set((state) => {
      // Avoid duplicates
      const alreadyPinned = state.pinnedArtifacts.some((a) => a.id === artifact.id);
      if (alreadyPinned) return state;

      const pinnedArtifact: Artifact = { ...artifact, isPinned: true };

      const updatedActiveArtifact =
        state.activeArtifact?.id === artifact.id
          ? { ...state.activeArtifact, isPinned: true }
          : state.activeArtifact;

      return {
        pinnedArtifacts: [...state.pinnedArtifacts, pinnedArtifact],
        activeArtifact: updatedActiveArtifact,
      };
    });
  },

  unpinArtifact: (artifactId: string) => {
    set((state) => {
      const updatedPinned = state.pinnedArtifacts.filter((a) => a.id !== artifactId);

      const updatedActiveArtifact =
        state.activeArtifact?.id === artifactId
          ? { ...state.activeArtifact, isPinned: false }
          : state.activeArtifact;

      return {
        pinnedArtifacts: updatedPinned,
        activeArtifact: updatedActiveArtifact,
      };
    });
  },

  // -------------------------------------------------------------------------
  // Input bar
  // -------------------------------------------------------------------------
  inputValue: '',

  setInputValue: (value: string) => {
    set({ inputValue: value });
  },

  // -------------------------------------------------------------------------
  // User
  // -------------------------------------------------------------------------
  user: {
    id: 'user-1',
    name: 'Alex Johnson',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=nexora-user',
  },
}));
