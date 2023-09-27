import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild
} from '@angular/core';
import {Ngulieu} from "@shared/models/quan-ly-ngu-lieu";
import {Pinable, Point} from "@shared/models/point";
import {TypeOptions} from "@shared/utils/syscat";
import {PerspectiveCamera, Raycaster, Scene, Vector2, Vector3, WebGLRenderer} from "three";
import {OrbitControls} from "@three-ts/orbit-controls";
import {MenuItem} from "primeng/api/menuitem";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NotificationService} from "@core/services/notification.service";
import {FileService} from "@core/services/file.service";
import {AuthService} from "@core/services/auth.service";
import {PointsService} from "@shared/services/points.service";
import {FilePointView, PointView, OvicVrPointUserData} from "@shared/models/pointView";

export interface convertPoint extends Pinable {
  id: number;
  icon: string;
  title: string;
  mota: string;
  location: number[]; // vi tri vector3
  type: 'DIRECT' | 'INFO'; //DIRECT | INFO
  parent_id: number; //ngulieu_id
  donvi_id: number;
  ds_ngulieu: Ngulieu[]; //danh sách audio | hảnh 360 | video360 ;
  toado_map: string;
  root: number;
}

@Component({
  selector: 'ovic-media-vr',
  templateUrl: './ovic-media-vr.component.html',
  styleUrls: ['./ovic-media-vr.component.css']
})
export class OvicMediaVrComponent implements OnInit, OnDestroy {
  @ViewChild('fromUpdate', {static: true}) formUpdate: TemplateRef<any>;
  @ViewChild('container', {static: true}) container: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip', {static: true}) tooltip: ElementRef<HTMLDivElement>;
  @ViewChild('imgtooltip', {static: true}) imgtooltip: ElementRef<HTMLImageElement>;
  @ViewChild('titletooltip', {static: true}) titletooltip: ElementRef<HTMLDivElement>;

  @Input() showOnly: boolean = false;
  @Input() _ngulieu: Ngulieu;
  @Input() _pointStart: Point;
  @Input() viewRotate: boolean = true;  // view rotate
  @Input() rotate: boolean = false;

  @HostListener('window:resize', ['$event']) onResize1(event: Event): void {
    this.isSmallScreen = window.innerWidth < 500;
  }

  isSmallScreen: boolean = window.innerWidth < 500;

  private audio: HTMLAudioElement = document.createElement('audio');

  isVideo: boolean;
  index: number = 1;

  formState: {
    formType: 'add' | 'edit',
    showForm: boolean,
    formTitle: string,
    object: Pinable | null
  } = {
    formType: 'add',
    showForm: false,
    formTitle: '',
    object: null
  }
  menuName: 'Point-location';
  filePermission = {
    canDelete: true,
    canDownload: true,
    canUpload: true
  };
  iconList: { name: string, path: string }[];
  typeOptions = TypeOptions;
  permission = {
    isExpert: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
  }
  pointChild: convertPoint[] = [];
  backToScene: boolean = false;
  audioLink: string;
  pointHover: boolean = false;
  spriteActive = false;
  scene: Scene;
  camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  controls: OrbitControls;
  rayCaster = new Raycaster();
  renderer = new WebGLRenderer({antialias: true});
  intersectsVecter: any;

  // =======================menu right click=================================
  items: MenuItem[];
  formSave: FormGroup;

  constructor(
    private notificationService: NotificationService,
    private element: ElementRef,
    private renderer2: Renderer2,
    private fileService: FileService,
    private auth: AuthService,
    private fb: FormBuilder,
    private pointsService: PointsService,
  ) {
    this.formSave = this.fb.group({
      title: ['', Validators.required],
      icon: ['', Validators.required],
      mota: [''],
      location: [''], // vi tri vector3
      parent_id: [0],
      type: ['', Validators.required], //DIRECT | INFO
      ds_ngulieu: [[]], // ảnh 360 | video360// audio thuyết minh
      donvi_id: [null],
      ngulieu_id: [0],
      file_media: [[]],
      file_audio: [[]],
    });
  }

  ngOnDestroy(): void {
    if (this.scene) {
      this.scene.clear();
      this.scene.remove();
      this.renderer.dispose();
    }
    this.audio.pause();
    this.audio.remove();
  }

  ngAfterViewInit(): void {
    this.container.nativeElement.addEventListener('resize', this.onResize);
    this.container.nativeElement.addEventListener('click', this.onClick);
    this.container.nativeElement.addEventListener('mousemove', this.onMouseMove);
    if (!this.showOnly) {
      this.container.nativeElement.addEventListener('contextmenu', this.onRightClick);
    }
  }

