import {OvicFile} from "@core/models/file";

export interface Pinable {
  id: number;
  icon: string;
  title: string;
  mota:string;
  location: number[]; // vi tri vector3
  type: string; //DIRECT | INFO
  parent_id: number;
  donvi_id:number;
  ds_ngulieu: OvicFile[]; //danh sách audio,hảnh 360 | video360

}

export interface Point extends Pinable {

  is_deleted: number; //1: deleted; 0: not deleted
  deleted_by: number;
  created_by: number;
  updated_by: number;
  created_at: string; // sql timestamp
  updated_at: string; // sql timestamp
}
