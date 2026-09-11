/**
 * timelineScript — the structured, timeline-shaped script used by the
 * Generate Variations cards.
 *
 * Product owner's ruling (2026-09-10): "Script ka only overview we can show in
 * prompt bar, because a script has every timeline's dialoge in it, and sometime
 * a script has visual directions also in it… have to give a toggle switch in
 * script modal, jiske click pe visuals bhi aajayenge as per timeline" — and the
 * clarification: "by default only script aayegi with timeline. on clicking
 * toggle visuals bhi add ho jayenge us script me."
 *
 * So the canonical shape is Video Sage's: one row per beat carrying
 * time / dialogue / visual (`VideoSageAnalysis.script` in
 * `src/lib/video-sage-dummy-data.ts`), with the visual column an ADDITIVE
 * layer on the same rows rather than a second view.
 *
 * THE HONESTY RULE THAT SHAPES THIS WHOLE FILE: the wizard and the Catalogue
 * both store a script as ONE BLOB of text (`WizardState.script: string | null`,
 * `ScriptAsset.body`). Timecodes and visual directions are frequently simply
 * not in there. Inventing either would put fabricated timings on screen that a
 * user would reasonably read as the model's plan, so `fromFlatScript` parses
 * ONLY the patterns listed on it and degrades to `provenance: "flat"` — a
 * single un-timed row the modal can label plainly — rather than guessing.
 */

export interface TimelineScriptRow {
  /**
   * A real timecode read off the source, e.g. "0:00-0:03". EMPTY STRING when
   * the source carried none — never an interpolated or invented one.
   */
  time: string;
  dialogue: string;
  /** Absent when this beat carries no visual direction. */
  visual?: string;
  /**
   * The author's own name for the beat ("Hook", "CTA", "Hero"), when the text
   * labelled it. Shown in place of the time column on an un-timed script, so
   * the timeline still reads as a sequence instead of a blank first column.
   */
  label?: string;
}

export interface TimelineScript {
  rows: TimelineScriptRow[];
  /**
   * True when ANY row carries a visual. Drives the toggle's availability and
   * the prompt-bar's "has visuals" datum.
   */
  hasVisuals: boolean;
  /**
   * True when ANY row carries a real timecode. False means the rows are
   * ordered beats with no timings — the modal says so rather than showing an
   * empty time column that reads as missing data.
   */
  hasTimecodes: boolean;
  /** How the rows were arrived at — the UI must be able to say so. */
  provenance: "video-sage" | "parsed" | "flat";
}

/* ------------------------------------------------------------------ builders */

/** The Video Sage row shape, restated so this module needn't import its type. */
interface VideoSageScriptRow {
  time: string;
  visual: string;
  dialogue: string;
}

/**
 * From Video Sage — `VideoSageAnalysis.script` is already exactly this shape
 * (time / visual / dialogue per beat), so this is a direct map and the only
 * fully-trustworthy path. An empty-string visual is dropped rather than kept
 * as a blank cell, so `hasVisuals` stays truthful.
 */
export function fromVideoSageScript(rows: VideoSageScriptRow[]): TimelineScript {
  const mapped: TimelineScriptRow[] = rows.map((r) => {
    const visual = r.visual?.trim();
    return {
      time: normalizeTime(r.time),
      dialogue: r.dialogue?.trim() ?? "",
      ...(visual ? { visual } : {}),
    };
  });
  return finalize(mapped, "video-sage");
}

/**
 * Every text pattern `fromFlatScript` accepts as genuine structure. Anything
 * not on this list is left alone — see the REFUSED list below.
 */
const TIME_UNIT = "\\d{1,2}(?::\\d{2}){1,2}"; // 0:03 · 00:03 · 1:02:03
const DASH = "[-–—]";
/** `[0:03]` / `[00:00–00:03]` at the start of a block. */
const BRACKETED_TIME = new RegExp(`^\\[\\s*(${TIME_UNIT}(?:\\s*${DASH}\\s*${TIME_UNIT})?)\\s*\\]\\s*`);
/** `0:03-0:07 —` / `00:00–00:03:` — a bare timecode plus an explicit separator. */
const BARE_TIME = new RegExp(`^(${TIME_UNIT}(?:\\s*${DASH}\\s*${TIME_UNIT})?)\\s*(?:${DASH}|:|\\||\\t)\\s*`);
/** Explicit visual-direction markers. */
const VISUAL_MARKER = /^(?:visual|visuals|on[ -]screen|on screen text|b[- ]?roll|shot|frame)\s*:\s*/i;
/** Explicit dialogue / voice-over markers. */
const DIALOGUE_MARKER = /^(?:v\s*\/\s*o|vo|voice[ -]?over|dialogue|dialog|audio|narrator|script|line)\s*:\s*/i;
/** `1. …` / `1) …` — an ordered shot list is genuine structure. */
const NUMBERED = /^(\d{1,2})\s*[.)]\s+/;
/**
 * Beat labels are a WHITELIST, not "any Capitalised word before a colon" —
 * the wizard's own auto-script ends with `Format: Video · English.`, which is
 * metadata, and a generic rule would promote it to a beat.
 */
