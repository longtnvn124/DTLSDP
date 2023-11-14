import {Injectable} from '@angular/core';
import {getRoute} from '@env';
import {HttpClient, HttpParams} from '@angular/common/http';
import {HttpParamsHeplerService} from '@core/services/http-params-hepler.service';
import {ShiftTests} from '@shared/models/quan-ly-doi-thi';
import {map, Observable} from 'rxjs';
import {Dto, OvicConditionParam, OvicQueryCondition} from '@core/models/dto';

export interface ShiftTestScore {
  number_correct: number;
  score: number;
}

@Injectable({
  providedIn: 'root'
})
export class DotThiKetQuaService {
  private readonly api = getRoute('shift-tests/');

  constructor(
    private http: HttpClient,
    private httpParamsHelper: HttpParamsHeplerService,) {
  }

  getShiftTestById(id: number): Observable<ShiftTests> {
    return this.http.get<Dto>(''.concat(this.api, id.toString(10))).pipe(map(res => res.data));
  }

  getShiftTest(shift_id: number, user_id: number): Observable<ShiftTests> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'thisinh_id',
        condition: OvicQueryCondition.equal,
        value: user_id.toString(10)
      },
      {
        conditionName: 'shift_id',
        condition: OvicQueryCondition.equal,
        value: shift_id.toString(10),
        orWhere: 'and'
      }
    ];
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions);
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => res.data && res.data[0] ? res.data[0] : null));
  }

  createShiftTest(data: { shift_id: number, thisinh_id: number, question_ids: number[], time_start: string, time: number }): Observable<number> {
    return this.http.post<Dto>(this.api, data).pipe(map(res => res.data));
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put<Dto>(''.concat(this.api, id.toString(10)), data);
  }

  // Tính điểm server
  scoreTest(id: number): Observable<ShiftTestScore> {
    return this.http.post<Dto>(''.concat(this.api, id.toString(10), '/point'), null).pipe(map(res => res.data))
  }

  getDataByShiftId(shift_id: number): Observable<ShiftTests[]> {
    const conditions: OvicConditionParam[] = [{
      conditionName: 'shift_id',
      condition: OvicQueryCondition.equal,
      value: shift_id.toString(10)
    }];
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams().set('with', 'users'));
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => res.data));
  }

  getDataByShiftIdAndWidth(shift_id: number): Observable<ShiftTests[]> {
    const conditions: OvicConditionParam[] = [{
      conditionName: 'shift_id',
      condition: OvicQueryCondition.equal,
      value: shift_id.toString(10)
    },
      {
        conditionName: 'state',
        condition: OvicQueryCondition.equal,
        value: '2',
        orWhere:'and'
    }
    ];

    const fromObject = {
      paged: 1,
      limit: -1,
      orderby: 'score',
      order: "ASC"
    }
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({fromObject}).set('with', 'thisinh'));
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => res.data));
  }
}
