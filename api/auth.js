// Step 1 of the GitHub OAuth flow.
// Decap opens this in a popup; we redirect the user to GitHub's
// authorization screen, then GitHub redirects back to /api/callback.

export default function handler(req, res) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;

  if (!clientId) {
    res.status(500).send(
      'GitHub OAuth is not configured. Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET in Vercel env vars.'
    );
    return;
  }

  const host = req.headers.host;
  const protocol = host && host.startsWith('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/callback`;

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'repo,user');

  res.writeHead(302, { Location: url.toString() });
  res.end();
}
