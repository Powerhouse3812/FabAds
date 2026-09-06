/**
 * Uploaded product image store — session-only, in-memory, same house style
 * as src/lib/ad-entity-write-store.ts.
 *
 * DEFECT FIX (adversarial review): Step2Product.tsx's Product-Shoot upload
 * route ("Brand → skip product → upload image", §21.2) used to put the raw
 * FileReader `data:` URL straight into wizard state, and useUrlSync.ts then
 * encoded THAT into `?productImage=` on every URL sync. A base64-encoded
 * image runs tens of thousands of characters long — well past browser and
 * server URL limits. useUrlSync.ts's own doc comment already said what
 * belongs in that param: "a short id/filename, not a data: or blob: URL" —
 * this file is what makes that true instead of just documented.
 *
 * Fix shape: `WizardState.uploadedProductImage` (and the `?productImage=` it
 * mirrors) now carries only the short opaque TOKEN this file mints. The
 * actual `data:` URL lives here, keyed by that token, read back only at the
 * few sites that need to actually PAINT the image (Step2Product's upload
 * popover + uploaded-image summary row, ContextRail's hero thumb + More
 * Details product card). Session-only and in-memory like every other
 * prototype write in this app — reset on reload is expected, and every read
 * site must treat a token that no longer resolves as "needs re-upload," not
 * render it as a broken <img src>.
 */
const store = new Map<string, string>();

let counter = 0;

/** Registers a `data:`/`blob:` URL, returns a short opaque token to carry in
 *  wizard state / the URL instead of the URL itself. */
export function registerUploadedImage(dataUrl: string): string {
  counter += 1;
  const token = `upimg-${Date.now().toString(36)}-${counter}`;
  store.set(token, dataUrl);
  return token;
}

/** Resolves a token back to its `data:` URL. Returns `undefined` once the
 *  in-memory store no longer has it (a reload, most commonly) — callers MUST
 *  treat that as "needs re-upload," never render it as a broken <img src>. */
export function resolveUploadedImage(token: string | null | undefined): string | undefined {
  if (!token) return undefined;
  return store.get(token);
}
