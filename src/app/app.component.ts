import { Component } from '@angular/core';
import { AuthService, ScopesBuilder, AuthConfig, TokenService } from './spotify-auth';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
@Component({
  selector: 'sort-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'smart-playlists';

  constructor(private authService: AuthService, private router: Router, private tokenSvc: TokenService) {}

  ngOnInit(): void {
    this.authService.authorizedStream.pipe(filter((x: boolean) => x)).subscribe(() => {
      this.router.navigate(['home']);
    });
  }
  logout(): void {
    this.tokenSvc.clearToken();
    this.router.navigate(['login']);
  }
}
