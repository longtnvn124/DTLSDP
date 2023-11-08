import { Injectable } from '@angular/core';
import { getRoute } from '@env';
import { HttpClient , HttpParams } from '@angular/common/http';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { Observable } from 'rxjs';
import { Dto , OrWhereCondition , OvicQueryCondition } from '@core/models/dto';
import { map } from 'rxjs/operators';
import { IctuQueryParams } from '@core/models/ictu-query-params';

export interface NewContestant {
  id: number;
  full_name : string,
  name : string,
  phone : string,
  dob : string,
  sex : string,
  address : string,
}

@Injectable( {
  providedIn : 'root'
} )
export class ThiSinhService {

  private readonly api : string = getRoute( 'thisinh/' );

  constructor(
    private http : HttpClient ,
    private httpParamsHelper : HttpParamsHeplerService
  ) {
  }

  assignNewContestant( info : NewContestant ) : Observable<any> {
    return this.http.post( this.api , info );
  }

  validatePhoneContestant( phoneNumber : string ) : Observable<number> {
    const fromObject : IctuQueryParams = { paged : 1 , limit : 1 };
    const params : HttpParams          = this.httpParamsHelper.paramsConditionBuilder( [ {
      conditionName : 'phone' ,
      condition     : OvicQueryCondition.like ,
      value         : phoneNumber
    } ] , new HttpParams( { fromObject } ) );
    return this.http.get<Dto>( this.api , { params } ).pipe( map( res => res.data[ 0 ] ? res.data[ 0 ].id : 0 ) );
  }

  getDataByShiftest(id: number[]): Observable<NewContestant[]> {
    const fromObject = {
      paged: 1,
      limit:-1,
      orderby: 'name',
      order: 'ASC',
      include : id && id.length === 0?'0': id.join( ',' ) ,
      include_by : 'id'
    };
    const params: HttpParams = new HttpParams({fromObject});
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => res.data));
  }
}
