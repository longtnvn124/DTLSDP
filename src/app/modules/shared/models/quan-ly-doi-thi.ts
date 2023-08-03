export interface ThongTinChung{
  id:number;
  is_deleted: number; //1: deleted; 0: not deleted
  deleted_by: number;
  created_by: number;
  updated_by: number;
  created_at: string; // sql timestamp
  updated_at: string; // sql timestamp
}
export interface shift extends ThongTinChung{
  title:string;
  bank_id:number;
  name:string;
  desc:string;
  time_start:string;
  time_end:string;
}

export interface shift_tests extends ThongTinChung{
  user_id:number;
  shift_id:number;
  details:[];
  time_start:string;
  time_end:string;
  time:number;
  question_ids:[];//array danh sách quesion
  number_corect:number;//số câu trả lời đúng
  score:number;//điểm hệ số 10
  state:0|1|2|-1;//0: chưa thi 1:đang thi 2:đã thi xong -1:bỏ thi
}

// 'shift': {
//   'table': 'shift'
// },
// 'shift-tests': {
//   'table': 'shift_tests'
// },
