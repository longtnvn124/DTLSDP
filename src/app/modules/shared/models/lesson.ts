import { OvicDocument , OvicMedia } from '@core/models/file';

export interface LessonVideoLogEvent {
	video_duration : number;
	time_play_video : number;
	completed : number;
	max_stopped_time : number;
	last_stopped : number;
}

interface LessonParams extends Object {
	condition? : number; // phần trăm đáp án đúng thí sinh cần đạt để qua bài , vd condition : 80 => thí sinh cần trả lời đúng > 80% thì đạt yêu cầu
	require? : number[]; // id những lesson yêu cầu hoàn thành trước khi bắt đầu học lesson này
	can_jump_forward? : boolean;
}

export interface LessonTest {
	id : number;
	lesson_id : number;
	content : string;
	type : 'english' | 'other' | string;
	media : OvicMedia;
	config : ConfigTestQuestion;
	created_by : number;
	point : number;
	time_start : number;
	total_time : number;
	updated_at : string;
	created_at : string;
}

export interface ConfigTestQuestion {
	invertedQuestion? : boolean; // 1 = là đảo thứ tự các câu hỏi trước khi show ra, 0 thì lấy theo thứ tự
	invertedAnswer? : boolean; // Đảo thứ câu trả lời
	showHint? : boolean; // hiển thị gợi ý
	showExplain? : boolean; // giải thích
	showAnswer? : boolean;
	percentComplete? : number; // số phần trăm cần đạt để được tính là đạt yêu cầu
	numberQuestion? : number; // Số lượng câu hỏi show ra
	maxTestTimes? : number; // Số lần được phép làm bài
}
