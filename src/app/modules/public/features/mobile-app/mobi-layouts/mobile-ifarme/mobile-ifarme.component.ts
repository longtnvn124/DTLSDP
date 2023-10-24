import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {CONG_THONG_TIN} from "@shared/utils/syscat";

@Component({
  selector: 'app-mobile-ifarme',
  templateUrl: './mobile-ifarme.component.html',
  styleUrls: ['./mobile-ifarme.component.css']
})
export class MobileIfarmeComponent implements OnInit {

  url: string;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    const id: number = this.activatedRoute.snapshot.queryParamMap.has('param') ? parseInt(this.activatedRoute.snapshot.queryParamMap.get('param'), 10) : NaN;
    const congThongTin = !Number.isNaN(id) ? CONG_THONG_TIN.find(t => t.id === id) : null;
    if (congThongTin) {
      this.url = congThongTin.url;
    }
  }

}
