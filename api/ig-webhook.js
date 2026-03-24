export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.status(403).send('Verification failed');
  }

  if (req.method === 'POST') {
    try {
      const payload = req.body;

      console.log('--- Instagram Webhook Payload ---');
      console.log(JSON.stringify(payload, null, 2));

      const entry0 = payload?.entry?.[0];
      const messaging0 = entry0?.messaging?.[0];

      const senderPsid = messaging0?.sender?.id;
      const messageText = messaging0?.message?.text;

      console.log('Extracted sender PSID:', senderPsid);
      console.log('Extracted message text:', messageText);
      console.log('AUTO_REPLY_ENABLED:', process.env.AUTO_REPLY_ENABLED);

      if (!senderPsid || !messageText) {
        console.log('No senderPsid or messageText, skip replying.');
        return res.status(200).send('EVENT_RECEIVED');
      }

      if (process.env.AUTO_REPLY_ENABLED !== 'true') {
        console.log('AUTO_REPLY_ENABLED is not true, skip auto reply.');
        return res.status(200).send('EVENT_RECEIVED');
      }

      const replyText =
        'We have received your inquiry. Please share your phone number so we can contact you soon.';

      const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
      console.log('Token length:', accessToken ? accessToken.length : 0);
      console.log('META_PAGE_ACCESS_TOKEN exists:', !!accessToken);

      const response = await fetch(
        'https://graph.facebook.com/v25.0/me/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            recipient: { id: senderPsid },
            message: { text: replyText },
          }),
        }
      );

      const result = await response.json();
      console.log('Send message status:', response.status);
      console.log('Send message result:', JSON.stringify(result, null, 2));

      return res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error('POST handler error:', error);
      return res.status(500).send('Internal Server Error');
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).send('Method Not Allowed');
}
