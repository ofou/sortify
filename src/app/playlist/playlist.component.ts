import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatSort, Sort, SortDirection } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { fromEvent } from 'rxjs';
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
import { StateService } from '../state/state.service';
import { shuffle } from 'lodash-es';

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
  return new Date((track.track.album as any).release_date).toISOString();
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

@Component({
  selector: 'sort-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss'],
})
export class PlaylistComponent implements OnInit, OnDestroy {
  constructor(
    private spotifyWebApiService: SpotifyWebApiService,
    private route: ActivatedRoute,
    private router: Router,
    private _stateService: StateService,
    private _matDialog: MatDialog,
  ) {}

  @ViewChild(MatSort, { static: false }) matSort: MatSort;

  playlistId: string;
  playlist: SpotifyApi.SinglePlaylistResponse;
  tracks: ITrackWFeatures[];
  initialTracks: ITrackWFeatures[];

  dataSource: MatTableDataSource<ITrackWFeatures>;
  audio: HTMLAudioElement;

  ENonSortableColumns: typeof ENonSortableColumns = ENonSortableColumns;
  ESortableColumns: typeof ESortableColumns = ESortableColumns;
  sortableColumns: string[] = sortableColumns;
  sortOptions: string[] = sortableColumns.reduce((acc: string[], col: string) => {
    return [...acc, `${col}-${EDirection.asc}`, `${col}-${EDirection.desc}`];
  }, []);
  displayedColumns: string[] = [...nonSortableColumns, ...sortableColumns];

  matSortActive: string;
  matSortDirection: SortDirection;

  get loading(): boolean {
    return this._stateService.loading;
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
    switch (this.matSortDirection) {
      case EDirection.asc:
        return '↑';
      case EDirection.desc:
        return '↓';
      default:
        return undefined;
    }
  }

  get sortedByString(): string {
    if (this.matSortActive && this.matSortDirection) {
      return `Sorted by ${this.matSortActive} in ${this.directionString} order`;
    }
    return undefined;
  }

  get ownsPlaylist(): boolean {
    return this.playlist && this.playlist.owner.id === this._stateService.userProfile.id;
  }

