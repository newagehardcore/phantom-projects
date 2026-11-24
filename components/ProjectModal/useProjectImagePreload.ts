import { useEffect } from 'react'
import type { Project } from '@/lib/types'
import { getProjectVideos } from './MediaReel'

const CONCURRENT_IMAGES = 2

export function useProjectImagePreload(projects: Project[], thumbnailsSettled: boolean) {
  useEffect(() => {
    if (!thumbnailsSettled || !projects.length) return
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (connection?.saveData) return

    const projectImages = projects.map(project => [
      ...getProjectVideos(project).map(({ item }) => item.kind === 'externalVideo' ? item.poster : item.data.posterUrl),
      ...project.photos.map(photo => photo.url),
    ].filter((url): url is string => Boolean(url)))

    // Warm the lead image across the wall before working through long galleries.
    const urls = new Set<string>()
    const longestGallery = Math.max(...projectImages.map(images => images.length))
    for (let index = 0; index < longestGallery; index++) {
      for (const images of projectImages) {
        if (images[index]) urls.add(images[index])
      }
    }
    const queue = urls.values()
    const inFlight = new Set<HTMLImageElement>()
    let disposed = false
    let cancelScheduled: (() => void) | undefined

    const schedule = () => {
      if (disposed || cancelScheduled) return
      if (typeof window.requestIdleCallback === 'function') {
        const id = window.requestIdleCallback(pump, { timeout: 1000 })
        cancelScheduled = () => window.cancelIdleCallback(id)
      } else {
        const id = window.setTimeout(pump, 100)
        cancelScheduled = () => window.clearTimeout(id)
      }
    }

    function pump() {
      cancelScheduled = undefined
      while (!disposed && inFlight.size < CONCURRENT_IMAGES) {
        const next = queue.next()
        if (next.done) return

        const image = new Image()
        image.fetchPriority = 'low'
        image.decoding = 'async'
        inFlight.add(image)
        image.onload = image.onerror = () => {
          image.onload = image.onerror = null
          inFlight.delete(image)
          schedule()
        }
        image.src = next.value
      }
    }

    if (document.readyState === 'complete') schedule()
    else window.addEventListener('load', schedule, { once: true })

    return () => {
      disposed = true
      window.removeEventListener('load', schedule)
      cancelScheduled?.()
      for (const image of inFlight) image.onload = image.onerror = null
      inFlight.clear()
    }
  }, [projects, thumbnailsSettled])
}
