// Step 2 of the GitHub OAuth flow.
// GitHub redirects the user here with a temporary `code`. We exchange
// it for an access token, then send the token back to the Decap admin
// window via postMessage and close the popup.

export default async function handler(req, res) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).send(
      'GitHub OAuth is not configured. Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET in Vercel env vars.'
    );
    return;
  }

  const code = req.query?.code;
  if (!code) {
    res.status(400).send('Missing OAuth code from GitHub.');
    return;
  }

  let tokenResponse;
  try {
    tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
  } catch (err) {
    res.status(502).send(`Could not reach GitHub: ${err.message}`);
    return;
  }

  const data = await tokenResponse.json();

  if (data.error || !data.access_token) {
    sendResult(res, 'error', { message: data.error_description || data.error || 'No token received' });
    return;
  }

  sendResult(res, 'success', { token: data.access_token, provider: 'github' });
}

function sendResult(res, status, content) {
  // Decap's expected handshake:
  //   1. Popup sends "authorizing:github" to opener
  //   2. Opener echoes a message back (any origin)
  //   3. Popup posts the final "authorization:github:<status>:<JSON>" reply
  const payload = JSON.stringify(content).replace(/</g, '\\u003c');

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Authorizing…</title></head>
<body>
  <p style="font-family: system-ui, sans-serif; padding: 24px;">Authorizing with GitHub… you can close this window.</p>
  <script>
    (function () {
      function receiveMessage(e) {
        window.opener.postMessage(
          'authorization:github:${status}:${payload}',
          e.origin
        );
        window.removeEventListener('message', receiveMessage, false);
      }
      window.addEventListener('message', receiveMessage, false);
      window.opener.postMessage('authorizing:github', '*');
    })();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
