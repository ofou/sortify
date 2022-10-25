export interface IAuthConfig {
  client_id: string;
  response_type: 'token' | string;
  redirect_uri: string;
  state: string;
  show_dialog: boolean;
  scope: SpotifyScope[] | string;
}

// To update run following code at
// https://developer.spotify.com/documentation/general/guides/scopes/
// Array.from(document.querySelector('main article ul').querySelectorAll('li a'))
//   .map((element) => `'${element.textContent}'`)
//   .join(' | ');
export type SpotifyScope =
  | 'ugc-image-upload'
  | 'user-read-playback-state'
  | 'user-modify-playback-state'
  | 'user-read-currently-playing'
  | 'streaming'
  | 'app-remote-control'
  | 'user-read-email'
  | 'user-read-private'
  | 'playlist-read-collaborative'
  | 'playlist-modify-public'
  | 'playlist-read-private'
  | 'playlist-modify-private'
  | 'user-library-modify'
  | 'user-library-read'
  | 'user-top-read'
  | 'user-read-recently-played'
  | 'user-follow-read'
  | 'user-follow-modify';

const requestAuthUrl = 'https://accounts.spotify.com/authorize';

export function buildAuthUrl(config: IAuthConfig): string {
  let params: string[] = [];
  for (const [key, value] of Object.entries(config)) {
    let param: string;
    if (typeof value === 'object') {
      param = `${key}=${(<string[]>value).join(' ')}`;
    } else {
      param = `${key}=${value}`;
    }
    params = [...params, param];
  }
  return `${requestAuthUrl}?${params.join('&')}`;
}
