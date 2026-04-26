// Step 2 of the GitHub OAuth flow.
// GitHub redirects the user here with a temporary `code`. We exchange
// it for an access token, fetch the user profile, then hand the auth
// state to Decap via three parallel channels (localStorage, BroadcastChannel,
// postMessage) — because GitHub's Cross-Origin-Opener-Policy header
// severs window.opener.postMessage when the popup leaves and returns.

export default async function handler(req, res) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    sendError(res, 'GitHub OAuth is not configured. Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET in Vercel env vars.');
    return;
  }

  const code = req.query?.code;
  if (!code) {
    sendError(res, 'Missing OAuth code from GitHub.');
    return;
  }

  let tokenData;
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    tokenData = await tokenResponse.json();
  } catch (err) {
    sendError(res, `Could not reach GitHub: ${err.message}`);
    return;
  }

  if (tokenData.error || !tokenData.access_token) {
    sendError(res, tokenData.error_description || tokenData.error || 'No token received from GitHub.');
    return;
  }

  // Fetch the user profile so Decap has a complete login record.
  let profile = {};
  try {
    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'cookwithseamus-cms',
      },
    });
    profile = await profileRes.json();
  } catch (_) {
    // Token works without profile, just less metadata for the UI.
  }

  const decapUser = {
    backendName: 'github',
    token: tokenData.access_token,
    login: profile.login || 'user',
    name: profile.name || profile.login || 'GitHub User',
    avatar_url: profile.avatar_url || '',
  };

  sendSuccess(res, decapUser);
}

function sendSuccess(res, user) {
  const userJson = JSON.stringify(user).replace(/</g, '\\u003c');
  const legacyMessage = `authorization:github:success:${JSON.stringify({
    token: user.token,
    provider: 'github',
  }).replace(/</g, '\\u003c')}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Logging you in…</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #FAF6F1; color: #3E2C20; padding: 48px 24px; max-width: 520px; margin: 0 auto; text-align: center; }
    h2 { font-family: Georgia, serif; margin: 0 0 12px; }
    p { color: #8A7A68; margin: 0 0 28px; line-height: 1.6; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #B87333, #c89d4a); color: white; text-decoration: none; font-weight: 700; border-radius: 12px; box-shadow: 0 6px 20px rgba(184,115,51,0.35); transition: transform 0.2s; }
    .btn:hover { transform: translateY(-1px); }
  </style>
</head>
<body>
  <h2 id="status-title">Logging you in…</h2>
  <p id="status-detail">One moment.</p>
  <a href="/admin/" class="btn" id="continue-btn" style="display:none;">Continue to admin</a>
  <script>
    (function () {
      var user = ${userJson};
      var legacyMessage = ${JSON.stringify(legacyMessage)};
      var titleEl = document.getElementById('status-title');
      var detailEl = document.getElementById('status-detail');
      var btnEl = document.getElementById('continue-btn');

      // (1) Persist auth to localStorage. Decap reads this on /admin/ load.
      try {
        localStorage.setItem('decap-cms-user', JSON.stringify(user));
        localStorage.setItem('netlify-cms-user', JSON.stringify(user));
      } catch (_) {}

      // (2) Broadcast to other same-origin tabs (e.g. the original /admin/ tab).
      // BroadcastChannel works even when window.opener has been severed
      // by GitHub's Cross-Origin-Opener-Policy header.
      try {
        var bc = new BroadcastChannel('decap-cms-auth');
        bc.postMessage({ type: 'auth', user: user });
        bc.close();
      } catch (_) {}

      // (3) Legacy postMessage handshake — works when COOP didn't sever opener.
      if (window.opener) {
        var sent = false;
        function receiveMessage(e) {
          if (sent) return;
          sent = true;
          try { window.opener.postMessage(legacyMessage, e.origin || '*'); } catch (_) {}
          window.removeEventListener('message', receiveMessage, false);
        }
        window.addEventListener('message', receiveMessage, false);

        var pings = 0;
        var pingInterval = setInterval(function () {
          if (sent || pings++ > 20) { clearInterval(pingInterval); return; }
          try { window.opener.postMessage('authorizing:github', '*'); } catch (_) {}
        }, 250);
      }

      // After ~1.5s, surface the success state and a fallback button.
      setTimeout(function () {
        titleEl.textContent = 'Logged in.';
        detailEl.textContent = 'If your original admin tab is still open it has refreshed automatically. Otherwise, click below to continue.';
        btnEl.style.display = 'inline-block';
      }, 1500);
    })();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}

function sendError(res, message) {
  const safe = String(message).replace(/[<&>]/g, (c) => ({ '<': '&lt;', '&': '&amp;', '>': '&gt;' }[c]));
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Authorization error</title></head>
<body style="font-family: system-ui, sans-serif; padding: 32px; max-width: 520px; margin: 0 auto; color: #3E2C20;">
  <h2>Couldn't log in</h2>
  <p style="color:#8A7A68;">${safe}</p>
  <p><a href="/admin/" style="color:#B87333;">Back to admin</a></p>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(400).send(html);
}
