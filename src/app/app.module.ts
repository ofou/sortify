import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthorizedComponent } from './authorized/authorized.component';
import { DeletePlaylistDialogComponent } from './delete-playlist-dialog/delete-playlist-dialog.component';
import { FooterComponent } from './footer/footer.component';
import { InfoDialogComponent } from './info-dialog/info-dialog.component';
import { LoginComponent } from './login/login.component';
import { MaterialModule } from './material.module';
import { PlaylistListComponent } from './playlist-list/playlist-list.component';
import { PlaylistComponent } from './playlist/playlist.component';
import { ReorderingAnimationComponent } from './reordering-animation/reordering-animation.component';
import { SavePlaylistDialogComponent } from './save-playlist-dialog/save-playlist-dialog.component';
import { StateService } from './services/state.service';
import { SpotifyAuthModule } from './spotify-auth';
import { SpotifyAuthInterceptor2 } from './spotify-auth.interceptor';
import { TinyMusicPlayerModule } from './tiny-music-player/tiny-music-player.module';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    PlaylistListComponent,
    PlaylistComponent,
    FooterComponent,
    SavePlaylistDialogComponent,
    DeletePlaylistDialogComponent,
    InfoDialogComponent,
    ReorderingAnimationComponent,
    AuthorizedComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SpotifyAuthModule.forRoot(),
    HttpClientModule,
    BrowserAnimationsModule,
    MaterialModule,

    TinyMusicPlayerModule,
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
  entryComponents: [SavePlaylistDialogComponent, DeletePlaylistDialogComponent, InfoDialogComponent],
})
export class AppModule {}