  async ngOnInit() {
    this.route.paramMap.subscribe(async (params: ParamMap) => {
      this._stateService.setLoading(true);

      this.playlistId = params.get('playlistId');
      try {
        this.playlist = await this.spotifyWebApiService.getPlaylist(this.playlistId);
      } catch {
        await this.router.navigate(['/']);
        return;
      }

      const [playlist, tracks] = await Promise.all([
        this.spotifyWebApiService.getPlaylist(this.playlistId),
        this.spotifyWebApiService.getPlaylistTracksWithFeatures(this.playlistId),
      ]);
      this.playlist = playlist;
      this.tracks = tracks;
      this.initialTracks = this.tracks;
      this.createDataSource();
      // await this.extractSortingData();
      this._stateService.setLoading(false);

      this.route.queryParamMap.subscribe(async (queryParams: ParamMap) => {
        if (queryParams) {
          const active: string = queryParams.get('active');
          const direction: SortDirection = queryParams.get('direction') as SortDirection;
          if (Object.keys(ESortableColumns).includes(active) && Object.keys(EDirection).includes(direction)) {
            this.matSortActive = active;
            this.matSortDirection = direction;
            this.dataSource.sort = this.matSort;
          } else {
            // reset
            this.matSortActive = undefined;
            this.matSortDirection = undefined;
            await this.router.navigate([], {
              relativeTo: this.route,
              queryParams: undefined,
            });
          }
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  createDataSource(): void {
    this.dataSource = new MatTableDataSource(this.tracks);
    this.dataSource.sort = this.matSort;
    this.dataSource.sortingDataAccessor = sortingDataAccessor;
  }

  async handleSortChange({ active, direction }: Sort): Promise<void> {
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: active && direction ? { active, direction } : undefined,
    });
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
      .map((track: ITrackWFeatures) => track.uri);

    let playlistDescription: string = this.playlist.description;
    playlistDescription = playlistDescription.replace(DESCRIPTION_REGEX, '');
    playlistDescription =
      playlistDescription +
      ' ' +
      `${DESCRIPTION_PREFIX}${this.matSortActive}${SEPARATOR}${this.matSortDirection}${DESCRIPTION_SUFFIX}`;

    let playlistName: string = this.playlist.name;
    playlistName = playlistName.replace(TITLE_REGEX, '').trim();
    if (this.directionString && this.matSortActive) {
      playlistName = `${playlistName} ${TITLE_PREFIX} ${this.directionString} ${this.matSortActive}`;
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

  reset(): void {
    this.tracks = this.initialTracks;
    this.createDataSource();
  }

  shuffle(): void {
    this.tracks = shuffle(this.initialTracks);
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
    return track.track.album.images[0].url;
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
    return getAlbumCover(this.playlist);
  }

  async sortSmartly(): Promise<void> {}

  applyFilters(): void {
    // interface IId {
    //   id: string;
    // }
    // interface IEnergy extends IId {
    //   energy: number;
    // }
    // interface IName extends IId {
    //   name: string;
    // }
    // interface IArtist extends IId {
    //   artist: string;
    // }
    // interface IAlbumName extends IId {
    //   album_name: string;
    // }
    // interface IAddedDate extends IId {
    //   added_at: string;
    // }
    // interface IReleaseDate extends IId {
    //   release_date: string;
    // }
    // interface IDuration extends IId {
    //   duration_ms: number;
    // }
    // interface IAcousticness extends IId {
    //   acousticness: number;
    // }
    // interface IDanceability extends IId {
    //   danceability: number;
    // }
    // interface IInstrumentalness extends IId {
    //   instrumentalness: number;
    // }
    // interface IKey extends IId {
    //   key: number;
    // }
    // interface ILiveness extends IId {
    //   liveness: number;
    // }
    // interface ILoudness extends IId {
    //   loudness: number;
    // }
    // interface IMode extends IId {
    //   mode: number;
    // }
    // interface ISpeechiness extends IId {
    //   speechiness: number;
    // }
    // interface ITempo extends IId {
    //   tempo: number;
    // }
    // interface ITimeSignature extends IId {
    //   time_signature: number;
    // }
    // interface IValence extends IId {
    //   valence: number;
    // }
    // // const groupByAlbum: Dictionary<ITrackWFeatures[]> = groupBy(this.initialTracks, (item: ITrackWFeatures) => item.track.album.name);
    // // const groupByArtist: Dictionary<ITrackWFeatures[]> = groupBy(this.initialTracks, (item: ITrackWFeatures) => item.track.artists[0].name);
    // // const wut: object = Object.keys(groupByArtist).reduce((acc: object, artist: string) => {
    // //   const tracks: ITrackWFeatures[] = groupByArtist[artist];
    // //   const tracksGroupedByAlbum: Dictionary<ITrackWFeatures[]> = groupBy(tracks, (item: ITrackWFeatures) => item.track.album.name);
    // //   return {
    // //     ...acc,
    // //     [artist]: tracksGroupedByAlbum,
    // //   };
    // // }, {});
    // // console.log(groupByAlbum);
    // // console.log(groupByArtist);
    // // console.log(wut);
    // // return;
    // const all: any[] = this.sortBy.value.map((sortBy: string) => {
    //   switch (sortBy) {
    //     case ESortableColumns.name:
    //       return this.initialTracks
    //         .map(({ id, track }) => ({ id, name: track.name }))
    //         .sort((a: IName, b: IName) => b.name.localeCompare(a.name));
    //     case 'artist':
    //       return this.initialTracks
    //         .map(({ id, track }) => ({ id, artist: track.artists[0].name }))
    //         .sort((a: IArtist, b: IArtist) => b.artist.localeCompare(a.artist));
    //     case 'album_name':
    //       return this.initialTracks
    //         .map(({ id, track }) => ({ id, album_name: track.album.name }))
    //         .sort((a: IAlbumName, b: IAlbumName) => b.album_name.localeCompare(a.album_name));
    //     case 'added_at':
    //       return this.initialTracks
    //         .map(({ id, added_at }) => ({ id, added_at }))
    //         .sort((a: IAddedDate, b: IAddedDate) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());
    //     case 'release_date':
    //       return this.initialTracks
    //         .map(({ id, track }) => ({ id, release_date: (<any>track.album).release_date }))
    //         .sort(
    //           (a: IReleaseDate, b: IReleaseDate) =>
    //             new Date(b.release_date).getTime() - new Date(a.release_date).getTime(),
    //         );
    //     case 'duration_ms':
    //       return this.initialTracks
    //         .map(({ id, duration_ms }) => ({ id, duration_ms }))
    //         .sort((a: IDuration, b: IDuration) => b.duration_ms - a.duration_ms);
    //     case 'acousticness':
    //       return this.initialTracks
    //         .map(({ id, acousticness }) => ({ id, acousticness }))
    //         .sort((a: IAcousticness, b: IAcousticness) => b.acousticness - a.acousticness);
    //     case 'danceability':
    //       return this.initialTracks
    //         .map(({ id, danceability }) => ({ id, danceability }))
    //         .sort((a: IDanceability, b: IDanceability) => b.danceability - a.danceability);
    //     case 'energy':
    //       return this.initialTracks
    //         .map(({ id, energy }) => ({ id, energy }))
    //         .sort((a: IEnergy, b: IEnergy) => b.energy - a.energy);
    //     case 'instrumentalness':
    //       return this.initialTracks
    //         .map(({ id, instrumentalness }) => ({ id, instrumentalness }))
    //         .sort((a: IInstrumentalness, b: IInstrumentalness) => b.instrumentalness - a.instrumentalness);
    //     case 'key':
    //       return this.initialTracks.map(({ id, key }) => ({ id, key })).sort((a: IKey, b: IKey) => b.key - a.key);
    //     case 'liveness':
    //       return this.initialTracks
    //         .map(({ id, liveness }) => ({ id, liveness }))
    //         .sort((a: ILiveness, b: ILiveness) => b.liveness - a.liveness);
    //     case 'loudness':
    //       return this.initialTracks
    //         .map(({ id, loudness }) => ({ id, loudness }))
    //         .sort((a: ILoudness, b: ILoudness) => b.loudness - a.loudness);
    //     case 'mode':
    //       return this.initialTracks.map(({ id, mode }) => ({ id, mode })).sort((a: IMode, b: IMode) => b.mode - a.mode);
    //     case 'speechiness':
    //       return this.initialTracks
    //         .map(({ id, speechiness }) => ({ id, speechiness }))
    //         .sort((a: ISpeechiness, b: ISpeechiness) => b.speechiness - a.speechiness);
    //     case 'tempo':
    //       return this.initialTracks
    //         .map(({ id, tempo }) => ({ id, tempo }))
    //         .sort((a: ITempo, b: ITempo) => b.tempo - a.tempo);
    //     case 'time_signature':
    //       return this.initialTracks
    //         .map(({ id, time_signature }) => ({ id, time_signature }))
    //         .sort((a: ITimeSignature, b: ITimeSignature) => b.time_signature - a.time_signature);
    //     case 'valence':
    //       return this.initialTracks
    //         .map(({ id, valence }) => ({ id, valence }))
    //         .sort((a: IValence, b: IValence) => b.valence - a.valence);
    //   }
    // });
    // interface ITotal {
    //   id: string;
    //   total: number;
    // }
    // const final: ITotal[] = this.initialTracks
    //   .map((track: ITrackWFeatures) => {
    //     const total: number = all.reduce((acc: number, curr: any[], index: number) => {
    //       const val: number = curr.findIndex(({ id }) => id === track.id);
    //       return acc + val;
    //     }, 0);
    //     return {
    //       id: track.id,
    //       total,
    //     };
    //   })
    //   .sort((a: ITotal, b: ITotal) => b.total - a.total);
    // this.tracks = final.map((track: ITotal) => this.initialTracks.find(({ id }: ITrackWFeatures) => id === track.id));
    // this.createDataSource();
  }
}
