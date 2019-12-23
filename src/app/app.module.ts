import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CovalentBaseEchartsModule } from '@covalent/echarts/base';
import { CovalentGraphEchartsModule } from '@covalent/echarts/graph';
import { LoginComponent } from './login/login.component';
import { MaterialModule } from './material.module';
import { PlaylistListComponent } from './playlist-list/playlist-list.component';
import { PlaylistComponent } from './playlist/playlist.component';
import { SpotifyAuthModule } from './spotify-auth';
import { SpotifyAuthInterceptor2 } from './spotify-auth.interceptor';
import { StateService } from './state/state.service';
import { FooterComponent } from './footer/footer.component';
import { SavePlaylistAsDialogComponent } from './save-playlist-as-dialog/save-playlist-as-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    PlaylistListComponent,
    PlaylistComponent,
    FooterComponent,
    SavePlaylistAsDialogComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SpotifyAuthModule.forRoot(),
    HttpClientModule,
    BrowserAnimationsModule,
    MaterialModule,
    CovalentBaseEchartsModule,
    CovalentGraphEchartsModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SpotifyAuthInterceptor2,
      multi: true,
    },
    StateService,
  ],
  bootstrap: [AppComponent],
  entryComponents: [SavePlaylistAsDialogComponent],
})
export class AppModule {}
