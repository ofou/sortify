import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild, Router } from '@angular/router';
import { fromPairs } from 'lodash';

import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { SpotifyAuthResponse } from '../shared/spotify-auth-response.i';
import { AuthConfig } from '../shared';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private tokenSvc: TokenService, private router: Router) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!!this.tokenSvc.oAuthToken) {
      return true;
    }
    const canActivate: boolean = this.canActivateChild(next, state);
    if (!canActivate) {
      const ac: AuthConfig = {
        client_id: '727f47bff18244eb83ad879e8ad30682', // WebPortal App Id. Shoud be config
        response_type: 'token',
        redirect_uri: 'http://localhost:4200/authorized', // My URL
        state: state.url,
        scope: 'playlist-read-private',
        show_dialog: true,
      };
      this.authService.configure(ac).authorize();
      // this.router.navigate(['login']);
    }
    return canActivate;
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
      return fromPairs(fragment.split('&').map(s => s.split('='))) as SpotifyAuthResponse;
    }
    return null;
  }
}
