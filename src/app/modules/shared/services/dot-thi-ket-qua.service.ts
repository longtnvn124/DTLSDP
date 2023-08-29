import {Injectable} from '@angular/core';
import {getRoute} from "@env";
import {HttpClient, HttpParams} from "@angular/common/http";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {AuthService} from "@core/services/auth.service";
import {Shift, ShiftTests} from "@shared/models/quan-ly-doi-thi";
import {map, Observable} from "rxjs";
import {Dto, OrWhereCondition, OvicConditionParam, OvicQueryCondition} from "@core/models/dto";

@Injectable({
  providedIn: 'root'
})
export class DotThiKetQuaService {
  private readonly api = getRoute('shift-tests/');

  constructor(private http: HttpClient,
              private httpParamsHelper: HttpParamsHeplerService,
              private themeSettingsService: ThemeSettingsService,
              private auth: AuthService
  ) {
  }

  getShiftTestById(id: number): Observable<ShiftTests> {
    return this.http.get<Dto>(''.concat(this.api, id.toString(10))).pipe(map(res => res.data))
  }

  getShiftTest(shift_id: number, user_id: number): Observable<ShiftTests> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'user_id',
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

  createShiftTest(data: { shift_id: number, user_id: number, question_ids: number[], time_start: string, time: number }): Observable<number> {
    data['created_by'] = this.auth.user.id;
    return this.http.post<Dto>(this.api, data).pipe(map(res => res.data));
  }

  update(id: number, data: any): Observable<any> {
    data['updated_by'] = this.auth.user.id;
    return this.http.put<Dto>(''.concat(this.api, id.toString(10)), data);
  }

  // Tính điểm server
  scoreTest(id: number): Observable<any> {
    return this.http.post<Dto>(''.concat(this.api, id.toString(10), '/point'), null);
  }

  getDataByShiftId(shift_id: number): Observable<ShiftTests[]> {
    const conditions: OvicConditionParam[] = [{
      conditionName: 'shift_id',
      condition: OvicQueryCondition.equal,
      value: shift_id.toString(10),
    }];
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams().set('with', 'users'));
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => res.data));
  }

  getdataUnlimit(): Observable<ShiftTests[]>{
    const fromObject = {
      limit: -1,
    }
    const params = new HttpParams({fromObject});
    return this.http.get<Dto>(''.concat(this.api), {params}).pipe(map(res => res.data));
  }

}
