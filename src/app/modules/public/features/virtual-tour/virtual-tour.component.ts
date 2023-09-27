import {
  AfterViewInit,
  Component,
  ElementRef, HostListener,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild
} from '@angular/core';
import {PointsService} from "@shared/services/points.service";
import {NotificationService} from "@core/services/notification.service";
import {FileService} from "@core/services/file.service";
import {Pinable, Point} from '@modules/shared/models/point';
import {MediaService} from "@shared/services/media.service";
import {Ngulieu} from "@shared/models/quan-ly-ngu-lieu";
import {ActivatedRoute, Router} from "@angular/router";
import {DanhMucDiemDiTichService} from "@shared/services/danh-muc-diem-di-tich.service";
import {forkJoin} from "rxjs";
import {PerspectiveCamera, Raycaster, Scene, Vector2, Vector3, WebGLRenderer} from "three";
import {NguLieuDanhSachService} from "@shared/services/ngu-lieu-danh-sach.service";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {FilePointView, PointView} from "@shared/models/pointView";
import {OvicVrPointUserData} from "@shared/models/sceneVr";
import {OvicFile} from "@core/models/file";
import {DownloadProcess} from "@shared/components/ovic-download-progress/ovic-download-progress.component";
import {AuthService} from "@core/services/auth.service";
import {BUTTON_NO, BUTTON_YES} from "@core/models/buttons";

interface convertPoint extends Pinable {
  id: number;
  icon: string;
  title: string;
  mota: string;
  location: number[]; // vi tri vector3
  type: 'DIRECT' | 'INFO'; //DIRECT | INFO
  parent_id: number; //ngulieu_id
  donvi_id: number;
  ds_ngulieu: Ngulieu[]; //danh sách audio | hảnh 360 | video360 ;
  ditich_id: number;// thay thế parent_id
  toado_map: string;
  root: number;
}


