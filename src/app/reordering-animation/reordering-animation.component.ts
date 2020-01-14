import { Component, OnInit } from '@angular/core';
import { shuffle } from 'lodash-es';

const NUMBER_OF_DEMO_ITEMS = 10;

interface IReorderItem {
  index: number;
}

@Component({
  selector: 'sort-reordering-animation',
  templateUrl: './reordering-animation.component.html',
  styleUrls: ['./reordering-animation.component.scss'],
})
export class ReorderingAnimationComponent implements OnInit {
  reorderingItems: IReorderItem[] = Array.from(Array(NUMBER_OF_DEMO_ITEMS).keys()).map((index: number) => ({ index }));

  ngOnInit() {
    setInterval(() => {
      const order: number[] = shuffle(Array.from(Array(NUMBER_OF_DEMO_ITEMS).keys()));
      this.reorderingItems.forEach((item: IReorderItem, index: number) => {
        item.index = order[index];
      });
    }, 2000);
  }

  getTop(index: number): number {
    return (index / NUMBER_OF_DEMO_ITEMS) * 100;
  }
}
