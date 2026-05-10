# Implementation Plan: Nexora Command & Canvas UI

## Overview

Implement the Nexora React + TypeScript SPA as a three-pane AI workflow workspace. The build proceeds in layers: project scaffolding → shared types and store → theme system → layout shell → Library sidebar → Command Center → Canvas pane → utility functions and hooks → property-based and unit tests → accessibility audit. Each layer is independently verifiable before the next begins.

---

## Tasks

- [x] 1. Scaffold project and install dependencies
  - Initialize a Vite project with the `react-ts` template
  - Install and configure Tailwind CSS v3 with `darkMode: 'class'` in `tailwind.config.ts`
  - Install and initialize Shadcn/ui; add Button, Tabs, Accordion, Popover, Sheet, and Toast components
  - Install Zustand, `react-markdown` (or `marked`), `fast-check`, Vitest, `@testing-library/react`, `@testing-library/jest-dom`, and `axe-core`
  - Configure `vitest.config.ts` with jsdom environment and `@testing-library/jest-dom` setup file
  - Create the `src/` directory tree matching the architecture: `app/`, `components/library/`, `components/command-center/`, `components/canvas/`, `store/`, `hooks/`, `lib/`, `styles/`, `__tests__/`
  - _Requirements: 1.1, 10.4_

  - [x] 1.1 Initialize Vite + React + TypeScript project and install all dependencies
    - Run `npm create vite@latest` with react-ts template, then install all packages listed above
    - _Requirements: 1.1, 10.4_

  - [x] 1.2 Configure Tailwind CSS, Shadcn/ui, and Vitest
    - Set up `tailwind.config.ts` with `darkMode: 'class'`, content paths, and indigo accent extension
    - Configure `vitest.config.ts` with jsdom, globals, and setup file
    - _Requirements: 1.3, 1.4, 10.1_

- [x] 2. Define TypeScript types and Zustand store
  - [x] 2.1 Create `src/store/types.ts` with all shared interfaces
    - Define `Theme`, `Message`, `Conversation`, `ArtifactSectionType`, `ChecklistItem`, `AccordionItem`, `ArtifactSection`, `Artifact`, `QuickLink`, `UserProfile`, and `AppState` exactly as specified in the design
    - _Requirements: 1.1, 3.1, 6.2, 7.2, 9.4_

  - [x] 2.2 Create `src/store/useAppStore.ts` with full Zustand store implementation
    - Implement all state slices: theme, conversations, streaming, canvas, pinnedArtifacts, inputValue, user
    - Implement all actions: `setTheme`, `loadConversation`, `addMessage`, `setStreamingState`, `appendStreamChunk`, `openArtifact`, `closeCanvas`, `updateArtifactSection`, `toggleChecklistItem`, `pinArtifact`, `unpinArtifact`, `setInputValue`
    - Seed store with mock conversations and a mock user for development
    - _Requirements: 2.3, 2.5, 3.1, 3.6, 6.5, 7.2, 7.3, 9.4_

  - [x] 2.3 Write property tests for store mutations (Properties 8, 17, 19, 20, 21)
    - **Property 8: Streaming Chunk Concatenation** — `fc.array(fc.string(), {minLength: 1})` — validates `appendStreamChunk` produces exact concatenation
    - **Property 17: Checklist Toggle Invariant** — `fc.array(checklistItemArb)` + `fc.nat()` — validates only targeted item flips
    - **Property 19: Accordion Toggle Invariant** — `fc.array(accordionItemArb)` + `fc.nat()` — validates only targeted item flips
    - **Property 20: Pin Artifact State Mutation** — `fc.record({isPinned: fc.constant(false)})` — validates artifact added and `isPinned` set to `true`
    - **Property 21: Unpin Artifact State Mutation** — `fc.array(artifactArb, {minLength: 1})` + `fc.nat()` — validates artifact removed, others unchanged
    - Tag each test: `// Feature: nexora-command-canvas-ui, Property {N}: ...`
    - _Requirements: 3.6, 6.5, 6.10, 7.2, 7.3_

