'use client'

import { useRef, useState, useCallback } from 'react'

interface AudioPlayerProps {
  src: string
  caption?: string
}

export default function AudioPlayer({ src, caption }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play()
      setPlaying(true)
    }
  }, [playing])

  const onTimeUpdate = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    setProgress(audio.currentTime / audio.duration)
  }, [])

  const onLoadedMetadata = useCallback(() => {
    setDuration(audioRef.current?.duration ?? 0)
  }, [])

  const onEnded = useCallback(() => setPlaying(false), [])

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * audio.duration
    setProgress(ratio)
  }, [])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  return (
    <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      {caption && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, letterSpacing: '0.04em' }}>
          {caption}
        </div>
      )}
      <audio ref={audioRef} src={src} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMetadata} onEnded={onEnded} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          style={{
            width: 32,
            height: 32,
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: '50%',
            background: 'transparent',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            flexShrink: 0,
          }}
        >
          {playing ? '■' : '▶'}
        </button>
        <div style={{ flex: 1, position: 'relative', height: 2, background: 'rgba(255,255,255,0.15)', cursor: 'pointer', borderRadius: 1 }} onClick={seek}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${progress * 100}%`,
              background: '#fff',
              borderRadius: 1,
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {fmt(audioRef.current?.currentTime ?? 0)} / {fmt(duration)}
        </div>
      </div>
    </div>
  )
}
