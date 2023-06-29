import { SimpleFileLocal } from '@core/models/file';

export enum LoaiHoSo {
	HOSO_TRINHKHEN = 'HOSO_TRINHKHEN' ,
	HOSO_KHEN      = 'HOSO_KHEN'
};

export const LoaiHoSoOptions = [
	{ value : LoaiHoSo.HOSO_TRINHKHEN , label : 'Hồ sơ trình khen' } ,
	{ value : LoaiHoSo.HOSO_KHEN , label : 'Hồ sơ khen' }
];

export interface HoSoTrinhKhen {
	id? : number;
	mahoso : string; // HTK[nam][thang].[id] : HTK202208.0001
	so_kyhieu : string;
	slug : string; // nối số ký hiệu và ngày ký làm key trống trùng
	trichyeu : string;
	mota : string; //tóm tắt nội dung tờ trình
	loaihinh_khen : string; //THUONGXUYEN,CHUYENDE,DOTXUAT,THANHTICH_DOINGOAI,HOGIADINH,
	ngayky : string; // sql Date
	nguoiky : string;
	chucvu_nguoiky : string;
	donvi_trinhkhen : number;
	donvi_tiepnhan : number;
	user_duyethoso : number;
	file_totrinh : SimpleFileLocal[]; // file tờ trình PDF đóng dấu đỏ trình khen kèm danh sách đối tượng thi đua
	file_tapthe_bctt : SimpleFileLocal[]; //1. Báo cáo thành tích của tập thể;
	file_canhan_bctt : SimpleFileLocal[]; //2. Báo cáo thành tích của cá nhân;
	file_bienbanhoidong : SimpleFileLocal[]; //3. Biên bản họp xét của hội đồng thi đua
	file_khac : SimpleFileLocal[];//	JSON: 1. Biên bản giải trình, văn bản nhận xét của đơn vị thứ 3 khác,...
	trangthai_hoso : number; //	0: Đang cập nhật 1: Đề nghị duyệt 2: Đề nghị sửa lại (lãnh đạo phê) 4: Duyệt 5: Đã nộp lên cấp trên
	user_phutrach : number; // User phụ trách
	user_tiepnhan : number; //
	users_phoihop : string; // |u=123|u=456|u=789|m=kjhdfk kahjsd akaj kah akjsh aksjd |
	trangthai_tiepnhan : number; //	0: Chưa tiếp nhận 1: Đã tiếp nhận, đang thẩm định hồ sơ 2: Đã tiếp nhận, Yêu cầu bổ sung hồ sơ, 3 : mới cập nhật ( cấp dưới cập nhật theo yêu cầu)
	trangthai_ketqua : number; //	0: Chưa trả kết quả 1: Đã trả kết quả
	ghichu : string; //	dành cho người kiểm tra note lại các nội dung thông tin cần thiết của hồ sơ
	ngay_guihoso : string; // sql Date	Ngày dự kiến nộp hồ sơ
	ngay_tiepnhanhoso : string; // sql Date
	ngay_traketqua : string; // sql Date
	progress? : string; // canhan:5|tapthe:1|duyet_canhan:4|duyet_tapthe:1
	is_deleted? : number; //	0: chưa xoá; 1: đã xoá
	deleted_by? : number; //	id user xoá
	created_at? : string; // sql timestamp
	updated_at? : string; // sql timestamp
}

export interface HoSoTrinhKhenTapThe {
	id : number;
	hoso_trinhkhen_id : number;
	tapthe_id : number;
	ten_tapthe : string;
	donvi_id : number;
	tendonvi : string;
	dhtd_htkt_id : number;
	dhtd_htkt_ten : string;
	trangthai_ketqua : number; // 0: đề nghi | 1: đạt | -1: không đạt
	lydo_khongdat : string;
	is_deleted : number;
	deleted_by : number;
	created_by : number;
	updated_by : number;
	created_at : string; // sql timestamp
	updated_at : string; // sql timestamp
}

export interface HoSoTrinhKhenCaNhan {
	id : number;
	hoso_trinhkhen_id : number; //	hồ sơ từ đơn vị trình khen
	canhan_id : number; //
	hovaten : string;
	ten : string;
	donvi_id : number; //
	tendonvi : string;
	donvi_phongban_id : number; //
	tendonvi_phongban : string;
	chucvu : string;
	dhtd_htkt_id : number;
	dhtd_htkt_ten : string;
	trangthai_ketqua : number; // 0: đề nghi | 1: đạt | -1: không đạt
	lydo_khongdat : string;
	is_deleted : number;
	deleted_by : number;
	created_by : number;
	updated_by : number;
	created_at : string; // sql timestamp
	updated_at : string; // sql timestamp
}

export interface HoSoTrinhKhenLog extends NewHoSoTrinhKhenLog {
	id : number;
	created_at : string; // sql timestamp
}

export type NewHoSoTrinhKhenLog = {
	hoso_trinhkhen_id : number;
	user_id : number; // User tạo ra hành động
	user_name : string; // User display name
	action : HoSoTrinhKhenLogName; // Action name
	content : string; // Nội dung
}

