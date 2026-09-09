const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '';
const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY || '';

export const sendNotificationToUser = async (targetUserId: 'Baby' | 'Mi Rey', title: string, message: string) => {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn('OneSignal credentials missing, notification not sent.');
    return;
  }

  const payload = {
    app_id: ONESIGNAL_APP_ID,
    target_channel: "push",
    include_aliases: {
      external_id: [targetUserId]
    },
    headings: { en: title, es: title },
    contents: { en: message, es: message },
    url: window.location.origin
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Failed to send notification', await response.text());
    }
  } catch (error) {
    console.error('Error sending notification', error);
  }
};
