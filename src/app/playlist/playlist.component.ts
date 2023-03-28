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
import { IInfoDialogData, InfoDialogComponent } from '../info-dialog/info-dialog.component';
import {
  ISavePlaylistDialogData,
  IUpdatedPlaylistDetails,
  SavePlaylistDialogComponent,
} from '../save-playlist-dialog/save-playlist-dialog.component';
import { ITrackWFeatures, SpotifyWebApiService } from '../services/spotify-web-api.service';
import { StateService } from '../services/state.service';
import { getAlbumCover } from '../shared';

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
    return (track as any)[sortHeaderId];
  }
}

function getReleaseDate(track: ITrackWFeatures): string {
  return new Date((<any>track.track.album).release_date).toISOString();
}

const sortableColumns: string[] = Object.keys(ESortableColumns);
const nonSortableColumns: string[] = Object.keys(ENonSortableColumns);

interface IPlaylistActionButton {
  action: () => any;
  description: string;
  icon: string;
  tooltip: () => string;
  disabled: () => boolean;
  link: string | undefined;
}

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

  private userProfile: SpotifyApi.CurrentUsersProfileResponse | undefined;

  private destroySubject: Subject<void> = new Subject();
  private audioSubject: Subject<void> = new Subject();

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

  @ViewChild(MatSort, { static: false }) matSort: MatSort | undefined;

  playlistId: string | undefined;
  playlist: SpotifyApi.SinglePlaylistResponse | undefined;
  tracks: ITrackWFeatures[] | undefined;
  initialTracks: ITrackWFeatures[] | undefined;

  dataSource: MatTableDataSource<ITrackWFeatures> = new MatTableDataSource();
  audio: HTMLAudioElement | undefined;

  ENonSortableColumns: typeof ENonSortableColumns = ENonSortableColumns;
  ESortableColumns: typeof ESortableColumns = ESortableColumns;
  displayedColumns: string[] = [...nonSortableColumns, ...sortableColumns];

  sortActive = '';
  sortDirection: MatSortDirectionType = EDirection.asc;

  get directionString(): string {
    switch (this.sortDirection) {
      case EDirection.asc:
        return '↑';
      case EDirection.desc:
        return '↓';
      default:
        return '';
    }
  }

  get sortedByString(): string {
    if (this.sortActive && this.sortDirection) {
      return `${this.directionString} ${this.sortActive}`;
    }
    return '';
  }

  get ownsPlaylist(): boolean {
    return (this.playlist && this.userProfile && this.playlist.owner.id === this.userProfile.id) || false;
  }

  get albumCover(): string {
    return getAlbumCover(this.playlist, false);
  }

  async ngOnInit() {
    this._stateService.setLoading(true);
    this.cdr.detectChanges();

    this._stateService.userProfile$
      .pipe(takeUntil(this.destroySubject))
      .subscribe((userProfile: SpotifyApi.CurrentUsersProfileResponse | undefined) => {
        this.userProfile = userProfile;
        this.cdr.detectChanges();
      });

    this.route.paramMap.subscribe(async (params: ParamMap) => {
      this.playlistId = params.get('playlistId') || undefined;
      try {
        this.playlist = await this.spotifyWebApiService.getPlaylist(this.playlistId || '');
        const tracks = await this.spotifyWebApiService.getPlaylistTracksWithFeatures(this.playlistId || '');
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
      const active: string | undefined = queryParams.get('active') || undefined;
      const direction: string | undefined = queryParams.get('direction') || undefined;
      if (
        active &&
        direction &&
        Object.keys(ESortableColumns).includes(active) &&
        Object.keys(EDirection).includes(direction)
      ) {
        this.sortActive = active;
        this.sortDirection = <MatSortDirectionType>direction;

        if (!(this.sortActive === this.matSort?.active && this.sortDirection === this.matSort.direction)) {
          this.matSort?.sort({
            id: this.sortActive,
            start: this.sortDirection,
            disableClear: false,
          });
          this.createDataSource();
        }
      } else {
        this.sortActive = '';
        this.sortDirection = EDirection.asc;
        // reset
        this.matSort?.sort({
          id: this.sortActive,
          start: undefined || 'asc',
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
    this.dataSource.sort = this.matSort || null;
    this.dataSource.sortingDataAccessor = sortingDataAccessor;
    this.dataSource.data = this.tracks || [];
    this.cdr.detectChanges();
  }

  async handleSortChange({ active, direction }: Sort): Promise<void> {
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: active && direction ? { active, direction } : undefined,
    });
  }

  async savePlaylist(): Promise<void> {
    if (this.dataSource.sort) {
      const updatedOrder: string[] = this.dataSource
        .sortData(this.dataSource.filteredData, this.dataSource.sort)
        .map((track: ITrackWFeatures) => track.uri)
        .filter((uri: string) => !!uri);

      if (this.playlist) {
        const data: ISavePlaylistDialogData = {
          ownsPlaylist: this.ownsPlaylist,
          playlistId: this.playlist?.id,
          tracks: updatedOrder,
          playlistName: this.playlist.name,
          playlistDescription: this.playlist.description,
        };
        const dialog: MatDialogRef<SavePlaylistDialogComponent> = this._matDialog.open(SavePlaylistDialogComponent, {
          data,
        });
        dialog.afterClosed().subscribe((updatedDetails: IUpdatedPlaylistDetails) => {
          if (updatedDetails && this.playlist) {
            this.playlist = { ...this.playlist, ...updatedDetails };
            this.cdr.detectChanges();
          }
        });
      }
    }
  }

  async delete(): Promise<void> {
    const data: IDeletePlaylistDialogData = {
      playlistId: this.playlist?.id || '',
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
    if (this.playlist) {
      const data: IInfoDialogData = {
        playlist: this.playlist,
        playlistLength: this.tracks?.length || 0,
      };
      this._matDialog.open(InfoDialogComponent, {
        data,
        maxWidth: '80vw',
        maxHeight: '80vh',
        disableClose: false,
      });
    }
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
      this.audio.volume = 0.5;
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
    }
  }
  isPlaying(track: ITrackWFeatures): boolean {
    return !!this.audio && this.audio.src === this.getPreviewUrl(track);
  }

  getPreviewUrl(track: ITrackWFeatures): string {
    return track.track.preview_url;
  }

  getAlbumImageUrl(track: ITrackWFeatures): string {
    return (
      (track.track.album.images.length > 0 && track.track.album.images[track.track.album.images.length - 1].url) || ''
    );
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

  async autoSort(): Promise<void> {
    // TODO: find optimal sort order
  }

  async sortByKey(tracks: ITrackWFeatures[]): Promise<void> {
    const circleOfFifths = {
      major: [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5], // starts on C major
      minor: [9, 4, 11, 6, 1, 8, 3, 10, 5, 0, 7, 2], // starts on A minor
    };

    tracks.sort((a, b) => {
      const aKeyIndex = circleOfFifths[a.mode ? 'major' : 'minor'].indexOf(a.key);
      const bKeyIndex = circleOfFifths[b.mode ? 'major' : 'minor'].indexOf(b.key);

      return aKeyIndex - bKeyIndex;
    });
  }

  applyFilters(): void {}
}
