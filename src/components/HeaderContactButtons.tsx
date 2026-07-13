'use client'

import { useState } from 'react'
import { Mail, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function HeaderContactButtons() {
  const [emailCopied, setEmailCopied] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }

  const handleEmailClick = (e: React.MouseEvent) => {
    const email = process.env.NEXT_PUBLIC_COACH_EMAIL || 'drkevinaswb@gmail.com'
    navigator.clipboard.writeText(email).catch(() => {})
    setEmailCopied(true)
    setTimeout(() => setEmailCopied(false), 3000)
    showToast("Email address copied successfully!")
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
          <div className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-200 shadow-sm">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
          </div>
        </a>
        <a 
          href={`mailto:${process.env.NEXT_PUBLIC_COACH_EMAIL || 'drkevinaswb@gmail.com'}`} 
          onClick={handleEmailClick}
          aria-label="Email"
        >
          <div className={`flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full transition-colors border shadow-sm ${emailCopied ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            {emailCopied ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mail className="w-5 h-5 sm:w-6 sm:h-6" />}
          </div>
        </a>
      </div>

      <AnimatePresence>
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm w-[90vw] border border-slate-700/50"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm font-medium leading-tight">
              {toastMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
