import { AbstractControl , ValidationErrors , ValidatorFn } from '@angular/forms';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap/modal/modal-config';

export const FULL_SIZE_MODAL_OPTIONS : NgbModalOptions = {
  scrollable  : true ,
  size        : 'xl' ,
  windowClass : 'modal-xxl ovic-modal-class ovic-modal-full-size' ,
  centered    : true
};

export const LARGE_MODAL_OPTIONS : NgbModalOptions = {
  scrollable  : true ,
  size        : 'xl' ,
  windowClass : 'modal-xxl ovic-modal-class' ,
  centered    : true
};

export const DEFAULT_MODAL_OPTIONS : NgbModalOptions = {
  size        : 'lg' ,
  backdrop    : 'static' ,
  centered    : true ,
  windowClass : 'ovic-modal-class'
};

export const NORMAL_MODAL_OPTIONS : NgbModalOptions = {
  size        : 'md' ,
  backdrop    : 'static' ,
  centered    : true ,
  windowClass : 'ovic-modal-class'
};

export const NORMAL_MODAL_OPTIONS_ROUND : NgbModalOptions = {
  size        : 'md' ,
  backdrop    : 'static' ,
  centered    : true ,
  windowClass : 'ovic-modal-class ovic-modal--rounded'
};

export const SM_MODAL_OPTIONS : NgbModalOptions = {
  size        : 'sm' ,
  backdrop    : 'static' ,
  centered    : true ,
  windowClass : 'ovic-modal-class'
};

export const DEFAULT_MODAL_OPTIONS_NO_BACKDROP : NgbModalOptions = {
  size        : 'lg' ,
  centered    : true ,
  windowClass : 'ovic-modal-class'
};

export const DanToc = [
  { name : 'kinh' , label : 'Kinh' } ,
  { name : 'tay' , label : 'Tày' } ,
  { name : 'thai' , label : 'Thái' } ,
  { name : 'muong' , label : 'Mường' } ,
  { name : 'nung' , label : 'Nùng' } ,
  { name : 'dao' , label : 'Dao' } ,
  { name : 'h-mong' , label : 'H\'mông' } ,
  { name : 'khmer' , label : 'Khmer' } ,
  { name : 'gia-rai' , label : 'Gia Rai' } ,
  { name : 'ede' , label : 'Ê Đê' } ,
  { name : 'bana' , label : 'Ba Na' } ,
  { name : 'xo-dang' , label : 'Xơ Đăng' } ,
  { name : 'san-chay' , label : 'Sán Chay' } ,
  { name : 'co-ho' , label : 'Cơ Ho' } ,
  { name : 'hoa' , label : 'Hoa' } ,
  { name : 'cham' , label : 'Chăm' } ,
  { name : 'san-diu' , label : 'Sán Dìu' } ,
  { name : 'tho' , label : 'Thổ' } ,
  { name : 'hre' , label : 'Hrê' } ,
  { name : 'ra-gia' , label : 'Ra Glai' } ,
  { name : 'm-nong' , label : 'M\'Nông' } ,
  { name : 'x-tieng' , label : 'X\'Tiêng' } ,
  { name : 'bru-van-kieu' , label : 'Bru-Vân Kiều' } ,
  { name : 'kho-mu' , label : 'Khơ Mú' } ,
  { name : 'co-tu' , label : 'Cơ Tu' } ,
  { name : 'giay' , label : 'Giáy' } ,
  { name : 'gie-trieng' , label : 'Giẻ Triêng' } ,
  { name : 'ta-oi' , label : 'Tà Ôi' } ,
  { name : 'ma' , label : 'Mạ' } ,
  { name : 'co' , label : 'Co' } ,
  { name : 'cho-ro' , label : 'Chơ Ro' } ,
  { name : 'xinh-mun' , label : 'Xinh Mun' } ,
  { name : 'ha-nhi' , label : 'Hà Nhì' } ,
  { name : 'chu-ru' , label : 'Chu Ru' } ,
  { name : 'lao' , label : 'Lào' } ,
  { name : 'khang' , label : 'Kháng' } ,
  { name : 'la-chi' , label : 'La Chí' } ,
  { name : 'phu-la' , label : 'Phù Lá' } ,
  { name : 'la-hu' , label : 'La Hủ' } ,
  { name : 'la-ha' , label : 'La Ha' } ,
  { name : 'pa-then' , label : 'Pà Thẻn' } ,
  { name : 'chut' , label : 'Chứt' } ,
  { name : 'lu' , label : 'Lự' } ,
  { name : 'lo-lo' , label : 'Lô Lô' } ,
  { name : 'mang' , label : 'Mảng' } ,
  { name : 'co-lao' , label : 'Cờ Lao' } ,
  { name : 'bo-y' , label : 'Bố Y' } ,
  { name : 'cong' , label : 'Cống' } ,
  { name : 'ngay' , label : 'Ngái' } ,
  { name : 'si-la' , label : 'Si La' } ,
  { name : 'pu-peo' , label : 'Pu Péo' } ,
  { name : 'ro-mam' , label : 'Rơ măm' } ,
  { name : 'brau' , label : 'Brâu' } ,
  { name : 'o-du' , label : 'Ơ Đu' }
];

