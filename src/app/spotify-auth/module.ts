import { ModuleWithProviders, NgModule } from '@angular/core';

import { AuthGuard } from './auth.guard';
import { TokenService } from './token.service';

@NgModule({
  declarations: [],
  providers: [],
})
export class SpotifyAuthModule {
  public static forRoot(): ModuleWithProviders<SpotifyAuthModule> {
    return {
      ngModule: SpotifyAuthModule,
      providers: [TokenService, AuthGuard],
    };
  }
}
