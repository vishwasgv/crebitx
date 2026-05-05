"use client"

import { useEffect, useState, useRef } from "react"

export function AnimatedCounter({ 
  endValue, 
  decimals = 0,
  duration = 2000,
  prefix = "",
  suffix = ""
}: { 
  endValue: number, 
  decimals?: number,
  duration?: number,
  prefix?: string,
  suffix?: string
}) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) {
      observer.observe(ref.current)
    }
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      
      setCount(easeOut * endValue)
      
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setCount(endValue)
      }
    }
    
    requestAnimationFrame(step)
  }, [endValue, duration, isVisible])

  const formattedCount = decimals > 0 
    ? count.toFixed(decimals) 
    : Math.floor(count).toLocaleString()

  return (
    <span ref={ref}>
      {prefix}{formattedCount}{suffix}
    </span>
  )
}
