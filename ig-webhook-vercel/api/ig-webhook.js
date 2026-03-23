export default async function handler(req, res) {
  // ---------------------------
  // (1) GET: Meta webhook verification
  // ---------------------------
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Meta expects you to echo back hub.challenge when verify_token matches.
    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.status(403).send('Verification failed');
  }

  // ---------------------------
  // (2) POST: Instagram webhook events
  // ---------------------------
  if (req.method === 'POST') {
    // Note: In Vercel serverless functions, req.body will typically be parsed JSON
    // when Content-Type is application/json.
    const payload = req.body;

    // Log the entire payload so you can confirm the exact structure from your subscription.
    console.log('--- Instagram Webhook Payload ---');
    console.log(JSON.stringify(payload, null, 2));

    // Common structure when subscribed to messaging events:
    // payload.entry[0].messaging[0].sender.id -> sender PSID (the numeric ID you reply to)
    // payload.entry[0].messaging[0].message.text -> message text
    const entry0 = payload?.entry?.[0];
    const messaging0 = entry0?.messaging?.[0];

    const senderPsid = messaging0?.sender?.id;      // ✅ Sender/User ID (PSID)
    const messageText = messaging0?.message?.text;  // ✅ Message text

    console.log('Extracted sender PSID:', senderPsid);
    console.log('Extracted message text:', messageText);

    // IMPORTANT: Always respond 200 quickly, otherwise Meta may retry.
    return res.status(200).send('EVENT_RECEIVED');
  }

  // ---------------------------
  // Anything else
  // ---------------------------
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).send('Method Not Allowed');
}