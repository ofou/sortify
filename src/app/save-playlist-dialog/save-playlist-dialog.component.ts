import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SpotifyWebApiService } from '../services/spotify-web-api.service';
import { StateService } from '../services/state.service';

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

export interface IUpdatedPlaylistDetails {
  name: string;
  description?: string;
}

function noWhitespaceValidator(control: FormControl) {
  return (control.value || '').trim().length !== 0 ? undefined : { whitespace: true };
}

@Component({
  selector: 'sort-save-playlist-dialog',
  templateUrl: './save-playlist-dialog.component.html',
  styleUrls: ['./save-playlist-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavePlaylistDialogComponent {
  playlistNameFC = new FormControl(this.data.playlistName, [Validators.required, noWhitespaceValidator]);
  playlistDescriptionFC = new FormControl(this.data.playlistDescription);
  writeMode: keyof typeof EWriteMode = this.data.ownsPlaylist ? EWriteMode.overWrite : EWriteMode.createNew;
  error: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<SavePlaylistDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ISavePlaylistDialogData,
    private spotifyWebApiService: SpotifyWebApiService,
    public _stateService: StateService,
    private router: Router,
  ) {}

  get writeModes(): string[] {
    return this.data.ownsPlaylist ? Object.keys(EWriteMode) : [EWriteMode.createNew];
  }

  get overWrite(): boolean {
    return this.writeMode === EWriteMode.overWrite;
  }

  get createNew(): boolean {
    return this.writeMode === EWriteMode.createNew;
  }

  get explanation(): string {
    if (this.data.ownsPlaylist) {
      return 'The playlist can be overwritten or a new playlist can be created';
    }
    return 'A new playlist will be created since you are not the owner of this playlist';
  }

  writeModeDescription(writeMode: EWriteMode): string {
    switch (writeMode) {
      case EWriteMode.overWrite:
        return 'Overwrite playlist';
      case EWriteMode.createNew:
        return 'Create a new playlist';
    }
  }

  async createNewPlaylist(): Promise<void> {
    this.error = false;
    this._stateService.setLoading(true);

    try {
      const { id }: SpotifyApi.CreatePlaylistResponse = await this.spotifyWebApiService.createPlaylist(
        this.playlistNameFC.value,
        this.data.tracks,
      );

      if (this.data.playlistDescription) {
        await this.spotifyWebApiService.updatePlaylistDetails(id, { description: this.data.playlistDescription });
      }

      await this.router.navigate(['playlist', id]);
      this.dialogRef.close();
      this._stateService.setSuccess('New playlist created!');
    } catch (error) {
      this.error = true;
      this._stateService.setError('Failed to create new playlist', error);
    }
    this._stateService.setLoading(false);
  }

  async overwritePlaylist(): Promise<void> {
    this.error = false;
    this._stateService.setLoading(true);

    try {
      const updatedDetails: IUpdatedPlaylistDetails = {
        name: this.playlistNameFC.value,
      };

      if (this.data.playlistDescription) {
        updatedDetails.description = this.data.playlistDescription;
      }

      await Promise.all([
        this.spotifyWebApiService.updatePlaylist(this.data.playlistId, this.data.tracks),
        this.spotifyWebApiService.updatePlaylistDetails(this.data.playlistId, updatedDetails),
      ]);

      this.dialogRef.close(updatedDetails);
      this._stateService.setSuccess('Playlist saved!');
    } catch (error) {
      this.error = true;
      this._stateService.setError('Failed to save playlist', error);
    }
    this._stateService.setLoading(false);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
