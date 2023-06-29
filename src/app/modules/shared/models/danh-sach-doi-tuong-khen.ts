import { Observable , of , Subject , switchMap , takeWhile , timer } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { User } from '@core/models/user';
import { catchError , map } from 'rxjs/operators';

export type DhtdHtktDTOEventName = 'CREATE' | 'UPDATE' | 'DELETE';

export interface DhtdHtktDTO {
	object : DhtdHtktInfo; // The object on which the event is occurring
	formValue : any; // form value
	event : DhtdHtktDTOEventName;
}

export interface DhtdHtktInfo {
	id? : number;
	dhtd_htkt_id? : number;
	dhtd_htkt_ten? : string;
	trangthai_ketqua? : number;
	lydo_khongdat? : string;
	tienthuong? : number;
	is_approved? : number;

	[ T : string ] : any;
}

export interface DhtdHttkObject {
	objectId : number; // canhan_id hoặc tapthe_id
	child : DhtdHtktInfo[];

	[ T : string ] : any;
}

export interface ServiceWorker {
	create( data : any ) : Observable<DhtdHtktInfo>;

	update( id : number , data : any ) : Observable<number>;

	delete( id : number , deleted_by : number ) : Observable<number>;

	load( id : number ) : Observable<DhtdHtktInfo[]>;
}

export class DanhSachDoiTuongKhen {

	data : DhtdHttkObject[];

	hoSo : { id : number };

	private _listData : DhtdHtktInfo[] = [];

	// store raw data
	get list() : DhtdHtktInfo[] {
		return this._listData;
	}

	private _loading : boolean;

	get loading() : boolean {
		return this._loading;
	}

	private _error : boolean;

	get error() : boolean {
		return this._error;
	}

	session : number;

	private user : User;

	private _serviceWorker : ServiceWorker;

	get serviceWorker() : ServiceWorker {
		return this._serviceWorker;
	}

	private notificationService : NotificationService;

	constructor(
		user : User ,
		notificationService : NotificationService
	) {
		this.notificationService = notificationService;
		this.user                = user;
		this.session             = 0;
	}

	triggerChanged() {
		this.session += 1;
	}

	/**
	 * getObjectId
	 * get unique key to group objects
	 * @var object : DhtdHtktInfo
	 * @return key - Number
	 * */
	getObjectId : ( object : DhtdHtktInfo ) => number; // can be overwritten

	/**
	 * getInformationDisplayed
	 * get basic information representing the object
	 * @var object : DhtdHtktInfo
	 * @return session - DhtdHttkObject
	 * */
	getInformationDisplayed : ( object : DhtdHtktInfo ) => DhtdHttkObject; // can be overwritten

	/**
	 * cloneObject
	 * crate new object from baseObject info
	 * @var baseObject : DhtdHtktInfo
	 * @return DhtdHtktInfo
	 * */
	cloneObject : ( baseObject : DhtdHtktInfo ) => DhtdHtktInfo; // can be overwritten

	sortList : ( a : DhtdHtktInfo , b : DhtdHtktInfo ) => number;

	private handleError( reload = true ) {
		this._loading = false;
		this.notificationService.toastError( 'Mất kết nối với máy chủ' );
		if ( reload ) {
			timer( 1000 ).subscribe( () => this.loadData() );
		} else {
			this._error = true;
		}
	}

	create( data : any ) : void {
		this._loading = true;
		this.serviceWorker.create( data ).subscribe( {
			next  : ( createdData ) => {
				this._listData.push( createdData );
				this.data.find( s => s.objectId === this.getObjectId( createdData ) ).child.push( createdData );
				this.triggerChanged();
				this.notificationService.toastSuccess( 'Thêm mới thành công thành công' );
				this._loading = false;
			} ,
			error : () => this.handleError()
		} );
	}

