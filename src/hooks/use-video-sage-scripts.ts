import { useState, useCallback } from "react";
import {
  type ScriptConcept,
  fakeGenerateScript,
  fakeEditScript,
} from "@/lib/video-sage-dummy-data";

export function useVideoSageScripts(videoId: string | undefined) {
  const [concepts, setConcepts] = useState<ScriptConcept[]>([]);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);

  const generateConcept = useCallback(
    async (framework: string) => {
      if (!videoId) return;
      setGenerating(true);
      try {
        const concept = await fakeGenerateScript(framework);
        setConcepts((prev) => [concept, ...prev]);
      } finally {
        setGenerating(false);
      }
    },
    [videoId]
  );

  const editScript = useCallback(
    async (
      conceptId: string,
      prompt: string
    ): Promise<{ explanation: string } | null> => {
      setEditing(true);
      try {
        const concept = concepts.find((c) => c.id === conceptId);
        if (!concept) return null;
        const result = await fakeEditScript(concept.script, prompt);
        setConcepts((prev) =>
          prev.map((c) =>
            c.id === conceptId ? { ...c, script: result.script } : c
          )
        );
        return { explanation: result.explanation };
      } finally {
        setEditing(false);
      }
    },
    [concepts]
  );

  const deleteConcept = useCallback((id: string) => {
    setConcepts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { concepts, generating, editing, generateConcept, editScript, deleteConcept };
}
