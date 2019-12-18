import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthConfig, AuthService, ScopesBuilder, TokenService } from './spotify-auth';
import { StateService } from './state/state.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const USER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <path d="M24 24c4.42 0 8-3.59 8-8 0-4.42-3.58-8-8-8s-8 3.58-8 8c0 4.41 3.58 8 8 8zm0 4c-5.33 0-16 2.67-16 8v4h32v-4c0-5.33-10.67-8-16-8z"/>
    <path d="M0 0h48v48H0z" fill="none"/>
</svg>
`;

@Component({
  selector: 'sort-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'sortify';
  fallbackUserImage: SafeResourceUrl;
  constructor(
    private authService: AuthService,
    private router: Router,
    private tokenSvc: TokenService,
    public _stateService: StateService,
    private _sanitizer: DomSanitizer,
  ) {
    this.fallbackUserImage = this._sanitizer.bypassSecurityTrustResourceUrl(
      `data:image/svg+xml,${encodeURIComponent(USER_SVG)}`,
    );
  }

  ngOnInit(): void {
    // this._stateService.setLoading(true);
    this.authService.authorizedStream.pipe(filter((x: boolean) => x)).subscribe(() => {
      this.router.navigate(['/']);
      // this._stateService.setLoading(false);
    });
  }
  logout(): void {
    this.tokenSvc.clearToken();
    this.router.navigate(['login']);
  }

  get username(): string {
    return this._stateService.userProfile && this._stateService.userProfile.display_name;
  }

  get loading(): boolean {
    return this._stateService.loading;
  }

  get loggedIn(): boolean {
    return !!this._stateService.userProfile;
  }

  get userImage(): string | SafeResourceUrl {
    return (
      (this._stateService.userProfile.images && this._stateService.userProfile.images[0].url) || this.fallbackUserImage
    );
  }
}
