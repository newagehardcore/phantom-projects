'use client'

import { useEffect, useState } from 'react'

export default function FlashingTitle() {
  const [word, setWord] = useState<'PHANTOM' | 'PROJECTS'>('PHANTOM')

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWord(current => current === 'PHANTOM' ? 'PROJECTS' : 'PHANTOM')
    }, 750)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <>
      <span className="desktop-site-title" aria-hidden="true">{word}</span>
      <span className="mobile-site-title" aria-hidden="true">{word}</span>
    </>
  )
}
