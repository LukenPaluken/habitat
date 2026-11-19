import Image from "next/image";

// Hosts `next.config.ts` lets Next optimise (resize / convert). The API accepts
// any image URL, and `next/image` throws while rendering one from a host it
// doesn't know, so those are shown as they are instead of breaking the page.
const OPTIMIZED_HOSTS = [
  /^utfs\.io$/,
  /\.ufs\.sh$/,
  /^(fastly\.)?picsum\.photos$/,
];

function canOptimize(src: string): boolean {
  try {
    const { protocol, hostname } = new URL(src);
    return (
      protocol === "https:" &&
      OPTIMIZED_HOSTS.some((host) => host.test(hostname))
    );
  } catch {
    return false;
  }
}

interface RemoteImageProps {
  src: string;
  alt: string;
  /** Width the image takes at each breakpoint: lets the browser pick a file size. */
  sizes: string;
  priority?: boolean;
  className?: string;
}

/** Fills its (relatively positioned) parent. */
export function RemoteImage({
  src,
  alt,
  sizes,
  priority,
  className,
}: RemoteImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!canOptimize(src)}
      className={className}
    />
  );
}
