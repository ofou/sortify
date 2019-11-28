import { ChangeDetectorRef, Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatRipple } from '@angular/material/core';
import { MatSelectChange } from '@angular/material/select';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { EChartOption, ECharts } from 'echarts';
import { Dictionary } from 'lodash';
import { groupBy } from 'lodash-es';
import { fromEvent } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ARTIST_PAIR_JOINER, IPlaylistArtistsGraph, ITrack, SpotifyWebApiService } from '../spotify-web-api.service';
import { StateService } from '../state/state.service';
import { SAMPLE_DATA } from './sample-data';

@Component({
  selector: 'sort-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss'],
})
export class PlaylistComponent implements OnInit, OnDestroy {
  constructor(
    private spotifyWebApiService: SpotifyWebApiService,
    private route: ActivatedRoute,
    fb: FormBuilder,
    private router: Router,
    private _stateService: StateService,
  ) {}

  config: any = {
    series: [
      {
        type: 'graph',
        layout: 'circular',
        data: [],
        edges: [],
        label: {
          emphasis: {
            position: 'right',
            show: true,
          },
        },
        roam: true,
        focusNodeAdjacency: true,
      },
    ],
  };

  tracks: ITrack[];
  initialTracks: ITrack[];
  dataSource: MatTableDataSource<ITrack>;

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

  playlistId: string;

  get loading(): boolean {
    return this._stateService.loading;
  }

  // energy, danceability, key, speechiness, tempo, time_signature no, valence

  @ViewChild(MatSort, { static: false }) sort: MatSort;

  get playTime(): number {
    if (this.audio && this.audio.currentTime && this.audio.duration) {
      return (this.audio.currentTime / this.audio.duration) * 100;
    }
    return 0;
  }
  async ngOnInit() {
    this._stateService.setLoading(true);
    this.route.paramMap.subscribe(async (params: ParamMap) => {
      this.playlistId = params.get('playlistId');

      const [tracks, { data, edges }] = await Promise.all([
        this.spotifyWebApiService.getPlaylistTracksWithFeatures(this.playlistId),
        this.spotifyWebApiService.getPlaylistArtistGraph(this.playlistId),
      ]);
      this.tracks = tracks;

      this.initialTracks = this.tracks;
      this.createDataSource();

      this.config.series[0].data = data;
      this.config.series[0].edges = edges;
      this.updateChart();

      this._stateService.setLoading(false);

      this.route.queryParamMap.subscribe((queryParams: ParamMap) => {
        if (queryParams) {
          const sortByFilters: string = queryParams.get('filters');
          if (sortByFilters && sortByFilters.length > 0) {
            this.sortBy.setValue(sortByFilters.split(','));
          } else {
            this.sortBy.setValue([]);
          }
          this.sortSmartly();
        }
      });
    });
  }

  updateChart(): void {
    this.config = JSON.parse(JSON.stringify(this.config));
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
      .map((track: ITrack) => track.uri);
    await this.spotifyWebApiService.updatePlaylist(this.playlistId, updatedOrder);
    this._stateService.setLoading(false);
  }

  ngOnDestroy() {
    if (this.audio) {
      this.audio.pause();
    }
  }
  async play(previewUrl: string): Promise<void> {
    // something is playing
    if (this.audio) {
      if (this.isPlaying(previewUrl)) {
        this.audio.pause();
        this.audio = undefined;
        return;
      } else {
        this.audio.pause();
        this.audio = undefined;
      }
    }
    if (previewUrl) {
      this.audio = new Audio(previewUrl);
      fromEvent(this.audio, 'ended').subscribe(() => {
        this.audio = undefined;
      });
      await this.audio.play();
    }
  }

  get currentlyPlayingTrack(): string {
    return this.audio && this.audio.src;
  }

  isPlaying(previewUrl: string) {
    return !!this.audio && this.audio.src === previewUrl;
  }

  createDate(ms: number): Date {
    return new Date(ms);
  }
  allArtists(artists: string[]): string {
    return artists.join(', ');
  }

