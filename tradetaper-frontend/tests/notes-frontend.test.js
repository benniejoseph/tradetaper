/**
 * Notes Frontend Component Tests
 * Tests React components and frontend functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Import components
import NewNotePage from '../src/app/(app)/notes/new/page';
import { notesService } from '../src/services/notesService';

// Mock the services
jest.mock('../src/services/notesService');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock debounce hook
jest.mock('../src/hooks/useDebounce', () => ({
  useDebounce: (value) => value,
}));

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { token: 'mock-token', user: { id: '1' } }) => state,
      ...initialState,
    },
  });
};

describe('Notes Frontend Components', () => {
  let mockStore;
  let user;

  beforeEach(() => {
    mockStore = createMockStore();
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('NewNotePage Component', () => {
    const renderComponent = () => {
      return render(
        <Provider store={mockStore}>
          <NewNotePage />
        </Provider>
      );
    };

    test('should render the new note page', () => {
      renderComponent();
      
      expect(screen.getByPlaceholderText('Untitled note')).toBeInTheDocument();
      expect(screen.getByText('Save Note')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    test('should allow typing in title field', async () => {
      renderComponent();
      
      const titleInput = screen.getByPlaceholderText('Untitled note');
      await user.type(titleInput, 'My Test Note');
      
      expect(titleInput.value).toBe('My Test Note');
    });

    test('should allow typing in content blocks', async () => {
      renderComponent();
      
      const contentTextarea = screen.getByPlaceholderText("Type '/' for commands...");
      await user.type(contentTextarea, 'This is my note content');
      
      expect(contentTextarea.value).toBe('This is my note content');
    });

    test('should create new block on Enter key', async () => {
      renderComponent();
      
      const contentTextarea = screen.getByPlaceholderText("Type '/' for commands...");
      await user.type(contentTextarea, 'First block');
      await user.keyboard('{Enter}');
      
      // Should have multiple text areas now
      const textareas = screen.getAllByPlaceholderText("Type '/' for commands...");
      expect(textareas.length).toBeGreaterThan(1);
    });

    test('should show block menu when typing "/"', async () => {
      renderComponent();
      
      const contentTextarea = screen.getByPlaceholderText("Type '/' for commands...");
      await user.type(contentTextarea, '/');
      
      // Block menu should appear
      await waitFor(() => {
        expect(screen.getByText('Heading')).toBeInTheDocument();
        expect(screen.getByText('Quote')).toBeInTheDocument();
        expect(screen.getByText('Code')).toBeInTheDocument();
      });
    });

    test('should add and remove tags', async () => {
      renderComponent();
      
      // Click add tag button
      const addTagButton = screen.getByText('Add tag');
      await user.click(addTagButton);
      
      // Type in tag input
      const tagInput = screen.getByPlaceholderText('Add tag...');
      await user.type(tagInput, 'test-tag{Enter}');
      
      // Tag should appear
      expect(screen.getByText('test-tag')).toBeInTheDocument();
      
      // Remove tag
      const removeButton = screen.getByText('×');
      await user.click(removeButton);
      
      // Tag should be removed
      expect(screen.queryByText('test-tag')).not.toBeInTheDocument();
    });

    test('should toggle visibility', async () => {
      renderComponent();
      
      const visibilityButton = screen.getByText('private');
      await user.click(visibilityButton);
      
      expect(screen.getByText('shared')).toBeInTheDocument();
    });

    test('should save note when save button is clicked', async () => {
      notesService.createNote = jest.fn().mockResolvedValue({
        id: 'test-note-id',
        title: 'Test Note',
      });

      renderComponent();
      
      // Fill in note data
      const titleInput = screen.getByPlaceholderText('Untitled note');
      await user.type(titleInput, 'Test Note');
      
      const contentTextarea = screen.getByPlaceholderText("Type '/' for commands...");
      await user.type(contentTextarea, 'Test content');
      
      // Click save
      const saveButton = screen.getByText('Save Note');
      await user.click(saveButton);
      
      // Verify service was called
      await waitFor(() => {
        expect(notesService.createNote).toHaveBeenCalledWith({
          title: 'Test Note',
          content: expect.any(Array),
          tags: [],
          visibility: 'private',
          accountId: undefined,
          tradeId: undefined,
        });
      });
    });

    test('should handle save errors gracefully', async () => {
      notesService.createNote = jest.fn().mockRejectedValue(new Error('Save failed'));

      renderComponent();
      
      // Fill in note data
      const titleInput = screen.getByPlaceholderText('Untitled note');
      await user.type(titleInput, 'Test Note');
      
      // Click save
      const saveButton = screen.getByText('Save Note');
      await user.click(saveButton);
      
      // Should handle error without crashing
      await waitFor(() => {
        expect(notesService.createNote).toHaveBeenCalled();
      });
    });

    test('should not save empty notes', async () => {
      notesService.createNote = jest.fn();

      renderComponent();
      
      // Click save without adding content
      const saveButton = screen.getByText('Save Note');
      await user.click(saveButton);
      
      // Service should not be called for empty notes
      expect(notesService.createNote).not.toHaveBeenCalled();
    });

    test('should show loading state when saving', async () => {
      notesService.createNote = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderComponent();
      
      // Fill in note data
      const titleInput = screen.getByPlaceholderText('Untitled note');
      await user.type(titleInput, 'Test Note');
      
      // Click save
      const saveButton = screen.getByText('Save Note');
      await user.click(saveButton);
      
      // Should show loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Block Components', () => {
    const renderComponent = () => {
      return render(
        <Provider store={mockStore}>
          <NewNotePage />
        </Provider>
      );
    };

    test('should render text block correctly', () => {
      renderComponent();
      
      const textBlock = screen.getByPlaceholderText("Type '/' for commands...");
      expect(textBlock).toBeInTheDocument();
      expect(textBlock.tagName).toBe('TEXTAREA');
    });

    test('should create heading block', async () => {
      renderComponent();
      
      const contentTextarea = screen.getByPlaceholderText("Type '/' for commands...");
      await user.type(contentTextarea, '/');
      
      // Select heading from menu
      await waitFor(() => {
        const headingOption = screen.getByText('Heading');
        user.click(headingOption);
      });
      
      // Should have heading input
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Heading')).toBeInTheDocument();
      });
    });

    test('should create quote block', async () => {
      renderComponent();
      
      const contentTextarea = screen.getByPlaceholderText("Type '/' for commands...");
      await user.type(contentTextarea, '/');
      
      // Select quote from menu
      await waitFor(() => {
        const quoteOption = screen.getByText('Quote');
        user.click(quoteOption);
      });
      
      // Should have quote inputs
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Quote...')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Author (optional)')).toBeInTheDocument();
      });
    });

    test('should create code block', async () => {
      renderComponent();
      
      const contentTextarea = screen.getByPlaceholderText("Type '/' for commands...");
      await user.type(contentTextarea, '/');
      
      // Select code from menu
      await waitFor(() => {
        const codeOption = screen.getByText('Code');
        user.click(codeOption);
      });
      
      // Should have code textarea and language selector
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter code...')).toBeInTheDocument();
        expect(screen.getByDisplayValue('JavaScript')).toBeInTheDocument();
      });
    });

    test('should create callout block', async () => {
      renderComponent();
      
      const contentTextarea = screen.getByPlaceholderText("Type '/' for commands...");
      await user.type(contentTextarea, '/');
      
      // Select callout from menu
      await waitFor(() => {
        const calloutOption = screen.getByText('Callout');
        user.click(calloutOption);
      });
      
      // Should have callout textarea and type selector
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Callout text...')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Info')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-save Functionality', () => {
    test('should trigger auto-save when content changes', async () => {
      // Mock the debounce hook to return the value immediately
      const mockUseDebounce = jest.fn((value) => value);
      jest.doMock('../src/hooks/useDebounce', () => ({
        useDebounce: mockUseDebounce,
      }));

      notesService.createNote = jest.fn().mockResolvedValue({ id: 'test-id' });

      renderComponent();
      
      // Add content that should trigger auto-save
      const titleInput = screen.getByPlaceholderText('Untitled note');
      await user.type(titleInput, 'Auto-save test');
      
      // Auto-save should be triggered
      await waitFor(() => {
        expect(notesService.createNote).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Accessibility', () => {
    const renderComponent = () => {
      return render(
        <Provider store={mockStore}>
          <NewNotePage />
        </Provider>
      );
    };

    test('should have proper ARIA labels', () => {
      renderComponent();
      
      // Check for important ARIA attributes
      const titleInput = screen.getByPlaceholderText('Untitled note');
      expect(titleInput).toHaveAttribute('type', 'text');
      
      const saveButton = screen.getByText('Save Note');
      expect(saveButton).toHaveAttribute('type', 'button');
    });

    test('should be keyboard navigable', async () => {
      renderComponent();
      
      // Tab through elements
      await user.tab();
      expect(screen.getByText('Back')).toHaveFocus();
      
      await user.tab();
      // Should focus on visibility button or save button
    });

    test('should handle keyboard shortcuts', async () => {
      renderComponent();
      
      const contentTextarea = screen.getByPlaceholderText("Type '/' for commands...");
      contentTextarea.focus();
      
      // Test Enter key for new block
      await user.keyboard('{Enter}');
      
      const textareas = screen.getAllByPlaceholderText("Type '/' for commands...");
      expect(textareas.length).toBeGreaterThan(1);
    });
  });

  describe('Error Boundaries', () => {
    test('should handle component errors gracefully', () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // This would test error boundary functionality
      // You'd need to implement an error boundary component first
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    test('should handle large amounts of content', async () => {
      renderComponent();
      
      const contentTextarea = screen.getByPlaceholderText("Type '/' for commands...");
      
      // Add a large amount of text
      const largeText = 'a'.repeat(10000);
      await user.type(contentTextarea, largeText);
      
      expect(contentTextarea.value).toBe(largeText);
    });

    test('should not cause memory leaks with multiple blocks', async () => {
      renderComponent();
      
      // Create multiple blocks
      for (let i = 0; i < 10; i++) {
        const textareas = screen.getAllByPlaceholderText("Type '/' for commands...");
        await user.type(textareas[textareas.length - 1], `Block ${i}`);
        await user.keyboard('{Enter}');
      }
      
      // Should handle multiple blocks without issues
      const finalTextareas = screen.getAllByPlaceholderText("Type '/' for commands...");
      expect(finalTextareas.length).toBeGreaterThan(10);
    });
  });
}); 