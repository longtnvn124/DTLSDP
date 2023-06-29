import { Component, OnInit } from '@angular/core';
import {MenuItem} from "primeng/api/menuitem";

@Component({
  selector: 'app-danh-sach-ngu-lieu',
  templateUrl: './danh-sach-ngu-lieu.component.html',
  styleUrls: ['./danh-sach-ngu-lieu.component.css']
})
export class DanhSachNguLieuComponent implements OnInit {
  items: MenuItem[] = [
    {
      label: 'Thêm vị trí',
      icon: 'pi pi-plus',
    },
    {
      label: 'Cập nhật vị trí',
      icon: 'pi pi-file-edit',
    },
    {
      label: 'Xoá vị trí',
      icon: 'pi pi-trash',
    },
  ];
  constructor() { }

  ngOnInit(): void {
  }

}
