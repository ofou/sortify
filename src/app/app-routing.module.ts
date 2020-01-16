import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { PlaylistListComponent } from './playlist-list/playlist-list.component';
import { PlaylistComponent } from './playlist/playlist.component';
import { AuthGuard } from './spotify-auth';
import { AuthorizedComponent } from './authorized/authorized.component';

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
    path: 'authorized',
    canActivate: [AuthGuard],
    component: AuthorizedComponent,
  },
  {
    path: 'playlist/:playlistId',
    component: PlaylistComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'playlist',
    redirectTo: '/',
  },
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
