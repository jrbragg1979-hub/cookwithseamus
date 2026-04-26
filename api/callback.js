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
  //   1. Popup repeatedly sends "authorizing:github" to opener
  //   2. Opener (admin page) echoes the same message back
  //   3. On the echo, popup posts "authorization:github:<status>:<JSON>" and closes
  const payload = JSON.stringify(content).replace(/</g, '\\u003c');
  const finalMessage = `authorization:github:${status}:${payload}`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Authorizing…</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; padding: 32px; max-width: 520px; margin: 0 auto; color: #3E2C20;">
  <h2 id="status-title" style="margin: 0 0 8px;">Authorizing with GitHub…</h2>
  <p id="status-detail" style="margin: 0; color: #8A7A68;">This window should close automatically in a moment.</p>
  <script>
    (function () {
      var finalMessage = ${JSON.stringify(finalMessage)};
      var titleEl = document.getElementById('status-title');
      var detailEl = document.getElementById('status-detail');

      if (!window.opener) {
        titleEl.textContent = 'Lost connection to the admin window.';
        detailEl.textContent = 'Close this tab, return to /admin/, and click "Login with GitHub" again. (This usually means the original tab was closed or refreshed.)';
        return;
      }

      var done = false;

      function receiveMessage(e) {
        // Decap echoes "authorizing:github" back. On any reply, send the token.
        if (done) return;
        done = true;
        clearInterval(handshakeInterval);
        clearTimeout(timeoutHandle);
        try {
          window.opener.postMessage(finalMessage, e.origin || '*');
          titleEl.textContent = 'Authorized.';
          detailEl.textContent = 'You can close this window.';
        } catch (err) {
          titleEl.textContent = 'Could not deliver the token.';
          detailEl.textContent = err.message;
        }
        window.removeEventListener('message', receiveMessage, false);
        setTimeout(function () { try { window.close(); } catch (_) {} }, 600);
      }

      window.addEventListener('message', receiveMessage, false);

      // Re-broadcast every 250ms until the admin page acknowledges. This
      // covers the race where the popup loads before Decap's listener
      // is fully attached, or where the browser delivered the popup as
      // a tab (in which case the first send may be ignored).
      var handshakeInterval = setInterval(function () {
        if (done) return;
        try {
          window.opener.postMessage('authorizing:github', '*');
        } catch (_) {}
      }, 250);

      // After 30s give up and tell the user what to do.
      var timeoutHandle = setTimeout(function () {
        if (done) return;
        clearInterval(handshakeInterval);
        titleEl.textContent = 'Authorization timed out.';
        detailEl.textContent = 'Make sure the /admin/ tab is still open in another tab, then close this window and click "Login with GitHub" again.';
      }, 30000);
    })();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