const BEAT_LABELS = [
  "intro", "open", "opening", "hook", "problem", "pain point", "agitate", "agitation",
  "solution", "reveal", "product reveal", "demo", "benefit", "benefits", "feature",
  "features", "proof", "social proof", "testimonial", "objection", "offer", "promo",
  "cta", "call to action", "close", "closing", "closing frame", "outro", "end card",
  "scene", "beat", "act", "hero", "detail macro", "context insert", "transition",
];
const BEAT_LABEL_RE = new RegExp(`^(${BEAT_LABELS.join("|")})\\s*:\\s*`, "i");

/**
 * From a flat script string — the wizard's `script` field and
 * `ScriptAsset.body` are both one blob.
 *
 * ACCEPTED as structure (per block, blocks split on blank lines then lines):
 *   1. `[0:03]` / `[00:00–00:03]` / `[1:02:03]` leading bracketed timecode
 *   2. `0:03-0:07 —` / `00:00–00:03:` bare leading timecode + separator
 *   3. `VISUAL:` `VISUALS:` `ON SCREEN:` `B-ROLL:` `SHOT:` `FRAME:` → the
 *      row's VISUAL
 *   4. `V/O:` `VO:` `VOICEOVER:` `DIALOGUE:` `AUDIO:` `NARRATOR:` → dialogue
 *   5. A whitelisted beat label + colon (`Hook:` … `CTA:`) → the row's `label`
 *   6. `1.` / `1)` ordered items, when at least two are present
 *
 * REFUSED, deliberately:
 *   - Inventing a timecode. No interpolation from a duration, row count or
 *     word count — an un-timed script stays un-timed (`hasTimecodes: false`).
 *   - Guessing that an unmarked sentence is a visual direction. Only markers
 *     (3) produce a `visual`.
 *   - Splitting prose on sentence boundaries to manufacture beats.
 *   - Promoting an arbitrary `Word:` prefix to a beat (whitelist only).
 * A block matching nothing is appended to the previous row's dialogue rather
 * than becoming a ghost row, and a script where nothing matched at all comes
 * back as ONE row with `provenance: "flat"`.
 */