- [x] 3. Implement theme system
  - [x] 3.1 Create `src/styles/globals.css` with Tailwind directives and CSS custom properties
    - Define `--library-width`, `--canvas-width`, and all Shadcn/ui CSS variable tokens for light and dark themes
    - Import in `main.tsx`
    - _Requirements: 1.3, 1.4, 9.2, 9.3_

  - [x] 3.2 Create `src/hooks/useTheme.ts`
    - Implement `getInitialTheme()` that reads `localStorage.getItem('nexora-theme')` and returns `'dark'` only when the stored value is exactly `'dark'`, defaulting to `'light'`
    - Implement `useTheme()` hook that reads from and writes to the Zustand store, syncs `document.documentElement.classList`, and persists to `localStorage`
    - Wrap `localStorage` access in try/catch for private-browsing safety
    - _Requirements: 9.4_

  - [x] 3.3 Add blocking theme pre-load script to `index.html`
    - Insert inline `<script>` before `</head>` that reads `localStorage.getItem('nexora-theme')` and adds `class="dark"` to `<html>` if value is `'dark'`
    - _Requirements: 9.4_

  - [ ] 3.4 Write property test for theme initialization (Property 23)
    - **Property 23: Theme Initialization from localStorage** — `fc.option(fc.string())` — validates `getInitialTheme` returns `'dark'` iff stored value is exactly `'dark'`
    - _Requirements: 9.4_

- [x] 4. Build three-pane CSS Grid layout shell
  - [x] 4.1 Create `src/app/App.tsx` with three-pane grid layout
    - Render `<div className="grid h-screen overflow-hidden">` with `gridTemplateColumns: 'var(--library-width) 1fr var(--canvas-width)'`
    - Wire `useTheme` to apply `dark` class on `<html>` on mount and on theme change
    - Render `<Library />`, `<CommandCenter />`, and `<Canvas />` as grid children (stub components initially)
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 4.2 Create `src/app/main.tsx` entry point
    - Mount `<App />` into `#root`, import `globals.css`
    - _Requirements: 1.1_

  - [x] 4.3 Implement responsive collapse at < 768px
    - Apply `hidden md:flex` to Library and Canvas wrappers
    - Add mobile menu button in CommandCenter header that opens Library as a Shadcn `Sheet` overlay
    - _Requirements: 1.6_

- [x] 5. Implement Library sidebar
  - [x] 5.1 Create `src/components/library/QuickLinks.tsx`
    - Render a 3×2 grid of `<a target="_blank" rel="noopener noreferrer">` wrapping Shadcn `Button variant="ghost"` for GitHub, Calendar, Gmail, Drive, Notion, Slack
    - Each link must have a descriptive `aria-label`
    - _Requirements: 2.1, 2.2, 11.1_

  - [x] 5.2 Create `src/components/library/RecentConversations.tsx`
    - Read `store.conversations`, slice to 10, render each with title and `Intl.RelativeTimeFormat` relative timestamp
    - Render "No recent conversations." empty state when array is empty
    - On click dispatch `store.loadConversation(id)`; on load failure render inline error per Requirement 2.4
    - Apply `transition-all duration-150` on hover/focus
    - _Requirements: 2.3, 2.4, 1.5_

  - [x] 5.3 Create `src/components/library/PinnedDocuments.tsx`
    - Read `store.pinnedArtifacts`, render each artifact title
    - Render "No pinned documents." empty state when array is empty
    - On click dispatch `store.openArtifact(artifact)`
    - _Requirements: 2.5, 2.6_

  - [x] 5.4 Create `src/components/library/UserProfile.tsx`
    - Render `<img>` avatar with `onError` handler that sets local state flag to switch to initials fallback `<div>`
    - Render settings icon as Shadcn `Button variant="ghost" size="icon"` that opens a settings `Sheet`
    - _Requirements: 2.7, 2.8_

  - [x] 5.5 Create `src/components/library/Library.tsx` container
    - Compose QuickLinks, RecentConversations, PinnedDocuments, UserProfile in a flex-col sidebar
    - Apply fixed width via `--library-width` CSS variable
    - _Requirements: 2.1–2.8_

  - [ ] 5.6 Write property tests for Library components (Properties 1, 2, 3)
    - **Property 1: Recent Conversations List Rendering** — `fc.array(fc.record({id, title, updatedAt}), {maxLength: 15})` — validates at most 10 items rendered and empty state
    - **Property 2: Pinned Documents List Rendering** — `fc.array(fc.record({id, title, isPinned: fc.constant(true)}))` — validates all titles shown and empty state
    - **Property 3: User Profile Avatar Fallback** — `fc.record({name: fc.string(), avatarUrl: fc.option(fc.webUrl())})` — validates `<img>` vs initials rendering
    - _Requirements: 2.3, 2.5, 2.7_

