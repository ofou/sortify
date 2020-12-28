import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialModule } from '../material.module';
import { TinyMusicPlayerComponent } from '../tiny-music-player/tiny-music-player.component';

@NgModule({
  declarations: [TinyMusicPlayerComponent],
  imports: [BrowserModule, MaterialModule],
  exports: [TinyMusicPlayerComponent],
})
export class TinyMusicPlayerModule {}