  sortSmartly(): void {
    interface IId {
      id: string;
    }
    interface IEnergy extends IId {
      energy: number;
    }
    interface IName extends IId {
      name: string;
    }
    interface IArtist extends IId {
      artist: string;
    }
    interface IAlbumName extends IId {
      album_name: string;
    }
    interface IAddedDate extends IId {
      added_at: string;
    }
    interface IReleaseDate extends IId {
      release_date: string;
    }
    interface IDuration extends IId {
      duration_ms: number;
    }
    interface IAcousticness extends IId {
      acousticness: number;
    }
    interface IDanceability extends IId {
      danceability: number;
    }
    interface IInstrumentalness extends IId {
      instrumentalness: number;
    }
    interface IKey extends IId {
      key: number;
    }
    interface ILiveness extends IId {
      liveness: number;
    }
    interface ILoudness extends IId {
      loudness: number;
    }
    interface IMode extends IId {
      mode: number;
    }
    interface ISpeechiness extends IId {
      speechiness: number;
    }
    interface ITempo extends IId {
      tempo: number;
    }
    interface ITimeSignature extends IId {
      time_signature: number;
    }
    interface IValence extends IId {
      valence: number;
    }

    const groupByAlbum: Dictionary<ITrack[]> = groupBy(this.initialTracks, (item: ITrack) => item.album_name);
    const groupByArtist: Dictionary<ITrack[]> = groupBy(this.initialTracks, (item: ITrack) => item.artists[0]);
    const wut: object = Object.keys(groupByArtist).reduce((acc: object, artist: string) => {
      const tracks: ITrack[] = groupByArtist[artist];
      const tracksGroupedByAlbum: Dictionary<ITrack[]> = groupBy(tracks, (item: ITrack) => item.album_name);
      return {
        ...acc,
        [artist]: tracksGroupedByAlbum,
      };
    }, {});
    const all: any[] = this.sortBy.value.map((sortBy: string) => {
      switch (sortBy) {
        case 'name':
          return this.initialTracks
            .map(({ id, name }) => ({ id, name }))
            .sort((a: IName, b: IName) => b.name.localeCompare(a.name));
        case 'artists':
          return this.initialTracks
            .map(({ id, artists }) => ({ id, artist: artists[0] }))
            .sort((a: IArtist, b: IArtist) => b.artist.localeCompare(a.artist));
        case 'album_name':
          return this.initialTracks
            .map(({ id, album_name }) => ({ id, album_name }))
            .sort((a: IAlbumName, b: IAlbumName) => b.album_name.localeCompare(a.album_name));
        case 'added_at':
          return this.initialTracks
            .map(({ id, added_at }) => ({ id, added_at }))
            .sort((a: IAddedDate, b: IAddedDate) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());
        case 'release_date':
          return this.initialTracks
            .map(({ id, release_date }) => ({ id, release_date }))
            .sort(
              (a: IReleaseDate, b: IReleaseDate) =>
                new Date(b.release_date).getTime() - new Date(a.release_date).getTime(),
            );
        case 'duration_ms':
          return this.initialTracks
            .map(({ id, duration_ms }) => ({ id, duration_ms }))
            .sort((a: IDuration, b: IDuration) => b.duration_ms - a.duration_ms);

        case 'acousticness':
          return this.initialTracks
            .map(({ id, acousticness }) => ({ id, acousticness }))
            .sort((a: IAcousticness, b: IAcousticness) => b.acousticness - a.acousticness);
        case 'danceability':
          return this.initialTracks
            .map(({ id, danceability }) => ({ id, danceability }))
            .sort((a: IDanceability, b: IDanceability) => b.danceability - a.danceability);
        case 'energy':
          return this.initialTracks
            .map(({ id, energy }) => ({ id, energy }))
            .sort((a: IEnergy, b: IEnergy) => b.energy - a.energy);
        case 'instrumentalness':
          return this.initialTracks
            .map(({ id, instrumentalness }) => ({ id, instrumentalness }))
            .sort((a: IInstrumentalness, b: IInstrumentalness) => b.instrumentalness - a.instrumentalness);
        case 'key':
          return this.initialTracks.map(({ id, key }) => ({ id, key })).sort((a: IKey, b: IKey) => b.key - a.key);
        case 'liveness':
          return this.initialTracks
            .map(({ id, liveness }) => ({ id, liveness }))
            .sort((a: ILiveness, b: ILiveness) => b.liveness - a.liveness);
        case 'loudness':
          return this.initialTracks
            .map(({ id, loudness }) => ({ id, loudness }))
            .sort((a: ILoudness, b: ILoudness) => b.loudness - a.loudness);
        case 'mode':
          return this.initialTracks.map(({ id, mode }) => ({ id, mode })).sort((a: IMode, b: IMode) => b.mode - a.mode);
        case 'speechiness':
          return this.initialTracks
            .map(({ id, speechiness }) => ({ id, speechiness }))
            .sort((a: ISpeechiness, b: ISpeechiness) => b.speechiness - a.speechiness);
        case 'tempo':
          return this.initialTracks
            .map(({ id, tempo }) => ({ id, tempo }))
            .sort((a: ITempo, b: ITempo) => b.tempo - a.tempo);
        case 'time_signature':
          return this.initialTracks
            .map(({ id, time_signature }) => ({ id, time_signature }))
            .sort((a: ITimeSignature, b: ITimeSignature) => b.time_signature - a.time_signature);
        case 'valence':
          return this.initialTracks
            .map(({ id, valence }) => ({ id, valence }))
            .sort((a: IValence, b: IValence) => b.valence - a.valence);
      }
    });

    interface ITotal {
      id: string;
      total: number;
    }
    const final: ITotal[] = this.initialTracks
      .map((track: ITrack) => {
        const total: number = all.reduce((acc: number, curr: any[], index: number) => {
          const val: number = curr.findIndex(({ id }) => id === track.id);
          return acc + val;
        }, 0);

        return {
          id: track.id,
          total,
        };
      })
      .sort((a: ITotal, b: ITotal) => b.total - a.total);
    this.tracks = final.map((track: ITotal) => this.initialTracks.find(({ id }: ITrack) => id === track.id));

    this.createDataSource();
  }
}
