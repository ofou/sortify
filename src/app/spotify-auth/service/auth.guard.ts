import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot } from '@angular/router';
import { fromPairs } from 'lodash';

import SpotifyWebApi from 'spotify-web-api-js';
import { StateService } from 'src/app/state/state.service';
import { AuthConfig } from '../shared';
import { SpotifyAuthResponse } from '../shared/spotify-auth-response.i';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
const spotifyApi = new SpotifyWebApi();

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private authService: AuthService,
    private tokenSvc: TokenService,
    private router: Router,
    private _stateService: StateService,
  ) {}

  public async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    // if (!!this.tokenSvc.oAuthToken) {
    try {
      spotifyApi.setAccessToken(this.tokenSvc.oAuthToken);
      const userDetails: SpotifyApi.CurrentUsersProfileResponse = await spotifyApi.getMe();
      this._stateService.setUserProfile(userDetails);

      return true;
    } catch {
      const canActivate: boolean = this.canActivateChild(next, state);
      if (!canActivate) {
        const ac: AuthConfig = {
          client_id: '727f47bff18244eb83ad879e8ad30682', // WebPortal App Id. Shoud be config
          response_type: 'token',
          redirect_uri: 'http://localhost:4200/authorized', // My URL
          state: state.url,
          scope: [
            'playlist-read-private',
            'playlist-read-collaborative',
            'playlist-modify-public',
            'playlist-modify-private',
          ],
          show_dialog: true,
        };
        this.authService.configure(ac).authorize();
        // this.router.navigate(['login']);
        // }
        // return false;
      }
      return canActivate;
    }
  }

  public canActivateChild(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const response = this.extractApiResponse(next.fragment);
    if (response) {
      this.tokenSvc.setAuthToken(response);
    }
    return !!response;
  }

  private extractApiResponse(fragment: string): SpotifyAuthResponse | null {
    if (!!fragment) {
      return fromPairs(fragment.split('&').map((s) => s.split('='))) as SpotifyAuthResponse;
    }
    return null;
  }
}