export type HoSoTrinhKhenLogName = 'TU_CHOI' | 'YEU_CAU_CAP_NHAT' | 'DUYET' | 'DE_NGHI_PHE_DUYET' | 'NOP_HO_SO' | 'TIEP_NHAN';

export const TrangThaiHoSoTrinhKhenStatusNumber : { [T in HoSoTrinhKhenLogName as string] : number } = {
	DE_NGHI_PHE_DUYET : 1 ,
	YEU_CAU_CAP_NHAT  : 2 ,
	DUYET             : 4 ,
	NOP_HO_SO         : 5
};

export const HoSoTrinhKhenLogNameMap = new Map<HoSoTrinhKhenLogName , string>( [
	[ 'TU_CHOI' , 'Từ chối' ] ,
	[ 'YEU_CAU_CAP_NHAT' , 'Yêu cầu cập nhật' ] ,
	[ 'DUYET' , 'Duyệt' ] ,
	[ 'DE_NGHI_PHE_DUYET' , 'Đề nghị duyệt' ] ,
	[ 'NOP_HO_SO' , 'Nộp hồ sơ' ] ,
	[ 'TIEP_NHAN' , 'Tiếp nhận' ]
] );

export type ProjectInteractionRoles = 'SUPERVISOR' | 'MANAGER' | 'CO_MANAGER' | 'VIEWER'; // Vai trò tương tác trong hồ sơ

export const TrangThaiTiepNhanTrinhKhenStatusNumber : { [T in HoSoTrinhKhenLogName as string] : number } = {
	TIEP_NHAN        : 1 ,
	YEU_CAU_CAP_NHAT : 2
};

export interface HoSoKhenCoSo {
	id : number;
	donvi_id : number;
	mahoso : string; // HK[nam][thang].[id] : HK202208.0001
	tieude : string;
	mota : string;
	loaihinh_khen : string; //THUONGXUYEN,CHUYENDE,DOTXUAT,THANHTICH_DOINGOAI,HOGIADINH,
	file_bienban : SimpleFileLocal[]; // file biên bản họp xét của thường trực hội đồng tđkt của đơn vị
	file_totrinh : SimpleFileLocal[];
	file_quyetdinh : SimpleFileLocal[];
	file_hiepy : SimpleFileLocal;
	file_tapthe_bctt : SimpleFileLocal;
	file_canhan_bctt : SimpleFileLocal;
	file_khac : SimpleFileLocal[];
	trangthai_pheduyet : number; //	0: Đang hoàn thiện hồ sơ 1: Chờ lãnh đạo phê duyệt => log 2: Yêu cầu sửa lại, làm rõ ==> xem log 3: Duyệt đồng ý => log
	user_pheduyet : number;
	is_deleted : number; //	0: không xoá;1 đã xoá
	deleted_by : number;
	created_by : number;
	updated_by : number;
	created_at : string; // sql timestamp
	updated_at : string; // sql timestamp
}

export interface HoSoKhenCoSoCaNhan {
	id : number,
	hoso_khen_id : number,
	hoso_trinhkhen_id : number, // id của hồ sơ trình nếu đối tượng lấy từ hồ sơ trình
	canhan_id : number,
	hovaten : string,
	ten : string,
	donvi_id : number,
	tendonvi : string,
	donvi_phongban_id : number,
	tendonvi_phongban : string,
	chucvu : string,
	dhtd_htkt_id : number,
	dhtd_htkt_ten : string,
	is_deleted : number,
	deleted_by : number,
	created_by : number,
	created_at : string,
	updated_at : string,
}

export interface HoSoKhenCoSoTapThe {
	id : number,
	hoso_khen_id : number,
	hoso_trinhkhen_id : number,
	tapthe_id : number,
	ten_tapthe : string,
	donvi_id : number,
	tendonvi : string,
	dhtd_htkt_id : number,
	dhtd_htkt_ten : string,
	trangthai_ketqua : number,//	0: đề nghị | 1: đủ điều kiện | -1: không điều kiện		Change Change	Drop Drop
	lydo_khongdat : string,
	is_deleted : number,
	deleted_by : number,
	created_by : number,
	created_at : string,
	updated_at : string,
}

// 0: Chưa tiếp nhận 1: Đã tiếp nhận, đang thẩm định hồ sơ 2: Đã tiếp nhận, Yêu cầu bổ sung hồ sơ
export const TrangThaiTiepNhanLabelMap = new Map<number , string>( [
	[ 0 , '<div class="p-inline-message alert-dark"><span class="--fs-14">Chờ tiếp nhận</span></div>' ] ,
	[ 1 , '<div class="p-inline-message alert-primary"><span class="--fs-14">Đang thẩm định hồ sơ</span></div>' ] ,
	[ 2 , '<div class="p-inline-message alert-warning"><span class="--fs-14">Yêu cầu bổ sung hồ sơ</span></div>' ] ,
	[ 3 , '<div class="p-inline-message alert-primary"><span class="--fs-14">Đã nộp lại hồ sơ</span></div>' ]
] );
