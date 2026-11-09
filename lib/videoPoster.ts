// Cache successful frame extraction across modal navigation in this session.
const frames = new Map<string, Promise<string | undefined>>()

export function getVideoPoster(src: string): Promise<string | undefined> {
  const cached = frames.get(src)
  if (cached) return cached
  const result = new Promise<string | undefined>((resolve) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })
    let finished = false
    let sample = 0
    const finish = (poster?: string) => {
      if (finished) return
      finished = true
      clearTimeout(timeout)
      video.onloadedmetadata = null
      video.onseeked = null
      video.onerror = null
      video.removeAttribute('src')
      video.load()
      resolve(poster)
    }
    const timeout = window.setTimeout(() => finish(), 15000)
    if (!context) { finish(); return }
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.onerror = () => finish()
    const seek = () => {
      // Sample beyond common opening fades, while respecting very short clips.
      const duration = video.duration
      if (!Number.isFinite(duration) || duration <= 0) { finish(); return }
      video.currentTime = Math.min([2, 5, 10][sample], duration * [0.15, 0.4, 0.7][sample])
    }
    video.onloadedmetadata = () => {
      canvas.width = Math.min(960, video.videoWidth)
      canvas.height = Math.round(canvas.width * video.videoHeight / video.videoWidth)
      if (!canvas.width || !canvas.height) { finish(); return }
      seek()
    }
    video.onseeked = () => {
      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
        let brightness = 0
        for (let i = 0; i < pixels.length; i += 64) brightness += Math.max(pixels[i], pixels[i + 1], pixels[i + 2])
        if (brightness / Math.ceil(pixels.length / 64) < 12 && sample < 2) { sample++; seek(); return }
        finish(canvas.toDataURL('image/jpeg', 0.8))
      } catch { finish() }
    }
    video.src = src
  })
  if (frames.size >= 40) frames.delete(frames.keys().next().value!)
  frames.set(src, result)
  return result
}
