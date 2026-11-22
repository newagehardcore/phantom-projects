'use client'

import { useRef, useState, type CSSProperties } from 'react'

interface AudioPlayerProps {
  src: string
  caption?: string
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

export default function AudioPlayer({ src, caption }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const title = caption?.trim() || 'Audio'

  async function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.paused) {
      audio.pause()
      return
    }
    try {
      await audio.play()
    } catch {
      setPlaying(false)
    }
  }

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onDurationChange={(event) => {
          const seconds = event.currentTarget.duration
          setDuration(Number.isFinite(seconds) ? seconds : 0)
        }}
      />
      <span className="audio-player-title">{title}</span>
      <button
        type="button"
        className="audio-player-toggle"
        onClick={toggle}
        aria-label={`${playing ? 'Pause' : 'Play'} ${title}`}
      >
        <span className={playing ? 'audio-pause-icon' : 'audio-play-icon'} aria-hidden="true" />
      </button>
      <div className="audio-player-progress">
        <input
          type="range"
          style={{ '--audio-progress': `${duration ? (Math.min(currentTime, duration) / duration) * 100 : 0}%` } as CSSProperties}
          aria-label={`Seek ${title}`}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          min={0}
          max={duration}
          step="any"
          value={Math.min(currentTime, duration)}
          disabled={!duration}
          onChange={(event) => {
            const seconds = event.currentTarget.valueAsNumber
            if (audioRef.current) audioRef.current.currentTime = seconds
            setCurrentTime(seconds)
          }}
        />
        <span className="audio-player-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>
    </div>
  )
}
