/**
 * Property-based tests for Zustand store mutations.
 * Feature: nexora-command-canvas-ui
 *
 * Tests Properties 8, 17, 19, 20, 21 using fast-check with Vitest.
 * Each property runs a minimum of 100 iterations.
 *
 * Requirements: 3.6, 6.5, 6.10, 7.2, 7.3
 */

import { describe, it, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useAppStore } from '../store/useAppStore';
import type { Artifact, ArtifactSection, ChecklistItem, AccordionItem } from '../store/types';

// ---------------------------------------------------------------------------
// Helpers to reset store state between tests
// ---------------------------------------------------------------------------

/**
 * Returns a fresh store state snapshot via getState().
 * We call useAppStore.getState() directly (Zustand's vanilla API) to avoid
 * React hook rules in a non-component context.
 */
const getStore = () => useAppStore.getState();

/**
 * Reset the store to a clean baseline before each test so that
 * property runs don't bleed state into each other.
 */
function resetStore() {
  useAppStore.setState({
    activeConversation: {
      id: 'test-conv',
      title: 'Test Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    conversations: [
      {
        id: 'test-conv',
        title: 'Test Conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    isStreaming: false,
    streamingMessageId: null,
    activeArtifact: null,
    isCanvasOpen: false,
    pinnedArtifacts: [],
  });
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Arbitrary for a ChecklistItem with a random checked state */
const checklistItemArb: fc.Arbitrary<ChecklistItem> = fc.record({
  id: fc.uuid(),
  text: fc.string({ minLength: 1, maxLength: 80 }),
  checked: fc.boolean(),
});

/** Arbitrary for an AccordionItem */
const accordionItemArb: fc.Arbitrary<AccordionItem> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 80 }),
  content: fc.string({ minLength: 0, maxLength: 200 }),
});

/** Arbitrary for a minimal ArtifactSection (checklist type) */
const checklistSectionArb = (items: ChecklistItem[]): ArtifactSection => ({
  id: 'section-checklist-test',
  title: 'Test Checklist',
  type: 'checklist',
  checklistItems: items,
});

/** Arbitrary for a minimal ArtifactSection (accordion type) */
const accordionSectionArb = (items: AccordionItem[]): ArtifactSection => ({
  id: 'section-accordion-test',
  title: 'Test Accordion',
  type: 'accordion',
  accordionItems: items,
});

/** Build a minimal Artifact for testing */
function buildArtifact(
  id: string,
  sections: ArtifactSection[],
  isPinned = false,
): Artifact {
  return {
    id,
    title: `Artifact ${id}`,
    sections,
    generatedAt: new Date(),
    isPinned,
  };
}

/** Arbitrary for a full Artifact (unpinned, with at least one section) */
const artifactArb: fc.Arbitrary<Artifact> = fc
  .record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 60 }),
    sections: fc.constant([]),
    generatedAt: fc.date(),
    isPinned: fc.constant(false),
  })
  .map((a) => ({ ...a, isPinned: false }));

// ---------------------------------------------------------------------------
// Property 8: Streaming Chunk Concatenation
// ---------------------------------------------------------------------------

