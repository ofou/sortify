import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SpotifyWebApiService } from '../services/spotify-web-api.service';
import { StateService } from '../services/state.service';
import { getAlbumCover } from '../shared';

enum EOwner {
  'all' = 'all',
  'owner' = 'owner',
  'non_owner' = 'non_owner',
}
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
  private userProfile: SpotifyApi.CurrentUsersProfileResponse;

  playlists: SpotifyApi.PlaylistObjectSimplified[] = [];
  searchFilter = '';
  ownerFilter: EOwner = EOwner.all;
  EOwner: typeof EOwner = EOwner;
  get filteredPlaylists(): SpotifyApi.PlaylistObjectSimplified[] {
    return this.playlists.filter((playlist) => {
      let matchesSearchFilter = true;
      let matchesOwnerFilter = true;
      if (this.searchFilter) {
        matchesSearchFilter = playlist.name.toLowerCase().indexOf(this.searchFilter.toLowerCase()) > -1;
      }
      if (this.ownerFilter === EOwner.owner) {
        matchesOwnerFilter = playlist.owner.id === this.userProfile.id;
      }
      if (this.ownerFilter === EOwner.non_owner) {
        matchesOwnerFilter = playlist.owner.id !== this.userProfile.id;
      }
      return matchesSearchFilter && matchesOwnerFilter;
    });
  }
  async ngOnInit(): Promise<void> {
    this._stateService.userProfile$.subscribe((userProfile: SpotifyApi.CurrentUsersProfileResponse) => {
      this.userProfile = userProfile;
    });

    this._stateService.setLoading(true);
    try {
      this.playlists = (await this.spotifyWebApiService.getPlaylists()).items;
    } catch (error) {
      this._stateService.setError('Failed to load playlists', error);
    }
    this.cdr.detectChanges();
    this._stateService.setLoading(false);
  }

  getAlbumCover(playlist: SpotifyApi.PlaylistObjectSimplified): string {
    return getAlbumCover(playlist, false);
  }
}
