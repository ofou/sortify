import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SpotifyWebApiService } from '../services/spotify-web-api.service';
import { StateService } from '../state/state.service';

export interface ISavePlaylistDialogData {
  ownsPlaylist: boolean;
  playlistId: string;
  tracks: string[];
  playlistName: string;
  playlistDescription: string;
}

enum EWriteMode {
  'overWrite' = 'overWrite',
  'createNew' = 'createNew',
}

@Component({
  selector: 'sort-save-playlist-dialog',
  templateUrl: './save-playlist-dialog.component.html',
  styleUrls: ['./save-playlist-dialog.component.scss'],
})
export class SavePlaylistDialogComponent implements OnInit {
  playlistNameFC = new FormControl('', [Validators.required]);
  writeMode: keyof typeof EWriteMode = this.data.ownsPlaylist ? EWriteMode.overWrite : EWriteMode.createNew;

  constructor(
    private dialogRef: MatDialogRef<SavePlaylistDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ISavePlaylistDialogData,
    private spotifyWebApiService: SpotifyWebApiService,
    private matSnackBar: MatSnackBar,
    private _stateService: StateService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.playlistNameFC.setValue(this.data.playlistName);
  }

  get writeModes(): string[] {
    return this.data.ownsPlaylist ? Object.keys(EWriteMode) : [EWriteMode.createNew];
  }

  get overWrite(): boolean {
    return this.writeMode === EWriteMode.overWrite;
  }

  get createNew(): boolean {
    return this.writeMode === EWriteMode.createNew;
  }

  get description(): string {
    if (this.data.ownsPlaylist) {
      return 'The playlist can be overwritten or a new playlist can be created';
    }
    return 'A new playlist will be created since you are not the owner of this playlist';
  }

  get loading(): boolean {
    return this._stateService.loading;
  }

  writeModeDescription(writeMode: EWriteMode): string {
    switch (writeMode) {
      case EWriteMode.overWrite:
        return 'Overwrite playlist';
      case EWriteMode.createNew:
        return 'Create a new playlist';
    }
  }
  async save(): Promise<void> {
    this._stateService.setLoading(true);
    if (this.createNew) {
      const { id }: SpotifyApi.CreatePlaylistResponse = await this.spotifyWebApiService.createPlaylist(
        this.playlistNameFC.value,
        this.data.tracks,
      );
      await this.spotifyWebApiService.updatePlaylistDetails(id, { description: this.data.playlistDescription });
      await this.router.navigate(['playlist', id]);
    } else {
      await Promise.all([
        this.spotifyWebApiService.updatePlaylist(this.data.playlistId, this.data.tracks),
        this.spotifyWebApiService.updatePlaylistDetails(this.data.playlistId, {
          name: this.playlistNameFC.value,
          description: this.data.playlistDescription,
        }),
      ]);
    }
    this.dialogRef.close(true);
    this._stateService.setLoading(false);
    this.matSnackBar.open('Saved!');
  }
  cancel(): void {
    this.dialogRef.close(false);
  }
}
