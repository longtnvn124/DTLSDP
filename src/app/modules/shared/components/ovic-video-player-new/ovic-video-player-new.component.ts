import { AfterViewInit , Component , EventEmitter , Input , OnChanges , OnDestroy , OnInit , Output , SimpleChanges , ViewChild } from '@angular/core';
import { Download , OvicMedia , OvicMediaSources } from '@core/models/file';
import { APP_CONFIGS , getLinkDrive } from '@env';
import * as Plyr from 'plyr';
import { firstValueFrom , interval , Subject , Subscription } from 'rxjs';
import { PlyrComponent } from 'ngx-plyr';
import { ClassStudentsTracking } from '@shared/models/class-students-tracking';
import { debounceTime , distinctUntilChanged , filter , tap } from 'rxjs/operators';
import { LessonVideoLogEvent } from '@shared/models/lesson';
import { FileService } from '@core/services/file.service';

export interface OvicVideosEventLog {
	tracking? : ClassStudentsTracking;
	log : LessonVideoLogEvent;
}

@Component( {
	selector    : 'ovic-video-player-new' ,
	templateUrl : './ovic-video-player-new.component.html' ,
	styleUrls   : [ './ovic-video-player-new.component.css' ]
} )
export class OvicVideoPlayerNewComponent implements OnInit , OnChanges , OnDestroy , AfterViewInit {

	@Input() data : OvicMedia; /* local | serverFile | googleDrive */

	@Input() tracking : ClassStudentsTracking;

	@Input() token : string;

	@Input() initTime = 0;

	@Input() reportAfter : number; // unit seconds

	@Input() can_jump_forward = true; // user can fast_forward

	@Output() reportWatchedTime = new EventEmitter<OvicVideosEventLog>();

	_tracking : ClassStudentsTracking;

	player : Plyr;

	videoSources : Plyr.Source[] = [];

	options : Plyr.Options;

	counter : Subscription;

	private __time_counter = 0;

	_videoDuration = 0;

	private _awakeTime : number;

	@ViewChild( PlyrComponent , { static : false } ) plyr : PlyrComponent;

	isPlaying : boolean;

	subscriptions = new Subscription();

	private settingVideo$ = new Subject<number>();

	settingVideoCount = 0;

	mediaDownloader : Download;

	mediaDownloaderFail : boolean;

	constructor(
		private fileService : FileService
	) {
		const observerSettingVideo$ = this.settingVideo$.asObservable().pipe( debounceTime( 100 ) , distinctUntilChanged() ).subscribe( () => this.__initVideo() );
		this.subscriptions.add( observerSettingVideo$ );
	}

	ngOnInit() : void {
		this.settingInitVideo();
		this._awakeTime = this.reportAfter || APP_CONFIGS.pingTime;
	}

	ngAfterViewInit() : void {
		if ( this._tracking && this._tracking.video_duration ) {
			this._videoDuration = this._tracking.video_duration;
		}
		if ( this.plyr ) {
			const plyrReady$ = this.plyr.plyrReady.subscribe( res => {
				// for YouTube video
				if ( res.detail.plyr.duration && res.detail.plyr.duration > 0 && res.detail.plyr.duration !== this._videoDuration ) {
					this._videoDuration = res.detail.plyr.duration;
				}
			} );

			const plyrSeeking$ = this.plyr.plyrSeeking.pipe( debounceTime( 100 ) ).subscribe( res => {
				const player = res.detail.plyr;
				if ( !this.can_jump_forward && player.currentTime > this._tracking.max_stopped_time ) {
					player.currentTime = this._tracking.max_stopped_time - 1;
					if ( player.playing ) {
						player.play();
					}
				}
			} );

			const plyrLoadedData$ = this.plyr.plyrLoadedData.subscribe(
				( res ) => {

					console.log( 'plyrLoadedData$' );

					if ( this.data && Array.isArray( this.data.encryptedSource ) && this.data.encryptedSource[ 0 ] && this._tracking ) {
						res.detail.plyr.currentTime = this._tracking.last_stopped;
					}
					if ( this.data && ( this.data.source === 'serverFile' || this.data.source === 'local' ) && this._tracking ) {
						res.detail.plyr.currentTime = this._tracking.last_stopped;
					}
					if ( res.detail.plyr.duration && res.detail.plyr.duration > 0 && res.detail.plyr.duration !== this._videoDuration ) {
						this._videoDuration = res.detail.plyr.duration;
					} else {
						setTimeout( () => {
							if ( res.detail.plyr.duration && res.detail.plyr.duration > 0 && res.detail.plyr.duration !== this._videoDuration ) {
								this._videoDuration = res.detail.plyr.duration;
							}
						} , 1000 );
					}
				}
			);
			this.subscriptions.add( plyrReady$ );
			this.subscriptions.add( plyrSeeking$ );
			this.subscriptions.add( plyrLoadedData$ );
		}
	}

	ngOnChanges( changes : SimpleChanges ) {
		const currentTime = this.plyr && this.isPlaying ? Math.round( this.plyr.player.currentTime ) : 0;
		if ( currentTime ) {
			this.report( Math.round( currentTime ) );
		}
		if ( changes[ 'data' ] ) {
			this.settingInitVideo();
		}
	}

	settingInitVideo() {
		this.settingVideo$.next( ++this.settingVideoCount );
	}

