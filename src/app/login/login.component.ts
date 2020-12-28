import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { generateLoginUrl } from '../shared';
import { TokenService } from '../spotify-auth';

@Component({
  selector: 'sort-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  constructor(private tokenSvc: TokenService, private router: Router) {}
  githubUrl = 'https://github.com/christianmemije/sortify';
  get loginUrl(): string {
    return generateLoginUrl('');
  }

  async ngOnInit(): Promise<void> {
    // TODO: move this logic out of here
    if (!!this.tokenSvc.oAuthToken) {
      await this.router.navigate(['/']);
    }
  }
}
