// src/hooks/useKeyboardShortcuts.ts
import { useEffect, useCallback } from 'react';

type KeyMap = Record<string, () => void>;

interface KeyboardShortcutOptions {
  onlyWhenFocused?: boolean;
  preventDefault?: boolean;
  enabledWhen?: boolean;
}

/**
 * Hook to handle keyboard shortcuts
 * @param keyMap - Object mapping key combinations to handler functions
 * @param options - Options for keyboard shortcut behavior
 */
export function useKeyboardShortcuts(
  keyMap: KeyMap,
  options: KeyboardShortcutOptions = {}
) {
  const {
    onlyWhenFocused = false,
    preventDefault = true,
    enabledWhen = true
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabledWhen) return;

      // Skip if we should only listen when focused and we're in an input, textarea, or select
      if (
        onlyWhenFocused &&
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.tagName === 'SELECT')
      ) {
        return;
      }

      // Construct key string
      let keyString = '';
      if (event.ctrlKey) keyString += 'ctrl+';
      if (event.altKey) keyString += 'alt+';
      if (event.shiftKey) keyString += 'shift+';
      if (event.metaKey) keyString += 'meta+';
      keyString += event.key.toLowerCase();

      // Look for match in keyMap and execute handler
      const handler = keyMap[keyString];
      if (handler) {
        if (preventDefault) {
          event.preventDefault();
        }
        handler();
      }
    },
    [keyMap, onlyWhenFocused, preventDefault, enabledWhen]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Adds aria-keyshortcuts attribute to a DOM element
 * @param ref - React ref to the DOM element
 * @param shortcuts - Array of keyboard shortcuts
 */
export function useAriaKeyShortcuts(
  ref: React.RefObject<HTMLElement>,
  shortcuts: string[]
) {
  useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute('aria-keyshortcuts', shortcuts.join(' '));
    }
  }, [ref, shortcuts]);
}