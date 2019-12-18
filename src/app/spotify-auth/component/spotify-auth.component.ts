import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { StateService } from '../../state/state.service';

@Component({
  selector: 'spotify-auth',
  templateUrl: './spotify-auth.component.html',
  styleUrls: ['./spotify-auth.component.scss'],
})
export class AuthorizedComponent implements OnInit {
  public constructor(
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private _stateService: StateService,
  ) {}

  public ngOnInit(): void {
    this._stateService.setLoading(true);
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
    this._stateService.setLoading(false);
  }
}
