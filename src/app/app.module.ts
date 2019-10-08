import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { SpotifyAuthModule } from './spotify-auth';
import { SpotifyAuthInterceptor2 } from './spotify-auth.interceptor';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoginComponent } from './login/login.component';
import { PlaylistListComponent } from './playlist-list/playlist-list.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { PlaylistComponent } from './playlist/playlist.component';
import { CovalentBaseEchartsModule } from '@covalent/echarts/base';
import { CovalentGraphEchartsModule } from '@covalent/echarts/graph';
@NgModule({
  declarations: [AppComponent, LoginComponent, PlaylistListComponent, PlaylistComponent],
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
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
