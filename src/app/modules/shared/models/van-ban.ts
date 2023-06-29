import { LoaiHoSo } from '@shared/models/ho-so';

export interface VanBanToTrinh {
	id : number;
	ma_totrinh : string; // TTr[nam][thang].[id] : HTK202208.0001
	donvi_id : number;
	donvi_chuquan : string; // Tên đơn vị chủ quản
	donvi_banhanh : string; // Tên đơn vị ban hành
	loai_hoso : LoaiHoSo | '';  //'HOSO_TRINHKHEN' | 'HOSO_KHEN';
	hoso_id : number; //	id hồ sơ tương ứng với loại hồ sơ
	trichyeu : string; //	vi du: Đề nghị Chủ tịch Ủy ban nhân dân tỉnh khen thưởng các tập thể, cá nhân có thành tích trong phong trào thi đua “Thái Nguyên chung tay vì người nghèo - Không để ai bị bỏ lại phía sau” giai đoạn 2016 - 2020
	so_kyhieu : string;
	ngayky : string; // sql date
	noi_ngayky : string; // Thái Nguyên, ngay 18 tháng 01 năm 2022
	nguoiky : string;
	chucvu_nguoiky : string;
	kinhgui : string; //	json Kính gửi: - Chủ tịch Ủy ban nhân dân tỉnh Thái Nguyên; - Sở Nội vụ.
	cancu : string; //	các căn cứ
	noidung : string;
	noinhan : string;	//Nơi nhận: - Ban TĐKT tỉnh; - Lãnh đạo Sở; - Lưu: VT, VP.
	is_locked : number;
	is_deleted : number;
	deleted_by : number;
	created_by : number;
	updated_by : number;
	created_at : string; // sql timestamp
	updated_at : string; // sql timestamp
}

export interface VanBanConfigs {
	id : number;
	donvi_id : number;
	donvi_chuquan : string;
	donvi_banhanh : string;
	totrinh_cancu : string;
	totrinh_noinhan : string;
	totrinh_chucvu_nguoiky : string;
	totrinh_tenguoiky : string;
	totrinh_kinhgui : string;
	quyetdinh_cancu : string;
	quyetdinh_noinhan : string;
	quyetdinh_chucvu_nguoiky : string;
	quyetdinh_tenguoiky : string;
	quyetdinh_kyhieu_vanban : string;
	updated_by : number;
	created_at : string; // sql timestamp
	updated_at : string; // sql timestamp
}

export interface VanBanQuyetDinh {
	id : number;
	donvi_id : number;
	loai_hoso : LoaiHoSo;
	hoso_id : number;
	donvi_chuquan : string;
	donvi_banhanh : string;
	thamquyen_banhanh : string; // Thẩm quyền ban hành
	trichyeu : string;
	so_kyhieu : string;
	ngayky : string; // sql date
	noi_ngayky : string; // Thái Nguyên, ngay 18 tháng 01 năm 2022
	nguoiky : string;
	chucvu_nguoiky : string;
	cancu : string;
	noidung : string;
	noinhan : string;
	is_locked : number;
	is_deleted : number;
	deleted_by : number;
	created_by : number;
	updated_by : number;
	created_at : string; // sql timestamp
	updated_at : string; // sql timestamp
}

export interface QuillRange {
	index : number;
	length : number;
}

export interface QuillSelectionChangeEvent {
	range : QuillRange,
	oldRange : QuillRange,
	source : string
}
