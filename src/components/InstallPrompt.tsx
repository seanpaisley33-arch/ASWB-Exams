'use client'

import { useEffect, useState } from 'react'
import { Share } from 'lucide-react'

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Detect if already installed/standalone
    const isStandaloneMode = ('standalone' in window.navigator) && !!(window.navigator as any).standalone
    setIsStandalone(isStandaloneMode)
  }, [])

  if (!isIOS || isStandalone) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-start gap-3 relative border border-slate-700">
        <div className="flex-1">
          <h4 className="font-bold mb-1 flex items-center gap-2">
            <span className="text-xl">📱</span> Enable Notifications
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            To receive instant message alerts on iPhone, tap the <Share className="w-4 h-4 inline" /> Share button below (or at the top right of your address bar) and select <strong>"Add to Home Screen"</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
