import {OvicFile} from "@core/models/file";

export interface NguLieuChung {
  id:number;
  title:string;
  mota:string;
  is_deleted: number; //1: deleted; 0: not deleted
  deleted_by: number;
  created_by: number;
  updated_by: number;
  created_at: string; // sql timestamp
  updated_at: string; // sql timestamp
}
export interface DsNgulieu extends NguLieuChung{
  loaingulieu:string[];
  linhvuc:string;
  chuyenmuc:string;
  diemditich_id:number;
  file_media?:OvicFile[];
  file_audio?:OvicFile[];
}

export interface DsSuKien extends NguLieuChung {

  diemditich_id:number;
  linhvuc:string;
  thoigian_batdau: string;
  thoigian_ketthuc: string;
  file_quyetdinh: OvicFile[];

}
