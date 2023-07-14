import {Injectable} from '@angular/core';
import {getRoute} from "@env";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {AuthService} from "@core/services/auth.service";
import {map, Observable} from "rxjs";
import {Dto, OvicConditionParam, OvicQueryCondition} from "@core/models/dto";
import {DsNgulieu} from "@shared/models/quan-ly-ngu-lieu";
import {HttpClient, HttpParams} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NguLieuDanhSachService {
  private readonly api = getRoute('danh-sach-ngu-lieu/');

  constructor(
    private http: HttpClient,
    private httpParamsHelper: HttpParamsHeplerService,
    private themeSettingsService: ThemeSettingsService,
    private auth: AuthService
  ) {
  }

  load(): Observable<DsNgulieu[]> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'is_deleted',
        condition: OvicQueryCondition.equal,
        value: '0'
      },
    ];
    const fromObject = {
      paged: 1,
      limit: -1,
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({fromObject}));
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => res.data));
  }

  create(data: any): Observable<DsNgulieu> {
    data['created_by'] = this.auth.user.id;
    return this.http.post<Dto>(this.api, data).pipe(map(res => res.data));
  }

  update(id: number, data: any): Observable<any> {
    data['updated_by'] = this.auth.user.id;
    return this.http.put<Dto>(''.concat(this.api, id.toString(10)), data);
  }

  delete(id: number): Observable<any> {
    const is_deleted = 1;
    const deleted_by = this.auth.user.id;
    return this.update(id, {is_deleted, deleted_by});
  }

  searchData(page:number, search?: string): Observable<DsNgulieu[]> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'is_deleted',
        condition: OvicQueryCondition.equal,
        value: '0'
      },
    ];
    if (search) {
      const c1: OvicConditionParam = {
        conditionName: 'title',
        condition: OvicQueryCondition.like,
        value: `%${search}%`,
        orWhere: 'and'
      };
      conditions.push(c1);
    }
    const fromObject = {
      paged: page,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'title',
      order: "ASC"
    }

    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({fromObject}));
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => res.data));
  }
  getDataUnlimit(search?:string):Observable<DsNgulieu[]>{
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'is_deleted',
        condition: OvicQueryCondition.equal,
        value: '0'
      },
    ];
    if (search) {
      const c1: OvicConditionParam = {
        conditionName: 'title',
        condition: OvicQueryCondition.like,
        value: `%${search}%`,
        orWhere: 'and'
      };
      conditions.push(c1);
    }
    const fromObject = {
      paged: 1,
      limit: -1,
      orderby: 'title',
      order: "ASC"
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({fromObject}));
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => res.data));
  }

  getDataByDitichId(diemditich_id:number,page?:number ,search?:string) :Observable<{ recordsTotal: number, data: DsNgulieu[] }>{
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'is_deleted',
        condition: OvicQueryCondition.equal,
        value: '0'
      },
      {
        conditionName: 'diemditich_id',
        condition: OvicQueryCondition.equal,
        value: diemditich_id.toString(10),
        orWhere:'and'
      },
    ];

    if(search){
      const searchData :OvicConditionParam[]=[
        {
          conditionName: 'title',
          condition: OvicQueryCondition.like,
          value: search,
          orWhere:'and',
        }
      ];
      conditions.push(...searchData);
    }
    const fromObject = {
      paged: page,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'title',
      order: "ASC"
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({fromObject}));
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => ({
      recordsTotal: res.recordsTotal,
      data: res.data
    })));
  }
  getDataByDiemditichIdAndSearch(page:number,diemditich_id:number,search:string):Observable<{recordsTotal: number, data: DsNgulieu[]}>{
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'is_deleted',
        condition: OvicQueryCondition.equal,
        value: '0'
      }
      ]
    if(diemditich_id){
      const diemditich:OvicConditionParam={
        conditionName:'diemditich_id',
        condition:OvicQueryCondition.like,
        value:diemditich_id.toString(10),
        orWhere:'end'
      }
      conditions.push(...[diemditich]);
    }
    if(search){
      const searchdata:OvicConditionParam={
        conditionName:'title',
        condition:OvicQueryCondition.like,
        value:`%${search}%`,
        orWhere:'end'
      }
      conditions.push(...[searchdata]);
    }

    const fromObject = {
      paged: page,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'title',
      order: "ASC"
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({fromObject}));
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => ({
      recordsTotal: res.recordsTotal,
      data: res.data
    })));
  }
}