	update( object : DhtdHtktInfo , info ) : void {
		this._loading = true;
		this.serviceWorker.update( object.id , info ).subscribe( {
			next  : () => {
				const index = this._listData.findIndex( s => s.id === object.id );
				console.log( index );
				console.log( this._listData[ index ] );
				Object.keys( info ).forEach( field => this._listData[ index ][ field ] = info[ field ] );
				this.triggerChanged();
				this.notificationService.toastSuccess( 'Cập nhật thành công thành công' );
				this._loading = false;
			} ,
			error : () => this.handleError()
		} );
	}

	delete( id : number ) : void {
		const object           = this._listData.find( s => s.id === id );
		const indexBlockObject = this.data.findIndex( u => u.objectId === this.getObjectId( object ) );
		this._loading          = true;
		this.serviceWorker.delete( id , this.user.id ).subscribe( {
			next  : () => {
				this._listData = this._listData.filter( s => s.id !== id );
				if ( this.data[ indexBlockObject ].child.length > 1 ) {
					this.data[ indexBlockObject ].child = this.data[ indexBlockObject ].child.filter( s => s.id !== id );
				} else {
					this.data = this.data.filter( ( o , index ) => index !== indexBlockObject );
				}
				this.triggerChanged();
				this.notificationService.toastSuccess( 'Xóa thành công thành công' );
				this._loading = false;
			} ,
			error : () => this.handleError()
		} );
	}

	/**
	 * deleteObject
	 * Delete all about one object
	 * */
	async deleteObject( objectId : number ) : Promise<void> {
		try {
			const confirm = await this.notificationService.confirmDelete();
			if ( confirm ) {
				this._loading                 = true;
				const listDelete              = this.data.find( u => u.objectId === objectId ).child;
				const length                  = listDelete.length;
				let error                     = false;
				let counter                   = 0;
				const exclusionIds : number[] = [];
				listDelete.forEach( ( object , index ) => setTimeout( () => this.serviceWorker.delete( object.id , this.user.id ).subscribe( {
					next  : () => {
						exclusionIds.push( object.id );
						if ( ++counter === length ) {
							if ( error ) {
								this.handleError();
							} else {
								this._listData = this._listData.filter( u => !exclusionIds.includes( u.id ) );
								this.data      = this.data.filter( baseObject => baseObject.objectId !== objectId );
								this.notificationService.toastSuccess( 'Xóa thành công' );
								this.triggerChanged();
								this._loading = false;
							}
						}
					} ,
					error : () => {
						if ( ++counter === length ) {
							this.handleError();
						}
					}
				} ) , index * 100 ) );
			}
		} catch ( e ) {
			console.warn( e );
		}
	}


	private __buildDataConstruct() {
		const uniqueMap = this._listData.reduce( ( collector , item ) => {
			if ( !collector.has( this.getObjectId( item ) ) ) {
				collector.set( this.getObjectId( item ) , this.getInformationDisplayed( item ) );
			}
			collector.get( this.getObjectId( item ) ).child.push( item );
			return collector;
		} , new Map<number , DhtdHttkObject>() );
		this.data       = [ ... uniqueMap.values() ];
	}

	public loadData() {
		if ( this.hoSo ) {
			this._loading = true;
			this.serviceWorker.load( this.hoSo.id ).subscribe( {
				next  : ( list ) => {
					this._listData = this.sortList ? list.sort( this.sortList ) : list;
					this.__buildDataConstruct();
					this._loading = false;
					this._error   = false;
				} ,
				error : () => this.handleError( false )
			} );
		}
	}

	init( serviceWorker : ServiceWorker , hoSo : { id : number } ) {
		this.hoSo           = hoSo;
		this._serviceWorker = serviceWorker;
		this.loadData();
	}

