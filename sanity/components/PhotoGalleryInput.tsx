'use client'

import { useRef, useState } from 'react'
import { PatchEvent, set, useClient, type ArrayOfObjectsInputProps } from 'sanity'

type Photo = {
  _key: string
  _type?: string
  asset?: { _ref?: string }
  alt?: string
  displayRole?: string
  hotspot?: { x?: number; y?: number; width?: number; height?: number }
  crop?: { top?: number; bottom?: number; left?: number; right?: number }
}

function previewUrl(photo: Photo) {
  const ref = photo.asset?._ref
  if (!ref) return ''
  const [, id, dimensions, format] = ref.match(/^image-([^-]+)-([^-]+)-(.+)$/) ?? []
  if (!id) return ''
  const params = new URLSearchParams({ w: '700', h: '500', fit: 'crop', auto: 'format' })
  const crop = photo.crop
  if (crop) {
    params.set('rect', [
      Math.round((crop.left ?? 0) * Number(dimensions.split('x')[0])),
      Math.round((crop.top ?? 0) * Number(dimensions.split('x')[1])),
      Math.round((1 - (crop.left ?? 0) - (crop.right ?? 0)) * Number(dimensions.split('x')[0])),
      Math.round((1 - (crop.top ?? 0) - (crop.bottom ?? 0)) * Number(dimensions.split('x')[1])),
    ].join(','))
  }
  const hot = photo.hotspot
  if (hot) params.set('fp-x', String(hot.x ?? 0.5)), params.set('fp-y', String(hot.y ?? 0.5)), params.set('crop', 'focalpoint')
  return `https://cdn.sanity.io/images/hc7jjv49/production/${id}-${dimensions}.${format}?${params}`
}

function sourceDimensions(photo: Photo) {
  const match = photo.asset?._ref?.match(/^image-[^-]+-(\d+)x(\d+)-/)
  return match ? `${Number(match[1]).toLocaleString()} × ${Number(match[2]).toLocaleString()} px` : null
}