@Component({
  selector: 'app-virtual-tour',
  templateUrl: './virtual-tour.component.html',
  styleUrls: ['./virtual-tour.component.css']
})
export class VirtualTourComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() showOnly: boolean = false;
  @Input() rotate: boolean = false;
  @ViewChild('container', {static: true}) container: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip', {static: true}) tooltip: ElementRef<HTMLDivElement>;
  @ViewChild('imgtooltip', {static: true}) imgtooltip: ElementRef<HTMLImageElement>;
  @ViewChild('titletooltip', {static: true}) titletooltip: ElementRef<HTMLDivElement>;

  @HostListener('window:resize', ['$event']) onResize1(event: Event): void {
    this.isSmallScreen = window.innerWidth < 500;
  }
  isSmallScreen: boolean = window.innerWidth < 500;

  mode: "BTNPLAY" | "MEDIAVR" = "BTNPLAY";
  private audio: HTMLAudioElement = document.createElement('audio');

  //===================================three js=============================================
  spriteActive = false;
  scene: Scene;
  camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  controls: OrbitControls;
  rayCaster = new Raycaster();
  renderer = new WebGLRenderer({antialias: true});
  intersectsVecter: any;

  constructor(

    private notificationService: NotificationService,
    private auth:AuthService,
    private fileService: FileService,
    private mediaService: MediaService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private element: ElementRef,
    private renderer2: Renderer2,
    private pointsService: PointsService,
    private danhMucDiemDiTichService: DanhMucDiemDiTichService,
    private ngulieuService: NguLieuDanhSachService
  ) {

  }

  pointHover: boolean;
  isVideo:boolean;
  isVideoPlay:boolean = true;
  private _ngulieu_id: number;
  ngulieuStart: Ngulieu;
  dataPoints: Point[];
  dataPointsChild: Point[];

  ngOnDestroy(): void {
    this.scene.remove();
    this.s.btnRemoveVideo();
  }

  ngAfterViewInit(): void {
    if (this.activatedRoute.snapshot.queryParamMap.has('code')) {
      const raw = this.activatedRoute.snapshot.queryParamMap.get('code');
      const s1 = this.auth.decryptData(raw);
      const info = s1 ? JSON.parse(s1) : null;
      this._ngulieu_id = info.ngulieu_id;
      this.LoadNgulieu(this._ngulieu_id);

      this.container.nativeElement.addEventListener('resize', this.onResize);
      this.container.nativeElement.addEventListener('click', this.onClick);
      this.container.nativeElement.addEventListener('mousemove', this.onMouseMove);
      this.container.nativeElement.addEventListener('contextmenu', this.onRightClick);
    }
  }

  ngOnInit(): void {
  }

  LoadNgulieu(id: number) {
    this.notificationService.isProcessing(true);
    forkJoin<[Ngulieu, Point[]]>(
      this.ngulieuService.getdataById(id),
      this.pointsService.getAllData()
    ).subscribe({
      next: ([ngulieu, dataPoint]) => {
        this.notificationService.isProcessing(false);
        this.dataPoints = dataPoint.map(m => {
          m['_child'] = dataPoint.filter(f => f.parent_id === m.id);
          m['_file_media'] = m.file_media && m.file_media[0] ? this.fileService.getPreviewLinkLocalFile(m.file_media[0]) : '';
          m['_file_audio'] = m.file_audio && m.file_audio[0] ? this.fileService.getPreviewLinkLocalFile(m.file_audio[0]) : '';
          return m;
        });
        this.ngulieuStart = ngulieu ? ngulieu[0] : {};
        this.ngulieuStart['_file_media'] = this.ngulieuStart.file_media && this.ngulieuStart.file_media[0] ? this.fileService.getPreviewLinkLocalFile(this.ngulieuStart.file_media[0]) : '';
        this.ngulieuStart['_file_audio'] = this.ngulieuStart.file_audio && this.ngulieuStart.file_audio[0] ? this.fileService.getPreviewLinkLocalFile(this.ngulieuStart.file_audio[0]) : '';
        this.ngulieuStart['_points_child'] = this.dataPoints.filter(f => f.ngulieu_id === this.ngulieuStart.id);
        this.dataPointsChild = this.dataPoints.filter(f => f.ngulieu_id === this.ngulieuStart.id);
        this.loadNgulieuStart(this.ngulieuStart);
        this.notificationService.isProcessing(false);
      }, error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError("Mất kết nối với máy chủ");
      }
    });
  }

  s: PointView;

  loadNgulieuStart(item: Ngulieu) {
    if(item.file_audio&& item.file_audio[0]){
        this.audio.src =item['_file_audio'];
        this.audio.setAttribute('autoplay','true');
    }

    //scene and controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.scene = new Scene();
    this.controls.rotateSpeed = -0.3;
    this.controls.enableZoom = false;
    this.camera.position.set(-0.1, 0, 0.1);
    // Sphere

    if (item.file_product && item.file_product[0]) {

    } else {
      const src = item['_file_media'];

      const file_type = item.file_media && item.file_media[0].type.split('/')[0] === "video" ? "video" : "image";
      this.file_param = {file: item.file_media[0], file_type: file_type, url: item['_file_media']};
      this.isVideo = this.file_param.file_type ==='video'?true  :false;
      this.s = new PointView(src, this.camera);

      if (this.dataPointsChild && this.dataPointsChild.length) {
        this.addPointInScene(this.dataPointsChild);
      } else {
      }

      this.s.createScrene(this.scene, this.file_param, item.id);
      this.renderSecene();
    }

  }

  addPointInScene(data: convertPoint[]) {
    data.forEach(f => this.pinInScene(f, true))
  }

  pinInScene(pin: convertPoint, renderScene: boolean = true) {
    const pin_file = pin.file_media && pin.file_media[0] ? pin.file_media[0] : null;
    const pin_media: FilePointView = {
      file: pin_file,
      file_type: pin_file && pin_file.type.split('/')[0] === "video" ? 'video' : 'image',
      url: pin_file ? this.fileService.getPreviewLinkLocalFile(pin_file) : '',
    }
    const medialink = pin.file_media ? this.fileService.getPreviewLinkLocalFile(pin.file_media[0]) : '';
    if (medialink) {
      let newPoint = new PointView(medialink, this.camera);
      const locationX = pin.location['x'];
      const locationY = pin.location['y'];
      const locationZ = pin.location['z'];
      this.s.addPoint(
        {
          position: new Vector3(locationX, locationY, locationZ),
          name: pin.title,
          scene: newPoint,
          userData: {
            ovicPointId: pin.id,
            iconPoint: pin.icon,
            dataPoint: pin,
            type: pin.type,
            parentPointId: this._ngulieu_id ? this._ngulieu_id : 0,
            ngulieu_id: this._ngulieu_id ? this._ngulieu_id : 0,
            file_media: pin_media
          },
        });
    }

    if (renderScene) {
      this.renderSecene();
    }
  }

  file_param: FilePointView;

  renderSecene() {
    // Render
    this.renderer.setSize(this.container.nativeElement.clientWidth, this.container.nativeElement.clientHeight);
    this.renderer2.appendChild(this.container.nativeElement, this.renderer.domElement);
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
    animate()
  }

  onResize = () => {
    let width = this.container.nativeElement.clientWidth;
    let height = this.container.nativeElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.render(this.scene, this.camera)
  }

  btnReload() {
    this.renderSecene()
  }

  onClick = (e: MouseEvent) => {
    let mouse = new Vector2(
      (e.offsetX / this.container.nativeElement.clientWidth) * 2 - 1,
      -(e.offsetY / this.container.nativeElement.clientHeight) * 2 + 1,
    );
    this.rayCaster.setFromCamera(mouse, this.camera);
    let intersects = this.rayCaster.intersectObjects(this.scene.children);
    const userData: OvicVrPointUserData = intersects[0].object.userData as OvicVrPointUserData;
    if (!userData.type) {
      return;
    }
    if (userData.type === "DIRECT") {
      intersects.forEach((intersect: any) => {
        if (intersect.object.type === "Sprite") {
          const newImg = document.createElement("img");
          newImg.setAttribute('src', 'assets/icon-png/pin.gif');
          newImg.setAttribute('class', 'newImg');
          intersect.object.onClick();
          const point = intersect.object.userData.dataPoint;

          this.loadPoint(point);
          // this.backToScene = true;
          if (this.spriteActive) {
            this.tooltip.nativeElement.classList.remove('is-active');
            this.spriteActive = false;
          }
        }
      });
    } else if (userData.type === 'INFO') {
      const dataInfo = userData.dataPoint;
      this.datainfo = dataInfo;
      this.datainfo['_type_media'] = dataInfo.file_media[0].type.split('/')[0] === 'video' ? 'video' : 'image';
      this.visibleInfo = true;
    }

  }
  datainfo: any;
  visibleInfo: boolean = false;

  onMouseMove = (e: MouseEvent) => {
    let mouse = new Vector2(
      (e.offsetX / this.container.nativeElement.clientWidth) * 2 - 1,
      -(e.offsetY / this.container.nativeElement.clientHeight) * 2 + 1,
    );
    let foundSprite = false;
    this.rayCaster.setFromCamera(mouse, this.camera);
    if (this.rayCaster && this.scene && this.scene.children) {
      const intersects = this.rayCaster.intersectObjects(this.scene.children);
      intersects.forEach((intersect: any) => {
        if (intersect.object.type === "Sprite") {
          let p = intersect.object.position.clone().project(this.camera);
          this.tooltip.nativeElement.style.top = ((-1 * p.y + 0.9) * this.container.nativeElement.offsetHeight / 2) + 'px';
          this.tooltip.nativeElement.style.left = ((p.x + 1) * this.container.nativeElement.offsetWidth / 2) + 'px';
          const src1 = intersect.object.userData.dataPoint['_file_media'];
          this.imgtooltip.nativeElement.src = src1
          this.titletooltip.nativeElement.innerHTML = intersect.object.name;
          this.tooltip.nativeElement.classList.add('is-active');
          this.spriteActive = intersect.object;
          foundSprite = true;
          this.pointHover = true;
        }
      });
    }
    if (foundSprite) {
      this.renderer2.addClass(this.container.nativeElement, 'hover');
    } else {
      this.renderer2.removeClass(this.container.nativeElement, 'hover');
    }
    if (foundSprite === false && this.spriteActive) {
      this.tooltip.nativeElement.classList.remove('is-active');
      this.spriteActive = false;
      this.pointHover = false;
    }
  }

  @HostListener("contextmenu", ["$event"]) onRightClick = (e: MouseEvent) => {
    if (!this.showOnly) {
      let mouse = new Vector2(
        (e.offsetX / this.container.nativeElement.clientWidth) * 2 - 1,
        -(e.offsetY / this.container.nativeElement.clientHeight) * 2 + 1,
      );
      this.rayCaster.setFromCamera(mouse, this.camera);
      this.intersectsVecter = this.rayCaster ? this.rayCaster.intersectObject(this.s.sphere) : [];
      this.rayCaster.setFromCamera(mouse, this.camera);
      let point = this.rayCaster.intersectObjects(this.scene.children);
      this.varMouseRight = point[0].object.userData['ovicPointId'];
    }
  }


  varMouseRight: any;
  pointSelect: Point;
  audioLink: string;
  loadPoint(point: Point) {
    this.pointSelect = point;
    this.audioLink = point.file_audio && point.file_audio[0] ? this.fileService.getPreviewLinkLocalFile(point.file_audio[0]) : null;
    const url = point.file_media && point.file_media[0] ? this.fileService.getPreviewLinkLocalFile(point.file_media[0]) : null;
    this.file_param = {
      file: point.file_media[0],
      file_type: point.file_media[0].type.split('/')[0] === "video" ? "video" : 'image',
      url: this.fileService.getPreviewLinkLocalFile(point.file_media[0])
    }
    this.isVideo = this.file_param.file_type ==='video'?true  :false;
    const pointchild = point['__child'];
    this.s = new PointView(url, this.camera);
    if (pointchild && pointchild[0]) {
      this.addPointInScene(pointchild);
    }
    this.s.createScrene(this.scene, this.file_param, point.id,);
    this.renderSecene();
  }


