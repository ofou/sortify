import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import SpotifyWebApi from 'spotify-web-api-js';
import { generateLoginUrl } from '../shared';
import { SpotifyAuthResponse, TokenService } from './token.service';
import { StateService } from '../services/state.service';

const spotifyApi = new SpotifyWebApi();

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private tokenSvc: TokenService, private router: Router, private _stateService: StateService) {}

  public async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    try {
      spotifyApi.setAccessToken(this.tokenSvc.oAuthToken);
      const userDetails: SpotifyApi.CurrentUsersProfileResponse = await spotifyApi.getMe();
      this._stateService.setUserProfile(userDetails);

      return true;
    } catch {
      const response = this.getSpotifyAuthResponse(next);
      if (response) {
        this.tokenSvc.setAuthToken(response);
        return true;
      } else {
        const currentUrl: string = state.url;
        if (currentUrl === '/') {
          await this.router.navigate(['login']);
        } else {
          window.location.href = generateLoginUrl(btoa(encodeURIComponent(currentUrl)));
        }
        return false;
      }
    }
  }

  private getSpotifyAuthResponse(next: ActivatedRouteSnapshot): SpotifyAuthResponse {
    if (!!next.fragment) {
      const url: URLSearchParams = new URLSearchParams(next.fragment);
      return <SpotifyAuthResponse>(<any>Object.fromEntries(url));
    }
    return undefined;
  }
}
