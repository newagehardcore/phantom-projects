export type ProjectType = 'Film' | 'Art' | 'Fashion' | 'Performance' | 'Releases' | 'Campaign'
export type FilterType = 'All' | ProjectType

export const FILTER_OPTIONS: FilterType[] = ['All', 'Film', 'Art', 'Fashion', 'Campaign', 'Performance', 'Releases']

export interface ThumbnailAsset {
  url: string
  alt: string
  width: number
  height: number
  focus?: { x: number; y: number }
}

export interface PhotoAsset {
  _key: string
  url: string
  alt?: string
  width?: number
  height?: number
  hotspot?: { x?: number; y?: number }
}

export interface UploadedVideoItem {
  _type: 'uploadedVideo'
  _key: string
  fileUrl: string
  caption?: string
}

export interface LinkedVideoItem {
  _type: 'linkedVideo'
  _key: string
  url: string
  caption?: string
}

export type VideoItem = UploadedVideoItem | LinkedVideoItem

export interface AudioItem {
  _key: string
  fileUrl: string
  caption?: string
}

export interface ExternalLink {
  label: string
  url: string
}

export interface LinkedItem {
  name: string
  url?: string
}

export interface Project {
  id: string
  slug: string
  title: string
  subtitleType?: 'By' | 'With' | 'For' | 'None'
  subtitleName?: string
  subtitleUrl?: string
  collaborators?: LinkedItem[]
  type: ProjectType[]
  roles?: string[]
  date?: string
  press?: LinkedItem[]
  presentedAt?: LinkedItem[]
  watchOn?: LinkedItem[]
  thumbnail?: ThumbnailAsset
  /** All media shown cycling on the wall tile (role: thumbnail or both). */
  thumbnails: { url: string; alt: string; type?: 'image' | 'video'; focus?: { x: number; y: number } }[]
  photos: PhotoAsset[]
  videos: VideoItem[]
  audio: AudioItem[]
  description?: string
  links: ExternalLink[]
  order?: number
}

export interface WallProject extends Project {
  x: number
  y: number
  w: number
  h: number
}

export interface About {
  title?: string
  headerDescription?: string
  contactEmail?: string
  photo?: { url: string; alt?: string }
  bio?: string
  socials?: Array<{ label: string; url: string }> | null
}