- [x] 6. Implement utility functions and custom hooks
  - [x] 6.1 Create `src/lib/utils.ts`
    - Implement `cn(...inputs)` using `clsx` + `tailwind-merge` for conditional class merging
    - _Requirements: 10.1_

  - [x] 6.2 Create `src/lib/markdown.ts`
    - Implement `renderMarkdown(content: string): string` wrapping `marked` or `react-markdown` parse
    - Wrap in try/catch; on parse error return the raw string (fallback for error boundary)
    - _Requirements: 6.6_

  - [x] 6.3 Create `src/lib/download.ts`
    - Implement `generateMarkdown(artifact: Artifact): string` that assembles `# title\n\n## section.title\n\n{content}\n\n---\n` for all sections
    - Implement `downloadArtifact(artifact: Artifact): void` that creates a `Blob`, calls `URL.createObjectURL`, triggers download, and revokes the URL; wraps in try/catch and dispatches `downloadError` on failure
    - Derive filename: `artifact.title.toLowerCase().replace(/\s+/g, '-') + '.md'`
    - _Requirements: 7.4, 7.5, 7.6_

  - [x] 6.4 Create `src/hooks/useAutoScroll.ts`
    - Implement `shouldAutoScroll(scrollTop, scrollHeight, clientHeight, threshold = 50): boolean` as a pure exported function
    - Implement `useAutoScroll(deps)` hook that attaches an `IntersectionObserver` to a sentinel `ref`, auto-scrolls when sentinel is visible and new messages arrive
    - _Requirements: 3.4, 3.8_

  - [x] 6.5 Create `src/hooks/useSlashCommand.ts`
    - Implement `shouldShowSlashMenu(value: string, cursorPos: number): boolean` — returns `true` iff char before cursor is `/` and that `/` is at position 0 or preceded by whitespace
    - Implement `replaceSlashCommand(value: string, cursorPos: number, command: string): string` — replaces slash trigger + partial text with selected command, preserving surrounding content
    - Implement `useSlashCommand()` hook that tracks menu open state and selected index
    - _Requirements: 5.2, 5.3_

  - [ ] 6.6 Write property tests for utility functions and hooks (Properties 7, 11, 12, 13, 14, 22)
    - **Property 7: Smart Auto-Scroll Decision** — `fc.record({scrollTop: fc.nat(), scrollHeight: fc.nat(), clientHeight: fc.nat()})` — validates `shouldAutoScroll` pure function
    - **Property 11: Input Bar Row Capping** — `fc.integer({min: 1, max: 20})` — validates `computeRows(n) === Math.min(n, 6)`
    - **Property 12: Slash Command Trigger Detection** — `fc.string()` + cursor position — validates `shouldShowSlashMenu`
    - **Property 13: Slash Command Text Replacement** — `fc.string()` + `fc.constantFrom('/task', '/note', '/link', '/search')` — validates `replaceSlashCommand`
    - **Property 14: Send Button Disabled on Whitespace** — `fc.string()` — validates `isSubmittable` returns false for whitespace-only strings
    - **Property 22: Download Markdown Content Completeness** — `fc.record({title: fc.string({minLength: 1}), sections: fc.array(sectionArb, {minLength: 1})})` — validates `generateMarkdown` contains all titles and content
    - _Requirements: 3.4, 3.8, 5.1, 5.2, 5.3, 5.5, 7.5_

- [x] 7. Checkpoint — core logic verified
  - Ensure all store, hook, and utility tests pass. Run `npx vitest --run` and confirm zero failures before proceeding to UI components.

