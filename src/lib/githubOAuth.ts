const OAUTH_CLIENT_ID =
  (import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined)?.trim() || 'Ov23liozfUubDI7kfWVD'
const OAUTH_SCOPE = 'repo,read:user,read:org'

export function createGitHubOAuthUrl(): string {
  const redirectUri =
    (import.meta.env.VITE_GITHUB_REDIRECT_URI as string | undefined)?.trim() ||
    new URL('/auth-callback.html', window.location.origin).toString()
  const url = new URL('https://github.com/login/oauth/authorize')
  const stateBytes = new Uint8Array(16)
  window.crypto.getRandomValues(stateBytes)
  const state = Array.from(stateBytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

  sessionStorage.setItem('gh_oauth_state', state)
  url.searchParams.set('client_id', OAUTH_CLIENT_ID)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', OAUTH_SCOPE)
  url.searchParams.set('state', state)
  return url.toString()
}
