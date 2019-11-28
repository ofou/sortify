import { Injectable } from '@angular/core';
import { chunk, intersection, uniqBy } from 'lodash-es';
import { stringify } from 'querystring';
import SpotifyWebApi from 'spotify-web-api-js';
import { TokenService } from './spotify-auth/service';
import { StateService } from './state/state.service';

export const ARTIST_PAIR_JOINER = '<!_!>';
const spotifyApi = new SpotifyWebApi();

export function randomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

export interface IEdges {
  source: string;
  target: string;
}
export interface ITrack {
  name: string;
  preview_url: string;
  id: string;
  duration_ms: number;
  artists: string[];
  album_name: string;
  added_at: string;
  release_date: string;
  image_url: string;

  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  key: number;
  liveness: number;
  loudness: number;
  mode: number;
  speechiness: number;
  tempo: number;
  time_signature: number;
  valence: number;

  app_url: string;
  web_url: string;

  uri: string;
}

function mergeTrackInfo(
  tracks: SpotifyApi.PlaylistTrackResponse,
  trackFeatures: SpotifyApi.MultipleAudioFeaturesResponse,
): ITrack[] {
  if (tracks) {
    return tracks.items.map((track, index: number) => {
      const { added_at } = track;
      const { name, preview_url, id, duration_ms, artists, album, external_urls, uri } = track.track;
      const {
        acousticness,
        danceability,
        energy,
        instrumentalness,
        key,
        liveness,
        loudness,
        mode,
        speechiness,
        tempo,
        time_signature,
        valence,
      } = trackFeatures.audio_features[index];
      return {
        name,
        preview_url,
        id,
        duration_ms,
        artists: artists.map((artist) => artist.name),
        album_name: album.name,
        release_date: new Date((album as any).release_date).toISOString(),
        added_at,
        image_url: album.images[0].url,

        acousticness,
        danceability,
        energy,
        instrumentalness,
        key,
        liveness,
        loudness,
        mode,
        speechiness,
        tempo,
        time_signature,
        valence,

        app_url: uri,
        web_url: external_urls.spotify,

        uri,
      };
    });
  } else {
    return undefined;
  }
}

function generateKey(artistA: SpotifyApi.ArtistObjectFull, artistB: SpotifyApi.ArtistObjectFull): string {
  return [artistA, artistB]
    .map((artist: SpotifyApi.ArtistObjectFull) => artist.id)
    .sort((a: string, b: string) => a.localeCompare(b))
    .join(ARTIST_PAIR_JOINER);
}
interface ITemp {
  artistPair: string;
  genres: string[];
}
export interface IPlaylistArtistsGraph {
  edges: IEdges[];
  data: any;
}
@Injectable({
  providedIn: 'root',
})
export class SpotifyWebApiService {
  constructor(private tokenSvc: TokenService, private _stateService: StateService) {
    spotifyApi.setAccessToken(this.tokenSvc.oAuthToken);
  }

  // async getUserProfile(): Promise<SpotifyApi.CurrentUsersProfileResponse> {
  //   return await spotifyApi.getMe();
  // }
  async getPlaylists(): Promise<SpotifyApi.ListOfUsersPlaylistsResponse> {
    const user: SpotifyApi.CurrentUsersProfileResponse = this._stateService.userProfile;

    const GET_USER_PLAYLISTS = 50;
    const playlists = await spotifyApi.getUserPlaylists(user.id, { limit: GET_USER_PLAYLISTS }); // todo: get all
    return playlists;
  }

  async getPlaylistTracks(playlistId: string): Promise<SpotifyApi.PlaylistTrackResponse> {
    const tracksResponse: SpotifyApi.PlaylistTrackResponse = await spotifyApi.getPlaylistTracks(playlistId); // paginate
    const { total, limit }: SpotifyApi.PlaylistTrackResponse = tracksResponse;
    const remaining: number = total - limit;
    const numNecessaryCalls: number = Math.ceil(remaining / limit);
    const necessaryCalls: Promise<SpotifyApi.PlaylistTrackResponse>[] = Array.from(Array(numNecessaryCalls).keys()).map(
      (index: number) => {
        return spotifyApi.getPlaylistTracks(playlistId, { offset: (index + 1) * limit });
      },
    );
    const test: SpotifyApi.PlaylistTrackResponse[] = await Promise.all(necessaryCalls);

    return test.reduce((acc: SpotifyApi.PlaylistTrackResponse, curr: SpotifyApi.PlaylistTrackResponse) => {
      acc.items = [...(acc.items || []), ...curr.items];
      return acc;
    }, tracksResponse);
  }

