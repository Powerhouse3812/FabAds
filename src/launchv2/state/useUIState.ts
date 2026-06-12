import { useCallback, useState } from 'react';

export interface UIState {
  openPanels: string[];
  focusedItems: Record<string, string>;
}

export function useUIState(initial?: UIState) {
  const [state, setState] = useState<UIState>(
    initial ?? { openPanels: [], focusedItems: {} }
  );

  const openPanel = useCallback((id: string) => {
    setState(s => ({ ...s, openPanels: [...s.openPanels.filter(p => p !== id), id] }));
  }, []);

  const closePanel = useCallback((id: string) => {
    setState(s => ({ ...s, openPanels: s.openPanels.filter(p => p !== id) }));
  }, []);

  const setFocusedItem = useCallback((panelId: string, itemId: string) => {
    setState(s => ({ ...s, focusedItems: { ...s.focusedItems, [panelId]: itemId } }));
  }, []);

  const clearFocusedItem = useCallback((panelId: string) => {
    setState(s => {
      const next = { ...s.focusedItems };
      delete next[panelId];
      return { ...s, focusedItems: next };
    });
  }, []);

  return { state, openPanel, closePanel, setFocusedItem, clearFocusedItem };
}