- [x] 8. Implement Command Center
  - [x] 8.1 Create `src/components/command-center/StreamingCursor.tsx`
    - Render `<span className="animate-pulse inline-block w-2 h-4 bg-current ml-1">` with 1s animation cycle
    - Render only when `store.isStreaming && message.id === store.streamingMessageId`
    - _Requirements: 3.5_

  - [x] 8.2 Create `src/components/command-center/MessageBubble.tsx`
    - AI messages: `bg-slate-50 dark:bg-slate-800`, left-aligned, no border, append `<StreamingCursor>` when streaming
    - User messages: `bg-indigo-600 dark:bg-indigo-500 text-white`, right-aligned, `rounded-2xl`
    - Apply `transition-all duration-150`
    - _Requirements: 3.2, 3.3, 3.5, 1.5_

  - [x] 8.3 Create `src/components/command-center/MessageList.tsx`
    - Render `store.activeConversation.messages` sorted ascending by `timestamp` into `<MessageBubble>` components
    - Attach `useAutoScroll` hook with sentinel `<div ref={sentinelRef}>` at bottom
    - Render empty-state placeholder when no messages exist
    - _Requirements: 3.1, 3.4, 3.7, 3.8_

  - [x] 8.4 Create `src/components/command-center/SlashCommandMenu.tsx`
    - Radix UI `Popover` anchored to InputBar, listing /task, /note, /link, /search
    - Arrow-key navigation between items; Escape dismisses and returns focus to InputBar
    - Focus trapped inside via Radix built-in focus management
    - Each item has `role="option"` and `aria-selected`
    - _Requirements: 5.2, 5.3, 11.1, 11.5_

  - [x] 8.5 Create `src/components/command-center/InputBar.tsx`
    - `<textarea aria-label="Message input">` that auto-expands rows via `computeRows(lineCount) = Math.min(lineCount, 6)`; shows scrollbar beyond 6 rows
    - Wire `useSlashCommand` hook; show `<SlashCommandMenu>` when triggered
    - Implement `isSubmittable(value)` — returns false for whitespace-only strings
    - Send on Enter (no Shift); newline on Shift+Enter
    - Attachment button opens `<input type="file">` picker; web-search toggle; send button disabled when `!isSubmittable(inputValue)`
    - Send button: `bg-indigo-600 hover:bg-indigo-700` with `transition-all duration-150`
    - On submit: call `store.addMessage`, clear `store.inputValue`
    - _Requirements: 5.1–5.7, 11.4_

  - [x] 8.6 Create `src/components/command-center/SuggestionsBar.tsx`
    - Render 3–6 `<Button variant="outline" className="rounded-full">` pills
    - Default pills: "Summarize my day", "Review pending tasks", "Search my links" (plus up to 3 more)
    - On click: `store.setInputValue(pill.prompt)` then focus InputBar
    - Hover: accent border + text color within 150ms via `transition-all duration-150`
    - Always rendered regardless of conversation state
    - _Requirements: 4.1–4.6_

  - [x] 8.7 Create `src/components/command-center/CommandCenter.tsx` container
    - Compose MessageList, SuggestionsBar, InputBar in a flex-col layout filling the center grid column
    - _Requirements: 3.1–3.8, 4.1–4.6, 5.1–5.7_

  - [ ] 8.8 Write property tests for Command Center components (Properties 4, 5, 6, 9, 10)
    - **Property 4: Message Chronological Order** — `fc.array(fc.record({id, role, content, timestamp: fc.date()}))` — validates ascending timestamp order in rendered list
    - **Property 5: AI Message Background Class** — `fc.record({role: fc.constant('assistant'), content: fc.string()})` — validates `bg-slate-50` / `bg-slate-800` classes
    - **Property 6: User Message Alignment** — `fc.record({role: fc.constant('user'), content: fc.string()})` — validates right-alignment class and distinct background
    - **Property 9: Suggestion Pill Input Population** — `fc.record({label: fc.string(), prompt: fc.string({minLength: 1})})` — validates `store.inputValue` equals pill prompt after click
    - **Property 10: Suggestions Bar Always Rendered** — `fc.record({messages: fc.array(...), isStreaming: fc.boolean()})` — validates SuggestionsBar present in all states
    - _Requirements: 3.1, 3.2, 3.3, 4.2, 4.6_

  - [ ] 8.9 Write property tests for InputBar (Properties 11, 14) — in `input-bar.test.ts`
    - **Property 11: Input Bar Row Capping** — validates `computeRows` exported from InputBar
    - **Property 14: Send Button Disabled on Whitespace** — validates `isSubmittable` exported from InputBar
    - _Requirements: 5.1, 5.5_

