import { buildAuthUrl, IAuthConfig } from './spotify-auth/auth.utilities';

const FALLBACK_IMG = 'https://developer.spotify.com/assets/branding-guidelines/icon3@2x.png';
const AUTHORIZED_ROUTE = 'authorized';
const CLIENT_ID = '1f6c5ac1591b4163b655d1a4b9965c38';

export function getAlbumCover(playlist: SpotifyApi.PlaylistObjectSimplified | undefined, biggestSize: boolean): string {
  return (
    (playlist && playlist.images.length > 0 && playlist.images[biggestSize ? 0 : playlist.images.length - 1].url) ||
    FALLBACK_IMG
  );
}

export function generateLoginUrl(state: string): string {
  const redirectUri: URL = new URL(window.location.origin);
  redirectUri.pathname = `/${AUTHORIZED_ROUTE}`;
  const ac: IAuthConfig = {
    client_id: CLIENT_ID,
    response_type: 'token',
    redirect_uri: redirectUri.href,
    state,
    scope: [
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-public',
      'playlist-modify-private',
      // 'user-top-read' // for top artists/albums
    ],
    show_dialog: true,
  };
  return buildAuthUrl(ac);
}
