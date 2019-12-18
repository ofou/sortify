import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { SpotifyAuthResponse } from '../shared/spotify-auth-response.i';

const TOKEN_KEY = 'SORTIFY_AUTH_TOKEN';

function getToken(): string {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

@Injectable()
export class TokenService {
  private token$ = new BehaviorSubject(getToken());

  public get oAuthToken(): string {
    return getToken();
  }

  public clearToken(): void {
    clearToken();
    this.token$.next(getToken());
  }

  public get authHeader(): { [name: string]: string } {
    return getToken() ? { Authorization: `Bearer ${getToken()}` } : {};
  }

  public get authTokens(): Observable<string> {
    return this.token$.asObservable();
  }

  public setAuthToken(spotifyResponse: SpotifyAuthResponse): boolean {
    if (!!spotifyResponse && !!spotifyResponse.access_token) {
      setToken(spotifyResponse.access_token);
    } else {
      clearToken();
    }
    this.token$.next(getToken());
    return !!getToken();
  }
}
