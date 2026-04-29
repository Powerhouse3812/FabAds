import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClients, Client } from "@/hooks/use-clients";

interface ClientContextType {
  activeClientId: string | null;
  activeClient: Client | null;
  clients: Client[];
  myClients: Client[];
  allClients: Client[];
  setActiveClient: (id: string) => void;
  loading: boolean;
  refetch: () => void;
}

const ClientContext = createContext<ClientContextType>({
  activeClientId: null,
  activeClient: null,
  clients: [],
  myClients: [],
  allClients: [],
  setActiveClient: () => {},
  loading: true,
  refetch: () => {},
});

export function ClientProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const { clients, myClients, loading, refetch } = useClients();
  const [activeClientId, setActiveClientId] = useState<string | null>(null);

  const isAdmin = role === "owner" || role === "admin";
  const available = isAdmin ? clients : myClients;

  // Restore from localStorage
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`fabads_active_client_${user.id}`);
    if (stored) setActiveClientId(stored);
  }, [user]);

  // Auto-select first available client if none selected or stored id is invalid
  useEffect(() => {
    if (loading || available.length === 0) return;
    const current = available.find((c) => c.id === activeClientId);
    if (!current) {
      setActiveClientId(available[0].id);
      if (user) localStorage.setItem(`fabads_active_client_${user.id}`, available[0].id);
    }
  }, [loading, activeClientId, available, user]);

  const setActiveClient = (id: string) => {
    setActiveClientId(id);
    if (user) {
      localStorage.setItem(`fabads_active_client_${user.id}`, id);
    }
  };

  const activeClient = clients.find((c) => c.id === activeClientId) ?? null;

  return (
    <ClientContext.Provider
      value={{
        activeClientId,
        activeClient,
        clients: available,
        myClients,
        allClients: clients,
        setActiveClient,
        loading,
        refetch,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export const useClientContext = () => useContext(ClientContext);
