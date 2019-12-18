import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  constructor(private matSnackBar: MatSnackBar) {}

  private readonly userProfileSubject: BehaviorSubject<SpotifyApi.CurrentUsersProfileResponse> = new BehaviorSubject<
    SpotifyApi.CurrentUsersProfileResponse
  >(undefined);

  readonly userProfile$: Observable<SpotifyApi.CurrentUsersProfileResponse> = this.userProfileSubject.asObservable();

  private readonly loadingSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  get userProfile(): SpotifyApi.CurrentUsersProfileResponse {
    return this.userProfileSubject.getValue();
  }

  set userProfile(userProfile: SpotifyApi.CurrentUsersProfileResponse) {
    this.userProfileSubject.next(userProfile);
  }

  setUserProfile(userProfile: SpotifyApi.CurrentUsersProfileResponse): void {
    this.userProfile = userProfile;
  }

  resetUserProfile(): void {
    this.userProfile = undefined;
  }

  get loading(): boolean {
    return this.loadingSubject.getValue();
  }

  set loading(loading: boolean) {
    setTimeout(() => {
      this.loadingSubject.next(loading);
    });
  }

  setLoading(loading: boolean): void {
    this.loading = loading;
  }

  setError(errorSummary: string, errorObject: any): void {
    this.matSnackBar.open(`${errorSummary} :(`);
    console.error(errorObject);
  }
}
