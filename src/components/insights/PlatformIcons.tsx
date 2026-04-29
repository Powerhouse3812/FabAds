import { Facebook, Instagram, MessageCircle, Phone, Globe, AtSign } from "lucide-react";
import type { ReactNode } from "react";

const iconMap: Record<string, ReactNode> = {
  Meta: <Facebook className="h-3.5 w-3.5" />,
  Instagram: <Instagram className="h-3.5 w-3.5" />,
  Messenger: <MessageCircle className="h-3.5 w-3.5" />,
  WhatsApp: <Phone className="h-3.5 w-3.5" />,
  "Audience Network": <Globe className="h-3.5 w-3.5" />,
  Threads: <AtSign className="h-3.5 w-3.5" />,
};

export function PlatformIcon({ platform }: { platform: string }) {
  return <span title={platform}>{iconMap[platform] ?? <Globe className="h-3.5 w-3.5" />}</span>;
}

export function PlatformIcons({ platforms }: { platforms: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {platforms.map((p) => (
        <PlatformIcon key={p} platform={p} />
      ))}
    </div>
  );
}
