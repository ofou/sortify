import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SpotifyWebApiService } from '../services/spotify-web-api.service';
import { StateService } from '../services/state.service';

export interface IDeletePlaylistDialogData {
  playlistId: string;
}

@Component({
  selector: 'sort-delete-playlist-dialog',
  templateUrl: './delete-playlist-dialog.component.html',
  styleUrls: ['./delete-playlist-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeletePlaylistDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<DeletePlaylistDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: IDeletePlaylistDialogData,
    private spotifyWebApiService: SpotifyWebApiService,
    public _stateService: StateService,
    private router: Router,
  ) {}

  cancel(): void {
    this.dialogRef.close(false);
  }

  async delete(): Promise<void> {
    this._stateService.setLoading(true);
    try {
      await this.spotifyWebApiService.deletePlaylist(this.data.playlistId);
      this._stateService.setSuccess('Playlist deleted!');
      await this.router.navigate(['/']);
      this.dialogRef.close(true);
    } catch (error) {
      this._stateService.setError('Failed to delete playlist', error);
    }
    this._stateService.setLoading(false);
  }
}
