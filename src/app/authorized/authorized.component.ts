import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { StateService } from '../services/state.service';

@Component({
  selector: 'spotify-auth',
  templateUrl: './authorized.component.html',
  styleUrls: ['./authorized.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizedComponent implements OnInit {
  public constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private _stateService: StateService,
  ) {}

  public async ngOnInit(): Promise<void> {
    this._stateService.setLoading(true);
    const params: URLSearchParams = new URLSearchParams(this.activatedRoute.snapshot.fragment);
    let redirectToUrl: string;
    for (const param of params) {
      if (param[0] === 'state') {
        redirectToUrl = decodeURIComponent(atob(param[1]));
      }
    }

    if (redirectToUrl && redirectToUrl !== '/') {
      setTimeout(async () => {
        const url: URL = new URL(window.location.origin + redirectToUrl);
        const queryParams: Params = {};
        url.searchParams.forEach((value: string, key: string) => {
          queryParams[key] = value;
        });

        await this.router.navigate([url.pathname], { queryParams });
      });
    } else {
      await this.router.navigate(['/']);
    }
    this._stateService.setLoading(false);
  }
}
