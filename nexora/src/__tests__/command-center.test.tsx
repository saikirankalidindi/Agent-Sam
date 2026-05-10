/**
 * Unit tests for Command Center components.
 *
 * Requirements: 3.5, 3.7, 5.2, 5.3, 5.4, 5.6, 5.7, 11.5
 *
 * Strategy:
 *   - Use the real Zustand store; reset state via useAppStore.setState(...)
 *     before each test that needs a specific initial state.
 *   - No mocking of the store.
 */

import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

// ---------------------------------------------------------------------------
// jsdom polyfills
// ---------------------------------------------------------------------------

// IntersectionObserver is not available in jsdom; provide a no-op class stub so
// that components using useAutoScroll (e.g. MessageList) can render without errors.
if (typeof window.IntersectionObserver === 'undefined') {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;
}

// scrollIntoView is not implemented in jsdom; stub it on the prototype.
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}

import { useAppStore } from '../store/useAppStore';
import { StreamingCursor } from '../components/command-center/StreamingCursor';
import { MessageList } from '../components/command-center/MessageList';
import { InputBar } from '../components/command-center/InputBar';
import { SlashCommandMenu } from '../components/command-center/SlashCommandMenu';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset the store to a clean baseline before each test. */
function resetStore() {
  useAppStore.setState({
    activeConversation: null,
    isStreaming: false,
    streamingMessageId: null,
    inputValue: '',
  });
}

// ---------------------------------------------------------------------------
// StreamingCursor
// ---------------------------------------------------------------------------

