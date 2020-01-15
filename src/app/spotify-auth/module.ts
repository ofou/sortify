import { ModuleWithProviders, NgModule } from '@angular/core';
import { Routes } from '@angular/router';

import { AuthorizedComponent } from './component/spotify-auth.component';
import { AuthGuard } from './service/auth.guard';
import { TokenService } from './service/token.service';

const routes: Routes = [
  {
    path: 'authorized',
    canActivate: [AuthGuard],
    component: AuthorizedComponent,
  },
];

@NgModule({
  declarations: [AuthorizedComponent],
  providers: [],
})
export class SpotifyAuthModule {
  public static authRoutes(): Routes {
    return routes;
  }

  public static forRoot(): ModuleWithProviders {
    return {
      ngModule: SpotifyAuthModule,
      providers: [TokenService, AuthGuard],
    };
  }
}
