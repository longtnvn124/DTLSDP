import { OvicFile } from "@core/models/file";
export interface KhoiCumThiDua {
  id: number;
  ten: string;
  loai: string;
  status: number;
  files: OvicFile[];
  is_deleted: 0 | 1;
  created_at: string; // sql timestamp
  updated_at: string; // sql timestamp
  created_by: number;
  updated_by: number;

}
export interface KhoiCum_ThanhVien {
  id: number;
  khoicum_id: number;
  donvi_id: number;
  thanhvien_id: number;
  ten_thanhvien:string;
  phanloai:string;
  ten_donvi: string;

  is_deleted: 0 | 1;
  created_at: string; // sql timestamp
  updated_at: string; // sql timestamp
  created_by: number;
  updated_by: number;
}
export interface KhoiCum_TieuChi{
  id: number;
  stt: string;
  tieuchi_id:string;
  khoicum_id: number;
  ten: string;
  parent_id: string;
  mota: string;
  diem: number;
  nam:number;
  pp_tinhdiem:number;
  is_deleted: 0 | 1;
  created_at: string; // sql timestamp
  updated_at: string; // sql timestamp
  created_by: number;
  updated_by: number;
}

export interface KhoiCum_Ketqua_ThiDua{
  id: number;
  khoicum_id:number;
  tieuchi_id:string;
  donvi_id:number;
  diem_tdg: number;
  diem_binhxet: number;
  nam_danhgia:number;
  is_deleted: 0 | 1;

  lock_ketqua: 0 | 1;
  created_at: string; // sql timestamp
  updated_at: string; // sql timestamp
  created_by: number;
  updated_by: number;
}

