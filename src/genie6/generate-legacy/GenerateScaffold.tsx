import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDraft } from "../stores/draftStore";
import type { ModeId } from "../types/output";

const VALID_MODES: ModeId[] = [
  "brand-ad",
  "product-ad",
  "affiliate-ad",
  "ugc-video",
  "forge",
  "image-to-ad",
];

/**
 * /iq/genie6/generate/:mode — seed draft state + redirect to /:mode/form.
 *
 * Wizard mode was removed (Track 5+); the only flow is the dense form. Onboarding /
 * wizard tour lives separately at /iq/genie6/wizard for first-time users.
 */
export function GenerateScaffold() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { dispatch } = useDraft();

  useEffect(() => {
    if (!mode || !VALID_MODES.includes(mode as ModeId)) {
      navigate("/iq/genie6/generate", { replace: true });
      return;
    }

    dispatch({ type: "SET_MODE", mode: mode as ModeId });
    navigate(`/iq/genie6/generate/${mode}/form`, { replace: true });
  }, [mode, navigate, dispatch]);

  return null;
}
