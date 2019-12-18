import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
import { ScopesBuilder } from '../shared/scopes-builder';
import { AuthConfig } from '../shared/spotify-auth-config.i';
import { SpotifyAuthResponse } from '../shared/spotify-auth-response.i';

export const requestAuthUrl = 'https://accounts.spotify.com/authorize';

export function buildAuthUrl(config: AuthConfig): string {
  const params = [];
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'object') {
      params.push(`${key}=${(value as string[]).join(' ')}`);
    } else {
      params.push(`${key}=${value}`);
    }
  }

  return `${requestAuthUrl}?${params.join('&')}`;
}
@Injectable()
export class AuthService {
  private authorized$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  // Signal someone, that router can navigate somewhere
  public authorized(): void {
    this.authorized$.next(true);
  }

  public get authorizedStream(): Observable<boolean> {
    return this.authorized$.asObservable();
  }
}
