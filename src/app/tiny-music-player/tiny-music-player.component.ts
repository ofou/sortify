import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { fromEvent, interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'sort-tiny-music-player',
  templateUrl: './tiny-music-player.component.html',
  styleUrls: ['./tiny-music-player.component.scss'],
})
export class TinyMusicPlayerComponent {
  @Input() isPlaying: boolean = false;
  @Input() disabled = false;
  @Input() currentTime = 0;
  @Input() duration = 0;
  @Output() play = new EventEmitter();
  @Output() stop = new EventEmitter();

  get playTime(): number {
    if (this.currentTime && this.duration) {
      return (this.currentTime / this.duration) * 100;
    }
    return 0;
  }
}
