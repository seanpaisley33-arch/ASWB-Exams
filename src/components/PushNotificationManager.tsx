'use client'

import { useEffect } from 'react'
import { subscribeToPush } from '@/app/actions'

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationManager({ userId }: { userId: string }) {
  useEffect(() => {
    async function setupPush() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return // Push not supported
      }

      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        
        // Auto-request permission if we haven't asked yet
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission()
          if (permission !== 'granted') return
        } else if (Notification.permission === 'denied') {
          return
        }

        // We have permission, create a subscription
        const existingSubscription = await registration.pushManager.getSubscription()
        if (!existingSubscription) {
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          if (!vapidPublicKey) return

          const newSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          })

          await subscribeToPush(JSON.parse(JSON.stringify(newSubscription)), userId)
        } else {
          // Send existing subscription to server just in case it's not saved
          await subscribeToPush(JSON.parse(JSON.stringify(existingSubscription)), userId)
        }
      } catch (err) {
        console.error('Error setting up push notifications:', err)
      }
    }

    // Delay slightly to not block initial page load
    const timeout = setTimeout(() => {
      setupPush()
    }, 2000)

    return () => clearTimeout(timeout)
  }, [userId])

  return null // This is a logic-only component
}
