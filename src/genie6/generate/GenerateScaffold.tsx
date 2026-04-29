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
  "image-to-ad", // merged former image-to-adcopy + image-to-video (Track 4.2)
];

const PREF_KEY = "genie6-wizard-form-pref";

/**
 * /generate/:mode — reads wizard/form preference and redirects.
 * Also seeds the draft mode so field components know which mode is active.
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

    const pref = window.localStorage.getItem(PREF_KEY) as "wizard" | "form" | null;
    const target = pref === "wizard" ? "wizard" : "form";
    navigate(`/iq/genie6/generate/${mode}/${target}`, { replace: true });
  }, [mode, navigate, dispatch]);

  return null;
}
