import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import { unstable_cache } from 'next/cache'
import type { Project, About } from './types'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET!

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: true,
})

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: unknown) {
  return builder.image(source as Parameters<typeof builder.image>[0])
}

export async function fetchProjects(): Promise<Project[]> {
  const projects = await sanityClient.withConfig({ useCdn: false }).fetch(`
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
    videos: project.videos ?? [],
    audio: project.audio ?? [],
    links: project.links ?? [],
    thumbnails: (project.thumbnails ?? []).map((thumb) => {
      if (thumb.type === 'video') return thumb
      const source = thumb as typeof thumb & { asset?: unknown; crop?: unknown; hotspot?: unknown }
      return {
        ...thumb,
        url: source.asset
          ? urlFor(source as Parameters<typeof urlFor>[0]).width(900).height(640).fit('crop').url()
          : thumb.url,
      }
    }),
  }))
}

export const fetchAbout = unstable_cache(async (): Promise<About | null> => {
  const raw = await sanityClient.withConfig({ useCdn: false }).fetch(`
    *[_type == "about"][0] {
      title,
      "photo": { "url": photo.asset->url, "alt": photo.alt },
      bio,
      "socials": socials[]{ label, url },
    }
  `)
  return raw as About | null
}, ['sanity-about'], { revalidate: 15, tags: ['sanity-about'] })