- [x] 9. Implement Canvas pane
  - [x] 9.1 Create `src/components/canvas/ChecklistRenderer.tsx`
    - Map `section.checklistItems` to `<label><input type="checkbox" role="checkbox" aria-checked={item.checked}></label>` pairs
    - On change dispatch `store.toggleChecklistItem(sectionId, itemId)`
    - Apply `transition-all duration-150` on checkbox focus ring (indigo accent)
    - _Requirements: 6.4, 6.5, 11.1, 11.3, 11.6_

  - [x] 9.2 Create `src/components/canvas/MarkdownSection.tsx`
    - Render mode: `renderMarkdown(section.markdownContent)` inside a `<div>` with click handler to enter edit mode
    - Edit mode: `<textarea>` with `onBlur` that calls `store.updateArtifactSection` and returns to render mode
    - Wrap in React error boundary; on parse error render raw content in `<pre>`
    - _Requirements: 6.6, 6.7, 6.8_

  - [x] 9.3 Create `src/components/canvas/AccordionSection.tsx`
    - Radix UI `Accordion type="multiple"` with all items open by default (`defaultValue` = all item IDs)
    - Toggle animation: `data-[state=open]:animate-accordion-down` at 150ms
    - Each trigger: `role="button" aria-expanded={isOpen}`
    - _Requirements: 6.9, 6.10, 11.1, 11.3, 11.6_

  - [x] 9.4 Create `src/components/canvas/ArtifactTabs.tsx`
    - Radix UI `Tabs` component; one tab per `artifact.sections` entry
    - Active tab: `text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600`
    - Each tab trigger: `role="tab" aria-selected={isActive}`
    - Render `<ChecklistRenderer>`, `<MarkdownSection>`, or `<AccordionSection>` based on `section.type`
    - _Requirements: 6.2, 6.3, 11.1, 11.3, 11.6_

  - [x] 9.5 Create `src/components/canvas/Canvas.tsx` container
    - Animate open/close by toggling `--canvas-width` CSS variable between `0px` and `420px` with `transition: width 150ms ease`
    - Render close button, `<ArtifactTabs>`, Pin button (outline when unpinned, filled when pinned), Download button
    - Pin button: on click call `store.pinArtifact` or `store.unpinArtifact` based on `artifact.isPinned`
    - Download button: call `downloadArtifact(artifact)`; on `store.downloadError` show Shadcn Toast that auto-dismisses after 5s
    - Replace artifact when `store.activeArtifact` changes while canvas is open
    - _Requirements: 6.1, 6.11, 7.1–7.6, 8.1–8.3_

  - [ ] 9.6 Write property tests for Canvas components (Properties 15, 16, 17, 18, 19)
    - **Property 15: Artifact Tab Count Matches Section Count** — `fc.array(fc.record({id, title, type}), {minLength: 1, maxLength: 8})` — validates N tabs for N sections with matching labels
    - **Property 16: Checklist Items Render Checkboxes** — `fc.array(fc.record({id, text, checked: fc.boolean()}), {minLength: 1})` — validates N checkboxes for N items
    - **Property 17: Checklist Toggle Invariant** — re-tested at component level via store integration
    - **Property 18: Accordion Items Expanded by Default** — `fc.array(fc.record({id, title, content}), {minLength: 1})` — validates all items expanded on first render
    - **Property 19: Accordion Toggle Invariant** — re-tested at component level via store integration
    - _Requirements: 6.2, 6.4, 6.5, 6.9, 6.10_

- [x] 10. Checkpoint — full UI assembled
  - Run `npx vitest --run` and confirm all tests pass. Verify the three-pane layout renders in the browser with mock data before proceeding to accessibility and integration tests.

