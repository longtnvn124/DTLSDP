import { SimpleFileLocal } from '@core/models/file';

export interface DoiTuongThiDuaCaNhan {
	id : number;
	anh_hoso : number;
	ma_canbo : string;
	donvi_id : number;
	donvi_phongban_id : number;
	hovaten : string;
	ten : string;
	ngaysinh : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
	gioitinh : string; //Nam; Nữ
	noisinh : number; // Tỉnh, thành phố nơi sinh
	dantoc : string;
	tongiao : string;
	noio_tinh : number;
	noio_huyen : number;
	noio_xa : number;
	noio_diachi : string;
	noio_daydu : string;
	cccd : string;
	ngaycap : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
	ngayhethan : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
	noicap : string;
	trinhdo_vanhoa : string; // 5/12; 10/10 12/12;...
	trinhdo_chuyenmon : string; // THPT;SOCAP;TRUNGCAP; CAODANG; DAIHOC; THACSI; TIENSI
	chuyenmon : string; // Tên chuyên ngành đào tạo ứng với trình độ chuyên môn
	chucvu_dang : string;
	chucvu_chinhquyen : string;
	chucvu_congdoan : string;
	chucvu_doantn : string;
	status : 0 | 1; // 1 Active; 0: inactive
	is_deleted : 0 | 1; // 1: deleted; 0: not deleted
	deleted_by : number;
	created_by : number;
	updated_by : number;
	created_at : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
	updated_at : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
}

export interface DoiTuongThiDuaTapThe {
	id : number;
	donvi_id : number;
	ten : string;
	description : string;
	lacoquan : 0 | 1; // 0: là tập thể phòng ban; 1. Là cơ quan
	status : 0 | 1; // 1 Active; 0: inactive
	is_deleted : 0 | 1; // 1: deleted; 0: not deleted
	deleted_by : number;
	created_by : number;
	updated_by : number;
	created_at : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
	updated_at : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
}

export interface QuaTrinhCongTac {
	id : number;
	doituong : number;
	tungay : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
	denngay : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
	donvi : string;
	chucvu : string;
	chuyenmon : string;
	diachi : string; //địa chỉ đơn vị công tác
	ghichu : string;
	files : SimpleFileLocal[];
	status : 0 | 1; // 1 Active; 0: inactive
	is_deleted : 0 | 1; // 1: deleted; 0: not deleted
	deleted_by : number;
	created_by : number;
	updated_by : number;
	created_at : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
	updated_at : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
}

export interface QuaTrinhHoatDongCachMang {
	id : number;
	doituong : number;
	giaidoan : string; // Trước 1945; từ 1945-1954; từ 1954-1975; từ 1975 đến nay
	tungay : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
	denngay : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
	donvi : string;
	chucvu : string;
	chuyenmon : string;
	diachi : string; // địa chỉ đơn vị công tác
	ghichu : string;
	files : SimpleFileLocal[];
	status : 0 | 1; // 1 Active; 0: inactive
	is_deleted : 0 | 1; // 1: deleted; 0: not deleted
	deleted_by : number;
	created_by : number;
	updated_by : number;
	created_at : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
	updated_at : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
}

export const QUA_TRINH_HOAT_DONG_CACH_MANG = [
	{ value : 'truoc-1945' , label : 'Trước 1945' } ,
	{ value : '1945-1954' , label : 'Từ 1945 đến 1954' } ,
	{ value : '1954-1975' , label : 'Từ 1954 đến 1975' } ,
	{ value : 'sau-1975' , label : 'Từ 1975 đến nay' }
];
