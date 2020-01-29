import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { shuffle } from 'lodash-es';
import { fromEvent, interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  DeletePlaylistDialogComponent,
  IDeletePlaylistDialogData,
} from '../delete-playlist-dialog/delete-playlist-dialog.component';
import {
  ISavePlaylistDialogData,
  SavePlaylistDialogComponent,
  IUpdatedPlaylistDetails,
} from '../save-playlist-dialog/save-playlist-dialog.component';
import { ITrackWFeatures, SpotifyWebApiService } from '../services/spotify-web-api.service';
import { StateService } from '../services/state.service';
import { getAlbumCover } from '../shared';
import { IInfoDialogData, InfoDialogComponent } from '../info-dialog/info-dialog.component';

enum ENonSortableColumns {
  'index' = 'index',
  'image_url' = 'image_url',
  'preview_url' = 'preview_url',
  'web_url' = 'web_url',
}

enum ESortableColumns {
  'name' = 'name',
  'artist' = 'artist',
  'album_name' = 'album_name',
  'release_date' = 'release_date',
  'duration_ms' = 'duration_ms',
  'added_at' = 'added_at',
  'popularity' = 'popularity',
  'acousticness' = 'acousticness',
  'danceability' = 'danceability',
  'energy' = 'energy',
  'instrumentalness' = 'instrumentalness',
  'key' = 'key',
  'liveness' = 'liveness',
  'loudness' = 'loudness',
  'mode' = 'mode',
  'speechiness' = 'speechiness',
  'tempo' = 'tempo',
  'time_signature' = 'time_signature',
  'valence' = 'valence',
}

enum EDirection {
  'asc' = 'asc',
  'desc' = 'desc',
}
type MatSortDirectionType = 'asc' | 'desc';

function sortingDataAccessor(track: ITrackWFeatures, sortHeaderId: string): string | number {
  if (sortHeaderId === ESortableColumns.name) {
    return track.track.name;
  } else if (sortHeaderId === ESortableColumns.artist) {
    return track.track.artists[0].name;
  } else if (sortHeaderId === ESortableColumns.album_name) {
    return track.track.album.name;
  } else if (sortHeaderId === ESortableColumns.release_date) {
    return getReleaseDate(track);
  } else if (sortHeaderId === ESortableColumns.duration_ms) {
    return track.track.duration_ms;
  } else if (sortHeaderId === ESortableColumns.popularity) {
    return track.track.popularity;
  } else {
    return track[sortHeaderId];
  }
}

function getReleaseDate(track: ITrackWFeatures): string {
  return new Date((<any>track.track.album).release_date).toISOString();
}

const sortableColumns: string[] = Object.keys(ESortableColumns);
const nonSortableColumns: string[] = Object.keys(ENonSortableColumns);

const PRE_AND_SU_FIX = 'stf';
const SEPARATOR = '-';
const DESCRIPTION_PREFIX = PRE_AND_SU_FIX + SEPARATOR;
const DESCRIPTION_SUFFIX = SEPARATOR + PRE_AND_SU_FIX;
const DESCRIPTION_REGEX: RegExp = new RegExp(DESCRIPTION_PREFIX + '(.*)' + DESCRIPTION_SUFFIX);

const TITLE_PREFIX = 'sorted by';
const TITLE_REGEX: RegExp = /(sorted by [↑↓] \w+\b)/g;

interface IPlaylistActionButton {
  action: () => any;
  description: string;
  icon: string;
  tooltip: () => string;
  disabled: () => boolean;
  link: string;
}

const PLAYLIST_ID_POSITION = 0;
const ACTIVE_POSITION = 1;
const DIRECTION_POSITION = 2;

// open in app link
// https://open.spotify.com/go?uri=' + playlist.owner.uri+ '&rtd=1'