	addElements( listObjects : any[] ) {
		const { duplicate , cleanData } = listObjects && listObjects.length ? this.__validateListImport( listObjects ) : { duplicate : false , cleanData : [] };
		if ( cleanData && cleanData.length ) {
			const payload$ = new Subject<number>();
			const total    = cleanData.length;
			const step     = 100 / total;
			let percent    = 0;
			let error      = false;
			this.notificationService.loadingAnimationV2( {
				text    : 'Hệ thống đang cập nhật dữ liệu, vui lòng chờ đến khi kết thúc' ,
				process : { percent }
			} );
			this._loading = true;
			payload$.asObservable().pipe( takeWhile( index => index <= total ) , switchMap( index => {
				return cleanData[ index ] ? this.serviceWorker.create( cleanData[ index ] ).pipe( map( object => {
					percent += step;
					this._listData.push( object );
					return { error , completed : false , next : 1 + index , percent };
				} ) , catchError( () => {
					error = true;
					return of( { error , completed : false , next : 1 + index , percent } );
				} ) ) : of( { error , completed : true , next : 1 + index , percent } );
			} ) ).subscribe( ( { completed , error , next , percent } ) => {
				if ( completed ) {
					this.notificationService.loadingAnimationV2( { process : { percent : 100 } } );
					this._loading = false;
					if ( error ) {
						this.notificationService.toastError( 'Lỗi mất kết nối mạng trong quá trình cập nhật dữ liệu' );
						timer( 1000 ).subscribe( () => this.loadData() );
					} else {
						if ( duplicate ) {
							this.notificationService.toastInfo( 'Đối tượng đã tồn tại trong danh sách' );
						}
						this.__buildDataConstruct();
					}
				} else {
					this.notificationService.loadingAnimationV2( { process : { percent } } );
					payload$.next( next );
				}
			} );
			payload$.next( 0 );
		} else {
			if ( duplicate ) {
				this.notificationService.toastInfo( 'Đối tượng đã tồn tại trong danh sách' );
			}
		}
	}

	private __validateListImport( elements : { id : number }[] ) : { duplicate : boolean, cleanData : { id : number }[] } {
		if ( this.list && this.list.length ) {
			const exclusionIds = [ ... new Set( this.list.map( item => this.getObjectId( item ) ) ) ];
			const result       = { duplicate : false , cleanData : [] };
			return elements.reduce( ( collector , item ) => {
				if ( exclusionIds.includes( this.getObjectId( item ) ) ) {
					collector.duplicate = true;
				} else {
					collector.cleanData.push( item );
				}
				return collector;
			} , result );
		} else {
			return { duplicate : false , cleanData : elements };
		}
	}

	private __addElementsSender( data : any , percent : number , step : number ) : Observable<{ object : any, percent : number }> {
		percent += step;
		return this.serviceWorker.create( data ).pipe( map( object => ( { object , percent } ) ) );
	}

	/*addElements( element : any[] ) {
	 const total = element.length;
	 const step  = total / 100;
	 let percent = 0;
	 this.notificationService.loadingAnimationV2( {
	 icon    : 'pill' ,
	 text    : 'Hệ thống đang cập nhật dữ liệu, vui lòng chờ đến khi kết thúc' ,
	 process : { percent }
	 } );

	 let error = false;
	 let count = 0;

	 const controllerGuard = new Subject<string>();
	 const controller      = new Subject<number>();

	 controller.asObservable().pipe( takeUntil( controllerGuard ) , mergeMap( index => {
	 return new Observable( ( subscriber ) => {
	 subscriber.next( 1 );
	 subscriber.next( 2 );
	 subscriber.next( 3 );
	 setTimeout( () => {
	 subscriber.next( 4 );
	 subscriber.complete();
	 } , 1000 );
	 } ).pipe( );
	 } ) ).subscribe();

	 element.forEach( ( data , index ) => {
	 this.serviceWorker.create( data ).pipe( tap( () => {
	 percent += step;
	 this.notificationService.loadingAnimationV2( { process : { percent } } );
	 } ) ).subscribe( {
	 next  : object => {
	 this._listData.push( object );
	 if ( ++count === total ) {
	 this.__buildDataConstruct();
	 if ( error ) {
	 this.handleError( true );
	 } else {
	 this.notificationService.toastSuccess( 'Cập nhật danh sách thành công' );
	 }
	 }
	 } ,
	 error : () => {
	 error = true;
	 if ( ++count === total ) {
	 this.__buildDataConstruct();
	 this.handleError( true );
	 }
	 }
	 } );
	 } );
	 }*/
}
