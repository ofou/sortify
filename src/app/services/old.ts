// const topPlaylists: SpotifyApi.PlaylistTrackResponse[] = await this.spotifyWebApiService.getTopSongsPlaylists();

// const topPlaylistsArtists: Dictionary<
//   SpotifyApi.PlaylistTrackObject[]
// >[] = topPlaylists.map((playlist: SpotifyApi.PlaylistTrackResponse) =>
//   groupBy(playlist.items, (item: SpotifyApi.PlaylistTrackObject) => item.track.artists[0].id),
// );
// console.log(topPlaylistsArtists);
// const sorted: string[][] = topPlaylistsArtists.map(
//   (playlistArtists: Dictionary<SpotifyApi.PlaylistTrackObject[]>, index: number) =>
//     Object.keys(playlistArtists).sort(
//       (artistA: string, artistB: string) =>
//         topPlaylistsArtists[index][artistB].length - topPlaylistsArtists[index][artistA].length,
//     ),
// );
// const map: any = sorted.map((artists: string[], index: number) =>
//   artists.map((artist: string) => [artist, topPlaylistsArtists[index][artist].length]),
// );
// console.log(map);

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
