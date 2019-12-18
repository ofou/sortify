import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { fromEvent } from 'rxjs';
import { SpotifyWebApiService, ITrackWFeatures } from '../services/spotify-web-api.service';
import { StateService } from '../state/state.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    private matSnackBar: MatSnackBar,
  ) {}

  @ViewChild(MatSort, { static: false }) sort: MatSort;

  playlistId: string;
  playlist: SpotifyApi.SinglePlaylistResponse;
  tracks: ITrackWFeatures[];
  initialTracks: ITrackWFeatures[];

  dataSource: MatTableDataSource<ITrackWFeatures>;
  audio: HTMLAudioElement;

  sortableColumns: string[] = [
    'name',
    'artists',
    /// todo artist_id and album_id
    'album_name',
    'added_at',
    'release_date',
    'duration_ms',

    'acousticness',
    'danceability',
    'energy',
    'instrumentalness',
    'key',
    'liveness',
    'loudness',
    'mode',
    'speechiness',
    'tempo',
    'time_signature',
    'valence',
  ];
  displayedColumns: string[] = ['index', 'image_url', 'preview_url', 'web_url', ...this.sortableColumns];

  sortBy: FormControl = new FormControl([]);

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

  get ownsPlaylist(): boolean {
    return this.playlist && this.playlist.owner.id === this._stateService.userProfile.id;
  }

  async ngOnInit() {
    this.route.paramMap.subscribe(async (params: ParamMap) => {
      this._stateService.setLoading(true);

      this.playlistId = params.get('playlistId');
      this.playlist = await this.spotifyWebApiService.getPlaylist(this.playlistId);

      const [playlist, tracks] = await Promise.all([
        this.spotifyWebApiService.getPlaylist(this.playlistId),
        this.spotifyWebApiService.getPlaylistTracksWithFeatures(this.playlistId),
      ]);
      this.playlist = playlist;
      this.tracks = tracks;
      this.initialTracks = this.tracks;
      this.createDataSource();
      this._stateService.setLoading(false);

      this.route.queryParamMap.subscribe((queryParams: ParamMap) => {
        if (queryParams) {
          const sortByFilters: string = queryParams.get('filters');
          if (sortByFilters && sortByFilters.length > 0) {
            this.sortBy.setValue(sortByFilters.split(','));
          } else {
            this.sortBy.setValue([]);
          }
          // this.sortSmartly();
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  changeFilter(change: MatSelectChange): void {
    const queryParams: Params = change.value.length ? { filters: change.value.join(',') } : undefined;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
    });
  }

  createDataSource(): void {
    this.dataSource = new MatTableDataSource(this.tracks);
    this.sort.sort({ disableClear: false, id: undefined, start: 'asc' });
    this.dataSource.sort = this.sort;
  }

  async savePlaylist(): Promise<void> {
    this._stateService.setLoading(true);
    const updatedOrder: string[] = this.dataSource
      .sortData(this.dataSource.filteredData, this.dataSource.sort)
      .map((track: ITrackWFeatures) => track.uri);
    await this.spotifyWebApiService.updatePlaylist(this.playlistId, updatedOrder);
    this.matSnackBar.open('Saved!');
    this._stateService.setLoading(false);
  }

  async saveAsPlaylist(): Promise<void> {
    // this._stateService.setLoading(true);
    // const updatedOrder: string[] = this.dataSource
    //   .sortData(this.dataSource.filteredData, this.dataSource.sort)
    //   .map((track: ITrack) => track.uri);
    // await this.spotifyWebApiService.updatePlaylist(this.playlistId, updatedOrder);
    // this.matSnackBar.open('Saved!');
    // this._stateService.setLoading(false);
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
    return new Date((track.track.album as any).release_date).toISOString();
  }

  // sortSmartly(): void {
  //   interface IId {
  //     id: string;
  //   }
  //   interface IEnergy extends IId {
  //     energy: number;
  //   }
  //   interface IName extends IId {
  //     name: string;
  //   }
  //   interface IArtist extends IId {
  //     artist: string;
  //   }
  //   interface IAlbumName extends IId {
  //     album_name: string;
  //   }
  //   interface IAddedDate extends IId {
  //     added_at: string;
  //   }
  //   interface IReleaseDate extends IId {
  //     release_date: string;
  //   }
  //   interface IDuration extends IId {
  //     duration_ms: number;
  //   }
  //   interface IAcousticness extends IId {
  //     acousticness: number;
  //   }
  //   interface IDanceability extends IId {
  //     danceability: number;
  //   }
  //   interface IInstrumentalness extends IId {
  //     instrumentalness: number;
  //   }
  //   interface IKey extends IId {
  //     key: number;
  //   }
  //   interface ILiveness extends IId {
  //     liveness: number;
  //   }
  //   interface ILoudness extends IId {
  //     loudness: number;
  //   }
  //   interface IMode extends IId {
  //     mode: number;
  //   }
  //   interface ISpeechiness extends IId {
  //     speechiness: number;
  //   }
  //   interface ITempo extends IId {
  //     tempo: number;
  //   }
  //   interface ITimeSignature extends IId {
  //     time_signature: number;
  //   }
  //   interface IValence extends IId {
  //     valence: number;
  //   }

  //   const groupByAlbum: Dictionary<ITrack[]> = groupBy(this.initialTracks, (item: ITrack) => item.album_name);
  //   const groupByArtist: Dictionary<ITrack[]> = groupBy(this.initialTracks, (item: ITrack) => item.artists[0]);
  //   const wut: object = Object.keys(groupByArtist).reduce((acc: object, artist: string) => {
  //     const tracks: ITrack[] = groupByArtist[artist];
  //     const tracksGroupedByAlbum: Dictionary<ITrack[]> = groupBy(tracks, (item: ITrack) => item.album_name);
  //     return {
  //       ...acc,
  //       [artist]: tracksGroupedByAlbum,
  //     };
  //   }, {});
  //   const all: any[] = this.sortBy.value.map((sortBy: string) => {
  //     switch (sortBy) {
  //       case 'name':
  //         return this.initialTracks
  //           .map(({ id, name }) => ({ id, name }))
  //           .sort((a: IName, b: IName) => b.name.localeCompare(a.name));
  //       case 'artists':
  //         return this.initialTracks
  //           .map(({ id, artists }) => ({ id, artist: artists[0] }))
  //           .sort((a: IArtist, b: IArtist) => b.artist.localeCompare(a.artist));
  //       case 'album_name':
  //         return this.initialTracks
  //           .map(({ id, album_name }) => ({ id, album_name }))
  //           .sort((a: IAlbumName, b: IAlbumName) => b.album_name.localeCompare(a.album_name));
  //       case 'added_at':
  //         return this.initialTracks
  //           .map(({ id, added_at }) => ({ id, added_at }))
  //           .sort((a: IAddedDate, b: IAddedDate) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());
  //       case 'release_date':
  //         return this.initialTracks
  //           .map(({ id, release_date }) => ({ id, release_date }))
  //           .sort(
  //             (a: IReleaseDate, b: IReleaseDate) =>
  //               new Date(b.release_date).getTime() - new Date(a.release_date).getTime(),
  //           );
  //       case 'duration_ms':
  //         return this.initialTracks
  //           .map(({ id, duration_ms }) => ({ id, duration_ms }))
  //           .sort((a: IDuration, b: IDuration) => b.duration_ms - a.duration_ms);

  //       case 'acousticness':
  //         return this.initialTracks
  //           .map(({ id, acousticness }) => ({ id, acousticness }))
  //           .sort((a: IAcousticness, b: IAcousticness) => b.acousticness - a.acousticness);
  //       case 'danceability':
  //         return this.initialTracks
  //           .map(({ id, danceability }) => ({ id, danceability }))
  //           .sort((a: IDanceability, b: IDanceability) => b.danceability - a.danceability);
  //       case 'energy':
  //         return this.initialTracks
  //           .map(({ id, energy }) => ({ id, energy }))
  //           .sort((a: IEnergy, b: IEnergy) => b.energy - a.energy);
  //       case 'instrumentalness':
  //         return this.initialTracks
  //           .map(({ id, instrumentalness }) => ({ id, instrumentalness }))
  //           .sort((a: IInstrumentalness, b: IInstrumentalness) => b.instrumentalness - a.instrumentalness);
  //       case 'key':
  //         return this.initialTracks.map(({ id, key }) => ({ id, key })).sort((a: IKey, b: IKey) => b.key - a.key);
  //       case 'liveness':
  //         return this.initialTracks
  //           .map(({ id, liveness }) => ({ id, liveness }))
  //           .sort((a: ILiveness, b: ILiveness) => b.liveness - a.liveness);
  //       case 'loudness':
  //         return this.initialTracks
  //           .map(({ id, loudness }) => ({ id, loudness }))
  //           .sort((a: ILoudness, b: ILoudness) => b.loudness - a.loudness);
  //       case 'mode':
  //         return this.initialTracks.map(({ id, mode }) => ({ id, mode })).sort((a: IMode, b: IMode) => b.mode - a.mode);
  //       case 'speechiness':
  //         return this.initialTracks
  //           .map(({ id, speechiness }) => ({ id, speechiness }))
  //           .sort((a: ISpeechiness, b: ISpeechiness) => b.speechiness - a.speechiness);
  //       case 'tempo':
  //         return this.initialTracks
  //           .map(({ id, tempo }) => ({ id, tempo }))
  //           .sort((a: ITempo, b: ITempo) => b.tempo - a.tempo);
  //       case 'time_signature':
  //         return this.initialTracks
  //           .map(({ id, time_signature }) => ({ id, time_signature }))
  //           .sort((a: ITimeSignature, b: ITimeSignature) => b.time_signature - a.time_signature);
  //       case 'valence':
  //         return this.initialTracks
  //           .map(({ id, valence }) => ({ id, valence }))
  //           .sort((a: IValence, b: IValence) => b.valence - a.valence);
  //     }
  //   });

  //   interface ITotal {
  //     id: string;
  //     total: number;
  //   }
  //   const final: ITotal[] = this.initialTracks
  //     .map((track: ITrack) => {
  //       const total: number = all.reduce((acc: number, curr: any[], index: number) => {
  //         const val: number = curr.findIndex(({ id }) => id === track.id);
  //         return acc + val;
  //       }, 0);

  //       return {
  //         id: track.id,
  //         total,
  //       };
  //     })
  //     .sort((a: ITotal, b: ITotal) => b.total - a.total);
  //   this.tracks = final.map((track: ITotal) => this.initialTracks.find(({ id }: ITrack) => id === track.id));

  //   this.createDataSource();
  // }
}
