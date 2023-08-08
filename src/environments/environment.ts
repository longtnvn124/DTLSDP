import { SimpleRole } from '@core/models/auth';

export const environment = {
  production : false
};

const realm       = 'dtlsdp';
const host        = [ 'h' , 't' , 't' , 'p' , 's' , ':' , '/' , '/' , 'a' , 'p' , 'i' , '-' , 'd' , 'e' , 'v' , '.' , 'i' , 'c' , 't' , 'u' , '.' , 'v' , 'n' ];
const port        = '10091';
const port_socket = '10092';
const ws_url      = [ 'w' , 's' , 's' , ':' , '/' , '/' , 'a' , 'p' , 'i' , '-' , 'd' , 'e' , 'v' , '.' , 'i' , 'c' , 't' , 'u' , '.' , 'v' , 'n' ];

export const getHost         = () : string => host.join( '' );
export const getRoute        = ( route : string ) : string => [].concat( host , [ ':' , port , '/' , realm , '/api/' , route ] ).join( '' );
export const getDateTime     = () : string => [].concat( host , [ ':' , port , '/' , 'datetime'] ).join( '' );
export const getLinkDrive    = ( id : string ) : string => [].concat( host , [ ':' , port , '/' , realm , '/api/driver/' , id ] ).join( '' );
export const getLinkMedia    = ( id : string ) : string => [].concat( host , [ ':' , port , '/' , realm , '/api/uploads/' , id ] ).join( '' );
export const getFileDir      = () : string => [].concat( host , [ ':' , port , '/' , realm , '/api/uploads/folder/' ] ).join( '' );
export const getLinkDownload = ( id : number | string ) : string => [].concat( host , [ ':' , port , '/' , realm , '/api/uploads/file/' , id ? id.toString( 10 ) : '' ] ).join( '' );
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
  dateStart                : '09/2020' , // 06/2020
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

export const USER_KEY        = 'dtlsdpZpeJk7zV';
export const EXPIRED_KEY     = 'dtlsdpZY4dcVQ8';
export const UCASE_KEY       = 'dtlsdpS2e6M9AT';
export const ROLES_KEY       = 'dtlsdpxKwPLuJF';
export const META_KEY        = 'dtlsdpMKhGKn9P';
export const ACCESS_TOKEN    = 'dtlsdpWf5XG74P';
export const REFRESH_TOKEN   = 'dtlsdpAbLPDaGK';
export const ENCRYPT_KEY     = 'dtlsdpW4jM2P5r';
export const APP_STORES      = 'dtlsdp4QfWtr6Z'; // no clear after logout
export const SWITCH_DONVI_ID = 'dtlsdpC@gGA506'; // no clear after logout
export const X_APP_ID        = '60A111A9-09EE-48B6-9B2D-6CCB70F56B1F';

export const imgFalback = 'assets/images/placeholder.jpg';

export const ROLES = Object.seal( {
  admin    : { title : 'Lãnh đạo ' , id : 49 } ,
  chuyen_vien  : { title : 'Chuyên viên' , id : 46 }
} );

export const ROLE_MANAGER = Object.seal( {
  list      : new Set<string>( [ 'manager' , 'ld_huyen' , 'ld_tinh' , 'ld_xa' ] ) ,
  isManager : ( roles : SimpleRole[] ) => roles.reduce( ( collect , role ) => collect || ROLE_MANAGER.list.has( role.name ) , false )
} );