	private async __initVideo() {
		// const settings = [ 'captions' , 'quality' , 'speed' , 'loop' ];
		const settings = this.can_jump_forward ? [ 'quality' , 'speed' , 'loop' ] : [ 'quality' ];
		this.options   = {
			disableContextMenu : true ,
			invertTime         : false ,
			youtube            : {
				start          : 0 ,
				fs             : 1 ,
				playsinline    : 1 ,
				modestbranding : 1 ,
				disablekb      : 0 ,
				controls       : 0 ,
				rel            : 0 ,
				showinfo       : 0
			} ,
			settings
		};
		if ( this.tracking ) {
			try {
				this._tracking = JSON.parse( JSON.stringify( this.tracking ) );
				if ( this._tracking ) {
					if ( this.data && Array.isArray( this.data.encryptedSource ) && this.data.encryptedSource[ 0 ] ) {

					} else {
						this.options.youtube[ 'start' ] = this._tracking.last_stopped;
					}
				}
			} catch {

			}
		}
		// const source = this.data ? this.validateDatasource( this.data ) : null;
		// if ( source ) {
		//     this.videoSources = source;
		// }
		try {
			this.videoSources = await this.__validateDatasource( this.data );
		} catch ( e ) {
			this.videoSources = [];
		}
	}


	private async __validateDatasource( media : OvicMedia ) : Promise<Plyr.Source[]> {
		let source : Plyr.Source[] = [];
		if ( media.path && media.source ) {
			switch ( media.source ) {
				case OvicMediaSources.vimeo:
					source = [ { provider : 'vimeo' , src : media.path as string } ];
					break;
				case OvicMediaSources.youtube:
					source = [ { provider : 'youtube' , src : media.path as string } ];
					break;
				case OvicMediaSources.local:
					source = [ { provider : 'html5' , src : media.path as string } ];
					break;
				case OvicMediaSources.serverFile:
					if ( typeof media.path === 'string' ) {
						source = [ { provider : 'html5' , src : getLinkDrive( media.path + '/stream?token=' + this.token ) } ];
					} else {
						const downloader = await this.loadVideoFromServerFile( media );
						source           = [ { provider : 'html5' , src : URL.createObjectURL( downloader.content ) } ];
					}
					break;
				case OvicMediaSources.encrypted:
					source = media.encryptedSource;
					break;
				default :
					source = null;
					break;
			}
		}
		return source;
	}

	async loadVideoFromServerFile( media : OvicMedia ) : Promise<Download> {
		this.mediaDownloaderFail = false;
		this.mediaDownloader     = { content : null , progress : 0 , state : 'PENDING' };
		if ( media ) {
			try {
				return firstValueFrom( this.fileService.getUnionFileProgressById( media.path ).pipe(
					tap(
						downloader => {
							if ( downloader.state === 'DONE' ) {
								setTimeout( () => this.mediaDownloader = null , 100 );
							} else {
								this.mediaDownloader = downloader;
							}
						}
					) ,
					filter( t => t.state === 'DONE' )
				) );
			} catch ( error ) {
				this.mediaDownloader     = { content : null , progress : 0 , state : 'PENDING' };
				this.mediaDownloaderFail = true;
				return Promise.resolve( null );
			}
		} else {
			return Promise.resolve( null );
		}
	}

	async loadMediaFile( media : OvicMedia ) {
		const downloader = await this.loadVideoFromServerFile( media );
		if ( downloader ) {
			this.videoSources = [ { provider : 'html5' , src : URL.createObjectURL( downloader.content ) } ];
		}
	}

	videoWaiting( event : Plyr.PlyrEvent ) {
		if ( this.counter ) {
			this.counter.unsubscribe();
		}
	}

	videoPlying( event : Plyr.PlyrEvent ) {
		const currentTime = event.detail.plyr.currentTime;
		this.counter      = interval( 1000 ).subscribe( () => this.calculateTime( currentTime ) );
		this.isPlaying    = true;
	}

	videoPaused( event : Plyr.PlyrEvent ) {
		if ( this.counter ) {
			this.counter.unsubscribe();
		}
		const player = event.detail.plyr;
		if ( !this.can_jump_forward && player.currentTime > this._tracking.max_stopped_time ) {
			this.player.currentTime = this._tracking.max_stopped_time - 1;
			player.currentTime      = this._tracking.max_stopped_time - 1;
			this.report( this._tracking.max_stopped_time - 1 );
		} else {
			this.report( player.currentTime );
		}
		this.isPlaying = false;
	}

	calculateTime( currentPoint : number ) {
		if ( isNaN( this.initTime ) ) {
			this.initTime = 0;
		}
		this.initTime++;
		if ( ++this.__time_counter >= this._awakeTime ) {
			this.report( currentPoint );
		}
	}

	report( last_stopped : number ) {
		this.__time_counter    = 0;
		const max_stopped_time = this._tracking?.max_stopped_time ? Math.max( this._tracking.max_stopped_time , last_stopped ) : last_stopped;
		if ( this._tracking ) {
			this._tracking.max_stopped_time = max_stopped_time;
		}
		const time_play_video = this._tracking ? this._tracking.time_play_video + this.initTime : this.initTime;
		const video_duration  = this._videoDuration;
		const tracking        = this._tracking || null;
		// const time                      = this.initTime;
		const c               = !!( video_duration && max_stopped_time && ( ( ( time_play_video / video_duration ) * 100 ) > 90 && ( ( max_stopped_time / video_duration ) * 100 ) > 90 ) );
		const completed       = c ? 1 : 0;
		const log             = { video_duration , time_play_video , completed , max_stopped_time , last_stopped };
		this.reportWatchedTime.emit( { tracking , log } );
	}

	ngOnDestroy() : void {
		const currentTime = this.plyr && this.isPlaying ? Math.round( this.plyr.player.currentTime ) : 0;
		if ( currentTime ) {
			this.report( Math.round( currentTime ) );
		}

		if ( this.counter ) {
			this.counter.unsubscribe();
		}

		if ( this.subscriptions ) {
			this.subscriptions.unsubscribe();
		}
	}
}
