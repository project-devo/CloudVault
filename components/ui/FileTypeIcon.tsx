import {
  Archive,
  File,
  FileText,
  Folder,
  Image,
  Music,
  Video,
  type LucideIcon,
} from "lucide-react";
import { cn, getFileCategory } from "@/lib/utils";

const KINDS: Record<string, { icon: LucideIcon; tint: string }> = {
  folder: { icon: Folder, tint: "bg-tint-sand" },
  images: { icon: Image, tint: "bg-tint-lilac" },
  documents: { icon: FileText, tint: "bg-tint-mist" },
  videos: { icon: Video, tint: "bg-tint-rose" },
  audio: { icon: Music, tint: "bg-tint-butter" },
  archives: { icon: Archive, tint: "bg-tint-sage" },
};

const SIZES = {
  sm: "h-[34px] w-[34px] rounded-lg [&>svg]:h-4 [&>svg]:w-4",
  md: "h-11 w-11 rounded-[10px] [&>svg]:h-5 [&>svg]:w-5",
  lg: "h-14 w-14 rounded-xl [&>svg]:h-6 [&>svg]:w-6",
};

interface Props {
  mime?: string;
  folder?: boolean;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Tinted line-icon tile for a file type (replaces the old emoji icons). */
export default function FileTypeIcon({
  mime = "",
  folder = false,
  size = "sm",
  className,
}: Props) {
  const { icon: Icon, tint } = KINDS[folder ? "folder" : getFileCategory(mime)] ?? {
    icon: File,
    tint: "bg-ink-800",
  };

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-ink-100",
        tint,
        SIZES[size],
        className
      )}
    >
      <Icon strokeWidth={1.25} />
    </span>
  );
}
