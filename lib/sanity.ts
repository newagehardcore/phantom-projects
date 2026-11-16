import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import { unstable_cache } from 'next/cache'
import type { Project, About } from './types'
import videoPosterAssets from './video-poster-assets.json'
import linkedVideoPosters from './linked-video-posters.json'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET!

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: true,
  timeout: 15_000,
})

const builder = imageUrlBuilder(sanityClient)
const generatedPosterIds = new Set(videoPosterAssets)
const linkedPosters = new Map(Object.entries(linkedVideoPosters))

function getGeneratedPosterUrl(fileUrl: string) {
  const assetId = fileUrl?.match(/\/([a-f0-9]{40})\.[a-z0-9]+$/i)?.[1]
  if (assetId && generatedPosterIds.has(assetId)) return `/video-posters/${assetId}.webp`
}

export function urlFor(source: unknown) {
  return builder.image(source as Parameters<typeof builder.image>[0])
}

export const fetchProjects = unstable_cache(async (): Promise<Project[]> => {
  type RawProject = Omit<Project, 'thumbnails'> & {
    thumbnails: Array<Project['thumbnails'][number] & {
      asset?: unknown
      crop?: unknown
      hotspot?: unknown
    }>
  }

  const projects = await sanityClient.withConfig({ useCdn: true }).fetch<RawProject[]>(`
    *[_type == "project"] | order(order asc) {
      _id,
      "id": _id,
      "slug": slug.current,
      title,
      subtitleType,
      subtitleName,
      subtitleUrl,
      "collaborators": collaborators[]{ name, url },
      "type": coalesce(type, []),
      date,
      "press": press[]{ name, url },
      "presentedAt": presentedAt[]{ name, url },
      "watchOn": watchOn[]{ name, url },
      "thumbnails": [
        ...photos[coalesce(displayRole, "both") in ["thumbnail", "both"]]{
          asset,
          crop,
          hotspot,
          alt,
          "focus": { "x": coalesce(hotspot.x, 0.5), "y": coalesce(hotspot.y, 0.5) },
        },
        ...videos[_type == "uploadedVideo" && displayRole in ["thumbnail", "both"]]{
          "url": file.asset->url,
          "alt": coalesce(caption, ""),
          "type": "video",
        },
      ],
      "photos": photos[coalesce(displayRole, "both") != "thumbnail"]{
        "_key": _key,
        "url": asset->url,
        alt,
        "width": asset->metadata.dimensions.width,
        "height": asset->metadata.dimensions.height,
        hotspot,
      },
      "videos": videos[_type == "linkedVideo" || displayRole != "thumbnail"]{
        "_type": _type,
        "_key": _key,
        "fileUrl": select(_type == "uploadedVideo" => file.asset->url),
        "posterUrl": poster.asset->url,
        "url": select(_type == "linkedVideo" => url),
        caption,
      },
      "audio": audio[]{
        "_key": _key,
        "fileUrl": file.asset->url,
        caption,
      },
      description,
      "links": links[]{ label, url },
      roles,
      order,
    }
  `)
  return projects.map((project) => ({
    ...project,
    photos: project.photos ?? [],
    videos: (project.videos ?? []).map(video => {
      if (video.posterUrl) return video
      if (video._type === 'uploadedVideo') return { ...video, posterUrl: getGeneratedPosterUrl(video.fileUrl) }
      const audited = linkedPosters.get(video.url)
      return audited ? { ...video, ...audited } : video
    }),
    audio: project.audio ?? [],
    links: project.links ?? [],
    thumbnails: (project.thumbnails ?? []).map((thumb) => {
      if (thumb.type === 'video') return { ...thumb, posterUrl: getGeneratedPosterUrl(thumb.url) }
      const source = thumb
      return {
        ...thumb,
        url: source.asset
          ? urlFor(source as Parameters<typeof urlFor>[0]).width(900).height(640).fit('crop').url()
          : thumb.url,
      }
    }),
  }))
}, ['sanity-projects', projectId, dataset], { revalidate: 30, tags: ['sanity-projects'] })

export const fetchAbout = unstable_cache(async (): Promise<About | null> => {
  const raw = await sanityClient.withConfig({ useCdn: false }).fetch(`
    *[_type == "about"][0] {
      title,
      headerDescription,
      contactEmail,
      "photo": { "url": photo.asset->url, "alt": photo.alt },
      bio,
      "socials": socials[]{ label, url },
    }
  `)
  return raw as About | null
}, ['sanity-about'], { revalidate: 15, tags: ['sanity-about'] })
