import { Component, OnInit } from '@angular/core';
import { TokenService } from '../spotify-auth/service';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { Subscription, BehaviorSubject, Observable, of } from 'rxjs';
// const Spotify = require('spotify-web-api-js');
import { HttpClient } from '@angular/common/http';
import { SpotifyWebApiService } from '../spotify-web-api.service';


@Component({
  selector: 'sort-playlist-list',
  templateUrl: './playlist-list.component.html',
  styleUrls: ['./playlist-list.component.scss'],
})
export class PlaylistListComponent implements OnInit {
  private apiUserUrl = 'https://api.spotify.com/v1/me';
  private stream: Subscription | null = null;
  private user: {} = {};
  private user$: BehaviorSubject<{}>;

  constructor(private tokenSvc: TokenService, private http: HttpClient, private spotifyWebApiService: SpotifyWebApiService) {}

  loading = true;
  playlists: any[] = [];
  fallbackImage = 'https://developer.spotify.com/assets/branding-guidelines/icon3@2x.png';

  async ngOnInit(): Promise<void> {
    this.playlists = (await this.spotifyWebApiService.getPlaylists()).items;
    this.loading = false;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      (result as any) = error;
      return of(result as T);
    };
  }

}
