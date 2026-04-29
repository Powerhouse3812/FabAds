import { useCopilotChat } from "@/hooks/use-copilot-chat";
import { CopilotMessageList } from "@/components/copilot/CopilotMessageList";
import { CopilotInput } from "@/components/copilot/CopilotInput";
import { CopilotConversationList } from "@/components/copilot/CopilotConversationList";
import { CopilotQuickActions } from "@/components/copilot/CopilotQuickActions";
import { useCopilot } from "@/contexts/CopilotContext";
import { Brain, PanelLeftClose, PanelLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function Copilot() {
  const { activeConversationId } = useCopilot();
  const { messages, isLoading, sendMessage, generateImage, stopGeneration, clearMessages, loadConversation } = useCopilotChat();
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div className="flex h-full -m-4 2xl:-m-5">
      {/* Conversation sidebar — folder/board pattern */}
      {showSidebar && (
        <div className="w-[260px] border-r border-border flex-shrink-0 bg-muted/20">
          <CopilotConversationList
            activeId={activeConversationId}
            onSelect={(id) => loadConversation(id)}
            onNew={() => clearMessages()}
          />
        </div>
      )}

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
          <Brain className="h-5 w-5 text-primary" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Creatives</span>
            <span className="text-xs text-muted-foreground">/</span>
            <h1 className="text-sm font-semibold">Co-pilot</h1>
          </div>
          <div className="flex-1" />
          <Badge variant="secondary" className="text-[10px] gap-1 px-2 py-0.5">
            <Sparkles className="h-3 w-3" />
            50 credits
          </Badge>
        </div>

        {/* Quick actions */}
        <CopilotQuickActions onAction={sendMessage} disabled={isLoading} />

        {/* Messages */}
        <CopilotMessageList messages={messages} isLoading={isLoading} />

        {/* Input */}
        <CopilotInput
          onSend={sendMessage}
          onGenerateImage={generateImage}
          onStop={stopGeneration}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
