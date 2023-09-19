import {OvicFile} from "@core/models/file";


export interface ChuyenDe {
  id: number;
  title:string;
  parent_id:number;
  type:'LESSON' | 'TEST';
  desc:string;
  video:OvicFile[];
  audio:OvicFile[];
  documents:OvicFile[] ;// text COLLATE utf8_unicode_ci DEFAULT NULL //COMMENT 'json: link file tai lieu, bai tap',
  ordering: number;// int(11) DEFAULT 1000,
  status:number ;// tinyint(4) DEFAULT 0 COMMENT '-1: delete; 0: inactive; 1: active',

}

export interface ChuyenDeDB extends ChuyenDe {

  is_deleted: number; //1: deleted; 0: not deleted
  deleted_by: number;
  created_by: number;
  updated_by: number;
  created_at: string; // sql timestamp
  updated_at: string; // sql timestamp
}
