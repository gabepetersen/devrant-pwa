import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Image, Comment } from 'ts-devrant';
import dayjs from 'dayjs';
import { getImageURL } from 'ts-devrant';

@Component({
  selector: 'app-inline-profile',
  templateUrl: './inline-profile.component.html',
  styleUrls: ['./inline-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InlineProfileComponent implements OnInit {

  @Input()
  profile: Comment

  humanReadableTime: string;
  imageUrl: string;

  constructor() { }

  noBubble(event: Event) {
    event.stopImmediatePropagation();
  }

  ngOnInit(): void {
    this.imageUrl = getImageURL(this.profile.user_avatar.i);
    if (this.profile.created_time) {
      this.humanReadableTime = dayjs(this.profile.created_time * 1000).fromNow()
        .replace('hours', 'h')
        .replace('minutes', 'm')
        .replace(/\s+(\w)/, '$1')
    }
  }

}