@Component({
  selector: 'sort-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistComponent implements OnInit, OnDestroy {
  constructor(
    private spotifyWebApiService: SpotifyWebApiService,
    private route: ActivatedRoute,
    private router: Router,
    private _stateService: StateService,
    private _matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  buttons: IPlaylistActionButton[] = [
    // {
    //   action: this.autoSort.bind(this),
    //   description: 'Auto sort',
    //   tooltip: () => 'Auto sort',
    //   icon: 'flash_auto',
    //   disabled: () => false,
    //   link: undefined
    // },
    {
      action: this.savePlaylist.bind(this),
      description: 'Save',
      tooltip: () => 'Save',
      icon: 'save',
      disabled: () => false,
      link: undefined,
    },
    {
      action: this.reset.bind(this),
      description: 'Reset to initial order',
      tooltip: () => 'Reset to initial order',
      icon: 'undo',
      disabled: () => false,
      link: undefined,
    },
    {
      action: this.shuffle.bind(this),
      description: 'Shuffle',
      tooltip: () => 'Shuffle',
      icon: 'shuffle',
      disabled: () => false,
      link: undefined,
    },
    {
      action: this.refresh.bind(this),
      description: 'Refresh',
      tooltip: () =>
        this.canRefreshPlaylist ? 'Refresh' : 'Description does not have encoded data to make this possible',
      icon: 'refresh',
      disabled: () => !this.canRefreshPlaylist,
      link: undefined,
    },
    {
      action: this.delete.bind(this),
      description: 'Delete',
      tooltip: () => (this.ownsPlaylist ? 'Delete' : 'You need to own the playlist to delete it'),
      icon: 'delete_outline',
      disabled: () => !this.ownsPlaylist,
      link: undefined,
    },
    {
      action: this.viewDetails.bind(this),
      description: 'View details',
      tooltip: () => 'View details',
      icon: 'info',
      disabled: () => false,
      link: undefined,
    },
    {
      action: () => {},
      description: 'View docs',
      tooltip: () => 'Docs',
      icon: 'help_outline',
      disabled: () => false,
      link: 'https://github.com/christianmemije/sortify/blob/master/README.md/#usage',
    },
  ];

  @ViewChild(MatSort, { static: false }) matSort: MatSort;

  playlistId: string;
  playlist: SpotifyApi.SinglePlaylistResponse;
  tracks: ITrackWFeatures[];
  initialTracks: ITrackWFeatures[];

  dataSource: MatTableDataSource<ITrackWFeatures> = new MatTableDataSource();
  audio: HTMLAudioElement;

  ENonSortableColumns: typeof ENonSortableColumns = ENonSortableColumns;
  ESortableColumns: typeof ESortableColumns = ESortableColumns;
  displayedColumns: string[] = [...nonSortableColumns, ...sortableColumns];

  sortActive = '';
  sortDirection: MatSortDirectionType = EDirection.asc;

  private userProfile: SpotifyApi.CurrentUsersProfileResponse;

  private destroySubject: Subject<void> = new Subject();
  private audioSubject: Subject<void> = new Subject();

  get descriptionEncodedData(): string {
    const matches: RegExpExecArray = DESCRIPTION_REGEX.exec(this.playlist.description);
    if (matches) {
      return matches[1];
    }
    return undefined;
  }

  get encodedPlaylistId(): string {
    if (this.descriptionEncodedData) {
      return this.descriptionEncodedData.split(SEPARATOR)[PLAYLIST_ID_POSITION];
    }
    return undefined;
  }

  get encodedActive(): string {
    if (this.descriptionEncodedData) {
      return this.descriptionEncodedData.split(SEPARATOR)[ACTIVE_POSITION];
    }
    return undefined;
  }

  get encodedDirection(): string {
    if (this.descriptionEncodedData) {
      return this.descriptionEncodedData.split(SEPARATOR)[DIRECTION_POSITION];
    }
    return undefined;
  }

  get canRefreshPlaylist(): boolean {
    return !!this.descriptionEncodedData;
  }
  get playTime(): number {
    if (this.audio && this.audio.currentTime && this.audio.duration) {
      return (this.audio.currentTime / this.audio.duration) * 100;
    }
    return 0;
  }

  get currentlyPlayingTrack(): string {
    return this.audio && this.audio.src;
  }

  get directionString(): string {
    switch (this.sortDirection) {
      case EDirection.asc:
        return '↑';
      case EDirection.desc:
        return '↓';
      default:
        return undefined;
    }
  }

  get sortedByString(): string {
    if (this.sortActive && this.sortDirection) {
      return `${this.directionString} ${this.sortActive}`;
    }
    return undefined;
  }

  get ownsPlaylist(): boolean {
    return this.playlist && this.userProfile && this.playlist.owner.id === this.userProfile.id;
  }

  async ngOnInit() {
    this._stateService.setLoading(true);
    this.cdr.detectChanges();

    this._stateService.userProfile$
      .pipe(takeUntil(this.destroySubject))
      .subscribe((userProfile: SpotifyApi.CurrentUsersProfileResponse) => {
        this.userProfile = userProfile;
        this.cdr.detectChanges();
      });

    this.route.paramMap.subscribe(async (params: ParamMap) => {
      this.playlistId = params.get('playlistId');
      try {
        this.playlist = await this.spotifyWebApiService.getPlaylist(this.playlistId);
        const tracks = await this.spotifyWebApiService.getPlaylistTracksWithFeatures(this.playlistId);
        this.tracks = tracks;
        this.initialTracks = this.tracks;
        this.createDataSource();

        this._stateService.setLoading(false);
        this.cdr.detectChanges();

        this.handleQueryParams();
      } catch (error) {
        await this.router.navigate(['/']);
        this._stateService.setError('Failed to load playlist', error);
      }
    });
  }

  handleQueryParams(): void {
    this.route.queryParamMap.subscribe(async (queryParams: ParamMap) => {
      const active: string = queryParams.get('active');
      const direction: string = queryParams.get('direction');
      if (
        active &&
        direction &&
        Object.keys(ESortableColumns).includes(active) &&
        Object.keys(EDirection).includes(direction)
      ) {
        this.sortActive = active;
        this.sortDirection = <MatSortDirectionType>direction;

        if (!(this.sortActive === this.matSort.active && this.sortDirection === this.matSort.direction)) {
          this.matSort.sort({
            id: this.sortActive,
            start: undefined,
            disableClear: false,
          });
          this.createDataSource();
        }
      } else {
        this.sortActive = '';
        this.sortDirection = EDirection.asc;
        // reset
        this.matSort.sort({
          id: this.sortActive,
          start: undefined,
          disableClear: false,
        });
        this.createDataSource();
        await this.resetQueryParams();
      }
    });
  }

  async resetQueryParams(): Promise<void> {
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: undefined,
    });
  }

  ngOnDestroy() {
    this.stopTrack();
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  createDataSource(): void {
    this.dataSource.sort = this.matSort;
    this.dataSource.sortingDataAccessor = sortingDataAccessor;
    this.dataSource.data = this.tracks;
    this.cdr.detectChanges();
  }

  async handleSortChange({ active, direction }: Sort): Promise<void> {
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: active && direction ? { active, direction } : undefined,
    });
  }

  async refresh(): Promise<void> {
    if (this.canRefreshPlaylist) {
      try {
        this.tracks = await this.spotifyWebApiService.getPlaylistTracksWithFeatures(this.encodedPlaylistId);
        this._stateService.setSuccess('Playlist refreshed!');
        await this.router.navigate([], {
          relativeTo: this.route,
          queryParams:
            this.encodedActive && this.encodedDirection
              ? { active: this.encodedActive, direction: this.encodedDirection }
              : undefined,
        });
      } catch (error) {
        this._stateService.setError('Failed to refresh. Try again.', error);
      }
    }
  }

  async savePlaylist(): Promise<void> {
    const updatedOrder: string[] = this.dataSource
      .sortData(this.dataSource.filteredData, this.dataSource.sort)
      .map((track: ITrackWFeatures) => track.uri)
      .filter((uri: string) => !!uri);
    const playlistName =
      this.directionString && this.sortActive
        ? `${this.playlist.name.replace(TITLE_REGEX, '').trim()} ${TITLE_PREFIX} ${this.directionString} ${
            this.sortActive
          }`
        : this.playlist.name;
    const playlistIdToEncode: string = this.encodedPlaylistId || this.playlistId;
    const activeToEncode: string = this.encodedActive || this.sortActive;
    const directionToEncode: string = this.encodedDirection || this.sortDirection;
    const playlistDescription: string =
      this.playlist.description.replace(DESCRIPTION_REGEX, '').trim() +
      ' ' +
      DESCRIPTION_PREFIX +
      playlistIdToEncode +
      (activeToEncode && directionToEncode ? SEPARATOR + activeToEncode + SEPARATOR + directionToEncode : '') +
      DESCRIPTION_SUFFIX;

    const data: ISavePlaylistDialogData = {
      ownsPlaylist: this.ownsPlaylist,
      playlistId: this.playlist.id,
      tracks: updatedOrder,
      playlistName,
      playlistDescription,
    };
    const dialog: MatDialogRef<SavePlaylistDialogComponent> = this._matDialog.open(SavePlaylistDialogComponent, {
      data,
    });
    dialog.afterClosed().subscribe((updatedDetails: IUpdatedPlaylistDetails) => {
      if (updatedDetails) {
        this.playlist = { ...this.playlist, ...updatedDetails };
        this.cdr.detectChanges();
      }
    });
  }

  async delete(): Promise<void> {
    const data: IDeletePlaylistDialogData = {
      playlistId: this.playlist.id,
    };
    this._matDialog.open(DeletePlaylistDialogComponent, {
      data,
    });
  }

  async reset(): Promise<void> {
    this.tracks = this.initialTracks;
    await this.resetQueryParams();
    this.createDataSource();
  }

  viewDetails(): void {
    const data: IInfoDialogData = {
      playlist: this.playlist,
      playlistLength: this.tracks.length,
    };
    this._matDialog.open(InfoDialogComponent, {
      data,
      maxWidth: '80vw',
      maxHeight: '80vh',
      disableClose: false,
    });
  }

  async shuffle(): Promise<void> {
    this.tracks = shuffle(this.initialTracks);
    await this.resetQueryParams();
    this.createDataSource();
  }

  async play(track: ITrackWFeatures): Promise<void> {
    // something is playing
    if (this.audio) {
      if (this.isPlaying(track)) {
        // stop track
        this.stopTrack();
        return;
      } else {
        // stop track and play new track
        this.stopTrack();
      }
    }
    if (track) {
      this.audio = new Audio(this.getPreviewUrl(track));
      this.audioSubject = new Subject();
      interval(500)
        .pipe(takeUntil(this.audioSubject))
        .subscribe(() => this.cdr.detectChanges());
      fromEvent(this.audio, 'ended')
        .pipe(takeUntil(this.audioSubject))
        .subscribe(() => {
          this.stopTrack();
          this.cdr.detectChanges();
        });
      await this.audio.play();
    }
    this.cdr.detectChanges();
  }

  stopTrack(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio = undefined;
      this.audioSubject.next();
      this.audioSubject.complete();
      this.audioSubject = undefined;
    }
  }
  isPlaying(track: ITrackWFeatures): boolean {
    return !!this.audio && this.audio.src === this.getPreviewUrl(track);
  }

  getPreviewUrl(track: ITrackWFeatures): string {
    return track.track.preview_url;
  }

  getAlbumImageUrl(track: ITrackWFeatures): string {
    return track.track.album.images.length > 0 && track.track.album.images[track.track.album.images.length - 1].url;
  }

  getSpotifyUrl(track: ITrackWFeatures): string {
    return track.track.external_urls.spotify;
  }

  getName(track: ITrackWFeatures): string {
    return track.track.name;
  }

  getFirstArtist(track: ITrackWFeatures): string {
    return track.track.artists[0].name;
  }

  getAddedAt(track: ITrackWFeatures): string {
    return track.added_at;
  }

  getPopularity(track: ITrackWFeatures): number {
    return track.track.popularity;
  }

  getDuration(track: ITrackWFeatures): Date {
    return new Date(track.track.duration_ms);
  }

  getAllArtists(track: ITrackWFeatures): string {
    return track.track.artists.map((artist) => artist.name).join(', ');
  }

  getAlbumName(track: ITrackWFeatures): string {
    return track.track.album.name;
  }

  getReleaseDate(track: ITrackWFeatures): string {
    return getReleaseDate(track);
  }

  get albumCover(): string {
    return getAlbumCover(this.playlist, false);
  }

  async autoSort(): Promise<void> {
    // TODO: find optimal sort order
  }

  applyFilters(): void {}
}