  ngOnInit(): void {
    this.iconList =
      [
        {name: 'Thông tin chi tiết ', path: './assets/icon-png/infomation.png'},
        {name: 'vị trí mới', path: './assets/icon-png/pin.gif'},
        {name: 'Chuyển cảnh', path: './assets/icon-png/chuyencanh.png'},
      ];

    if (this._ngulieu) {

      this.startSceneByNgulieu();
    }
    if (this._pointStart) {

    }
  }

  dataPointsChild: convertPoint[];
  ngulieuStart: Ngulieu;

  startSceneByNgulieu() {
    const ngulieu_id = this._ngulieu.id;
    this.backToScene = false;
    this.notificationService.isProcessing(true);


    this.ngulieuStart = this._ngulieu;

    this.ngulieuStart['_file_media'] = this.ngulieuStart.file_media && this.ngulieuStart.file_media[0] ? this.fileService.getPreviewLinkLocalFile(this.ngulieuStart.file_media[0]) : '';
    this.ngulieuStart['_file_audio'] = this.ngulieuStart.file_audio && this.ngulieuStart.file_audio[0] ? this.fileService.getPreviewLinkLocalFile(this.ngulieuStart.file_audio[0]) : '';

    this.pointsService.getAllData().subscribe({
      next: (data) => {
        const ngulieu_id = this._ngulieu.id;
        this.dataPointsChild = data.find(f => f.ngulieu_id === ngulieu_id) ? data.map(m => {
          m['_child'] = data.filter(f => f.parent_id === m.id);
          m['_file_media'] = m.file_media && m.file_media[0] ? this.fileService.getPreviewLinkLocalFile(m.file_media[0]) : '';
          m['_file_audio'] = m.file_audio && m.file_audio[0] ? this.fileService.getPreviewLinkLocalFile(m.file_audio[0]) : '';
          return m;
        }).filter(f => f.ngulieu_id === ngulieu_id && f.parent_id === 0) : [];
        this.ngulieuStart['_points_child'] = this.dataPointsChild ? this.dataPointsChild : [];
        this.loadInit(this.ngulieuStart);
        this.notificationService.isProcessing(false);
      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất Kết nối với máy chủ');
      }
    })
  }

  file_param: FilePointView;
  scenePrev: PointView;

  loadInit(item: Ngulieu) {
    if (item.file_audio && item.file_audio[0]) {
      this.audio.src = item['_file_audio'];
      this.audio.setAttribute('autoplay', 'true');
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
      this.file_param = {
        file: item.file_media[0],
        file_type: file_type,
        url: item['_file_media']
      };
      this.isVideo = this.file_param.file_type === 'video' ? true : false;
      this.scenePrev = new PointView(src, this.camera);

      if (this.dataPointsChild && this.dataPointsChild.length) {
        this.addPointInScene(this.dataPointsChild)
      } else {
        console.log('data not point');
      }
      this.scenePrev.createScrene(this.scene, this.file_param, item.id);
      this.renderSecene();
    }
  }

  addPointInScene(data: convertPoint[]) {
    data.forEach(f => this.pinInScene(f, true))
  }

  pinInScene(pin: convertPoint, renderScene: boolean = false) {
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
      this.scenePrev.addPoint(
        {
          position: new Vector3(locationX, locationY, locationZ),
          name: pin.title,
          scene: newPoint,
          userData: {
            ovicPointId: pin.id,
            iconPoint: pin.icon,
            dataPoint: pin,
            type: pin.type,
            parentPointId: pin.id ? pin.id : 0,
            ngulieu_id: this.ngulieuStart.id ? this.ngulieuStart.id : 0,
            file_media: pin_media
          },
        });
    }

