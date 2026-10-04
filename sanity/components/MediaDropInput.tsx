'use client'

import { useRef, useState } from 'react'
import { useClient, type ArrayOfObjectsInputProps } from 'sanity'

type MediaKind = 'audio' | 'video'

export default function MediaDropInput({ props, kind }: { props: ArrayOfObjectsInputProps; kind: MediaKind }) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const fileInput = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState('')
  const [error, setError] = useState('')
  const label = kind === 'audio' ? 'audio' : 'video'

  const uploadFiles = async (files: FileList | File[]) => {
    const extensions = kind === 'audio' ? /\.(mp3|wav|m4a|aac|aiff|flac|ogg)$/i : /\.(mp4|mov|m4v|webm|mkv|avi)$/i
    const selected = Array.from(files).filter((file) => file.type.startsWith(`${kind}/`) || extensions.test(file.name))
    if (!selected.length) {
      setError(`Choose ${kind} files to upload.`)
      return
    }

    setError('')
    for (let index = 0; index < selected.length; index += 1) {
      const file = selected[index]
      setUploading(`Uploading ${index + 1} of ${selected.length}: ${file.name}`)
      try {
        const asset = await client.assets.upload('file', file, { filename: file.name, contentType: file.type || undefined })
        const fileValue = { _type: 'file', asset: { _type: 'reference', _ref: asset._id } }
        const item = kind === 'video'
          ? { _key: crypto.randomUUID().replaceAll('-', ''), _type: 'uploadedVideo', file: fileValue, caption: '', displayRole: 'project' }
          : { _key: crypto.randomUUID().replaceAll('-', ''), _type: 'object', file: fileValue, caption: '' }
        props.onItemAppend(item)
      } catch {
        setError(`Could not upload ${file.name}. Check your connection and try again.`)
      }
    }
    setUploading('')
  }

  return (
    <div>
      <div
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('button, input')) return
          if (!uploading) fileInput.current?.click()
        }}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
        onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false) }}
        onDrop={(event) => { event.preventDefault(); setDragging(false); void uploadFiles(event.dataTransfer.files) }}
        style={{ marginBottom: 14, padding: '20px 16px', border: `1px dashed ${dragging ? '#7a9cff' : '#777'}`, borderRadius: 8, background: dragging ? 'rgba(122,156,255,.08)' : 'transparent', textAlign: 'center', cursor: 'pointer' }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Drop {label} files here</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>Upload one or more {label} files, or choose them from your device.</div>
        <button type="button" onClick={() => fileInput.current?.click()} disabled={Boolean(uploading)} style={{ border: 0, borderRadius: 5, padding: '8px 14px', cursor: 'pointer' }}>
          Choose {label} files
        </button>
        <input ref={fileInput} type="file" accept={kind === 'audio' ? 'audio/*,.mp3,.wav,.m4a,.aac,.aiff,.flac,.ogg' : 'video/*,.mp4,.mov,.m4v,.webm,.mkv,.avi'} multiple hidden onChange={(event) => {
          if (event.currentTarget.files) void uploadFiles(event.currentTarget.files)
          event.currentTarget.value = ''
        }} />
        {uploading && <div role="status" style={{ marginTop: 10, fontSize: 12 }}>{uploading}</div>}
        {error && <div role="alert" style={{ marginTop: 10, color: '#e88', fontSize: 12 }}>{error}</div>}
      </div>
      {props.renderDefault(props)}
    </div>
  )
}

export function AudioDropInput(props: ArrayOfObjectsInputProps) {
  return <MediaDropInput props={props} kind="audio" />
}

export function VideoDropInput(props: ArrayOfObjectsInputProps) {
  return <MediaDropInput props={props} kind="video" />
}