export const TonGiaoVietNam = [
  { name : 'khong' , label : 'Không' } ,
  { name : 'phat-giao' , label : 'Phật giáo' } ,
  { name : 'hoi-giao' , label : 'Hồi giáo' } ,
  { name : 'bahai' , label : 'Bahai' } ,
  { name : 'cong-giao' , label : 'Công giáo' } ,
  { name : 'tin-lanh' , label : 'Tin lành' } ,
  { name : 'mac-mon' , label : 'Mặc môn' } ,
  { name : 'phat-giao-hoa-hao' , label : 'Phật giáo Hòa Hảo' } ,
  { name : 'cao-dai' , label : 'Cao Đài' } ,
  { name : 'buu-son-ky-huong' , label : 'Bửu Sơn Kỳ Hương' } ,
  { name : 'tinh-do-cu-si-phat-hoi' , label : 'Tịnh Độ Cư Sĩ Phật Hội' } ,
  { name : 'tu-an-hieu-nghia' , label : 'Tứ Ân Hiếu Nghĩa' } ,
  { name : 'phat-duong-nam-tong-minh-su-dao' , label : 'Phật Đường Nam Tông Minh Sư Đạo' } ,
  { name : 'minh-ly-dao-tam-tong-mieu' , label : 'Minh Lý Đạo Tam Tông Miếu' } ,
  { name : 'ba-la-mon-kho-me' , label : 'Bà la môn Khơ me' } ,
  { name : 'phat-giao-hieu-nghia-ta-lon' , label : 'Phật giáo Hiếu Nghĩa Tà Lơn' }
];

