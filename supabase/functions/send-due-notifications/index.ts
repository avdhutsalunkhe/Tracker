/**
 * Supabase Edge Function: send-due-notifications
 *
 * Queries `allotted_slots` where `notified_at IS NULL` and the slot start time
 * is within the user's configured `pre_alert_mins`, sends a Web Push notification
 * using VAPID keys, and marks `notified_at`.
 *
 * SETUP INSTRUCTIONS:
 * 1. Generate VAPID keys:
 *    npx web-push generate-vapid-keys
 * 2. Add to your frontend `.env` and Vercel/Netlify env vars:
 *    VITE_VAPID_PUBLIC_KEY=<your-public-key>
 * 3. Set Supabase Edge Function secrets:
 *    supabase secrets set VAPID_PUBLIC_KEY=<your-public-key> VAPID_PRIVATE_KEY=<your-private-key> VAPID_SUBJECT=mailto:you@example.com
 * 4. Deploy & schedule every minute via pg_cron:
 *    supabase functions deploy send-due-notifications
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:tracker@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

Deno.serve(async () => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const nowMins = now.getUTCHours() * 60 + now.getUTCMinutes();

    const { data: dueSlots, error: slotsErr } = await supabase
      .from('allotted_slots')
      .select('*')
      .eq('slot_date', todayStr)
      .eq('completed', false)
      .is('notified_at', null);

    if (slotsErr) throw slotsErr;
    if (!dueSlots || dueSlots.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let sentCount = 0;

    for (const slot of dueSlots) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', slot.user_id);

      if (!subs || subs.length === 0) continue;

      const [h, m] = String(slot.start_time).split(':').map(Number);
      const startMins = (h || 0) * 60 + (m || 0);
      const preAlert = subs[0]?.pre_alert_mins ?? 5;

      if (startMins - nowMins <= preAlert && startMins - nowMins >= -2) {
        const payload = JSON.stringify({
          title: `Upcoming Study Block: ${slot.title}`,
          body: `${slot.start_time} – ${slot.end_time} (${slot.slot_type})`,
          tag: `slot-${slot.id}`,
          url: '/timer',
        });

        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              payload
            );
            sentCount++;
          } catch (pushErr) {
            console.error('Push failed for endpoint:', sub.endpoint, pushErr);
          }
        }

        await supabase
          .from('allotted_slots')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', slot.id);
      }
    }

    return new Response(JSON.stringify({ sent: sentCount }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