export default function PhotoGalleryInput(props: ArrayOfObjectsInputProps<Photo>) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const fileInput = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [cropKey, setCropKey] = useState<string | null>(null)
  const [thumbnailSize, setThumbnailSize] = useState(210)
  const photos = (props.value ?? []) as Photo[]

  const uploadImages = async (files: FileList | File[]) => {
    const imageExtension = /\.(png|jpe?g|gif|webp|avif|tiff?|bmp)$/i
    const selected = Array.from(files).filter((file) => file.type.startsWith('image/') || imageExtension.test(file.name))
    if (!selected.length) {
      setUploadError('Choose image files to upload.')
      return
    }

    setUploadError('')
    for (let index = 0; index < selected.length; index += 1) {
      const file = selected[index]
      setUploading(`Uploading ${index + 1} of ${selected.length}: ${file.name}`)
      try {
        const asset = await client.assets.upload('image', file, { filename: file.name, contentType: file.type || undefined })
        props.onItemAppend({
          _key: crypto.randomUUID().replaceAll('-', ''),
          _type: 'image',
          asset: { _ref: asset._id },
          hotspot: { x: 0.5, y: 0.25, width: 1, height: 1 },
          displayRole: 'both',
        })
      } catch {
        setUploadError(`Could not upload ${file.name}. Check your connection and try again.`)
      }
    }
    setUploading('')
  }

  const cropPhoto = photos.find((photo) => photo._key === cropKey)
  const saveFocalPoint = (key: string, x: number, y: number) => {
    const photo = photos.find((item) => item._key === key)
    if (!photo) return
    props.onChange(PatchEvent.from(set({
      x,
      y,
      width: photo.hotspot?.width ?? 1,
      height: photo.hotspot?.height ?? 1,
    }, [{ _key: key }, 'hotspot'])))
  }
  const saveDisplayRole = (key: string, role: NonNullable<Photo['displayRole']>) => {
    props.onChange(PatchEvent.from(set(role, [{ _key: key }, 'displayRole'])))
  }
  const reorder = (toIndex: number) => {
    if (dragIndex === null || dragIndex === toIndex) return
    props.onItemMove({ fromIndex: dragIndex, toIndex })
    setDragIndex(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 12, opacity: 0.7, marginRight: 4 }}>Thumbnail size</span>
        <button type="button" aria-label="Make thumbnails smaller" title="Make thumbnails smaller" disabled={thumbnailSize <= 56} onClick={() => setThumbnailSize((size) => Math.max(56, size - 20))} style={scaleButtonStyle}>−</button>
        <button type="button" aria-label="Make thumbnails larger" title="Make thumbnails larger" disabled={thumbnailSize >= 410} onClick={() => setThumbnailSize((size) => Math.min(410, size + 20))} style={scaleButtonStyle}>+</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize}px, 1fr))`, gap: thumbnailSize < 100 ? 7 : 12 }}>
        {photos.map((photo, index) => {
          const src = previewUrl(photo)
          return (
            <div
              key={photo._key}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); reorder(index) }}
              onDragEnd={() => setDragIndex(null)}
              style={{ position: 'relative', minWidth: 0, aspectRatio: '4 / 3', overflow: 'hidden', borderRadius: 8, background: '#202124', opacity: dragIndex === index ? 0.45 : 1, cursor: 'grab' }}
            >
              {src ? (
                <button type="button" aria-label={`Edit image ${index + 1}`} onClick={() => setCropKey(photo._key)} style={{ display: 'block', width: '100%', height: '100%', padding: 0, border: 0, background: 'transparent', cursor: 'pointer' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={photo.alt ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ) : <div style={{ width: '100%', height: '100%' }}>Image still uploading</div>}
              {thumbnailSize >= 120 && (
                <div style={{ position: 'absolute', inset: 'auto 0 0', padding: '38px 9px 9px', display: 'flex', justifyContent: 'space-between', alignItems: 'end', background: 'linear-gradient(transparent, rgba(0,0,0,.8))', pointerEvents: 'none' }}>
                  <span style={{ color: 'white', fontSize: 12, textShadow: '0 1px 3px #000' }}>Edit image</span>
                  <span style={{ color: 'white', fontSize: 12, textShadow: '0 1px 3px #000' }}>{index + 1}</span>
                </div>
              )}
              <button type="button" aria-label={`Remove image ${index + 1}`} title="Remove image" onClick={() => props.onItemRemove(photo._key)} style={{ ...actionStyle, position: 'absolute', top: thumbnailSize < 100 ? 3 : 8, right: thumbnailSize < 100 ? 3 : 8, width: thumbnailSize < 100 ? 22 : 30, height: thumbnailSize < 100 ? 22 : 30, padding: 0, borderRadius: '50%', fontSize: thumbnailSize < 100 ? 15 : 19, lineHeight: thumbnailSize < 100 ? '20px' : '28px' }}>×</button>
            </div>
          )
        })}
      </div>
      <section aria-label="Add photos" style={{ marginTop: 14, padding: '20px 16px', border: `1px dashed ${dragging ? '#7a9cff' : '#777'}`, borderRadius: 8, background: dragging ? 'rgba(122,156,255,.08)' : 'transparent', textAlign: 'center', cursor: 'pointer' }}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('button, input')) return
          if (!uploading) fileInput.current?.click()
        }}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
        onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false) }}
        onDrop={(event) => { event.preventDefault(); setDragging(false); void uploadImages(event.dataTransfer.files) }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Drop image files here</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>Upload one or more image files, or choose them from your device.</div>
        <button type="button" onClick={() => fileInput.current?.click()} disabled={Boolean(uploading)} style={{ border: 0, borderRadius: 5, padding: '8px 14px', cursor: 'pointer' }}>
          Choose image files
        </button>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(event) => {
          if (event.currentTarget.files) void uploadImages(event.currentTarget.files)
          event.currentTarget.value = ''
        }} />
        {uploading && <div role="status" style={{ marginTop: 10, fontSize: 12 }}>{uploading}</div>}
        {uploadError && <div role="alert" style={{ marginTop: 10, color: '#e88', fontSize: 12 }}>{uploadError}</div>}
      </section>
      {cropPhoto && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCropKey(null) }} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(0,0,0,.72)' }}>
          <div role="dialog" aria-modal="true" aria-labelledby="thumbnail-crop-title" style={{ width: 'min(720px, 100%)', padding: 20, borderRadius: 10, background: '#1b1b1b', color: '#fff', boxShadow: '0 12px 48px rgba(0,0,0,.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div id="thumbnail-crop-title" style={{ fontSize: 16, fontWeight: 600 }}>Edit image</div>
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>Click the image to choose its thumbnail focal point. The original image stays unchanged.</div>
              </div>
              <button type="button" aria-label="Close crop editor" onClick={() => setCropKey(null)} style={{ ...actionStyle, fontSize: 22, padding: '2px 9px' }}>×</button>
            </div>
            <div
              role="button"
              tabIndex={0}
              aria-label="Set thumbnail focal point"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect()
                saveFocalPoint(cropPhoto._key, Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)))
              }}
              style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4 / 3', background: '#000', cursor: 'crosshair' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl(cropPhoto)} alt={cropPhoto.alt ?? ''} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: `${(cropPhoto.hotspot?.x ?? 0.5) * 100}% ${(cropPhoto.hotspot?.y ?? 0.5) * 100}%` }} />
              <span aria-hidden="true" style={{ position: 'absolute', left: `${(cropPhoto.hotspot?.x ?? 0.5) * 100}%`, top: `${(cropPhoto.hotspot?.y ?? 0.5) * 100}%`, width: 18, height: 18, border: '2px solid white', borderRadius: '50%', boxShadow: '0 0 0 1px #000', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
              Original resolution: {sourceDimensions(cropPhoto) ?? 'Unavailable'}
            </div>
            <label style={{ display: 'grid', gap: 6, marginTop: 16, fontSize: 13 }}>
              Show this image in
              <select
                value={cropPhoto.displayRole ?? 'both'}
                onChange={(event) => saveDisplayRole(cropPhoto._key, event.currentTarget.value)}
                style={{ width: '100%', padding: '9px 10px', border: '1px solid #555', borderRadius: 6, background: '#292929', color: '#fff' }}
              >
                <option value="thumbnail">Thumbnail cycling only</option>
                <option value="project">Project modal only</option>
                <option value="both">Both thumbnail and project modal</option>
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

const actionStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 5,
  background: 'rgba(0,0,0,.75)',
  color: '#fff',
  padding: '7px 10px',
  fontSize: 12,
  cursor: 'pointer',
}

const scaleButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  border: '1px solid rgba(255,255,255,.25)',
  borderRadius: 5,
  background: 'transparent',
  color: 'inherit',
  fontSize: 18,
  lineHeight: '26px',
  cursor: 'pointer',
}