describe('StreamingCursor', () => {
  beforeEach(resetStore);

  it('renders when isStreaming=true and messageId matches streamingMessageId', () => {
    useAppStore.setState({ isStreaming: true, streamingMessageId: 'msg-abc' });

    const { container } = render(<StreamingCursor messageId="msg-abc" />);

    // The cursor is a <span> with animate-pulse class
    const cursor = container.querySelector('span.animate-pulse');
    expect(cursor).toBeInTheDocument();
  });

  it('does NOT render when isStreaming=false', () => {
    useAppStore.setState({ isStreaming: false, streamingMessageId: 'msg-abc' });

    const { container } = render(<StreamingCursor messageId="msg-abc" />);

    expect(container.querySelector('span.animate-pulse')).not.toBeInTheDocument();
  });

  it('does NOT render when messageId does not match streamingMessageId', () => {
    useAppStore.setState({ isStreaming: true, streamingMessageId: 'msg-xyz' });

    const { container } = render(<StreamingCursor messageId="msg-different" />);

    expect(container.querySelector('span.animate-pulse')).not.toBeInTheDocument();
  });

  it('does NOT render when both isStreaming=false and messageId does not match', () => {
    useAppStore.setState({ isStreaming: false, streamingMessageId: null });

    const { container } = render(<StreamingCursor messageId="msg-abc" />);

    expect(container.querySelector('span.animate-pulse')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MessageList — empty state
// ---------------------------------------------------------------------------

describe('MessageList', () => {
  beforeEach(resetStore);

  it('renders empty state placeholder when no messages exist (null conversation)', () => {
    useAppStore.setState({ activeConversation: null });

    render(<MessageList />);

    expect(
      screen.getByText('Start a conversation to get started.'),
    ).toBeInTheDocument();
  });

  it('renders empty state placeholder when conversation has zero messages', () => {
    useAppStore.setState({
      activeConversation: {
        id: 'conv-empty',
        title: 'Empty',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    render(<MessageList />);

    expect(
      screen.getByText('Start a conversation to get started.'),
    ).toBeInTheDocument();
  });

  it('renders messages when conversation has messages', () => {
    useAppStore.setState({
      activeConversation: {
        id: 'conv-1',
        title: 'Test',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello world',
            timestamp: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    render(<MessageList />);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(
      screen.queryByText('Start a conversation to get started.'),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// InputBar — Enter submits and clears; Shift+Enter inserts newline
// ---------------------------------------------------------------------------

describe('InputBar — keyboard behaviour', () => {
  beforeEach(resetStore);

  it('pressing Enter submits the message and clears the input', async () => {
    useAppStore.setState({
      inputValue: '',
      activeConversation: {
        id: 'conv-1',
        title: 'Test',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const user = userEvent.setup();
    render(<InputBar />);

    const textarea = screen.getByRole('textbox', { name: /message input/i });

    await user.click(textarea);
    await user.type(textarea, 'Hello');

    // Verify text was typed
    expect(useAppStore.getState().inputValue).toBe('Hello');

    await user.keyboard('{Enter}');

    // After submit the input should be cleared
    expect(useAppStore.getState().inputValue).toBe('');

    // The message should have been added to the conversation
    const messages = useAppStore.getState().activeConversation?.messages ?? [];
    expect(messages.some((m) => m.content === 'Hello' && m.role === 'user')).toBe(true);
  });

  it('pressing Shift+Enter inserts a newline without submitting', async () => {
    useAppStore.setState({
      inputValue: '',
      activeConversation: {
        id: 'conv-1',
        title: 'Test',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const user = userEvent.setup();
    render(<InputBar />);

    const textarea = screen.getByRole('textbox', { name: /message input/i });

    await user.click(textarea);
    await user.type(textarea, 'Line one');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    await user.type(textarea, 'Line two');

    // Input should contain a newline — not submitted
    const value = useAppStore.getState().inputValue;
    expect(value).toContain('\n');
    expect(value).toContain('Line one');
    expect(value).toContain('Line two');

    // No messages should have been added
    const messages = useAppStore.getState().activeConversation?.messages ?? [];
    expect(messages).toHaveLength(0);
  });

  it('send button is disabled when input is empty', () => {
    useAppStore.setState({ inputValue: '' });

    render(<InputBar />);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
  });

  it('send button is disabled when input contains only whitespace', async () => {
    useAppStore.setState({ inputValue: '   ' });

    render(<InputBar />);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
  });

  it('send button is enabled when input has non-whitespace content', async () => {
    useAppStore.setState({ inputValue: 'Hello' });

    render(<InputBar />);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// InputBar — attachment button opens file picker
// ---------------------------------------------------------------------------

describe('InputBar — attachment button', () => {
  beforeEach(resetStore);

  it('hidden file input exists in the DOM', () => {
    render(<InputBar />);

    // The hidden file input should be present (aria-hidden, type="file")
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it('attachment button is present and accessible', () => {
    render(<InputBar />);

    const attachButton = screen.getByRole('button', { name: /attach file/i });
    expect(attachButton).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// InputBar — slash command menu opens on "/" trigger
// ---------------------------------------------------------------------------

describe('InputBar — slash command menu', () => {
  beforeEach(resetStore);

  it('typing "/" at the start of input shows the slash command menu', async () => {
    useAppStore.setState({ inputValue: '' });

    const user = userEvent.setup();
    render(<InputBar />);

    const textarea = screen.getByRole('textbox', { name: /message input/i });
    await user.click(textarea);
    await user.type(textarea, '/');

    // The slash command menu should be visible (role="listbox")
    expect(screen.getByRole('listbox', { name: /slash commands/i })).toBeInTheDocument();
  });

  it('slash command menu lists the four available commands', async () => {
    useAppStore.setState({ inputValue: '' });

    const user = userEvent.setup();
    render(<InputBar />);

    const textarea = screen.getByRole('textbox', { name: /message input/i });
    await user.click(textarea);
    await user.type(textarea, '/');

    const menu = screen.getByRole('listbox', { name: /slash commands/i });
    const options = within(menu).getAllByRole('option');
    expect(options).toHaveLength(4);
  });

  it('slash command menu is NOT shown when input does not start with "/"', async () => {
    useAppStore.setState({ inputValue: '' });

    const user = userEvent.setup();
    render(<InputBar />);

    const textarea = screen.getByRole('textbox', { name: /message input/i });
    await user.click(textarea);
    await user.type(textarea, 'hello');

    expect(screen.queryByRole('listbox', { name: /slash commands/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// SlashCommandMenu — Escape dismisses and returns focus to InputBar
// ---------------------------------------------------------------------------

describe('SlashCommandMenu — keyboard navigation and Escape', () => {
  /** Render the menu in an open state with a real textarea ref. */
  function renderOpenMenu(selectedIndex = 0) {
    // We need a real textarea to test focus return
    const TestWrapper = () => {
      const textareaRef = { current: null as HTMLTextAreaElement | null };
      return (
        <div>
          <textarea
            ref={(el) => {
              textareaRef.current = el;
            }}
            aria-label="Message input"
            data-testid="textarea"
          />
          <SlashCommandMenu
            isOpen={true}
            onSelect={() => {}}
            onClose={() => {
              // In real usage the parent closes the menu; here we just test Escape
            }}
            inputRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
            selectedIndex={selectedIndex}
            setSelectedIndex={() => {}}
          />
        </div>
      );
    };

    return render(<TestWrapper />);
  }

  it('renders the menu with role="listbox" when isOpen=true', () => {
    renderOpenMenu();
    expect(screen.getByRole('listbox', { name: /slash commands/i })).toBeInTheDocument();
  });

  it('does NOT render when isOpen=false', () => {
    const noop = () => {};
    const ref = { current: null } as React.RefObject<HTMLTextAreaElement>;
    render(
      <SlashCommandMenu
        isOpen={false}
        onSelect={noop}
        onClose={noop}
        inputRef={ref}
        selectedIndex={0}
        setSelectedIndex={noop}
      />,
    );
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('pressing Escape dismisses the menu and returns focus to the InputBar', async () => {
    let closed = false;
    const textareaRef = { current: null as HTMLTextAreaElement | null };

    const TestWrapper = () => (
      <div>
        <textarea
          ref={(el) => {
            textareaRef.current = el;
          }}
          aria-label="Message input"
          data-testid="textarea"
        />
        <SlashCommandMenu
          isOpen={!closed}
          onSelect={() => {}}
          onClose={() => {
            closed = true;
          }}
          inputRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
          selectedIndex={0}
          setSelectedIndex={() => {}}
        />
      </div>
    );

    render(<TestWrapper />);

    const menu = screen.getByRole('listbox', { name: /slash commands/i });

    // Fire Escape on the menu container
    fireEvent.keyDown(menu, { key: 'Escape', code: 'Escape' });

    expect(closed).toBe(true);
  });

  it('pressing Escape returns focus to the textarea', async () => {
    const textareaRef = { current: null as HTMLTextAreaElement | null };

    const TestWrapper = () => (
      <div>
        <textarea
          ref={(el) => {
            textareaRef.current = el;
          }}
          aria-label="Message input"
          data-testid="textarea"
        />
        <SlashCommandMenu
          isOpen={true}
          onSelect={() => {}}
          onClose={() => {}}
          inputRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
          selectedIndex={0}
          setSelectedIndex={() => {}}
        />
      </div>
    );

    render(<TestWrapper />);

    const menu = screen.getByRole('listbox', { name: /slash commands/i });
    fireEvent.keyDown(menu, { key: 'Escape', code: 'Escape' });

    // Focus should have moved to the textarea
    expect(document.activeElement).toBe(screen.getByTestId('textarea'));
  });

  it('ArrowDown moves selection to the next item', () => {
    let currentIndex = 0;
    const setSelectedIndex = (idx: number) => {
      currentIndex = idx;
    };

    const TestWrapper = () => {
      const textareaRef = { current: null } as React.RefObject<HTMLTextAreaElement>;
      return (
        <SlashCommandMenu
          isOpen={true}
          onSelect={() => {}}
          onClose={() => {}}
          inputRef={textareaRef}
          selectedIndex={0}
          setSelectedIndex={setSelectedIndex}
        />
      );
    };

    render(<TestWrapper />);

    const menu = screen.getByRole('listbox', { name: /slash commands/i });
    fireEvent.keyDown(menu, { key: 'ArrowDown', code: 'ArrowDown' });

    // selectedIndex should have been updated to 1
    expect(currentIndex).toBe(1);
  });

  it('ArrowUp moves selection to the previous item (wraps around)', () => {
    let currentIndex = 0;
    const setSelectedIndex = (idx: number) => {
      currentIndex = idx;
    };

    const TestWrapper = () => {
      const textareaRef = { current: null } as React.RefObject<HTMLTextAreaElement>;
      return (
        <SlashCommandMenu
          isOpen={true}
          onSelect={() => {}}
          onClose={() => {}}
          inputRef={textareaRef}
          selectedIndex={0}
          setSelectedIndex={setSelectedIndex}
        />
      );
    };

    render(<TestWrapper />);

    const menu = screen.getByRole('listbox', { name: /slash commands/i });
    fireEvent.keyDown(menu, { key: 'ArrowUp', code: 'ArrowUp' });

    // From index 0, ArrowUp should wrap to the last item (index 3 for 4 commands)
    expect(currentIndex).toBe(3);
  });

  it('each menu item has role="option" and aria-selected', () => {
    renderOpenMenu(1);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);

    // The item at selectedIndex=1 should have aria-selected="true"
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    // Others should have aria-selected="false"
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[2]).toHaveAttribute('aria-selected', 'false');
    expect(options[3]).toHaveAttribute('aria-selected', 'false');
  });
});
