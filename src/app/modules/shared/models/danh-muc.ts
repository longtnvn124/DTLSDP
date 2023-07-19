import {OvicFile} from "@core/models/file";

export interface DmChung {
  is_deleted: number; //1: deleted; 0: not deleted
  deleted_by: number;
  created_by: number;
  updated_by: number;
  created_at: string; // sql timestamp
  updated_at: string; // sql timestamp
}

export interface DmLinhVuc extends DmChung {
  id: number;
  ten: string;
  kyhieu: string;// viet tat
  mota: string;
  status: number; //1 Active; 0: inactive
}

export interface DmLoaiNguLieu extends DmChung {
  id: number;
  ten: string;
  mota: string;
  donvi_id:number;
  kihieu: string;
  status: number; //1 Active; 0: inactive
}

export interface DmChuyenMuc extends DmChung {
  id: number;
  ten: string;
  mota: string;
  status: number; //1 Active; 0: inactive
}

export interface DmNhanVatLichSu extends DmChung {
  id: number;
  ten: string;
  bietdanh: string;
  mota: string;
  nam: string;
  gioitinh: number;
  files: OvicFile;
}

export interface DmDiemDiTich extends DmChung {
  id: number;
  ten: string;
  mota: string;
  vitri_ggmap: string;
  file_media: OvicFile[];
  status: number; //1 Active; 0: inactive
  total_ngulieu?:number;
}


export interface DonVi {
  id: number;
  title: string;
  parent_id: number; //Đơn vị cấp trên ID
  description: string;
  status: number; //1 Active; 0: inactive
}
