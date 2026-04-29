import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { deriveModuleFromPath, type CopilotModule } from "@/lib/copilot-prompts";

interface CopilotContextType {
  isOpen: boolean;
  isPinned: boolean;
  activeConversationId: string | null;
  currentModule: CopilotModule;
  selectedItems: string[];
  filters: Record<string, any>;
  open: () => void;
  close: () => void;
  toggle: () => void;
  togglePin: () => void;
  setActiveConversationId: (id: string | null) => void;
  setSelectedItems: (items: string[]) => void;
  setFilters: (filters: Record<string, any>) => void;
}

const CopilotContext = createContext<CopilotContextType>({
  isOpen: false,
  isPinned: false,
  activeConversationId: null,
  currentModule: "default",
  selectedItems: [],
  filters: {},
  open: () => {},
  close: () => {},
  toggle: () => {},
  togglePin: () => {},
  setActiveConversationId: () => {},
  setSelectedItems: () => {},
  setFilters: () => {},
});

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const { pathname } = useLocation();

  const currentModule = deriveModuleFromPath(pathname);

  // No longer auto-close on navigation — panel persists across modules

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setIsPinned(false);
  }, []);
  const toggle = useCallback(() => setIsOpen((o) => !o), []);
  const togglePin = useCallback(() => setIsPinned((p) => !p), []);

  return (
    <CopilotContext.Provider
      value={{
        isOpen,
        isPinned,
        activeConversationId,
        currentModule,
        selectedItems,
        filters,
        open,
        close,
        toggle,
        togglePin,
        setActiveConversationId,
        setSelectedItems,
        setFilters,
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
}

export const useCopilot = () => useContext(CopilotContext);