//===============btn action====================

  btnPlayVideo() {
    this.isVideoPlay=!this.isVideoPlay;
    this.s.btnOnorPauseVideo();
  }

  souseAudio: boolean = false;

  btnPlayAudio() {
    if (this.audio) {
      this.souseAudio = !this.souseAudio;
      if (this.audio.paused) {
        this.audio.play();
      } else {
        this.audio.pause();
      }
    }
  }

  btnplayRotate() {
    this.rotate = !this.rotate;
    if (this.rotate) {
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.4; // Tốc độ quay (đơn 2 vị là radian/giây)
      this.renderSecene()
    } else {
      this.controls.autoRotate = false;
      this.controls.update();
    }
  }

  visibleHelp: boolean = false;

  btnHelp() {
    this.visibleHelp = !this.visibleHelp;
  }
  loadStart(){
    this.LoadNgulieu(this._ngulieu_id);
  }

  async gobackhome(){
    const button = await this.notificationService.confirmRounded('Xác nhận','Trở lại trang chủ',[BUTTON_YES,BUTTON_NO]);
    console.log(BUTTON_YES.name);
    console.log(button);
    if(button.name === BUTTON_YES.name){
      console.log(BUTTON_YES.name);
      console.log(button);
      void this.router.navigate(['home/']);
    }

  }
}
