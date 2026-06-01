import Link from "next/link"
import { CREBITX_LOGO_MARK, CREBITX_LOGO_WORDMARK } from "@/lib/brand"
import { cn } from "@/lib/utils"

type CrebitXLogoProps = {
  variant?: "wordmark" | "mark"
  href?: string
  className?: string
  priority?: boolean
}

export function CrebitXLogo({
  variant = "wordmark",
  href,
  className,
  priority = false,
}: CrebitXLogoProps) {
  const src = variant === "wordmark" ? CREBITX_LOGO_WORDMARK : CREBITX_LOGO_MARK
  const imgClass =
    variant === "wordmark"
      ? cn("h-9 w-auto object-contain sm:h-10", className)
      : cn("h-9 w-9 object-contain sm:h-10 sm:w-10", className)

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="CrebitX"
      className={imgClass}
      fetchPriority={priority ? "high" : undefined}
    />
  )

  if (!href) return image

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#005259]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fef8f3]"
    >
      {image}
    </Link>
  )
}
