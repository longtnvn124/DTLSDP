import { SimpleRole } from '@core/models/auth';

export const environment = {
	production : true
};

const realm       = 'DTLSDP';
const host        = [ 'h' , 't' , 't' , 'p' , 's' , ':' , '/' , '/' , 'a' , 'p' , 'i' , '-' , 'd' , 'e' , 'v' , '.' , 'i' , 'c' , 't' , 'u' , '.' , 'v' , 'n' ];
const port        = '10091';
const port_socket = '10092';
const ws_url      = [ 'w' , 's' , 's' , ':' , '/' , '/' , 'a' , 'p' , 'i' , '-' , 'd' , 'e' , 'v' , '.' , 'i' , 'c' , 't' , 'u' , '.' , 'v' , 'n' ];

export const getHost         = () : string => host.join( '' );
export const getRoute        = ( route : string ) : string => [].concat( host , [ ':' , port , '/' , realm , '/api/' , route ] ).join( '' );
export const getLinkDrive    = ( id : string ) : string => [].concat( host , [ ':' , port , '/' , realm , '/api/driver/' , id ] ).join( '' );
export const getLinkMedia    = ( id : string ) : string => [].concat( host , [ ':' , port , '/' , realm , '/api/uploads/' , id ] ).join( '' );
export const getFileDir      = () : string => [].concat( host , [ ':' , port , '/' , realm , '/api/uploads/folder/' ] ).join( '' );
export const getLinkDownload = ( id : number ) : string => [].concat( host , [ ':' , port , '/' , realm , '/api/uploads/file/' , id ? id.toString( 10 ) : '' ] ).join( '' );
export const getWsUrl        = () : string => ws_url.join( '' ) + ':' + port_socket;
export const wsPath          = '/sso/socket';

const acceptFileType = [
	'application/doc' ,
	'application/ms-doc' ,
	'application/msword' ,
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ,
	'application/vnd.openxmlformats-officedocument.presentationml.presentation' ,
	'application/excel' ,
	'application/vnd.ms-excel' ,
	'application/x-excel' ,
	'application/x-msexcel' ,
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ,
	'application/mspowerpoint' ,
	'application/powerpoint' ,
	'application/vnd.ms-powerpoint' ,
	'application/x-mspowerpoint' ,
	'application/vnd.openxmlformats-officedocument.presentationml.presentation' ,
	'application/pdf' ,
	'application/zip' ,
	'application/x-rar-compressed' ,
	'application/octet-stream' ,
	'application/x-zip-compressed' ,
	'multipart/x-zip' ,
	'audio/mpeg' ,
	'image/jpeg' ,
	'image/png' ,
	'video/mp4' ,
	'text/plain' ,
	'video/quicktime' ,
	'video/x-quicktime' ,
	'image/mov' ,
	'audio/aiff' ,
	'audio/x-midi' ,
	'audio/x-wav' ,
	'video/avi'
];

const appLanguages = [
	{ name : 'vn' , label : 'Tiếng việt' } ,
	{ name : 'en' , label : 'English' }
];

const appDefaultLanguage = { name : 'vn' , label : 'Tiếng việt' };

const appVersion = '2.0.1';

export const APP_CONFIGS = {
  defaultRedirect          : '/admin' ,
  pageTitle                : 'Phần mềm quản lý di tích lịch sử địa phương' ,
  multiLanguage            : true ,
  defaultLanguage          : appDefaultLanguage , // không được bỏ trống trường này ngay cả khi multiLanguage = false
  languages                : appLanguages ,
  realm                    : 'dtlsdp' , // app realm
  dateStart                : '06/2023' , // 06/2020
  maxUploadSize            : 838860800 , // (1024 * 1024 * 200) = 800mb
  maxFileUploading         : 10 , // The maximum number of files allowed to upload per time
  donvi_id                 : 1 , // default donvi id
  coreVersion              : '2.0.0' ,
  appVersion               : appVersion ,
  pingTime                 : 30 , // unit seconds
  storeLabels              : [ 'Server File' , 'ICTU Drive' ] ,
  metaKeyStore             : '__store_dir' ,
  metaKeyLanguage          : '__language' ,
  showHttpInterceptorError : false ,
  limitFileType            : false ,
  info_console             : true ,
  project_name             : `Core 14 V${ appVersion }` ,
  author                   : 'OvicSoft' ,
  bg_color_01              : '#008060' ,
  bg_color_02              : '#4959bd' ,
  acceptList               : acceptFileType ,
  cloudStorage             : '1mkWmS69qTh_7uoS_wpKDju7OdHLSkA1y' , //driveFolder id
  lectureCloudStorage      : '1Gwx6F72HUgM6ZDxonsvj8zLySGB6AYLJ' ,
  teacherCloudStorage      : '1YZwbEC_OBOTg6OyzvWXMWqxJI63dehH6' ,
  soundAlert               : true
};

/* define menu filter */
export const HIDDEN_MENUS = new Set( [ 'message/notification-details' ] ); // id của menu không muốn hiển thị

// export const CSRF_TOKEN_KEY         = 'CDaJMADt';
// export const CSRF_TOKEN_EXPIRED_KEY = 'MsWAA8EX';

export const USER_KEY        = 'tdktZpeJk7zV';
export const EXPIRED_KEY     = 'tdktZY4dcVQ8';
export const UCASE_KEY       = 'tdktS2e6M9AT';
export const ROLES_KEY       = 'tdktxKwPLuJF';
export const META_KEY        = 'tdktMKhGKn9P';
export const ACCESS_TOKEN    = 'tdktWf5XG74P';
export const REFRESH_TOKEN   = 'tdktAbLPDaGK';
export const ENCRYPT_KEY     = 'tdktW4jM2P5r';
export const APP_STORES      = 'tdkt4QfWtr6Z'; // no clear after logout
export const SWITCH_DONVI_ID = 'tdktC@gGA506'; // no clear after logout
export const X_APP_ID        = '3498a76c-81d0-4258-9735-751cbe71283c';

export const HE_SO_LUONG_CO_BAN = 1490000;

export const ROLES = Object.seal( {
	ld_tinh     : { title : 'Lãnh đạo ban TDKT' , id : 49 } ,
	cv_tinh     : { title : 'Chuyên viên ban TDKT' , id : 52 } ,
	ld_huyen    : { title : 'Lãnh đạo cấp huyện' , id : 50 } ,
	cv_huyen    : { title : 'Chuyên viên cấp huyện' , id : 53 } ,
	ld_xa       : { title : 'Lãnh đạo cấp xã' , id : 55 } ,
	cv_xa       : { title : 'Chuyên viên cấp xã' , id : 54 } ,
	manager     : { title : 'Lãnh đạo' , id : 48 } ,
	chuyen_vien : { title : 'Chuyên Viên' , id : 38 } ,
	nguoi_dung  : { title : 'Người dùng' , id : 46 }
} );

export const ROLE_MANAGER = Object.seal( {
	list      : new Set<string>( [ 'manager' , 'ld_huyen' , 'ld_tinh' , 'ld_xa' ] ) ,
	isManager : ( roles : SimpleRole[] ) => roles.reduce( ( collect , role ) => collect || ROLE_MANAGER.list.has( role.name ) , false )
} );
