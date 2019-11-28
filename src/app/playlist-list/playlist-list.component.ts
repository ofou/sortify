// const Spotify = require('spotify-web-api-js');
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { TokenService } from '../spotify-auth/service';
import { SpotifyWebApiService } from '../spotify-web-api.service';
import { StateService } from '../state/state.service';

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

  constructor(
    private tokenSvc: TokenService,
    private http: HttpClient,
    private spotifyWebApiService: SpotifyWebApiService,
    private _stateService: StateService,
  ) {}

  playlists: any[] = [];
  fallbackImage = 'https://developer.spotify.com/assets/branding-guidelines/icon3@2x.png';

  async ngOnInit(): Promise<void> {
    this._stateService.setLoading(true);
    try {
      this.playlists = (await this.spotifyWebApiService.getPlaylists()).items;
    } catch (error) {
      this._stateService.setError('Unable to load playlists', error);
    }
    this._stateService.setLoading(false);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      (result as any) = error;
      return of(result as T);
    };
  }
}
