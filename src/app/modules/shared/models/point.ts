import {OvicFile} from "@core/models/file";

export interface Pinable {
  id: number;
  icon: string;
  title: string;
  loaingulieu: string[];
  location: number[]; // vi tri vector3
  type: string; //DIRECT | INFO
  file_media: OvicFile[]; // ảnh 360 | video360
  file_audio: OvicFile[]; // audio thuyết minh
  mota: string;
  parent_id: number;
}

export interface Point extends Pinable {

  is_deleted: number; //1: deleted; 0: not deleted
  deleted_by: number;
  created_by: number;
  updated_by: number;
  created_at: string; // sql timestamp
  updated_at: string; // sql timestamp
}
