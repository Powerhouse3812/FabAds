/**
 * Video editor module — barrel.
 *
 * Other agents importing the Framework contract should import directly from
 * `./frameworks` (matches the module-manifest path exactly), but everything
 * is also re-exported here for convenience.
 */
export { VideoEditor } from "./VideoEditor";
export { FrameworkEditor, type FrameworkEditorProps } from "./FrameworkEditor";
export { TimelineEditor, type TimelineEditorProps } from "./TimelineEditor";
export {
  FRAMEWORKS,
  getFramework,
  frameworkDuration,
  type Framework,
  type FrameworkSection,
} from "./frameworks";
export { resolveEditorFramework, type EditorAvailability } from "./outputFramework";
export { MUSIC_TRACKS, getMusicTrack, type MusicTrack } from "./musicTracks";
export { SwapFromCatalogueDialog, type SwapResult } from "./SwapPicker";
