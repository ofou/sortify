import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { PlaylistListComponent } from './playlist-list/playlist-list.component';
import { PlaylistComponent } from './playlist/playlist.component';
import { AuthGuard, SpotifyAuthModule } from './spotify-auth';

const routes: Routes = [
  {
    path: '',
    component: PlaylistListComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'home',
    component: PlaylistListComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'home/playlist',
    redirectTo: 'home',
  },
  {
    path: 'home/playlist/:playlistId',
    component: PlaylistComponent,
    canActivate: [AuthGuard],
  },
  SpotifyAuthModule.authRoutes()[0],
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
