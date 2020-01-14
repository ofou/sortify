const FALLBACK_IMG = 'https://developer.spotify.com/assets/branding-guidelines/icon3@2x.png';

export function getAlbumCover(playlist: SpotifyApi.PlaylistObjectSimplified, biggestSize: boolean): string {
  return (
    (playlist && playlist.images.length > 0 && playlist.images[biggestSize ? 0 : playlist.images.length - 1].url) ||
    FALLBACK_IMG
  );
}
