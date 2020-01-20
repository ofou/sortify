import { Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { shuffle, takeWhile } from 'lodash-es';
import { fromEvent, Subject } from 'rxjs';
import {
  DeletePlaylistDialogComponent,
  IDeletePlaylistDialogData,
} from '../delete-playlist-dialog/delete-playlist-dialog.component';
import {
  ISavePlaylistDialogData,
  SavePlaylistDialogComponent,
} from '../save-playlist-dialog/save-playlist-dialog.component';
import { ITrackWFeatures, SpotifyWebApiService } from '../services/spotify-web-api.service';
import { getAlbumCover } from '../shared';
import { StateService } from '../services/state.service';
import { takeUntil } from 'rxjs/operators';

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
const TITLE_REGEX: RegExp = new RegExp(TITLE_PREFIX + ' [↑↓] \\S+\\b');

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
      return `Sorted by ${this.sortActive} in ${this.directionString} order`;
    }
    return 'no sorting';
  }

  get ownsPlaylist(): boolean {
    return this.playlist && this.playlist.owner.id === this._stateService.userProfile.id;
  }

  async ngOnInit() {
    this._stateService.setLoading(true);
    this.cdr.detectChanges();

    this.route.paramMap.subscribe(async (params: ParamMap) => {
      this.playlistId = params.get('playlistId');

      try {
        this.playlist = await this.spotifyWebApiService.getPlaylist(this.playlistId);
      } catch {
        await this.router.navigate(['/']);
        return;
      }
      const tracks = await this.spotifyWebApiService.getPlaylistTracksWithFeatures(this.playlistId);
      this.tracks = tracks;
      this.initialTracks = this.tracks;
      this.createDataSource();
      this._stateService.setLoading(false);
      this.cdr.detectChanges();

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
    });
  }

  async resetQueryParams(): Promise<void> {
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: undefined,
    });
  }

  ngOnDestroy() {
    if (this.audio) {
      this.audio.pause();
      this.audio = undefined;
    }
  }

  createDataSource(): void {
    this.dataSource.data = this.tracks;
    this.dataSource.sort = this.matSort;
    this.dataSource.sortingDataAccessor = sortingDataAccessor;
    this.cdr.detectChanges();
  }

  async handleSortChange({ active, direction }: Sort): Promise<void> {
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: active && direction ? { active, direction } : undefined,
    });
  }

  async update(): Promise<void> {
    const test: RegExpExecArray = DESCRIPTION_REGEX.exec(this.playlist.description);
    if (test && test[1]) {
      const [active, direction, originalPlaylistId]: string[] = test[1].split(SEPARATOR);
      const tracks = await this.spotifyWebApiService.getPlaylistTracksWithFeatures(originalPlaylistId);
      this.tracks = tracks;

      this.sortActive = active;
      this.sortDirection = <MatSortDirectionType>direction;
      this.createDataSource();
    }
  }
  async extractSortingData(): Promise<void> {
    const test: RegExpExecArray = DESCRIPTION_REGEX.exec(this.playlist.description);
    if (test && test[1]) {
      const [active, direction]: string[] = test[1].split(SEPARATOR);
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams: active && direction ? { active, direction } : undefined,
      });
    }
  }

  async savePlaylist(): Promise<void> {
    const updatedOrder: string[] = this.dataSource
      .sortData(this.dataSource.filteredData, this.dataSource.sort)
      .map((track: ITrackWFeatures) => track.uri)
      .filter((uri: string) => !!uri);
    let playlistName: string = this.playlist.name;
    let playlistDescription: string = this.playlist.description;
    if (this.directionString && this.sortActive) {
      playlistName = `${playlistName.replace(TITLE_REGEX, '').trim()} ${TITLE_PREFIX} ${this.directionString} ${
        this.sortActive
      }`;
      playlistDescription = `${playlistDescription.replace(DESCRIPTION_REGEX, '').trim()} ${DESCRIPTION_PREFIX}${
        this.sortActive
      }${SEPARATOR}${this.sortDirection}${SEPARATOR}${this.playlistId}${DESCRIPTION_SUFFIX}`;
    }

    const data: ISavePlaylistDialogData = {
      ownsPlaylist: this.ownsPlaylist,
      playlistId: this.playlist.id,
      tracks: updatedOrder,
      playlistName,
      playlistDescription,
    };
    this._matDialog.open(SavePlaylistDialogComponent, {
      data,
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

  async shuffle(): Promise<void> {
    this.tracks = shuffle(this.initialTracks);
    await this.resetQueryParams();
    this.createDataSource();
  }

  async play(track: ITrackWFeatures): Promise<void> {
    // something is playing
    if (this.audio) {
      if (this.isPlaying(track)) {
        this.audio.pause();
        this.audio = undefined;
        return;
      } else {
        this.audio.pause();
        this.audio = undefined;
      }
    }
    if (track) {
      this.audio = new Audio(this.getPreviewUrl(track));
      // TODO: unsubscribe from this properly
      fromEvent(this.audio, 'ended').subscribe(() => {
        this.audio = undefined;
      });
      await this.audio.play();
    }
  }
  isPlaying(track: ITrackWFeatures): boolean {
    return !!this.audio && this.audio.src === this.getPreviewUrl(track);
  }

  getPreviewUrl(track: ITrackWFeatures): string {
    return track.track.preview_url;
  }

  getAlbumImageUrl(track: ITrackWFeatures): string {
    return track.track.album.images[track.track.album.images.length - 1].url;
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
    return getAlbumCover(this.playlist, true);
  }

  async sortSmartly(): Promise<void> {}

  applyFilters(): void {}
}
