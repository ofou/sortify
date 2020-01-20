import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { StateService } from './services/state.service';
import { TokenService } from './spotify-auth';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  fallbackUserImage: SafeResourceUrl;
  constructor(
    private router: Router,
    private tokenSvc: TokenService,
    public _stateService: StateService,
    private _sanitizer: DomSanitizer,
  ) {
    this.fallbackUserImage = this._sanitizer.bypassSecurityTrustResourceUrl(
      `data:image/svg+xml,${encodeURIComponent(USER_SVG)}`,
    );
  }
  async logout(): Promise<void> {
    this._stateService.resetUserProfile();
    this.tokenSvc.clearToken();
    await this.router.navigate(['login']);
  }
}
