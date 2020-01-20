import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SpotifyWebApiService } from '../services/spotify-web-api.service';
import { getAlbumCover } from '../shared';
import { StateService } from '../services/state.service';

@Component({
  selector: 'sort-playlist-list',
  templateUrl: './playlist-list.component.html',
  styleUrls: ['./playlist-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistListComponent implements OnInit {
  constructor(
    private spotifyWebApiService: SpotifyWebApiService,
    private _stateService: StateService,
    private cdr: ChangeDetectorRef,
  ) {}

  playlists: SpotifyApi.PlaylistObjectSimplified[] = [];
  playlistFilter = '';

  async ngOnInit(): Promise<void> {
    this._stateService.setLoading(true);
    try {
      this.playlists = (await this.spotifyWebApiService.getPlaylists()).items;
    } catch (error) {
      this._stateService.setError('Unable to load playlists', error);
    }
    this.cdr.detectChanges();
    this._stateService.setLoading(false);
  }
  get filteredPlaylists(): SpotifyApi.PlaylistObjectSimplified[] {
    return this.playlists.filter((playlist) => {
      if (this.playlistFilter) {
        return playlist.name.toLowerCase().indexOf(this.playlistFilter.toLowerCase()) > -1;
      }
      return true;
    });
  }

  getAlbumCover(playlist: SpotifyApi.PlaylistObjectSimplified): string {
    return getAlbumCover(playlist, false);
  }
}
