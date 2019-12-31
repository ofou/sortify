import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthConfig, AuthService, ScopesBuilder, TokenService } from '../spotify-auth';
import { buildAuthUrl } from '../spotify-auth/service/auth.service';
export const CLIENT_ID = '727f47bff18244eb83ad879e8ad30682';
export const AUTHORIZED_ROUTE = 'authorized';
@Component({
  selector: 'sort-login',
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  constructor(private authService: AuthService, private tokenSvc: TokenService, private router: Router) {}

  ngOnInit() {
    if (!!this.tokenSvc.oAuthToken) {
      this.router.navigate(['/']);
    }
  }
  get loginUrl(): string {
    const scopes = new ScopesBuilder() /* .withScopes(ScopesBuilder.LIBRARY) */
      .build();

    const redirectUri: URL = new URL(window.location.origin);
    redirectUri.pathname = `/${AUTHORIZED_ROUTE}`;
    const ac: AuthConfig = {
      client_id: CLIENT_ID,
      response_type: 'token',
      redirect_uri: redirectUri.href,
      state: '',
      scope: [
        'playlist-read-private',
        'playlist-read-collaborative',
        'playlist-modify-public',
        'playlist-modify-private',
        // 'user-top-read' // for top
      ],
      show_dialog: true,
    };
    return buildAuthUrl(ac);
  }
}
