'use client'

import { useEffect, useState } from 'react'
import { X, Share } from 'lucide-react'

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Detect if already installed/standalone
    const isStandaloneMode = ('standalone' in window.navigator) && !!(window.navigator as any).standalone
    setIsStandalone(isStandaloneMode)
    
    // Check local storage for dismissed state
    if (localStorage.getItem('iosInstallPromptDismissed') === 'true') {
      setDismissed(true)
    }
  }, [])

  if (!isIOS || isStandalone || dismissed) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('iosInstallPromptDismissed', 'true')
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-start gap-3 relative border border-slate-700">
        <button 
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 bg-slate-800 rounded-full p-1 border border-slate-600 hover:bg-slate-700"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex-1">
          <h4 className="font-bold mb-1 flex items-center gap-2">
            <span className="text-xl">📱</span> Enable Notifications
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            To receive instant message alerts on iPhone, tap the <Share className="w-4 h-4 inline" /> Share button below and select <strong>"Add to Home Screen"</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
