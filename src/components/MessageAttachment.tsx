import { FileIcon, Download, Image as ImageIcon, Video } from 'lucide-react'

interface MessageAttachmentProps {
  fileUrl: string
  fileType: string
  fileName: string
}

export function MessageAttachment({ fileUrl, fileType, fileName }: MessageAttachmentProps) {
  const isImage = fileType.startsWith('image/')
  const isVideo = fileType.startsWith('video/')
  const isAudio = fileType.startsWith('audio/')

  if (isImage) {
    return (
      <div className="mt-2 rounded-xl overflow-hidden max-w-sm border border-slate-200/50 shadow-sm bg-slate-50">
        <img src={fileUrl} alt={fileName} className="w-full h-auto object-cover" />
      </div>
    )
  }

  if (isVideo) {
    return (
      <div className="mt-2 rounded-xl overflow-hidden max-w-sm border border-slate-200/50 shadow-sm bg-slate-900">
        <video controls className="w-full h-auto">
          <source src={fileUrl} type={fileType} />
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }

  if (isAudio) {
    return (
      <div className="mt-2 rounded-xl p-2 max-w-sm border border-slate-200/50 shadow-sm bg-white/80 backdrop-blur">
        <audio controls className="w-full h-10 outline-none">
          <source src={fileUrl} type={fileType} />
          Your browser does not support the audio element.
        </audio>
      </div>
    )
  }

  // Default to a generic file download link
  return (
    <a 
      href={fileUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-3 p-3 rounded-xl bg-white/50 hover:bg-white border border-slate-200/50 shadow-sm transition-colors group max-w-xs"
    >
      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
        <FileIcon className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-700 truncate">{fileName}</p>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Document</p>
      </div>
      <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0" />
    </a>
  )
}
