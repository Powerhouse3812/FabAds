import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/hooks/use-workspace";
import FacebookConnectModal from "./FacebookConnectModal";

interface ConnectFacebookButtonProps {
  disabled?: boolean;
  onConnected?: () => void;
}

export default function ConnectFacebookButton({ disabled, onConnected }: ConnectFacebookButtonProps) {
  const workspaceId = useWorkspace();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setModalOpen(true)} disabled={disabled || !workspaceId}>
        Connect Facebook
      </Button>
      <FacebookConnectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onConnected={onConnected}
      />
    </>
  );
}
