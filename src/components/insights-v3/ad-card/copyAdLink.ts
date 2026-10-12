import { toast } from "sonner";

/** Current URL with `ad=<id>` so the link reopens the drawer. */
function adLink(adId: string): string {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("ad", adId);
    return url.toString();
  } catch {
    return `?ad=${encodeURIComponent(adId)}`;
  }
}

export async function copyAdLink(adId: string) {
  try {
    await navigator.clipboard.writeText(adLink(adId));
    toast.success("Link copied");
  } catch {
    toast.error("Couldn't copy the link. Open the ad and copy it from the address bar.");
  }
}
