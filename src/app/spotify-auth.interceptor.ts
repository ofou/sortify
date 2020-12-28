import { Injectable } from '@angular/core';
import { SpotifyAuthInterceptor, TokenService } from './spotify-auth';

@Injectable()
export class SpotifyAuthInterceptor2 extends SpotifyAuthInterceptor {
  constructor(tokenSvc: TokenService) {
    super(tokenSvc);
  }
  doOnError(err: any): void {}
}