  async updatePlaylist(playlistId: string, trackIds: string[]): Promise<void> {
    await spotifyApi.replaceTracksInPlaylist(playlistId, trackIds);
  }

  async getFeaturesOfTracks(trackIds: string[]): Promise<SpotifyApi.MultipleAudioFeaturesResponse> {
    const GET_AUDIO_FEATURES_MAX = 100;
    const artistResponsesChunkedUp: Promise<SpotifyApi.MultipleAudioFeaturesResponse>[] = chunk(
      trackIds,
      GET_AUDIO_FEATURES_MAX,
    ).map((artistChunk: string[]) => spotifyApi.getAudioFeaturesForTracks(artistChunk));

    const allPromises: SpotifyApi.MultipleAudioFeaturesResponse[] = await Promise.all(artistResponsesChunkedUp);

    return allPromises.reduce(
      (acc: SpotifyApi.MultipleAudioFeaturesResponse, curr: SpotifyApi.MultipleAudioFeaturesResponse) => {
        acc.audio_features = [...(acc.audio_features || []), ...curr.audio_features];
        return acc;
      },
      { audio_features: [] },
    );
  }

  async getPlaylistArtistGraph(playlistId: string): Promise<IPlaylistArtistsGraph> {
    const tracks: SpotifyApi.PlaylistTrackResponse = await this.getPlaylistTracks(playlistId);

    const artists: string[] = tracks.items.map(({ track }) => track.artists[0].id);
    const uniqueArtists: string[] = [...new Set(artists)];
    const artistsInfo: SpotifyApi.MultipleArtistsResponse = await this.getArtists(uniqueArtists);

    // interface IArtistsGroupedByGenre {
    //   [genre: string]: string[];
    // }

    // const artistsGroupedByGenre: IArtistsGroupedByGenre = artistsInfo.artists.reduce(
    //   (acc: IArtistsGroupedByGenre, artist: SpotifyApi.ArtistObjectFull) => {
    //     const { genres } = artist;
    //     genres.forEach((genre: string) => {
    //       if (acc[genre]) {
    //         acc[genre] = [...acc[genre], artist.name];
    //       } else {
    //         acc[genre] = [artist.name];
    //       }
    //     });
    //     return acc;
    //   },
    //   {}
    // );
    // return;

    interface ArtistsHashMap {
      [artist: string]: string[];
    }

    const artistsHashMap: ArtistsHashMap = artistsInfo.artists.reduce(
      (acc: ArtistsHashMap, artist: SpotifyApi.ArtistObjectFull, index: number) => {
        const otherArtists: SpotifyApi.ArtistObjectFull[] = [
          ...artistsInfo.artists.slice(0, index),
          ...artistsInfo.artists.slice(index + 1),
        ];

        otherArtists.forEach((thisArtist: SpotifyApi.ArtistObjectFull) => {
          const key: string = generateKey(artist, thisArtist);
          acc[key] = intersection(artist.genres, thisArtist.genres);
        });
        return acc;
      },
      {},
    );

    const artistsHashMapArray: ITemp[] = Object.keys(artistsHashMap)
      .map((artistPair: string) => {
        return {
          artistPair,
          genres: artistsHashMap[artistPair],
        };
      })
      .sort((tempA: ITemp, tempB: ITemp) => tempB.genres.length - tempA.genres.length)
      .filter((item: ITemp) => item.genres.length > 0);

    const edges: IEdges[] = artistsHashMapArray.map(({ artistPair }: any) => {
      const artistsIdsPair: string[] = artistPair.split(ARTIST_PAIR_JOINER);
      const artistA: string = artistsIdsPair[0];
      const artistB: string = artistsIdsPair[1];
      return {
        source: artistA,
        target: artistB,
      };
    });

    function getSymbolSize(artistId): number {
      const totalTrack: number = tracks.items.length;
      const numTracks: number = tracks.items.filter(({ track }) => track.artists[0].id === artistId).length;
      return (numTracks / totalTrack) * 150;
    }

    const data: any = artistsInfo.artists.map((artist: SpotifyApi.ArtistObjectFull) => ({
      id: artist.id,
      name: artist.name,
      value: 100,
      symbolSize: getSymbolSize(artist.id),
      itemStyle: {
        normal: {
          color: randomColor(),
        },
      },
    }));

    return {
      edges,
      data,
    };
  }

