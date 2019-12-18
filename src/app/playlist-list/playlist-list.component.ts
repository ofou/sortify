import { Component, OnInit } from '@angular/core';
import { SpotifyWebApiService } from '../services/spotify-web-api.service';
import { StateService } from '../state/state.service';

const FALLBACK_IMG = 'https://developer.spotify.com/assets/branding-guidelines/icon3@2x.png';

@Component({
  selector: 'sort-playlist-list',
  templateUrl: './playlist-list.component.html',
  styleUrls: ['./playlist-list.component.scss'],
})
export class PlaylistListComponent implements OnInit {
  constructor(private spotifyWebApiService: SpotifyWebApiService, private _stateService: StateService) {}

  playlists: SpotifyApi.PlaylistObjectSimplified[] = [];
  playlistFilter = '';

  async ngOnInit(): Promise<void> {
    this._stateService.setLoading(true);
    try {
      this.playlists = (await this.spotifyWebApiService.getPlaylists()).items;
    } catch (error) {
      this._stateService.setError('Unable to load playlists', error);
    }
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

  getImage(playlist: SpotifyApi.PlaylistObjectSimplified): string {
    return (playlist.images[0] && playlist.images[0].url) || FALLBACK_IMG;
  }
}