export function fromFlatScript(body: string | null | undefined): TimelineScript {
  const text = (body ?? "").trim();
  if (!text) return { rows: [], hasVisuals: false, hasTimecodes: false, provenance: "flat" };

  const blocks = text
    .split(/\n\s*\n|\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const numberedCount = blocks.filter((b) => NUMBERED.test(b)).length;
  const acceptNumbered = numberedCount >= 2;

  const rows: TimelineScriptRow[] = [];
  let matched = 0;

  for (const block of blocks) {
    let rest = block;
    let time = "";
    let label: string | undefined;
    let isVisualLine = false;
    let structured = false;

    const bracketed = rest.match(BRACKETED_TIME);
    if (bracketed) {
      time = normalizeTime(bracketed[1]);
      rest = rest.slice(bracketed[0].length);
      structured = true;
    } else {
      const bare = rest.match(BARE_TIME);
      if (bare) {
        time = normalizeTime(bare[1]);
        rest = rest.slice(bare[0].length);
        structured = true;
      }
    }

    const visualMarker = rest.match(VISUAL_MARKER);
    if (visualMarker) {
      rest = rest.slice(visualMarker[0].length);
      isVisualLine = true;
      structured = true;
    } else {
      const dialogueMarker = rest.match(DIALOGUE_MARKER);
      if (dialogueMarker) {
        rest = rest.slice(dialogueMarker[0].length);
        structured = true;
      } else {
        const beat = rest.match(BEAT_LABEL_RE);
        if (beat) {
          label = titleCase(beat[1]);
          rest = rest.slice(beat[0].length);
          structured = true;
        } else if (acceptNumbered) {
          const numbered = rest.match(NUMBERED);
          if (numbered) {
            rest = rest.slice(numbered[0].length);
            /* The author's OWN leading phrase becomes the label ("Hero — full
               product shot"). Capped so a whole sentence never becomes one. */
            const split = rest.match(new RegExp(`^(.{1,32}?)\\s*${DASH}\\s+`));
            if (split) {
              label = split[1].trim();
              rest = rest.slice(split[0].length);
            }
            structured = true;
          }
        }
      }
    }

    rest = rest.trim();
    if (!rest && !time) continue;

    /* A VISUAL: line belongs to the beat above it — that is what the marker
       means. With no beat above, it opens a row of its own. */
    if (isVisualLine) {
      const prev = rows[rows.length - 1];
      if (prev && !prev.visual && (!time || time === prev.time)) {
        prev.visual = rest;
      } else {
        rows.push({ time, dialogue: "", visual: rest, ...(label ? { label } : {}) });
      }
      matched += 1;
      continue;
    }

    if (structured) {
      matched += 1;
      rows.push({ time, dialogue: rest, ...(label ? { label } : {}) });
      continue;
    }

    /* Unstructured continuation — never its own row. */
    const prev = rows[rows.length - 1];
    if (prev) {
      prev.dialogue = prev.dialogue ? `${prev.dialogue}\n${rest}` : rest;
    } else {
      rows.push({ time: "", dialogue: rest });
    }
  }

  /* One structured hit is a coincidence, not a timeline. Below two, the honest
     answer is "this script has no timeline yet". */
  if (matched < 2 || rows.length < 2) {
    return {
      rows: [{ time: "", dialogue: text }],
      hasVisuals: false,
      hasTimecodes: false,
      provenance: "flat",
    };
  }

  return finalize(rows, "parsed");
}

/** One un-timed row holding the text as-is. The modal's flat-script case. */
export function flatTimelineScript(body: string): TimelineScript {
  return {
    rows: [{ time: "", dialogue: body.trim() }],
    hasVisuals: false,
    hasTimecodes: false,
    provenance: "flat",
  };
}

/* ------------------------------------------------------------------ summary */

export interface TimelineScriptSummary {
  rowCount: number;
  /** How many rows carry a visual direction. */
  visualCount: number;
  hasVisuals: boolean;
  hasTimecodes: boolean;
  provenance: TimelineScript["provenance"];
  /** Seconds from the first row's start to the last row's end — null unless
   *  the timecodes actually support it. Never estimated. */
  totalSeconds: number | null;
  /** "0:36" — null whenever `totalSeconds` is. */
  durationLabel: string | null;
  /** One line for the prompt bar's script row. */
  line: string;
}

/**
 * The prompt-bar datum. The bar shows an OVERVIEW only (owner's ruling), so
 * this is the whole of what it may say about a script: how many beats, how
 * long if the timecodes prove it, and whether visuals are in there.
 */
export function summarizeTimelineScript(script: TimelineScript): TimelineScriptSummary {
  const rowCount = script.rows.length;
  const visualCount = script.rows.filter((r) => !!r.visual?.trim()).length;
  const totalSeconds = totalDuration(script.rows);
  const durationLabel = totalSeconds === null ? null : formatSeconds(totalSeconds);

  const parts: string[] = [];
  if (script.provenance === "flat") {
    parts.push("No timeline yet");
  } else {
    parts.push(`${rowCount} beat${rowCount === 1 ? "" : "s"}`);
    if (durationLabel) parts.push(durationLabel);
  }
  parts.push(visualCount > 0 ? `${visualCount} with visuals` : "no visuals");

  return {
    rowCount,
    visualCount,
    hasVisuals: script.hasVisuals,
    hasTimecodes: script.hasTimecodes,
    provenance: script.provenance,
    totalSeconds,
    durationLabel,
    line: parts.join(" · "),
  };
}

/**
 * Back to one blob, for the fields that only store text
 * (`WizardState.script`, `ScriptAsset.body`). Round-trips through
 * `fromFlatScript`: timecodes go back in brackets and visuals behind a
 * `VISUAL:` marker, both patterns this file accepts.
 */
export function serializeTimelineScript(
  script: TimelineScript,
  opts: { includeVisuals?: boolean } = {},
): string {
  const includeVisuals = opts.includeVisuals ?? true;
  if (script.provenance === "flat") return script.rows.map((r) => r.dialogue).join("\n\n");

  return script.rows
    .map((row) => {
      const head = row.time ? `[${row.time}] ` : row.label ? `${row.label}: ` : "";
      const lines = [`${head}${row.dialogue}`.trim()];
      if (includeVisuals && row.visual) lines.push(`VISUAL: ${row.visual}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

/* -------------------------------------------------------------------- utils */

function finalize(rows: TimelineScriptRow[], provenance: "video-sage" | "parsed"): TimelineScript {
  return {
    rows,
    hasVisuals: rows.some((r) => !!r.visual?.trim()),
    hasTimecodes: rows.some((r) => !!r.time.trim()),
    provenance,
  };
}

/** Collapses the three dash characters and the padding to one written form. */
function normalizeTime(raw: string): string {
  return raw.trim().replace(/\s*[-–—]\s*/g, "-");
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w === "cta" ? "CTA" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function parseSeconds(stamp: string): number | null {
  const parts = stamp.split(":").map((p) => Number(p));
  if (parts.some((p) => !Number.isFinite(p))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

/** Only from real timecodes: needs a parseable first start and last end. */
function totalDuration(rows: TimelineScriptRow[]): number | null {
  const stamps: number[] = [];
  for (const row of rows) {
    if (!row.time) continue;
    for (const piece of row.time.split("-")) {
      const secs = parseSeconds(piece.trim());
      if (secs !== null) stamps.push(secs);
    }
  }
  if (stamps.length < 2) return null;
  const span = Math.max(...stamps) - Math.min(...stamps);
  return span > 0 ? span : null;
}

export function formatSeconds(total: number): string {
  const mins = Math.floor(total / 60);
  const secs = Math.round(total % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
