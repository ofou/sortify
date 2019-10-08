import { Injectable } from '@angular/core';
import { TokenService } from './spotify-auth/service';
import SpotifyWebApi from 'spotify-web-api-js';
import { chunk, intersection } from 'lodash-es';
import { stringify } from 'querystring';

export const ARTIST_PAIR_JOINER = '<!_!>';
const spotifyApi = new SpotifyWebApi();

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
}

function mergeTrackInfo(
  tracks: SpotifyApi.PlaylistTrackResponse,
  trackFeatures: SpotifyApi.MultipleAudioFeaturesResponse
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
        artists: artists.map(artist => artist.name),
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
      };
    });
  } else {
    return undefined;
  }
}
interface ITemp {
  artistPair: string;
  genres: string[];
}
@Injectable({
  providedIn: 'root',
})
export class SpotifyWebApiService {
  constructor(private tokenSvc: TokenService) {}

  async getPlaylists(): Promise<SpotifyApi.ListOfUsersPlaylistsResponse> {
    spotifyApi.setAccessToken(this.tokenSvc.oAuthToken);
    const user: SpotifyApi.CurrentUsersProfileResponse = await spotifyApi.getMe();
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
      }
    );
    const test: SpotifyApi.PlaylistTrackResponse[] = await Promise.all(necessaryCalls);

    return test.reduce((acc: SpotifyApi.PlaylistTrackResponse, curr: SpotifyApi.PlaylistTrackResponse) => {
      acc.items = [...(acc.items || []), ...curr.items];
      return acc;
    }, tracksResponse);
  }

  async getFeaturesOfTracks(trackIds: string[]): Promise<SpotifyApi.MultipleAudioFeaturesResponse> {
    const GET_AUDIO_FEATURES_MAX = 100;
    const artistResponsesChunkedUp: Promise<SpotifyApi.MultipleAudioFeaturesResponse>[] = chunk(
      trackIds,
      GET_AUDIO_FEATURES_MAX
    ).map((artistChunk: string[]) => spotifyApi.getAudioFeaturesForTracks(artistChunk));

    const allPromises: SpotifyApi.MultipleAudioFeaturesResponse[] = await Promise.all(artistResponsesChunkedUp);

    return allPromises.reduce(
      (acc: SpotifyApi.MultipleAudioFeaturesResponse, curr: SpotifyApi.MultipleAudioFeaturesResponse) => {
        acc.audio_features = [...(acc.audio_features || []), ...curr.audio_features];
        return acc;
      },
      { audio_features: [] }
    );
  }


  async getPlaylistArtistGraph(playlistId: string): Promise<any> {
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

    function generateKey(artistA: string, artistB): string {
      return [artistA, artistB].sort((a: string, b: string) => a.localeCompare(b)).join(ARTIST_PAIR_JOINER);
    }
    const artistsHashMap: ArtistsHashMap = artistsInfo.artists.reduce(
      (acc: ArtistsHashMap, artist: SpotifyApi.ArtistObjectFull, index: number) => {
        const otherArtists: SpotifyApi.ArtistObjectFull[] = [
          ...artistsInfo.artists.slice(0, index),
          ...artistsInfo.artists.slice(index + 1),
        ];

        otherArtists.forEach((thisArtist: SpotifyApi.ArtistObjectFull) => {
          const key: string = generateKey(artist.name, thisArtist.name);
          acc[key] = intersection(artist.genres, thisArtist.genres);
        });
        return acc;
      },
      {}
    );



    const test: ITemp[] = Object.keys(artistsHashMap)
      .map((artistPair: string) => {
        return {
          artistPair,
          genres: artistsHashMap[artistPair],
        };
      })
      .sort((tempA: ITemp, tempB: ITemp) => tempB.genres.length - tempA.genres.length)
      .filter((item: ITemp) => item.genres.length > 0);
    return test;
  }

  async getPlaylistTracksWithFeatures(playlistId: string): Promise<ITrack[]> {
    const tracks: SpotifyApi.PlaylistTrackResponse = await this.getPlaylistTracks(playlistId);
    const trackFeatures: SpotifyApi.MultipleAudioFeaturesResponse = await this.getFeaturesOfTracks(
      tracks.items.map(({ track }) => track.id)
    );

    interface IArtistWithRelatedAndDetails {
      id: string;
      name: string;
      related_artists: SpotifyApi.ArtistObjectFull[];
    }

    interface IRelatedArtistsScored {
      id: string;
      name: string;
      related_score: number;
    }

    interface IRelatedScored {
      id: string;
      name: string;
      related_artists_scored: IRelatedArtistsScored[];
    }

    return;

    interface Idk {
      genre: string;
      artists: string[];
    }
    const yeah: Idk[] = Object.keys(artistsGroupedByGenre)
      .map((genre: string) => ({
        genre,
        artists: artistsGroupedByGenre[genre],
      }))
      .sort((a: Idk, b: Idk) => a.artists.length - b.artists.length);

    return;
    const uniqueArtistsWithRelated: SpotifyApi.ArtistsRelatedArtistsResponse[] = await this.getRelatedArtistsOfList(
      uniqueArtists
    );


    const uniqueArtistsWithRelatedAndDetails: IArtistWithRelatedAndDetails[] = uniqueArtistsWithRelated.map(
      (relatedArtists: SpotifyApi.ArtistsRelatedArtistsResponse, index: number) => {
        const name: string = tracks.items.find(
          ({ track }: SpotifyApi.PlaylistTrackObject) => track.artists[0].id === uniqueArtists[index]
        ).track.artists[0].name;
        return {
          id: uniqueArtists[index],
          name,
          related_artists: relatedArtists.artists,
        };
      }
    );

    const final: IRelatedScored[] = uniqueArtistsWithRelatedAndDetails.map(
      (artist: IArtistWithRelatedAndDetails, index: number) => {
        const artistsToCompareTo: IArtistWithRelatedAndDetails[] = [
          ...uniqueArtistsWithRelatedAndDetails.slice(0, index),
          ...uniqueArtistsWithRelatedAndDetails.slice(index + 1),
        ];

        return {
          id: artist.id,
          name: artist.name,
          related_artists_scored: artistsToCompareTo
            .map((artistToCompareTo: IArtistWithRelatedAndDetails) => {
              return {
                id: artistToCompareTo.id,
                name: artistToCompareTo.name,
                related_score: artistToCompareTo.related_artists.findIndex(
                  (ar: SpotifyApi.ArtistObjectFull) => ar.id === artist.id
                ),
              };
            })
            .sort((a: IRelatedArtistsScored, b: IRelatedArtistsScored) => a.related_score - b.related_score),
        };
      }
    );

    return mergeTrackInfo(tracks, trackFeatures);
  }

  async getRelatedArtists(artistId: string): Promise<SpotifyApi.ArtistsRelatedArtistsResponse> {
    return spotifyApi.getArtistRelatedArtists(artistId);
  }

  async getRelatedArtistsOfList(artistIds: string[]): Promise<SpotifyApi.ArtistsRelatedArtistsResponse[]> {
    return Promise.all(artistIds.map((artistId: string) => this.getRelatedArtists(artistId)));
  }

  async getArtists(artistsIds: string[]): Promise<SpotifyApi.MultipleArtistsResponse> {
    const GET_ARTISTS_MAX = 50;
    const artistResponsesChunkedUp: Promise<SpotifyApi.MultipleArtistsResponse>[] = chunk(
      artistsIds,
      GET_ARTISTS_MAX
    ).map((artistChunk: string[]) => spotifyApi.getArtists(artistChunk));
    const allPromises: SpotifyApi.MultipleArtistsResponse[] = await Promise.all(artistResponsesChunkedUp);

    return allPromises.reduce(
      (acc: SpotifyApi.MultipleArtistsResponse, curr: SpotifyApi.MultipleArtistsResponse) => {
        acc.artists = [...(acc.artists || []), ...curr.artists];
        return acc;
      },
      { artists: [] }
    );
  }
}
