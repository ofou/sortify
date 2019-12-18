// export const ARTIST_PAIR_JOINER = '<!_!>';

// export function randomColor(): string {
//   return '#' + Math.floor(Math.random() * 16777215).toString(16);
// }

// export interface IEdges {
//   source: string;
//   target: string;
// }

// function generateKey(artistA: SpotifyApi.ArtistObjectFull, artistB: SpotifyApi.ArtistObjectFull): string {
//   return [artistA, artistB]
//     .map((artist: SpotifyApi.ArtistObjectFull) => artist.id)
//     .sort((a: string, b: string) => a.localeCompare(b))
//     .join(ARTIST_PAIR_JOINER);
// }
// interface ITemp {
//   artistPair: string;
//   genres: string[];
// }
// export interface IPlaylistArtistsGraph {
//   edges: IEdges[];
//   data: any;
// }

// async getPlaylistArtistGraph(playlistId: string): Promise<IPlaylistArtistsGraph> {
//   const tracks: SpotifyApi.PlaylistTrackResponse = await this.getPlaylistTracks(playlistId);

//   const artists: string[] = tracks.items.map(({ track }) => track.artists[0].id);
//   const uniqueArtists: string[] = [...new Set(artists)];
//   const artistsInfo: SpotifyApi.MultipleArtistsResponse = await this.getArtists(uniqueArtists);

//   // interface IArtistsGroupedByGenre {
//   //   [genre: string]: string[];
//   // }

//   // const artistsGroupedByGenre: IArtistsGroupedByGenre = artistsInfo.artists.reduce(
//   //   (acc: IArtistsGroupedByGenre, artist: SpotifyApi.ArtistObjectFull) => {
//   //     const { genres } = artist;
//   //     genres.forEach((genre: string) => {
//   //       if (acc[genre]) {
//   //         acc[genre] = [...acc[genre], artist.name];
//   //       } else {
//   //         acc[genre] = [artist.name];
//   //       }
//   //     });
//   //     return acc;
//   //   },
//   //   {}
//   // );
//   // return;

//   interface ArtistsHashMap {
//     [artist: string]: string[];
//   }

//   const artistsHashMap: ArtistsHashMap = artistsInfo.artists.reduce(
//     (acc: ArtistsHashMap, artist: SpotifyApi.ArtistObjectFull, index: number) => {
//       const otherArtists: SpotifyApi.ArtistObjectFull[] = [
//         ...artistsInfo.artists.slice(0, index),
//         ...artistsInfo.artists.slice(index + 1),
//       ];

//       otherArtists.forEach((thisArtist: SpotifyApi.ArtistObjectFull) => {
//         const key: string = generateKey(artist, thisArtist);
//         acc[key] = intersection(artist.genres, thisArtist.genres);
//       });
//       return acc;
//     },
//     {},
//   );

//   const artistsHashMapArray: ITemp[] = Object.keys(artistsHashMap)
//     .map((artistPair: string) => {
//       return {
//         artistPair,
//         genres: artistsHashMap[artistPair],
//       };
//     })
//     .sort((tempA: ITemp, tempB: ITemp) => tempB.genres.length - tempA.genres.length)
//     .filter((item: ITemp) => item.genres.length > 0);

//   const edges: IEdges[] = artistsHashMapArray.map(({ artistPair }: any) => {
//     const artistsIdsPair: string[] = artistPair.split(ARTIST_PAIR_JOINER);
//     const artistA: string = artistsIdsPair[0];
//     const artistB: string = artistsIdsPair[1];
//     return {
//       source: artistA,
//       target: artistB,
//     };
//   });

//   function getSymbolSize(artistId): number {
//     const totalTrack: number = tracks.items.length;
//     const numTracks: number = tracks.items.filter(({ track }) => track.artists[0].id === artistId).length;
//     return (numTracks / totalTrack) * 150;
//   }

//   const data: any = artistsInfo.artists.map((artist: SpotifyApi.ArtistObjectFull) => ({
//     id: artist.id,
//     name: artist.name,
//     value: 100,
//     symbolSize: getSymbolSize(artist.id),
//     itemStyle: {
//       normal: {
//         color: randomColor(),
//       },
//     },
//   }));

//   return {
//     edges,
//     data,
//   };
// }

//     // interface IArtistWithRelatedAndDetails {
//     //   id: string;
//     //   name: string;
//     //   related_artists: SpotifyApi.ArtistObjectFull[];
//     // }

//     // interface IRelatedArtistsScored {
//     //   id: string;
//     //   name: string;
//     //   related_score: number;
//     // }