export const FileType = new Map( [
  [ 'application/vnd.google-apps.folder' , 'folder' ] ,
  [ 'audio/mpeg' , 'mp3' ] ,
  [ 'audio/mp3' , 'mp3' ] ,
  [ 'audio/x-aac' , 'x-aac' ] ,
  [ 'application/zip' , 'zip' ] ,
  [ 'application/x-zip-compressed' , 'zip' ] ,
  [ 'application/x-rar-compressed' , 'rar' ] ,
  [ 'application/x-7z-compressed' , 'zip' ] ,
  [ 'application/msword' , 'doc' ] ,
  [ 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' , 'docx' ] ,
  [ 'application/vnd.ms-powerpoint' , 'ppt' ] ,
  [ 'application/vnd.openxmlformats-officedocument.presentationml.presentation' , 'pptx' ] ,
  [ 'application/vnd.ms-excel' , 'xls' ] ,
  [ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' , 'xlsx' ] ,
  [ 'application/vnd.google-apps.spreadsheet' , 'xlsx' ] ,
  [ 'application/pdf' , 'pdf' ] ,
  [ 'video/x-msvideo' , 'video' ] ,
  [ 'video/mp4' , 'mp4' ] ,
  [ 'image/png' , 'img' ] ,
  [ 'image/jpeg' , 'img' ] ,
  [ 'image/jpg' , 'img' ] ,
  [ 'image/gif' , 'img' ] ,
  [ 'text/plain' , 'text' ]
] );


export const AppValidators = {
  arrayInput : {
    needInputAtLeast : ( length : number ) : ValidatorFn => ( control : AbstractControl ) : ValidationErrors | null => ( control.value && Array.isArray( control.value ) && control.value.length >= length ) ? null : { notValidLength : 'content does not meet the minimum content requirements' }
  }
};

export const TypeOptions : { value : string, label : string }[] = [
  { value : 'DIRECT' , label : 'Chuyển cảnh' } ,
  { value : 'INFO' , label : 'Thông tin' }
];

export const MAXIMIZE_MODAL_OPTIONS : NgbModalOptions = {
  scrollable  : true ,
  size        : 'xl' ,
  windowClass : 'modal-maximize ovic-modal-class' ,
  centered    : true
};

export const TYPE_FILE_LIST        = {
  docx  : 'docx' ,
  pptx  : 'pptx' ,
  ppt   : 'ppt' ,
  pdf   : 'pdf' ,
  xlsx  : 'xlsx' ,
  audio : 'audio' ,
  video : 'video' ,
  image : 'image' ,
  text  : 'text' ,
  zip   : 'zip'
};
export const OvicVideoSourceObject = {
  local       : 'local' ,
  serverFile  : 'serverFile' ,
  vimeo       : 'vimeo' ,
  youtube     : 'youtube' ,
  googleDrive : 'googleDrive' ,
  encrypted   : 'encrypted' ,
  serverAws   : 'serverAws'
};
export const VIDEO_SOURCE          = [
  { name : 'Youtube' , key : 'youtube' } ,
  { name : 'Server Files' , key : 'serverFile' }
];

export const WAITING_POPUP : NgbModalOptions = {
  scrollable  : true ,
  size        : 'xl' ,
  windowClass : 'modal-xxl ovic-modal-class' ,
  centered    : true ,
  backdrop    : 'static'
};

export const WAITING_POPUP_SPIN : NgbModalOptions = {
  scrollable  : true ,
  size        : 'xl' ,
  windowClass : 'modal-xxl ovic-modal-class popup-spin' ,
  centered    : true ,
  backdrop    : 'static'
};

export const KEY_NAME_CONTESTANT_ID : string = 'contestant';

export const KEY_NAME_CONTESTANT_PHONE : string = 'contestantPhone';

export const KEY_NAME_SHIFT_ID : string = 'shift_id';

export const  CONG_THONG_TIN:{id:number,url:string, img:string}[]=[
  {
    id:1,url:'https://thainguyen.gov.vn',img:'assets/svg/cthainguyen.svg'
  },
  {
    id:2,url:'https://thainguyen.dcs.vn',img:'assets/svg/Cobualiem.svg'
  },
  {
    id:3,url:'',img:'assets/svg/UBNDtinh.svg'
  },
  {
    id:4,url:'https://tuyengiaothainguyen.org.vn/',img:'assets/svg/bantuyengiao.svg'
  },
]
export const MODULES_QUILL:any={
  imageResize : {
    displaySize : true ,
    modules     : [ 'Resize' , 'DisplaySize' , 'Toolbar' ]
  }
}

export const TYPE_FILE_IMAGE:string[] = ['image/png', 'image/gif','image/jpeg', 'image/bmp',' image/x-icon'];
export const TYPE_FILE_VIDEO:string[] = ['video/mp4', 'image/gif', 'image/jpeg', 'image/bmp', 'image/x-icon'];
export const TYPE_FILE_SCORM:string[] = ['application/zip', 'application/x-zip-compressed', 'application/x-7z-compressed' ,];
