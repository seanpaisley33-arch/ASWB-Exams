'use server'

import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'
import webpush from 'web-push'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function submitScheduleRequest(formData: FormData) {
  const full_name = formData.get('full_name') as string
  const email = formData.get('email') as string
  const exam_type_select = formData.get('exam_type') as string
  const other_exam_type = formData.get('other_exam_type') as string
  const exam_type = exam_type_select === 'Other' && other_exam_type ? other_exam_type : exam_type_select
  const target_exam_date = formData.get('target_exam_date') as string
  const study_frequency = formData.get('study_frequency') as string
  const study_hours = Number(formData.get('study_hours'))
  const phone_number = formData.get('phone_number') as string
  const location = formData.get('location') as string
  const preferred_coach = formData.get('preferred_coach') as string
  const roadblock_notes = formData.get('roadblock_notes') as string

  const { data, error } = await supabase
    .from('schedule_requests')
    .insert({
      full_name,
      email,
      exam_type,
      target_exam_date: target_exam_date || null,
      study_frequency: study_frequency || null,
      study_hours: study_hours || null,
      phone_number: phone_number || null,
      location: location || null,
      preferred_coach: preferred_coach || null,
      roadblock_notes,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error inserting schedule request:', error)
    return { error: error.message || 'Failed to submit request' }
  }

  if (data?.id) {
    return { id: data.id }
  }
}

export async function updateScheduleRequest(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return { error: 'Request ID missing' }

  const full_name = formData.get('full_name') as string
  const email = formData.get('email') as string
  const exam_type_select = formData.get('exam_type') as string
  const other_exam_type = formData.get('other_exam_type') as string
  const exam_type = exam_type_select === 'Other' && other_exam_type ? other_exam_type : exam_type_select
  const target_exam_date = formData.get('target_exam_date') as string
  const study_frequency = formData.get('study_frequency') as string
  const study_hours = Number(formData.get('study_hours'))
  const phone_number = formData.get('phone_number') as string
  const location = formData.get('location') as string
  const preferred_coach = formData.get('preferred_coach') as string
  const roadblock_notes = formData.get('roadblock_notes') as string

  const { error } = await supabase
    .from('schedule_requests')
    .update({
      full_name,
      email,
      exam_type,
      target_exam_date: target_exam_date || null,
      study_frequency: study_frequency || null,
      study_hours: study_hours || null,
      phone_number: phone_number || null,
      location: location || null,
      preferred_coach: preferred_coach || null,
      roadblock_notes,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating schedule request:', error)
    return { error: error.message || 'Failed to update request' }
  }

  return { success: true }
}

export async function deleteScheduleRequest(id: string) {
  if (!id) return { error: 'Request ID missing' }

  // Must delete messages first to avoid foreign key constraint errors
  const { error: msgError } = await supabase
    .from('chat_messages')
    .delete()
    .eq('request_id', id)
    
  if (msgError) {
    console.error('Error deleting messages:', msgError)
    return { error: msgError.message || 'Failed to delete associated messages' }
  }

  const { error } = await supabase
    .from('schedule_requests')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting request:', error)
    return { error: error.message || 'Failed to delete request' }
  }

  return { success: true }
}

export async function sendEmailNotification(requestId: string, messagePreview: string) {
  try {
    const { data: request, error } = await supabase
      .from('schedule_requests')
      .select('email, full_name')
      .eq('id', requestId)
      .single()

    if (error || !request) {
      console.error('Failed to fetch request for email notification', error)
      return { error: 'Failed to fetch request' }
    }

    if (!process.env.RESEND_API_KEY || !resend) {
      console.log('RESEND_API_KEY is not set. Simulating email send to:', request.email)
      return { success: true, simulated: true }
    }

    const { data, error: resendError } = await resend.emails.send({
      from: 'Coach <coach@aswbcoaching.com>', 
      replyTo: request.email, // Best practice: avoids spam filters by having a valid reply-to
      to: [request.email],
      subject: 'New Message from Your Coach',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://aswbcoaching.com/icon.png" alt="ASWB Coaching" style="width: 64px; height: 64px; border-radius: 16px; display: inline-block;" />
          </div>
          <h2 style="color: #0f172a; text-align: center;">Hello ${request.full_name},</h2>
          <p style="text-align: center;">You have received a new message from your coach in your secure workspace.</p>
          <div style="padding: 16px; background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; margin: 24px 0; font-style: italic; color: #475569;">
            "${messagePreview || 'Attachment sent'}"
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://aswbcoaching.com/chat/${requestId}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reply in Secure Workspace
            </a>
          </div>
          <p style="margin-top: 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center;">
            Please do not reply directly to this email. Click the button above to access your classroom.
          </p>
        </div>
      `
    })

    if (resendError) {
      console.error('Failed to send email:', resendError)
      return { error: resendError }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in sendEmailNotification:', error)
    return { error: 'Internal Server Error' }
  }
}

export async function subscribeToPush(subscription: any, userId: string) {
  if (!subscription || !subscription.endpoint || !userId) {
    return { error: 'Invalid subscription or userId' }
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      updated_at: new Date().toISOString()
    }, { onConflict: 'endpoint' })

  if (error) {
    console.error('Error saving push subscription:', error)
    return { error: 'Failed to save subscription' }
  }

  return { success: true }
}

export async function sendPushNotification(requestId: string, senderType: 'client' | 'admin', messagePreview: string) {
  try {
    // Determine the recipient's user_id
    // If admin sends message, recipient is the client (userId = requestId)
    // If client sends message, recipient is the admin (userId = 'admin')
    const targetUserId = senderType === 'admin' ? requestId : 'admin'
    const title = senderType === 'admin' ? 'New Message from Coach' : 'New Message from Client'

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)

    if (error || !subscriptions || subscriptions.length === 0) {
      return { success: true, delivered: 0, note: 'No subscriptions found' }
    }

    const payload = JSON.stringify({
      title,
      body: messagePreview || 'Sent an attachment',
      url: senderType === 'admin' ? `/chat/${requestId}` : `/admin/dashboard`
    })

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      }

      try {
        await webpush.sendNotification(pushSubscription, payload)
        return true
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription has expired or is no longer valid, delete it
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('Error sending push notification:', err)
        }
        return false
      }
    })

    const results = await Promise.all(sendPromises)
    const deliveredCount = results.filter(Boolean).length

    return { success: true, delivered: deliveredCount }
  } catch (error) {
    console.error('Error in sendPushNotification:', error)
    return { error: 'Internal Server Error' }
  }
}
