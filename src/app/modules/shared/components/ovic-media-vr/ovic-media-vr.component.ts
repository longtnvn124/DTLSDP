import {Component, ElementRef, HostListener, Input, OnInit, Renderer2, TemplateRef, ViewChild} from '@angular/core';
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
import {OvicVrPointUserData, sceneControl} from "@shared/models/sceneVr";

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
  toado_map: string;
  root: number;
}

@Component({
  selector: 'ovic-media-vr',
  templateUrl: './ovic-media-vr.component.html',
  styleUrls: ['./ovic-media-vr.component.css']
})
export class OvicMediaVrComponent implements OnInit {
  @ViewChild('fromUpdate', {static: true}) formUpdate: TemplateRef<any>;
  @ViewChild('myCanvas', {static: false}) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container', {static: true}) container: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip', {static: true}) tooltip: ElementRef<HTMLDivElement>;

  // @ViewChild('audio' , {static: true}) audioPlayerRef: ElementRef<HTMLAudioElement>;


  private audio: HTMLAudioElement = document.createElement('audio');
  private imageElements: HTMLImageElement = document.createElement('img');

  @Input() Showspinning: boolean; // hiểu thị nút quay
  @Input() SpinningAction: boolean;// thực hiện quay
  @Input() _ngulieu: Ngulieu;
  @Input() _pointStart: Point;
  @Input() showOnly = false; // if true; remove all mouse events
  @Input() viewRotate: boolean = true;  // view rotate


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
  video360: HTMLVideoElement;
  destination: Ngulieu;
  otherInfo: Ngulieu[];
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
    this.video360 = this.renderer2.createElement('video');
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
      this.renderer.dispose();
      this.video360.pause();
      this.video360.remove();
    }
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
        {name: 'vị trí mới', path: './assets/icon-png/pin.png'},
        {name: 'Chuyển cảnh', path: './assets/icon-png/chuyencanh.png'},
      ];

    if (this._ngulieu) {

      this.startSceneByNgulieu();
    }
    if (this._pointStart) {

    }
  }

  dataPoint: Point[];

  startSceneByNgulieu() {
    const ngulieu_id = this._ngulieu.id;
    this.backToScene = false;
    this.notificationService.isProcessing(true);
    if (this._ngulieu.loaingulieu === 'image360') {
      this._ngulieu['_audioLink'] = this._ngulieu.file_audio ? this.fileService.getPreviewLinkLocalFile(this._ngulieu.file_audio[0]) : null;
      this._ngulieu['_mediaLink'] = this._ngulieu.file_media ? this.fileService.getPreviewLinkLocalFile(this._ngulieu.file_media[0]) : null;
    } else {
      if (this._ngulieu.loaingulieu === 'video360') {
        this._ngulieu['_mediaLink'] = this._ngulieu.file_media ? this.fileService.getPreviewLinkLocalFile(this._ngulieu.file_media[0]) : null;
        this._ngulieu['_audioLink'] = this._ngulieu.file_audio && this._ngulieu.file_audio[0] ? this.fileService.getPreviewLinkLocalFile(this._ngulieu.file_audio[0]) : null;
      }
    }
    this.pointsService.getAllData().subscribe({
      next: (data) => {
        const ngulieu_id = this._ngulieu.id;
        this.pointChild = data.find(f => f.ngulieu_id === ngulieu_id) ? data.map(m => {
          m['_child'] = data.filter(f => f.parent_id === m.id);
          m['_file_media_converted'] = m.file_media && m.file_media[0] ? this.fileService.getPreviewLinkLocalFile(m.file_media[0]):'';
          m['_file_audio_converted'] = m.file_audio && m.file_audio[0] ? this.fileService.getPreviewLinkLocalFile(m.file_audio[0]):'';
          return m;
        }).filter(f => f.ngulieu_id === ngulieu_id && f.parent_id === 0) : [];

        console.log(this.pointChild);
        this.loadInit(this.pointChild, ngulieu_id, this._ngulieu['_audioLink'], this._ngulieu, 0);
        this.notificationService.isProcessing(false);
      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất Kết nối với máy chủ');
      }
    })
  }

  scenePrev: sceneControl;

  loadInit(pointChild: convertPoint[], ngulieu_id: number, audio: string, ngulieu?: Ngulieu, idPointStart?: number) {
    if (audio) {
      this.audio.src = audio;
    }
    //scene and controls
    this.sceneAndControl()

    if (ngulieu) {
      console.log(ngulieu);
      const src = ngulieu['__media_link'];

      if (ngulieu.loaingulieu == "video360") {
        console.log(ngulieu);
        this.scenePrev = new sceneControl(src, this.camera, null);
        this.renderer2.setAttribute(this.video360, 'src', src);
        this.renderer2.setAttribute(this.video360, 'loop', 'true');
        this.renderer2.setAttribute(this.video360, 'autoplay', 'true');
        this.renderer2.setAttribute(this.video360, 'playsinline', 'true');
        this.renderer2.setAttribute(this.video360, 'crossorigin', 'anonymous');
        this.scenePrev.createMovie(this.scene, this.video360);
        console.log(this.scene);
        console.log(this.scenePrev);

      }
      if (ngulieu.loaingulieu == "image360") {
        this.scenePrev = new sceneControl(src, this.camera, null);
        this.scenePrev.createScrene(this.scene, idPointStart);
        console.log(this.scene);
        console.log(this.scenePrev);
      }

      if (pointChild && pointChild.length) {
        this.addPointInScene(pointChild);
      }
      this.renderSecene();
    }


  }

  addPointInScene(data: convertPoint[]) {
    data.forEach(f => this.pinInScene(f, false));
  }

  pinInScene(pin: convertPoint, renderScene: boolean = true) {
    if (pin.type === "DIRECT") {
      const typeMedia = pin.file_media[0].type.split('/')[0];
      console.log(pin.file_media[0]);
      console.log(typeMedia);
      const medialink = pin.file_media ? this.fileService.getPreviewLinkLocalFile(pin.file_media[0]) : '';
      if (medialink) {
        let newPoint = new sceneControl(medialink, this.camera, '');
        const locationX = pin.location['x'];
        const locationY = pin.location['y'];
        const locationZ = pin.location['z'];
        this.scenePrev.addPoint({
          position: new Vector3(locationX, locationY, locationZ),
          name: pin.title,
          scene: newPoint,
          userData: {
            ovicPointId: pin.id,
            iconPoint: pin.icon,
            dataPoint: pin,
            type: pin.type,
            parentPointId: this._pointStart ? this._pointStart.id : 0,
            ngulieu_id: this._ngulieu ? this._ngulieu.id : 0
          }
        });
        if (typeMedia =="video") {
          console.log('create video');
          this.scenePrev.createMovie(this.scene, this.video360, pin.id, {
            ovicPointId: pin.id,
            iconPoint: pin.icon,
            dataPoint: pin,
            type: pin.type,
            parentPointId: this._pointStart ? this._pointStart.id : this._ngulieu.id,
          });
          this.scenePrev.appear();
        }
        // if (typeMedia === "jpg") {
        if (typeMedia == "image") {
          console.log('create image');

          this.scenePrev.createScrene(this.scene, pin.id, false, {
            ovicPointId: pin.id,
            iconPoint: pin.icon,
            dataPoint: pin,
            type: pin.type,
            parentPointId: this._pointStart ? this._pointStart.id : this._ngulieu.id,
          });
          this.scenePrev.appear();
        }
      }
    }
    if (pin.type === "INFO") {
      let newPoint = new sceneControl(null, this.camera, null);
      if (pin.location) {
        const locationX = pin.location['x'];
        const locationY = pin.location['y'];
        const locationZ = pin.location['z'];
        this.scenePrev.addPoint({
          position: new Vector3(locationX, locationY, locationZ),
          name: pin.title,
          scene: newPoint,
          userData: {
            ovicPointId: pin.id,
            iconPoint: pin.icon,
            dataPoint: pin,
            type: pin.type,
            parentPointId: this._pointStart ? this._pointStart.id : this._ngulieu.id
          }
        });
        this.scenePrev.createScrene(this.scene, pin.id, false, {
          ovicPointId: pin.id,
          iconPoint: pin.icon,
          dataPoint: pin,
          type: pin.type,
          parentPointId: this._pointStart ? this._pointStart.id : this._ngulieu.id,
        });
        this.scenePrev.appear();
      }
    }
    if (renderScene) {
      this.renderSecene();
    }

  }

  sceneAndControl() {
    //scene and controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.scene = new Scene();
    this.controls.rotateSpeed = -0.3;
    this.controls.enableZoom = false;
    this.camera.position.set(-0.1, 0, 0.1);
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
      return
    }

    if (userData.type === "DIRECT") {

      intersects.forEach((intersect: any) => {
        if (intersect.object.type === "Sprite") {
          intersect.object.onClick();
          this.backToScene = true;
          if (this.spriteActive) {
            this.tooltip.nativeElement.classList.remove('is-active');
            this.spriteActive = false;
          }
        }
      });
    }
    else if (userData.type === "INFO") {
      const datainfo = userData.dataPoint;
      this.datainfo =datainfo ? datainfo :{};
      console.log(this.datainfo);
      this.datainfo['_type_media'] = datainfo.file_media[0] ? datainfo.file_media[0].type.split('/')[0]:null;
      this.visibleInfo = true;
    }
    console.log(userData.type);
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
          this.tooltip.nativeElement.classList.add('is-active');
          this.tooltip.nativeElement.innerHTML = intersect.object.name;
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
  varMouseRight: number;


  @HostListener("contextmenu", ["$event"]) onRightClick = (e: MouseEvent) => {
    if (!this.showOnly) {
      // let mouse = new Three.Vector2(
      let mouse = new Vector2(
        (e.offsetX / this.container.nativeElement.clientWidth) * 2 - 1,
        -(e.offsetY / this.container.nativeElement.clientHeight) * 2 + 1,
      );
      this.rayCaster.setFromCamera(mouse, this.camera);
      // let intersectss = this.rayCaster ? this.rayCaster.intersectObject(this.s.sphere) : [];
      // this.intersectsVecter = intersectss;
      this.intersectsVecter = this.rayCaster ? this.rayCaster.intersectObject(this.scenePrev.sphere) : [];
      this.rayCaster.setFromCamera(mouse, this.camera);
      let point = this.rayCaster.intersectObjects(this.scene.children);
      this.varMouseRight = point[0].object.userData['ovicPointId'] ? point[0].object.userData['ovicPointId'] :0;
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
            command: () => this.btnFormEdit()
          },
          {
            label: 'Xoá vị trí',
            icon: 'pi pi-trash',
            command: () => this.btnFormDelete()
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

// ========================= btn =========================================
  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }

  saveForm() {
    console.log(this.formSave.valid);
    console.log(this.formSave.value);
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
            this.pinInScene(newPin, false);
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
          parent_id: pointIdParent | 0,
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

  btnFormAdd(idPointhere) {
    this.changeInputMode("add", null, idPointhere)
    this.onOpenFormEdit();
  }

  // pointChild: convertPoint[];

  btnFormEdit() {
    this.onOpenFormEdit();
    const object = this.pointChild.find(f => f.id === this.varMouseRight);
    this.changeInputMode("edit", object)

  }

  async btnFormDelete() {
    const idDelete = this.varMouseRight;
    const xacNhanXoa = await this.notificationService.confirmDelete();
    if (xacNhanXoa) {
      this.notificationService.isProcessing(true);
      this.pointsService.delete(idDelete).subscribe({
        next: () => {
          this.scenePrev.deletePoint(idDelete);
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

  rotate: boolean = false;
  sound: boolean = false;

  btnPlayVideo() {
    if (this.video360.paused) {
      this.video360.play();
    } else {
      this.video360.pause();
    }
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
    // if (this.audioLink) {
    //   this.souseAudio = !this.souseAudio;
    //   // console.log(this.audioPlayerRef);
    //   // if (this.souseAudio) {
    //   //   this.audioPlayerRef.nativeElement.play();
    //   // } else {
    //   //   this.audioPlayerRef.nativeElement.pause();
    //   // }
    //   this.audio.src = this.audioLink;
    //   this.audio.play();
    //
    // } else {
    //   this.notificationService.toastError('Điểm truy cập này chưa gắn audio');
    // }
  }

  btnplayRotate() {
    this.rotate = !this.rotate;
    if (this.rotate) {
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.8; // Tốc độ quay (đơn 2 vị là radian/giây)
      this.renderSecene()
    } else {
      this.controls.autoRotate = false;
      this.controls.update();
    }
  }

  visibleHelp: boolean = false;

  btnInfo() {
    this.visibleHelp = !this.visibleHelp;
  }

  unListen() {
    this.audioLink = null;
    // this.audioPlayerRef.nativeElement.pause();
    // this.audioPlayerRef.nativeElement.remove();
    this.audio.pause();
    this.rotate = false;
    this.video360.pause();
    this.video360.remove();
    this.scene.clear();
    this.renderer.dispose();
    this.controls.dispose();
  }


  showMap: boolean = false;

  btnviewMap() {
    this.showMap = !this.showMap;
  }

  //==========================btn next,back===================================
  currentImageIndex: number = 0;
  dataNextBack = [];
  pointSelect: Point;

  convertDataChild() {
    if (this._pointStart) {
      this.dataNextBack.push(this._pointStart);
    }
    if (this.pointChild) {
      const newPointChild = this.pointChild.filter(f => f.type === "DIRECT");
      for (const item of newPointChild) {
        this.dataNextBack.push(item);
        const child = item['__child'] && item['__child'].length ? item['__child'] : [];
        if (child !== []) {
          for (const item1 of child.filter(b => b.type === "DIRECT")) {
            this.dataNextBack.push(item1);
          }
        }
      }
    }
  }

  //
  // btnNext() {
  //   this.notificationService.isProcessing(true);
  //   const countChild = this.dataNextBack.length;
  //   this.currentImageIndex = (this.currentImageIndex + 1) % countChild;
  //
  //   this.changeImage();
  //   this.notificationService.isProcessing(false);
  //
  // }
  //
  // btnBack() {
  //   this.notificationService.isProcessing(true);
  //   const countChild = this.dataNextBack.length;
  //   this.currentImageIndex = (this.currentImageIndex - 1 + countChild) % countChild;
  //   this.changeImage();
  //   this.notificationService.isProcessing(false);
  // }
  //
  // changeImage() {
  //   this.unListen();
  //   const currentImage = this.dataNextBack[this.currentImageIndex];
  //   this.pointSelect = currentImage;
  //   // this.startSeenByDiemtruycap(currentImage);
  // }

}
