import {AfterViewInit, Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild} from '@angular/core';
import {interval} from "rxjs";


export interface Galleria_img {
  itemImageSrc: string,
  thumbnailImageSrc: string,
  alt: string,
  title: string
}

@Component({
  selector: 'app-web-home',
  templateUrl: './web-home.component.html',
  styleUrls: ['./web-home.component.css']
})


export class WebHomeComponent implements OnInit,AfterViewInit {

  @ViewChild('slider', {static: true}) slider: ElementRef<HTMLDivElement>;
  @HostListener('window:scroll', []) onWindowScroll() {
    const header = document.getElementById('header');
    if (window.pageYOffset > 100) {
      this.renderer.addClass(header, 'header-scrolled');
    } else {
      this.renderer.removeClass(header, 'header-scrolled');
    }
  }

  slides = [
    {index:1,img: '/assets/slide/slide1.jpg'},
    {index:2,img: '/assets/slide/slide2.jpg',}
  ];


  index=0;
  mode: "CHUYENMUC" | "DANNHMUC_NGULIEUSO" | "NHANVAT" | "SUKIEN_TONGHOP" | "SEARCH" | "THONGTIN" | "HOME" = "HOME";
  slideIndex = 0;

  constructor(private renderer: Renderer2) {}
  ngOnInit(): void {}
  ngAfterViewInit(): void {}



}
