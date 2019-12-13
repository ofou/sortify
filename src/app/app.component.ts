import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthConfig, AuthService, ScopesBuilder, TokenService } from './spotify-auth';
import { StateService } from './state/state.service';
@Component({
  selector: 'sort-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'sortify';

  constructor(
    private authService: AuthService,
    private router: Router,
    private tokenSvc: TokenService,
    public _stateService: StateService,
  ) {}

  ngOnInit(): void {
    // this._stateService.setLoading(true);
    this.authService.authorizedStream.pipe(filter((x: boolean) => x)).subscribe(() => {
      this.router.navigate(['home']);
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
}
