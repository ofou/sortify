import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'spotify-auth',
  template: `
    <h3>Authorizing&hellip;</h3>
  `,
  styles: [``],
})
export class SpotifyAuthComponent implements OnInit {
  public constructor(
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {}

  public ngOnInit(): void {
    const params: URLSearchParams = new URLSearchParams(this.activatedRoute.snapshot.fragment);
    let redirectToUrl: string;
    for (const param of params) {
      if (param[0] === 'state') {
        redirectToUrl = decodeURIComponent(param[1]);
      }
    }

    this.authService.authorized();
    if (redirectToUrl && redirectToUrl !== '/') {
      setTimeout(() => {
        const split: string[] = redirectToUrl.split('?filters=');
        const path: string = split[0];
        const queryParams: Params = split[1] ? { filters: split[1] } : {};
        // TODO: wait properly
        this.router.navigate([path], { queryParams });
      });
    }
  }
}