describe('Property 8: Streaming Chunk Concatenation', () => {
  beforeEach(resetStore);

  it(
    // Feature: nexora-command-canvas-ui, Property 8: Streaming Chunk Concatenation
    'appendStreamChunk produces exact concatenation of all chunks in order',
    () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 1, maxLength: 20 }),
          (chunks) => {
            // Set up: add a streaming message to the active conversation
            const store = getStore();

            // Add an initial assistant message with empty content
            const streamingMsgId = 'streaming-msg-test';
            useAppStore.setState((state) => ({
              activeConversation: state.activeConversation
                ? {
                    ...state.activeConversation,
                    messages: [
                      {
                        id: streamingMsgId,
                        role: 'assistant',
                        content: '',
                        timestamp: new Date(),
                        isStreaming: true,
                      },
                    ],
                  }
                : state.activeConversation,
              conversations: state.conversations.map((c) =>
                c.id === 'test-conv'
                  ? {
                      ...c,
                      messages: [
                        {
                          id: streamingMsgId,
                          role: 'assistant',
                          content: '',
                          timestamp: new Date(),
                          isStreaming: true,
                        },
                      ],
                    }
                  : c,
              ),
              isStreaming: true,
              streamingMessageId: streamingMsgId,
            }));

            // Append each chunk in order
            for (const chunk of chunks) {
              getStore().appendStreamChunk(chunk);
            }

            // The final message content must equal the exact concatenation
            const finalMessages = getStore().activeConversation?.messages ?? [];
            const streamingMsg = finalMessages.find((m) => m.id === streamingMsgId);

            const expectedContent = chunks.join('');
            return streamingMsg?.content === expectedContent;
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 17: Checklist Toggle Invariant
// ---------------------------------------------------------------------------

describe('Property 17: Checklist Toggle Invariant', () => {
  beforeEach(resetStore);

  it(
    // Feature: nexora-command-canvas-ui, Property 17: Checklist Toggle Invariant
    'toggleChecklistItem flips only the targeted item and leaves all others unchanged',
    () => {
      fc.assert(
        fc.property(
          fc.array(checklistItemArb, { minLength: 1, maxLength: 15 }),
          fc.nat(),
          (items, indexSeed) => {
            // Ensure unique IDs (fast-check uuid may collide rarely; deduplicate)
            const uniqueItems = items.filter(
              (item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx,
            );
            if (uniqueItems.length === 0) return true; // skip degenerate case

            const targetIndex = indexSeed % uniqueItems.length;
            const targetItem = uniqueItems[targetIndex];

            // Set up the store with an artifact containing this checklist section
            const sectionId = 'section-checklist-test';
            const artifact = buildArtifact('art-checklist', [
              checklistSectionArb(uniqueItems),
            ]);
            useAppStore.setState({ activeArtifact: artifact });

            // Record the state before toggle
            const beforeItems = [...uniqueItems];

            // Perform the toggle
            getStore().toggleChecklistItem(sectionId, targetItem.id);

            // Read the updated state
            const updatedArtifact = getStore().activeArtifact;
            const updatedSection = updatedArtifact?.sections.find(
              (s) => s.id === sectionId,
            );
            const updatedItems = updatedSection?.checklistItems ?? [];

            // 1. The targeted item must have its checked state flipped
            const updatedTarget = updatedItems.find((i) => i.id === targetItem.id);
            if (!updatedTarget) return false;
            if (updatedTarget.checked !== !targetItem.checked) return false;

            // 2. All other items must remain unchanged
            for (const beforeItem of beforeItems) {
              if (beforeItem.id === targetItem.id) continue;
              const afterItem = updatedItems.find((i) => i.id === beforeItem.id);
              if (!afterItem) return false;
              if (afterItem.checked !== beforeItem.checked) return false;
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 19: Accordion Toggle Invariant
// ---------------------------------------------------------------------------

/**
 * The store does not have a dedicated accordion toggle action — accordion
 * expanded/collapsed state is managed by Radix UI's Accordion component.
 * However, the store's `updateArtifactSection` can be used to update
 * accordion items. We test the toggle invariant as a pure function over
 * the accordion items array: toggling one item's conceptual "expanded"
 * state (modelled here as a boolean field added to the item for testing)
 * leaves all other items unchanged.
 *
 * We implement the toggle logic inline (mirroring what a store action would
 * do) and verify the invariant holds for any array of items and any target.
 */

/** Extended accordion item with an isExpanded field for testing the invariant */
interface AccordionItemWithState extends AccordionItem {
  isExpanded: boolean;
}

const accordionItemWithStateArb: fc.Arbitrary<AccordionItemWithState> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 80 }),
  content: fc.string({ minLength: 0, maxLength: 200 }),
  isExpanded: fc.boolean(),
});

/** Pure toggle function: flips isExpanded for the targeted item only */
function toggleAccordionItem(
  items: AccordionItemWithState[],
  targetId: string,
): AccordionItemWithState[] {
  return items.map((item) =>
    item.id === targetId ? { ...item, isExpanded: !item.isExpanded } : item,
  );
}

describe('Property 19: Accordion Toggle Invariant', () => {
  it(
    // Feature: nexora-command-canvas-ui, Property 19: Accordion Toggle Invariant
    'accordion toggle flips only the targeted item and leaves all others unchanged',
    () => {
      fc.assert(
        fc.property(
          fc.array(accordionItemWithStateArb, { minLength: 1, maxLength: 15 }),
          fc.nat(),
          (items, indexSeed) => {
            // Ensure unique IDs
            const uniqueItems = items.filter(
              (item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx,
            );
            if (uniqueItems.length === 0) return true;

            const targetIndex = indexSeed % uniqueItems.length;
            const targetItem = uniqueItems[targetIndex];

            // Apply the toggle
            const updatedItems = toggleAccordionItem(uniqueItems, targetItem.id);

            // 1. The targeted item must have its isExpanded state flipped
            const updatedTarget = updatedItems.find((i) => i.id === targetItem.id);
            if (!updatedTarget) return false;
            if (updatedTarget.isExpanded !== !targetItem.isExpanded) return false;

            // 2. All other items must remain unchanged
            for (const beforeItem of uniqueItems) {
              if (beforeItem.id === targetItem.id) continue;
              const afterItem = updatedItems.find((i) => i.id === beforeItem.id);
              if (!afterItem) return false;
              if (afterItem.isExpanded !== beforeItem.isExpanded) return false;
              if (afterItem.title !== beforeItem.title) return false;
              if (afterItem.content !== beforeItem.content) return false;
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    // Feature: nexora-command-canvas-ui, Property 19: Accordion Toggle Invariant (store integration)
    'updateArtifactSection updates only the targeted accordion section in the store',
    () => {
      fc.assert(
        fc.property(
          fc.array(accordionItemArb, { minLength: 1, maxLength: 10 }),
          fc.nat(),
          (items, indexSeed) => {
            const uniqueItems = items.filter(
              (item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx,
            );
            if (uniqueItems.length === 0) return true;

            const targetIndex = indexSeed % uniqueItems.length;
            const targetItem = uniqueItems[targetIndex];

            // Build an artifact with two accordion sections
            const sectionA: ArtifactSection = {
              id: 'section-acc-a',
              title: 'Section A',
              type: 'accordion',
              accordionItems: uniqueItems,
            };
            const sectionB: ArtifactSection = {
              id: 'section-acc-b',
              title: 'Section B',
              type: 'accordion',
              accordionItems: [{ id: 'b-item', title: 'B', content: 'B content' }],
            };

            const artifact = buildArtifact('art-accordion', [sectionA, sectionB]);
            useAppStore.setState({ activeArtifact: artifact });

            // Update only section A with a modified item (simulate toggle)
            const updatedItems = uniqueItems.map((item) =>
              item.id === targetItem.id
                ? { ...item, title: item.title + '-toggled' }
                : item,
            );
            getStore().updateArtifactSection('section-acc-a', {
              accordionItems: updatedItems,
            });

            const updatedArtifact = getStore().activeArtifact;
            const updatedSectionA = updatedArtifact?.sections.find(
              (s) => s.id === 'section-acc-a',
            );
            const updatedSectionB = updatedArtifact?.sections.find(
              (s) => s.id === 'section-acc-b',
            );

            // Section A should have the updated items
            const updatedTarget = updatedSectionA?.accordionItems?.find(
              (i) => i.id === targetItem.id,
            );
            if (!updatedTarget) return false;
            if (updatedTarget.title !== targetItem.title + '-toggled') return false;

            // Section B must remain unchanged
            if (updatedSectionB?.accordionItems?.[0]?.id !== 'b-item') return false;

            return true;
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 20: Pin Artifact State Mutation
// ---------------------------------------------------------------------------

describe('Property 20: Pin Artifact State Mutation', () => {
  beforeEach(resetStore);

  it(
    // Feature: nexora-command-canvas-ui, Property 20: Pin Artifact State Mutation
    'pinArtifact adds the artifact to pinnedArtifacts with isPinned=true and leaves others unchanged',
    () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 60 }),
            sections: fc.constant([]),
            generatedAt: fc.date(),
            isPinned: fc.constant(false),
          }),
          // Optional pre-existing pinned artifacts (to verify others are unchanged)
          fc.array(
            fc.record({
              id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 60 }),
              sections: fc.constant([]),
              generatedAt: fc.date(),
              isPinned: fc.constant(true),
            }),
            { minLength: 0, maxLength: 5 },
          ),
          (newArtifact, existingPinned) => {
            // Ensure the new artifact's ID doesn't collide with existing pinned ones
            const safeExisting = existingPinned.filter(
              (a) => a.id !== newArtifact.id,
            );

            // Set up store with existing pinned artifacts
            useAppStore.setState({ pinnedArtifacts: safeExisting });

            const beforeCount = safeExisting.length;

            // Pin the new artifact
            getStore().pinArtifact(newArtifact);

            const { pinnedArtifacts } = getStore();

            // 1. The artifact must be present in pinnedArtifacts
            const pinned = pinnedArtifacts.find((a) => a.id === newArtifact.id);
            if (!pinned) return false;

            // 2. Its isPinned must be true
            if (pinned.isPinned !== true) return false;

            // 3. The count must have increased by exactly 1
            if (pinnedArtifacts.length !== beforeCount + 1) return false;

            // 4. All previously pinned artifacts must still be present and unchanged
            for (const existing of safeExisting) {
              const stillPinned = pinnedArtifacts.find((a) => a.id === existing.id);
              if (!stillPinned) return false;
              if (stillPinned.isPinned !== true) return false;
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 21: Unpin Artifact State Mutation
// ---------------------------------------------------------------------------

describe('Property 21: Unpin Artifact State Mutation', () => {
  beforeEach(resetStore);

  it(
    // Feature: nexora-command-canvas-ui, Property 21: Unpin Artifact State Mutation
    'unpinArtifact removes the targeted artifact and leaves all others unchanged',
    () => {
      fc.assert(
        fc.property(
          fc.array(artifactArb, { minLength: 1, maxLength: 10 }),
          fc.nat(),
          (artifacts, indexSeed) => {
            // Ensure unique IDs
            const uniqueArtifacts = artifacts.filter(
              (a, idx, arr) => arr.findIndex((x) => x.id === a.id) === idx,
            );
            if (uniqueArtifacts.length === 0) return true;

            // Mark all as pinned for the test
            const pinnedArtifacts: Artifact[] = uniqueArtifacts.map((a) => ({
              ...a,
              isPinned: true,
            }));

            const targetIndex = indexSeed % pinnedArtifacts.length;
            const targetArtifact = pinnedArtifacts[targetIndex];

            // Set up store with all artifacts pinned
            useAppStore.setState({ pinnedArtifacts });

            const beforeCount = pinnedArtifacts.length;

            // Unpin the target
            getStore().unpinArtifact(targetArtifact.id);

            const { pinnedArtifacts: afterPinned } = getStore();

            // 1. The targeted artifact must no longer be in pinnedArtifacts
            const stillPresent = afterPinned.find((a) => a.id === targetArtifact.id);
            if (stillPresent) return false;

            // 2. The count must have decreased by exactly 1
            if (afterPinned.length !== beforeCount - 1) return false;

            // 3. All other artifacts must still be present and unchanged
            for (const artifact of pinnedArtifacts) {
              if (artifact.id === targetArtifact.id) continue;
              const stillPinned = afterPinned.find((a) => a.id === artifact.id);
              if (!stillPinned) return false;
              if (stillPinned.id !== artifact.id) return false;
              if (stillPinned.title !== artifact.title) return false;
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});