    if (renderScene) {
      this.renderSecene();
    }
  }

  //-------------------------------- render + onclick-----------------------------
  renderSecene() {
    this.renderer.setSize(this.container.nativeElement.clientWidth, this.container.nativeElement.clientHeight);
    this.renderer2.appendChild(this.container.nativeElement, this.renderer.domElement);
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
    animate()
  }

  //======================sukien-onclick======================
  onResize = () => {
    let width = this.container.nativeElement.clientWidth;
    let height = this.container.nativeElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.render(this.scene, this.camera);
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
      this.intersectsVecter = this.rayCaster ? this.rayCaster.intersectObject(this.scenePrev.sphere) : [];
      this.rayCaster.setFromCamera(mouse, this.camera);
      let point = this.rayCaster.intersectObjects(this.scene.children);

      this.varMouseRight = point[0].object.userData;
      if (point[0].object.name == '') {
        this.items = [
          {
            label: 'Thêm điểm truy cập mới',
            icon: 'pi pi-plus',
            command: () => this.btnFormAdd(this.varMouseRight)
          },
          // {
          //   label: 'Thêm mới thông tin ',
          //   icon: 'pi pi-plus',
          //   command: () => this.btnFormAdd('THONGTIN')
          // },
        ]
      } else {
        this.items = [
          {
            label: 'Cập nhật vị trí',
            icon: 'pi pi-file-edit',
            command: () => this.btnFormEdit(this.varMouseRight.ovicPointId)
          },
          {
            label: 'Xoá vị trí',
            icon: 'pi pi-trash',
            command: () => this.btnFormDelete(this.varMouseRight.ovicPointId)
          },
          {
            label: 'Thông tin chi tiết',
            icon: 'pi pi-info-circle',
            command: () => this.btnFormInformation()
          },
        ];
      }

    }
  }

  varMouseRight: any;
  pointSelect: Point;

  loadPoint(point: Point) {
    this.pointSelect = point;
    this.audioLink = point.file_audio && point.file_audio[0] ? this.fileService.getPreviewLinkLocalFile(point.file_audio[0]) : null;
    const url = point.file_media && point.file_media[0] ? this.fileService.getPreviewLinkLocalFile(point.file_media[0]) : null;
    this.file_param = {
      file: point.file_media[0],
      file_type: point.file_media[0].type.split('/')[0] === "video" ? "video" : 'image',
      url: this.fileService.getPreviewLinkLocalFile(point.file_media[0])
    }
    this.isVideo = this.file_param.file_type === 'video' ? true : false;
    const pointchild = point['_child'];
    this.scenePrev = new PointView(url, this.camera);
    if (pointchild && pointchild[0]) {
      this.addPointInScene(pointchild);
    }
    this.scenePrev.createScrene(this.scene, this.file_param, point.id,
      {
        file_media: null,
        type: point.type,
        iconPoint: null,
        parentPointId: point.id,
        dataPoint: point,
        ngulieu_id: this.ngulieuStart.id,
        ovicPointId: point.id
      });

    this.renderSecene();
  }

  isVideoPlay: boolean = true;

  btnPlayVideo() {
    this.isVideoPlay = !this.isVideoPlay;
    this.scenePrev.btnOnorPauseVideo();
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

//==========================================================
  closeForm() {
    this.notificationService.closeSideNavigationMenu();
  }

  onOpenFormEdit() {
    setTimeout(() => this.notificationService.openSideNavigationMenu({
      template: this.formUpdate,
      size: 700,
      offsetTop: '0'
    }), 100);
    this.controls.saveState();
  }

  changeInputMode(formType: 'add' | 'edit', object: convertPoint | null = null, pointIdParent?: number) {
    this.formState.formTitle = formType === 'add' ? 'Thêm điểm truy cập mới ' : 'Cập nhật điểm truy cập';
    this.formState.formType = formType;
    if (formType === 'add') {
      this.formSave.reset(
        {
          title: '',
          mota: '',
          icon: '',
          location: this.intersectsVecter[0].point,// vi tri vector3
          parent_id: pointIdParent === this._ngulieu.id ? 0 : pointIdParent,
          type: 'INFO', //DIRECT | INFO
          ds_ngulieu: [], // ảnh 360 | video360// audio thuyết minh
          donvi_id: this.auth.userDonViId,
          ngulieu_id: this._ngulieu.id,
          file_media: [],
          file_audio: []
        }
      );
    } else {
      this.formState.object = object;
      this.formSave.reset(
        {
          title: object.title,
          mota: object.mota,
          icon: object.icon,
          location: object.location, // vi tri vector3
          parent_id: object.parent_id,
          type: object.type, //DIRECT | INFO
          ds_ngulieu: object.ds_ngulieu, // ảnh 360 | video360
          donvi_id: this.auth.userDonViId,
          ngulieu_id: this._ngulieu.id,
          file_media: object.file_media,
          file_audio: object.file_audio,
        }
      );
    }
  }

  btnFormAdd(pointData: OvicVrPointUserData) {
    this.parentId = pointData.ovicPointId;
    console.log(this.parentId);
    this.changeInputMode("add", null, pointData.ovicPointId)
    this.onOpenFormEdit();
  }

  btnFormEdit(id: number) {
    this.parentId = id;
    this.onOpenFormEdit();
    const object = this.dataPointsChild.find(f => f.id === id);
    this.changeInputMode("edit", object)

  }

  parentId: number;

  async btnFormDelete(id: number) {
    // const idDelete = this.varMouseRight;
    const xacNhanXoa = await this.notificationService.confirmDelete();
    if (xacNhanXoa) {
      this.notificationService.isProcessing(true);
      this.pointsService.delete(id).subscribe({
        next: () => {
          this.scenePrev.deletePoint(id);
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Thao tác thành công');
        },
        error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Thao tác thất bại');
        }
      });
    }
  }

  btnFormInformation() {

  }

  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }

  saveForm() {

    if (this.formSave.valid) {
      const newPin: convertPoint = {
        id: 0,
        icon: this.f['icon'].value,
        title: this.f['title'].value,
        mota: this.f['mota'].value,
        location: this.f['location'].value,
        type: this.f['type'].value,
        parent_id: this.f['parent_id'].value | 0,
        donvi_id: this.f['donvi_id'].value,
        ds_ngulieu: this.f['ds_ngulieu'].value,
        toado_map: '',
        root: 0,
        ngulieu_id: this.f['ngulieu_id'].value,
        file_audio: this.f['file_audio'].value,
        file_media: this.f['file_media'].value,
      }
      if (this.formState.formType === 'add') {
        this.notificationService.isProcessing(true);
        this.pointsService.create(this.formSave.value).subscribe({
          next: (id) => {
            newPin.id = id;

            if (newPin.parent_id == 0) {
              this.dataPointsChild.push(newPin);
              this.pinInScene(newPin, true);
            }
            if (newPin.parent_id !== 0) {
              this.dataPointsChild.find(f => f.id === newPin.parent_id)['_child'].push(newPin);
              this.pinInScene(newPin, true);

            }
            this.pointChild.push(newPin)
            this.formSave.reset({
              icon: '',
              title: '',
              mota: '',
              location: this.intersectsVecter,
              type: '',
              parent_id: 0,
              donvi_id: this.auth.userDonViId,
              ds_ngulieu: [],
              ngulieu_id: this._ngulieu.id,
              file_media: [],
              file_audio: []
            });
            this.notificationService.isProcessing(false);
            this.notificationService.toastSuccess("Thêm mới thành công");
            this.loadPointInDatabase(this.parentId);
            this.closeForm();
          }, error: () => {
            this.notificationService.toastError("Thêm mới thất bại");
            this.notificationService.isProcessing(false);
          }
        })
      } else {
        this.notificationService.isProcessing(true);
        this.pointsService.update(this.formState.object.id, this.formSave.value).subscribe({
          next: () => {
            newPin.id = this.formState.object.id;
            this.scenePrev.deletePoint(this.formState.object.id);
            this.pinInScene(newPin, false);
            this.renderSecene();
            this.notificationService.isProcessing(false);
            this.notificationService.toastSuccess('Cập nhật thành công');
          }, error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastSuccess('Cập nhật không thành công');
          }
        })
      }
    } else {
      this.notificationService.toastError('Lỗi nhập liệu');
    }
  }

  showMap: boolean;

  btnviewMap() {
    this.showMap = !this.showMap;
  }

  loadPointInDatabase(idPoint: number) {
    this.pointsService.getAllData().subscribe({
      next: (data) => {
        const ngulieu_id = this._ngulieu.id;
        const dataPointsChild = data.find(f => f.ngulieu_id === ngulieu_id) ? data.map(m => {
          m['_child'] = data.filter(f => f.parent_id === m.id);
          m['_file_media'] = m.file_media && m.file_media[0] ? this.fileService.getPreviewLinkLocalFile(m.file_media[0]) : '';
          m['_file_audio'] = m.file_audio && m.file_audio[0] ? this.fileService.getPreviewLinkLocalFile(m.file_audio[0]) : '';
          return m;
        }) : [];
        console.log(idPoint);
        console.log(this.dataPointsChild);// pass
        this.pointSelect = dataPointsChild.find(f => f.id === idPoint) ? dataPointsChild.find(f => f.id === idPoint) : null;
        console.log(this.pointSelect);
        if (this.pointSelect) {

          this.loadPoint(this.pointSelect);
        }

      }, error: () => {

      }
    })
  }

  loadStart(){
    this.loadInit(this.ngulieuStart);
  }
}
