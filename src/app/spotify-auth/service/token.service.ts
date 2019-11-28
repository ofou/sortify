import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { SpotifyAuthResponse } from '../shared/spotify-auth-response.i';

@Injectable()
export class TokenService {
  private token = localStorage.getItem('sortify');
  private token$ = new BehaviorSubject(this.token);

  public get oAuthToken(): string {
    return this.token;
  }

  public clearToken(): void {
    this.token = '';
    localStorage.removeItem('sortify');
    this.token$.next(this.token);
  }

  public get authHeader(): { [name: string]: string } {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  public get authTokens(): Observable<string> {
    return this.token$.asObservable();
  }

  public setAuthToken(spotifyResponse: SpotifyAuthResponse): boolean {
    if (!!spotifyResponse && !!spotifyResponse.access_token) {
      this.token = spotifyResponse.access_token;
      localStorage.setItem('sortify', this.token);
    } else {
      this.token = '';
    }
    this.token$.next(this.token);
    return !!this.token;
  }
}
