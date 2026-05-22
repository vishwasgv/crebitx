"use client"

import { useEffect, useRef, type ReactNode, type ElementType } from "react"

interface Scroll3DProps {
  children: ReactNode
  className?: string
  direction?: "up" | "left" | "right"
  delay?: number  // ms
  as?: ElementType
}

/**
 * Wraps children with a scroll-triggered 3D reveal animation.
 * Uses IntersectionObserver to add `.in-view` class when element enters viewport.
 *
 * CSS classes used (defined in globals.css):
 *   .reveal       → translateY + rotateX entrance (default "up")
 *   .reveal-left  → translateX from left
 *   .reveal-right → translateX from right
 *   .in-view      → final visible state
 */
export function Scroll3D({
  children,
  className = "",
  direction = "up",
  delay = 0,
  as: Tag = "div",
}: Scroll3DProps) {
  const ref = useRef<HTMLElement>(null)

  const dirClass = direction === "left"
    ? "reveal-left"
    : direction === "right"
      ? "reveal-right"
      : "reveal"

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Apply delay inline
    if (delay > 0) el.style.transitionDelay = `${delay}ms`

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view")
            observer.unobserve(entry.target) // animate only once
          }
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <Tag ref={ref} className={`${dirClass} ${className}`}>
      {children}
    </Tag>
  )
}

/**
 * Mouse-tilt card. Apply to any card to get a live 3D tilt effect on hover.
 */
export function TiltCard({
  children,
  className = "",
  intensity = 8,
}: {
  children: ReactNode
  className?: string
  intensity?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function handleMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      el!.style.transform = `perspective(800px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) translateZ(8px)`
    }

    function handleLeave() {
      el!.style.transform = "perspective(800px) rotateY(0) rotateX(0) translateZ(0)"
    }

    el.addEventListener("mousemove", handleMove)
    el.addEventListener("mouseleave", handleLeave)
    return () => {
      el.removeEventListener("mousemove", handleMove)
      el.removeEventListener("mouseleave", handleLeave)
    }
  }, [intensity])

  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`}
      style={{ transition: "transform 0.15s ease, box-shadow 0.3s ease" }}
    >
      {children}
    </div>
  )
}