- [ ] 11. Write unit and integration tests for acceptance criteria
  - [x] 11.1 Write unit tests for Library components (`library.test.ts`)
    - Empty state rendering for RecentConversations and PinnedDocuments
    - Conversation click dispatches `loadConversation`; load failure renders error message
    - Pinned document click dispatches `openArtifact`
    - Settings icon click opens settings Sheet
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.8_

  - [x] 11.2 Write unit tests for Command Center components
    - Streaming cursor visible only during streaming for the correct message ID
    - Empty state placeholder rendered when no messages exist
    - Enter submits and clears input; Shift+Enter inserts newline
    - Attachment button opens file picker
    - Slash menu opens on `/` trigger, dismisses on Escape, returns focus to InputBar
    - Arrow-key navigation in slash menu
    - _Requirements: 3.5, 3.7, 5.2, 5.3, 5.4, 5.6, 5.7, 11.5_

  - [ ] 11.3 Write unit tests for Canvas components
    - Canvas slides open when `store.openArtifact` is called; slides closed on close button click
    - Active tab highlighted with indigo accent
    - Markdown section switches to editor on click; returns to render on blur
    - Pin button icon toggles between outline and filled states
    - Download failure toast appears and auto-dismisses after 5s
    - _Requirements: 6.1, 6.3, 6.7, 6.8, 7.1, 7.6, 8.1, 8.2_

  - [ ] 11.4 Write unit tests for theme system
    - Dark class applied to `<html>` when theme is `'dark'`
    - Light class removed when theme switches to `'light'`
    - `localStorage` updated on theme change
    - `localStorage` unavailability handled gracefully (no crash)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 12. Accessibility audit with axe-core
  - [ ] 12.1 Create `src/__tests__/accessibility.test.ts`
    - Run `axe-core` smoke tests on: full App render, Library, CommandCenter, Canvas (open with artifact)
    - Assert zero critical or serious violations
    - _Requirements: 11.1, 11.2_

  - [ ] 12.2 Write property test for ARIA state consistency (Property 24)
    - **Property 24: ARIA State Reflects Component State** — `fc.array(fc.constantFrom('toggle', 'select', 'check'))` — generates random sequences of state transitions on Tab, Accordion header, and checkbox; asserts `aria-selected`, `aria-expanded`, `aria-checked` always match logical state after each step
    - _Requirements: 11.3, 11.6_

  - [ ] 12.3 Write unit tests for ARIA attributes
    - `aria-label="Message input"` present on InputBar textarea
    - `role="tab"` and `aria-selected` on ArtifactTabs triggers
    - `role="button"` and `aria-expanded` on AccordionSection triggers
    - `role="checkbox"` and `aria-checked` on ChecklistRenderer items
    - `aria-label` on Pin and Download buttons
    - Focus trap active inside SlashCommandMenu
    - _Requirements: 11.3, 11.4, 11.5_

- [ ] 13. Final checkpoint — all tests pass
  - Run `npx vitest --run --coverage` and confirm all 24 property tests and all unit/integration tests pass with zero failures. Review coverage report and address any uncovered acceptance criteria.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all 24 correctness properties are in optional sub-tasks
- Each task references specific requirements for full traceability
- Checkpoints (tasks 7, 10, 13) ensure incremental validation at meaningful milestones
- Property tests use `fc.assert(fc.property(...), { numRuns: 100 })` minimum
- Each property test must include the tag comment: `// Feature: nexora-command-canvas-ui, Property {N}: {property_text}`
- No mocking of the Zustand store in component tests — use real store with test initial state for integration fidelity
- `computeRows` and `isSubmittable` should be exported pure functions from `InputBar.tsx` to enable direct unit and property testing
- `shouldAutoScroll`, `shouldShowSlashMenu`, and `replaceSlashCommand` should be exported pure functions from their respective hook files

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["2.3", "3.2", "3.3"] },
    { "id": 4, "tasks": ["3.4", "4.1", "4.2"] },
    { "id": 5, "tasks": ["4.3", "6.1", "6.2", "6.3"] },
    { "id": 6, "tasks": ["6.4", "6.5", "5.1", "5.2", "5.3", "5.4"] },
    { "id": 7, "tasks": ["5.5", "6.6", "8.1", "8.2", "9.1", "9.2", "9.3"] },
    { "id": 8, "tasks": ["5.6", "8.3", "8.4", "9.4"] },
    { "id": 9, "tasks": ["8.5", "8.6", "9.5"] },
    { "id": 10, "tasks": ["8.7", "8.8", "8.9", "9.6"] },
    { "id": 11, "tasks": ["11.1", "11.2", "11.3", "11.4"] },
    { "id": 12, "tasks": ["12.1", "12.2", "12.3"] }
  ]
}
```