//     // interface IRelatedScored {
//     //   id: string;
//     //   name: string;
//     //   related_artists_scored: IRelatedArtistsScored[];
//     // }

//     // interface Idk {
//     //   genre: string;
//     //   artists: string[];
//     // }
//     // const yeah: Idk[] = Object.keys(artistsGroupedByGenre)
//     //   .map((genre: string) => ({
//     //     genre,
//     //     artists: artistsGroupedByGenre[genre],
//     //   }))
//     //   .sort((a: Idk, b: Idk) => a.artists.length - b.artists.length);

//     // return;
//     // const uniqueArtistsWithRelated: SpotifyApi.ArtistsRelatedArtistsResponse[] = await this.getRelatedArtistsOfList(
//     //   uniqueArtists
//     // );

//     // const uniqueArtistsWithRelatedAndDetails: IArtistWithRelatedAndDetails[] = uniqueArtistsWithRelated.map(
//     //   (relatedArtists: SpotifyApi.ArtistsRelatedArtistsResponse, index: number) => {
//     //     const name: string = tracks.items.find(
//     //       ({ track }: SpotifyApi.PlaylistTrackObject) => track.artists[0].id === uniqueArtists[index]
//     //     ).track.artists[0].name;
//     //     return {
//     //       id: uniqueArtists[index],
//     //       name,
//     //       related_artists: relatedArtists.artists,
//     //     };
//     //   }
//     // );

//     // const final: IRelatedScored[] = uniqueArtistsWithRelatedAndDetails.map(
//     //   (artist: IArtistWithRelatedAndDetails, index: number) => {
//     //     const artistsToCompareTo: IArtistWithRelatedAndDetails[] = [
//     //       ...uniqueArtistsWithRelatedAndDetails.slice(0, index),
//     //       ...uniqueArtistsWithRelatedAndDetails.slice(index + 1),
//     //     ];

//     //     return {
//     //       id: artist.id,
//     //       name: artist.name,
//     //       related_artists_scored: artistsToCompareTo
//     //         .map((artistToCompareTo: IArtistWithRelatedAndDetails) => {
//     //           return {
//     //             id: artistToCompareTo.id,
//     //             name: artistToCompareTo.name,
//     //             related_score: artistToCompareTo.related_artists.findIndex(
//     //               (ar: SpotifyApi.ArtistObjectFull) => ar.id === artist.id
//     //             ),
//     //           };
//     //         })
//     //         .sort((a: IRelatedArtistsScored, b: IRelatedArtistsScored) => a.related_score - b.related_score),
//     //     };
//     //   }
//     // );

//   // async getRelatedArtists(artistId: string): Promise<SpotifyApi.ArtistsRelatedArtistsResponse> {
//   //   return spotifyApi.getArtistRelatedArtists(artistId);
//   // }

//   // async getRelatedArtistsOfList(artistIds: string[]): Promise<SpotifyApi.ArtistsRelatedArtistsResponse[]> {
//   //   return Promise.all(artistIds.map((artistId: string) => this.getRelatedArtists(artistId)));
//   // }

//   async getArtists(artistsIds: string[]): Promise<SpotifyApi.MultipleArtistsResponse> {
//     const GET_ARTISTS_MAX = 50;
//     const artistResponsesChunkedUp: Promise<SpotifyApi.MultipleArtistsResponse>[] = chunk(
//       artistsIds,
//       GET_ARTISTS_MAX,
//     ).map((artistChunk: string[]) => spotifyApi.getArtists(artistChunk));
//     const allPromises: SpotifyApi.MultipleArtistsResponse[] = await Promise.all(artistResponsesChunkedUp);

//     return allPromises.reduce(
//       (acc: SpotifyApi.MultipleArtistsResponse, curr: SpotifyApi.MultipleArtistsResponse) => {
//         acc.artists = [...(acc.artists || []), ...curr.artists];
//         return acc;
//       },
//       { artists: [] },
//     );
//   }
// export interface ITrack {
//   name: string;
//   preview_url: string;
//   id: string;
//   duration_ms: number;
//   artists: string[];
//   album_name: string;
//   added_at: string;
//   release_date: string;
//   image_url: string;

//   acousticness: number;
//   danceability: number;
//   energy: number;
//   instrumentalness: number;
//   key: number;
//   liveness: number;
//   loudness: number;
//   mode: number;
//   speechiness: number;
//   tempo: number;
//   time_signature: number;
//   valence: number;

//   app_url: string;
//   web_url: string;

//   uri: string;
// }
