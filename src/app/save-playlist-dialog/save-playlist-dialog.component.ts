import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StateService } from '../state/state.service';
import { SpotifyWebApiService } from '../services/spotify-web-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

export interface ISavePlaylistDialogData {
  saveAs: boolean;
  playlistId: string;
  tracks: string[];
}

@Component({
  selector: 'sort-save-playlist-dialog',
  templateUrl: './save-playlist-dialog.component.html',
  styleUrls: ['./save-playlist-dialog.component.scss'],
})
export class SavePlaylistDialogComponent {
  playlistNameFC = new FormControl('', [Validators.required]);
  constructor(
    private dialogRef: MatDialogRef<SavePlaylistDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: ISavePlaylistDialogData,
    private spotifyWebApiService: SpotifyWebApiService,
    private matSnackBar: MatSnackBar,
    private _stateService: StateService,
    private router: Router,
  ) {}

  cancel(): void {
    this.dialogRef.close(false);
  }

  async save(): Promise<void> {
    this._stateService.setLoading(true);
    if (this.saveAs) {
      const { id }: SpotifyApi.CreatePlaylistResponse = await this.spotifyWebApiService.createPlaylist(
        this.playlistNameFC.value,
        this.data.tracks,
      );

      await this.router.navigate(['playlist', id]);
    } else {
      await this.spotifyWebApiService.updatePlaylist(this.data.playlistId, this.data.tracks);
    }
    this.dialogRef.close(true);
    this._stateService.setLoading(false);
    this.matSnackBar.open('Saved!');
  }

  get saveAs(): boolean {
    return this.data.saveAs;
  }

  get title(): string {
    if (this.saveAs) {
      return 'Save playlist as';
    }
    return 'Save playlist';
  }

  get description(): string {
    if (this.saveAs) {
      return 'Enter name to save playlist as.';
    }
    return 'Are you sure you want to save the playlist?';
  }

  get loading(): boolean {
    return this._stateService.loading;
  }
}
