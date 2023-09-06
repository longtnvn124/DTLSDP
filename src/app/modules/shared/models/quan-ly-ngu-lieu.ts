import {OvicFile} from "@core/models/file";
import {LoaiNguLieu} from "@shared/models/danh-muc";

export interface NguLieuChung {
  id: number;
  title: string;
  mota: string;
  is_deleted: number; //1: deleted; 0: not deleted
  deleted_by: number;
  created_by: number;
  updated_by: number;
  created_at: string; // sql timestamp
  updated_at: string; // sql timestamp
}

export interface Ngulieu extends NguLieuChung {
  loaingulieu: LoaiNguLieu;
  linhvuc: number;
  chuyenmuc: string;
  diemditich_ids: number[];
  donvi_id: number;
  file_media?: OvicFile[];
  file_audio?: OvicFile[];
}

export interface SuKien extends NguLieuChung {
  diemditich_ids: number[];
  thoigian_batdau: string;
  thoigian_ketthuc: string;
  files: OvicFile;
  nhanvat_ids: number[];
  donvi_id: number;
  ngulieu_ids: NguLieuSuKien[];
  file_audio:OvicFile[];
}

export interface NguLieuSuKien {
  id: number;
  title: string;
  file_media: OvicFile;
}
