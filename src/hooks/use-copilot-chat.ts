import { useState, useCallback, useRef } from "react";
import { useCopilot } from "@/contexts/CopilotContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "sonner";
import { DEMO_MODE, fakeSleep, fakeChatResponse, fakeImageUrl } from "@/lib/demo-mode";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  metadata?: Record<string, any>;
  created_at?: string;
}

export function useCopilotChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { currentModule, selectedItems, filters, activeConversationId, setActiveConversationId } = useCopilot();
  const { user } = useAuth();
  const workspaceId = useWorkspace();

  const saveMessage = useCallback(
    async (conversationId: string, role: string, content: string, images: string[] = [], metadata: Record<string, any> = {}) => {
      if (!workspaceId) return;
      await supabase.from("copilot_messages").insert({
        conversation_id: conversationId,
        workspace_id: workspaceId,
        role,
        content,
        images,
        metadata,
      } as any);
    },
    [workspaceId]
  );

  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (activeConversationId) return activeConversationId;
    if (!user || !workspaceId) return null;

    const { data, error } = await supabase
      .from("copilot_conversations")
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        title: "New conversation",
        module_context: currentModule,
      } as any)
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to create conversation:", error);
      return null;
    }

    setActiveConversationId((data as any).id);
    return (data as any).id;
  }, [activeConversationId, user, workspaceId, currentModule, setActiveConversationId]);

  const sendMessage = useCallback(
    async (input: string) => {
      if (!input.trim() || isLoading) return;

      const conversationId = await ensureConversation();
      if (!conversationId) {
        toast.error("Could not start conversation");
        return;
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: input,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Save user message
      await saveMessage(conversationId, "user", input);

      // Prepare messages for API
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const context = {
        module: currentModule,
        selectedItems,
        filters,
      };

      let assistantContent = "";
      const assistantId = crypto.randomUUID();

      const updateAssistant = (chunk: string) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id === assistantId) {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantContent } : m
            );
          }
          return [...prev, { id: assistantId, role: "assistant", content: assistantContent }];
        });
      };

      try {
        if (DEMO_MODE) {
          // --- Demo mode: fake streaming response ---
          await fakeSleep(800, 1500);
          const fakeText = fakeChatResponse(input);
          // Stream character by character
          for (let i = 0; i < fakeText.length; i++) {
            updateAssistant(fakeText[i]);
            if (i % 3 === 0) await new Promise((r) => setTimeout(r, 15));
          }
          assistantContent = fakeText;
          await saveMessage(conversationId, "assistant", assistantContent);
          if (messages.length === 0) {
            const title = input.slice(0, 60) + (input.length > 60 ? "…" : "");
            await supabase.from("copilot_conversations").update({ title } as any).eq("id", conversationId);
          }
        } else {
          // --- Real mode ---
          const controller = new AbortController();
          abortRef.current = controller;

          const { data: { session } } = await supabase.auth.getSession();
          const accessToken = session?.access_token;
          if (!accessToken) { toast.error("Session expired — please sign in again"); setIsLoading(false); return; }

          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const resp = await fetch(`${supabaseUrl}/functions/v1/copilot-chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ messages: apiMessages, context, conversation_id: conversationId }),
            signal: controller.signal,
          });

          if (!resp.ok) {
            const errData = await resp.json().catch(() => ({ error: "Unknown error" }));
            if (resp.status === 429) toast.error("Rate limit reached. Please wait a moment.");
            else if (resp.status === 402) toast.error("AI credits exhausted. Please add funds in Settings.");
            else toast.error(errData.error || "AI service error");
            setIsLoading(false);
            return;
          }

          if (!resp.body) throw new Error("No response body");

          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let streamDone = false;

          while (!streamDone) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIndex: number;
            while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, newlineIndex);
              buffer = buffer.slice(newlineIndex + 1);

              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (line.startsWith(":") || line.trim() === "") continue;
              if (!line.startsWith("data: ")) continue;

              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") {
                streamDone = true;
                break;
              }

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content as string | undefined;
                if (content) updateAssistant(content);
              } catch {
                buffer = line + "\n" + buffer;
                break;
              }
            }
          }

          // Flush remaining
          if (buffer.trim()) {
            for (let raw of buffer.split("\n")) {
              if (!raw) continue;
              if (raw.endsWith("\r")) raw = raw.slice(0, -1);
              if (raw.startsWith(":") || raw.trim() === "") continue;
              if (!raw.startsWith("data: ")) continue;
              const jsonStr = raw.slice(6).trim();
              if (jsonStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content as string | undefined;
                if (content) updateAssistant(content);
              } catch {
                /* ignore */
              }
            }
          }

          // Save assistant message
          if (assistantContent) {
            await saveMessage(conversationId, "assistant", assistantContent);

            // Auto-title conversation after first exchange
            if (messages.length === 0) {
              const title = input.slice(0, 60) + (input.length > 60 ? "…" : "");
              await supabase
                .from("copilot_conversations")
                .update({ title } as any)
                .eq("id", conversationId);
            }
          }
        }
      } catch (e: any) {
        if (e.name === "AbortError") return;
        console.error("Chat error:", e);
        toast.error("Failed to get response");
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [messages, isLoading, currentModule, selectedItems, filters, ensureConversation, saveMessage]
  );

  const generateImage = useCallback(
    async (prompt: string) => {
      if (isLoading) return;

      const conversationId = await ensureConversation();
      if (!conversationId) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: `🎨 Generate image: ${prompt}`,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      await saveMessage(conversationId, "user", userMsg.content);

      try {
        let imageUrl: string | undefined;
        let textContent: string;

        if (DEMO_MODE) {
          await fakeSleep(2000, 3500);
          imageUrl = fakeImageUrl(prompt);
          textContent = "Here's the image I generated based on your prompt:";
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          const accessToken = session?.access_token;
          if (!accessToken) { toast.error("Session expired — please sign in again"); setIsLoading(false); return; }

          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const resp = await fetch(`${supabaseUrl}/functions/v1/copilot-chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              messages: [{ role: "user", content: prompt }],
              generate_image: true,
            }),
          });

          if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            toast.error(errData.error || "Image generation failed");
            setIsLoading(false);
            return;
          }

          const data = await resp.json();
          imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          textContent = data.choices?.[0]?.message?.content || "Here's your generated image:";
        }

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: textContent,
          images: imageUrl ? [imageUrl] : [],
        };

        setMessages((prev) => [...prev, assistantMsg]);
        await saveMessage(conversationId, "assistant", textContent, imageUrl ? [imageUrl] : []);
      } catch (e) {
        console.error("Image gen error:", e);
        toast.error("Failed to generate image");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, ensureConversation, saveMessage]
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
  }, [setActiveConversationId]);

  const loadConversation = useCallback(
    async (conversationId: string) => {
      const { data } = await supabase
        .from("copilot_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(
          (data as any[]).map((m: any) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            images: m.images,
            metadata: m.metadata,
            created_at: m.created_at,
          }))
        );
        setActiveConversationId(conversationId);
      }
    },
    [setActiveConversationId]
  );

  return {
    messages,
    isLoading,
    sendMessage,
    generateImage,
    stopGeneration,
    clearMessages,
    loadConversation,
  };
}
