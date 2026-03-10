import { useEffect, useRef, useState } from 'react'

const CHARS_PER_FRAME = 2

/**
 * Reveals text character-by-character for a ChatGPT-style typing effect.
 * Always animates from 0 to full length so text appears as if being typed.
 */
export function useTypewriter(text: string, shouldAnimate: boolean): string {
  const [displayed, setDisplayed] = useState('')
  const targetLenRef = useRef(0)
  const displayedLenRef = useRef(0)
  const textRef = useRef(text)
  const rafRef = useRef<number | undefined>(undefined)

  textRef.current = text

  useEffect(() => {
    targetLenRef.current = text.length

    if (!shouldAnimate || text.length === 0) {
      setDisplayed(text)
      displayedLenRef.current = text.length
      return
    }

    const animate = () => {
      const target = targetLenRef.current
      const fullText = textRef.current
      let current = displayedLenRef.current

      if (current < target) {
        current = Math.min(current + CHARS_PER_FRAME, target)
        displayedLenRef.current = current
        setDisplayed(fullText.slice(0, current))
      } else if (current > target) {
        displayedLenRef.current = target
        setDisplayed(fullText.slice(0, target))
      }

      if (displayedLenRef.current < targetLenRef.current) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [text, shouldAnimate])

  return shouldAnimate ? displayed : text
}
