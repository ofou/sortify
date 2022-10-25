import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import SpotifyWebApi from 'spotify-web-api-js';
import { StateService } from '../services/state.service';
import { generateLoginUrl } from '../shared';
import { ISpotifyAuthResponse, TokenService } from './token.service';

const spotifyApi = new SpotifyWebApi();

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private tokenSvc: TokenService, private router: Router, private _stateService: StateService) {}

  private getSpotifyAuthResponse(next: ActivatedRouteSnapshot): ISpotifyAuthResponse | undefined {
    if (!!next.fragment) {
      const url: URLSearchParams = new URLSearchParams(next.fragment);
      return <ISpotifyAuthResponse>(<any>Object.fromEntries(url));
    }
    return undefined;
  }

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
        const currentUrl: string = state && state.url;
        if (currentUrl === '/') {
          await this.router.navigate(['login']);
        } else {
          window.location.href = generateLoginUrl(btoa(encodeURIComponent(currentUrl)));
        }
        return false;
      }
    }
  }
}
