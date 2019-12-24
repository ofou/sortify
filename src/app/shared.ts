const FALLBACK_IMG = 'https://developer.spotify.com/assets/branding-guidelines/icon3@2x.png';

export function getAlbumCover(playlist: SpotifyApi.PlaylistObjectSimplified): string {
  return (playlist && playlist.images[0] && playlist.images[0].url) || FALLBACK_IMG;
}