  async getPlaylistTracksWithFeatures(playlistId: string): Promise<ITrack[]> {
    const tracks: SpotifyApi.PlaylistTrackResponse = await this.getPlaylistTracks(playlistId);
    const trackFeatures: SpotifyApi.MultipleAudioFeaturesResponse = await this.getFeaturesOfTracks(
      tracks.items.map(({ track }) => track.id),
    );

    return mergeTrackInfo(tracks, trackFeatures);

    // interface IArtistWithRelatedAndDetails {
    //   id: string;
    //   name: string;
    //   related_artists: SpotifyApi.ArtistObjectFull[];
    // }

    // interface IRelatedArtistsScored {
    //   id: string;
    //   name: string;
    //   related_score: number;
    // }

    // interface IRelatedScored {
    //   id: string;
    //   name: string;
    //   related_artists_scored: IRelatedArtistsScored[];
    // }

    // interface Idk {
    //   genre: string;
    //   artists: string[];
    // }
    // const yeah: Idk[] = Object.keys(artistsGroupedByGenre)
    //   .map((genre: string) => ({
    //     genre,
    //     artists: artistsGroupedByGenre[genre],
    //   }))
    //   .sort((a: Idk, b: Idk) => a.artists.length - b.artists.length);

    // return;
    // const uniqueArtistsWithRelated: SpotifyApi.ArtistsRelatedArtistsResponse[] = await this.getRelatedArtistsOfList(
    //   uniqueArtists
    // );

    // const uniqueArtistsWithRelatedAndDetails: IArtistWithRelatedAndDetails[] = uniqueArtistsWithRelated.map(
    //   (relatedArtists: SpotifyApi.ArtistsRelatedArtistsResponse, index: number) => {
    //     const name: string = tracks.items.find(
    //       ({ track }: SpotifyApi.PlaylistTrackObject) => track.artists[0].id === uniqueArtists[index]
    //     ).track.artists[0].name;
    //     return {
    //       id: uniqueArtists[index],
    //       name,
    //       related_artists: relatedArtists.artists,
    //     };
    //   }
    // );

    // const final: IRelatedScored[] = uniqueArtistsWithRelatedAndDetails.map(
    //   (artist: IArtistWithRelatedAndDetails, index: number) => {
    //     const artistsToCompareTo: IArtistWithRelatedAndDetails[] = [
    //       ...uniqueArtistsWithRelatedAndDetails.slice(0, index),
    //       ...uniqueArtistsWithRelatedAndDetails.slice(index + 1),
    //     ];

    //     return {
    //       id: artist.id,
    //       name: artist.name,
    //       related_artists_scored: artistsToCompareTo
    //         .map((artistToCompareTo: IArtistWithRelatedAndDetails) => {
    //           return {
    //             id: artistToCompareTo.id,
    //             name: artistToCompareTo.name,
    //             related_score: artistToCompareTo.related_artists.findIndex(
    //               (ar: SpotifyApi.ArtistObjectFull) => ar.id === artist.id
    //             ),
    //           };
    //         })
    //         .sort((a: IRelatedArtistsScored, b: IRelatedArtistsScored) => a.related_score - b.related_score),
    //     };
    //   }
    // );
  }

  // async getRelatedArtists(artistId: string): Promise<SpotifyApi.ArtistsRelatedArtistsResponse> {
  //   return spotifyApi.getArtistRelatedArtists(artistId);
  // }

  // async getRelatedArtistsOfList(artistIds: string[]): Promise<SpotifyApi.ArtistsRelatedArtistsResponse[]> {
  //   return Promise.all(artistIds.map((artistId: string) => this.getRelatedArtists(artistId)));
  // }

  async getArtists(artistsIds: string[]): Promise<SpotifyApi.MultipleArtistsResponse> {
    const GET_ARTISTS_MAX = 50;
    const artistResponsesChunkedUp: Promise<SpotifyApi.MultipleArtistsResponse>[] = chunk(
      artistsIds,
      GET_ARTISTS_MAX,
    ).map((artistChunk: string[]) => spotifyApi.getArtists(artistChunk));
    const allPromises: SpotifyApi.MultipleArtistsResponse[] = await Promise.all(artistResponsesChunkedUp);

    return allPromises.reduce(
      (acc: SpotifyApi.MultipleArtistsResponse, curr: SpotifyApi.MultipleArtistsResponse) => {
        acc.artists = [...(acc.artists || []), ...curr.artists];
        return acc;
      },
      { artists: [] },
    );
  }
}
