import {
  Component,
  ElementRef, HostListener,
  Input,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild
} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators} from "@angular/forms";
import {FileService} from "@core/services/file.service";
import {MediaService} from "@shared/services/media.service";
import {AuthService} from "@core/services/auth.service";
import {NotificationService} from "@core/services/notification.service";
import {Ngulieu} from '@modules/shared/models/quan-ly-ngu-lieu';
import {Pinable, Point} from '@modules/shared/models/point';
import {TypeOptions} from "@shared/utils/syscat";
import {
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {MenuItem} from "primeng/api/menuitem";
import {PointsService} from "@shared/services/points.service";
import {EmployeesPickerService} from "@shared/services/employees-picker.service";
import {OvicVrPointUserData, sceneControl} from "@shared/models/sceneVr";
import {DanhMucDiemDiTichService} from "@shared/services/danh-muc-diem-di-tich.service";
import {DmDiemDiTich} from "@shared/models/danh-muc";
import {OvicFile} from "@core/models/file";
import {DownloadProcess} from "@shared/components/ovic-download-progress/ovic-download-progress.component";

const PinableValidator = (control: AbstractControl): ValidationErrors | null => {
  if (control.get('type').valid && control.get('type').value) {
    if (control.get('type').value === 'DIRECT') {
      return control.get('ds_ngulieu').value && Array.isArray(control.get('ds_ngulieu').value) && control.get('ds_ngulieu').value.some(nl => ['image360', 'video360'].includes(nl['loaingulieu'])) ? null : {invalidPinable: true}
    } else {
      return null;
    }
  } else {
    return {invalid: true};
  }
}

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
  selector: 'ovic-input-vr-media',
  templateUrl: './ovic-input-vr-media.component.html',
  styleUrls: ['./ovic-input-vr-media.component.css']
})
export class OvicInputVrMediaComponent implements OnInit {
  @ViewChild('fromUpdate', {static: true}) formUpdate: TemplateRef<any>;
  @ViewChild('myCanvas', {static: false}) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container', {static: true}) container: ElementRef<HTMLDivElement>;
  @ViewChild('audio', {static: true}) audio: ElementRef<HTMLAudioElement>;
  @ViewChild('tooltip', {static: true}) tooltip: ElementRef<HTMLDivElement>;

  @Input() Showspinning: boolean; // hiểu thị nút quay
  @Input() SpinningAction: boolean;// thực hiện quay

  @Input() AudioAction: boolean;

  @Input() ngulieu: Ngulieu;
  @Input() _pointStart: Point;
  @Input() showOnly = false; // if true  remove all mouse events

  menuName: 'Point-location';
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
  iconList: { name: string, path: string }[];
  // viewMode = [
  //   {label: 'Truy cập trực tiếp', value: 'DIRECT'},
  //   {label: 'Thông tin trực tiếp', value: 'INFO'},
  // ];
  typeOptions = TypeOptions;
  audioLink: string;
  video360: HTMLVideoElement;
  destination: Ngulieu;
  otherInfo: Ngulieu[];
  pointHover: boolean;
  dmDiemDitich: DmDiemDiTich[];
  pointChild: convertPoint[];
  //----------------three js------------------
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
  backToScene: boolean = false;

  constructor(
    private notificationService: NotificationService,
    private element: ElementRef,
    private renderer2: Renderer2,
    private fileService: FileService,
    private auth: AuthService,
    private fb: FormBuilder,
    private pointsService: PointsService,
    private mediaService: MediaService,
    private employeesPickerService: EmployeesPickerService,
    private danhMucDiemDiTichService: DanhMucDiemDiTichService
  ) {
    this.video360 = this.renderer2.createElement('video');

    this.formSave = this.fb.group({
      title: ['', Validators.required],
      icon: ['', Validators.required],
      mota: [''],
      location: ['', Validators.required], // vi tri vector3
      ditich_id: [null],
      parent_id: [null, Validators.required],//
      type: ['', Validators.required], //DIRECT | INFO
      ds_ngulieu: [[]], // ảnh 360 | video360// audio thuyết minh
      donvi_id: [null, Validators.required],
    }, {validators: PinableValidator});

    this.formSave.get('type').valueChanges.subscribe(value => {
      if (this.f['ds_ngulieu'].value && Array.isArray(this.f['ds_ngulieu'].value)) {
        if (value === 'DIRECT') {
          this.destination = this.f['ds_ngulieu'].value.find(n => ['image360', 'video360'].includes(n['loaingulieu']));
          this.otherInfo = this.f['ds_ngulieu'].value.filter(n => !['image360', 'video360'].includes(n['loaingulieu']));
        } else {
          this.destination = null;
          this.otherInfo = this.f['ds_ngulieu'].value;
        }
      } else {
        this.destination = null;
        this.otherInfo = [];
      }
    });
    this.formSave.get('ds_ngulieu').valueChanges.subscribe(value => {
      if (value && Array.isArray(value)) {
        if (this.formSave.get('type').value === 'DIRECT') {
          this.destination = this.f['ds_ngulieu'].value.find(n => ['image360', 'video360'].includes(n['loaingulieu']));
          this.otherInfo = this.f['ds_ngulieu'].value.filter(n => !['image360', 'video360'].includes(n['loaingulieu']));
        } else {
          this.destination = null;
          this.otherInfo = this.f['ds_ngulieu'].value;
        }
      } else {
        this.destination = null;
        this.otherInfo = [];
      }
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
    } else {
    }

  }

  ngOnInit() {
    this.danhMucDiemDiTichService.getDataUnlimit().subscribe({next: (data) => this.dmDiemDitich = data})
    this.iconList =
      [
        {name: 'Thông tin chi tiết ', path: './assets/icon-png/infomation.png'},
        {name: 'vị trí mới', path: './assets/icon-png/pin.png'},
        {name: 'Chuyển cảnh', path: './assets/icon-png/chuyencanh.png'},
      ];
    if (this._pointStart) {
      this.pointSelect = this._pointStart;
      this.startSeenByDiemtruycap(this._pointStart);
    }
    if (this.pointChild) {
      this.convertDataChild();
    }
    if(this.ngulieu){
      this.startSeenByNguLieu();
    }
  }

  startSeenByDiemtruycap(pointStart: Point) {
    this.notificationService.isProcessing(true);
    const nglieu = pointStart.ds_ngulieu;
    const pointChild = pointStart['__child'];
    this.pointChild = pointChild;
    const nglieuDerect = nglieu.find(f => f.loaingulieu === "video360" || f.loaingulieu === "image360");
    const nguleuAudio = nglieu.find(f => f.loaingulieu === "audio");
    const nglieuInfo = nguleuAudio ? nglieu.filter(f => f.id !== nglieuDerect.id && f.id !== nguleuAudio.id) : nglieu.filter(f => f.id !== nglieuDerect.id);
    this.loadInit({
      nglieuPoind: nglieuDerect,
      nglieuAudio: nguleuAudio,
      pointChild: pointChild,
      idPointStart: pointStart.id
    });
    this.notificationService.isProcessing(false);

  }
  startSeenByNguLieu(){

  }
  s: sceneControl;

  loadInit({nglieuPoind, nglieuAudio, pointChild, idPointStart}: { nglieuPoind: Ngulieu, nglieuAudio?: Ngulieu, pointChild?: Point[], idPointStart: number }) {

    if (nglieuAudio) {
      this.audioLink = this.fileService.getPreviewLinkLocalFile(nglieuAudio.file_media[0]);

    }
    if (nglieuPoind) {
      const src = this.fileService.getPreviewLinkLocalFile(nglieuPoind.file_media[0]);

      //scene and controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.scene = new Scene();
      this.controls.rotateSpeed = -0.3;
      this.controls.enableZoom = false;
      this.camera.position.set(-0.1, 0, 0.1);
      // Sphere
      if (nglieuPoind.loaingulieu === 'video360') {
        this.s = new sceneControl(src, this.camera, null);
        this.renderer2.setAttribute(this.video360, 'src', src);
        this.renderer2.setAttribute(this.video360, 'loop', 'true');
        this.renderer2.setAttribute(this.video360, 'autoplay', 'true');
        this.renderer2.setAttribute(this.video360, 'playsinline', 'true');
        this.renderer2.setAttribute(this.video360, 'crossorigin', 'anonymous');
        this.s.createMovie(this.scene, this.video360);
      }
      if (nglieuPoind.loaingulieu === 'image360') {
        this.s = new sceneControl(src, this.camera, null);

        this.s.createScrene(this.scene, idPointStart);
      }
      if (pointChild && pointChild.length) {
        this.addPointInScene(pointChild);
      }
      this.renderSecene();
    }
  }

  addPointInScene(data: Point[]) {
    data.forEach(f => this.pinInScene(f, false));
  }

  pinInScene(pin: convertPoint, renderScene: boolean = true) {
    const nglieuPin = pin.ds_ngulieu
    const nglieuDerect = nglieuPin.find(f => f.loaingulieu === "video360" || f.loaingulieu === "image360");
    const media = nglieuDerect ? this.fileService.getPreviewLinkLocalFile(nglieuDerect.file_media[0]) : null;
    const nguleuAudio = nglieuPin.find(f => f.loaingulieu === "audio");
    // const nglieuInfo = nguleuAudio ? nglieuPin.filter(f => f.id !== nglieuDerect.id && f.id !== nguleuAudio.id) : nglieuPin.filter(f => f.id !== nglieuDerect.id);
    // this.audioLink= nguleuAudio ? this.fileService.getPreviewLinkLocalFile(nguleuAudio.file_media[0]) :null;
    if (pin.type === "DIRECT") {
      if (media) {
        let newPoint = new sceneControl(media, this.camera, '');
        const locationX = pin.location['x'];
        const locationY = pin.location['y'];
        const locationZ = pin.location['z'];
        this.s.addPoint({
          position: new Vector3(locationX, locationY, locationZ),
          name: pin.title,
          scene: newPoint,
          userData: {
            ovicPointId: pin.id,
            iconPoint: pin.icon,
            dataPoint: pin,
            type: pin.type,
            parentPointId: this._pointStart ? this._pointStart.id : this.ngulieu.id,
          }
        });
        if (nglieuDerect && nglieuDerect.loaingulieu === "video360") {
          this.s.createMovie(this.scene, this.video360);
          this.s.appear();
        }
        if (nglieuDerect && nglieuDerect.loaingulieu === "image360") {
          this.s.createScrene(this.scene, pin.id, false, {
            ovicPointId: pin.id,
            iconPoint: pin.icon,
            dataPoint: pin,
            type: pin.type,
            parentPointId: this._pointStart ? this._pointStart.id : this.ngulieu.id,
          });
          this.s.appear();
        }
      }


    } else {
      let newPoint = new sceneControl(null, this.camera, null);
      if (pin.location) {
        const locationX = pin.location['x'];
        const locationY = pin.location['y'];
        const locationZ = pin.location['z'];
        this.s.addPoint({
          position: new Vector3(locationX, locationY, locationZ),
          name: pin.title,
          scene: newPoint,
          userData: {
            ovicPointId: pin.id,
            iconPoint: pin.icon,
            dataPoint: pin,
            type: pin.type,
            parentPointId: this._pointStart ? this._pointStart.id : this.ngulieu.id
          }
        });
        this.s.createScrene(this.scene, pin.id, false, {
          ovicPointId: pin.id,
          iconPoint: pin.icon,
          dataPoint: pin,
          type: pin.type,
          parentPointId: this._pointStart ? this._pointStart.id : this.ngulieu.id,
        });
        this.s.appear();
      }

    }

    if (renderScene) {
      this.renderSecene();
    }

  }

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

  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }

//=====================Sukien-Mouse==============================
  onResize = () => {
    let width = this.container.nativeElement.clientWidth;
    let height = this.container.nativeElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.render(this.scene, this.camera)
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
          this.backToScene = true;
          if (this.spriteActive) {
            this.tooltip.nativeElement.classList.remove('is-active');
            this.spriteActive = false;
          }
        }
      });
    } else if (userData.type === 'INFO') {
      const dataInfo = userData.dataPoint;
      const nguLieuInfo = dataInfo.ds_ngulieu;
      this.datainfo= dataInfo;
      this.datainfo['_type_media']= nguLieuInfo.find(f=>f.loaingulieu ==="video") ? 'video':'image';
      this.datainfo['_imageLink'] =  nguLieuInfo.find(f=>f.loaingulieu ==="image") ? this.fileService.getPreviewLinkLocalFile(nguLieuInfo.find(f=>f.loaingulieu ==="image").file_media[0]) :null;
      this.datainfo['_videoLink'] = nguLieuInfo.find(f=>f.loaingulieu ==="video") ? this.fileService.getPreviewLinkLocalFile(nguLieuInfo.find(f=>f.loaingulieu === "video").file_media[0]) :null;
      this.datainfo['_otherLink'] = nguLieuInfo.filter(f=>f.loaingulieu === "others")? nguLieuInfo.filter(f=>f.loaingulieu === "others").map(m=>{
        m['_linkdowload'] =  this.fileService.getPreviewLinkLocalFile(m.file_media[0]);
        return m;
      }) : [];
      this.visibleInfo= true;
    }
    // intersects = this.rayCaster.intersectObject(this.s.sphere);
    // if (intersects.length > 0) {
    // }
  }
  datainfo:any;
  visibleInfo:boolean= false;

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
  varMouseRight: any;
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

      if (point[0].object.name == '') {
        this.items = [
          {
            label: 'Thêm điểm truy cập',
            icon: 'pi pi-plus',
            command: () => this.btnFormAdd(this.varMouseRight)
          },
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

  //-------------------form, button--------------------------------------
  selectDmDiemDiTich(event) {
    const id = event.value;
    const object = this.dmDiemDitich.find(f => f.id === id);
    this.formSave.reset({
      title: object.ten,
      mota: object.mota,
      ditich_id: object.id,
    })
  }

  onOpenFormEdit() {
    setTimeout(() => this.notificationService.openSideNavigationMenu({
      template: this.formUpdate,
      size: 700,
      offsetTop: '0'
    }), 100);
    this.controls.saveState();
  }

  changeInputMode(formType: 'add' | 'edit', object: convertPoint | null = null, pointIdParent?:number) {
    this.formState.formTitle = formType === 'add' ? 'Thêm điểm truy cập mới ' : 'Cập nhật điểm truy cập';
    this.formState.formType = formType;
    if (formType === 'add') {
      this.formSave.reset(
        {
          title: '',
          mota: '',
          icon: '',
          location: this.intersectsVecter[0].point,// vi tri vector3
          parent_id: pointIdParent,
          type: 'INFO', //DIRECT | INFO
          ditich_id: null,
          ds_ngulieu: [], // ảnh 360 | video360// audio thuyết minh
          donvi_id: this.auth.userDonViId,
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
          ditich_id: object.ditich_id,
          type: object.type, //DIRECT | INFO
          ds_ngulieu: object.ds_ngulieu, // ảnh 360 | video360
          donvi_id: this.auth.userDonViId,

        }
      );
    }
  }

  btnFormAdd(idPointhere) {
    this.changeInputMode("add", null,idPointhere)
    this.onOpenFormEdit();
  }

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
          this.s.deletePoint(idDelete);
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

  saveForm() {
    if (this.formSave.valid) {
      const newPin: convertPoint = {
        id: 0,
        icon: this.f['icon'].value,
        title: this.f['title'].value,
        mota: this.f['mota'].value,
        location: this.f['location'].value,
        type: this.f['type'].value,
        parent_id: this.f['parent_id'].value,
        donvi_id: this.f['donvi_id'].value,
        ds_ngulieu: this.f['ds_ngulieu'].value,
        ditich_id: this.f['ditich_id'].value,
        toado_map: '',
        root: null
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
              parent_id: '',
              donvi_id: this.auth.userDonViId,
              ds_ngulieu: [],
              ditich_id: null,
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
        console.log(this.formState.object);
        this.pointsService.update(this.formState.object.id, this.formSave.value).subscribe({
          next: () => {
            newPin.id = this.formState.object.id;
            this.s.deletePoint(this.formState.object.id);
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

  //---------------------------- button action----------------------------
  btnPlayVideo() {
    if (this.video360.paused) {
      this.video360.play();
    } else {
      this.video360.pause();
    }
  }

  souseAudio: boolean = false;

  btnPlayAudio() {
    if (this.audioLink) {
      this.souseAudio = !this.souseAudio;
      if (this.souseAudio) {
        this.audio.nativeElement.play();
      } else {
        this.audio.nativeElement.pause();
      }

    } else {
      this.notificationService.toastError('Điểm truy cập này chưa gắn audio');
    }
  }

  rotate: boolean;

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

  visibleHelp: boolean = true;

  btnInfo() {
    this.visibleHelp = !this.visibleHelp;
  }

  //============================btn use picker ngulieu==================================//
  async btnAddNgulieu(type) {
    const result = await this.employeesPickerService.pickerNgulieu([], '', type);
    const value = [].concat(this.f['ds_ngulieu'].value, result);
    this.f['ds_ngulieu'].setValue(value);
    this.f['ds_ngulieu'].markAsUntouched();
  }

  async dowloadNgulieu(n: Ngulieu) {
    const file = n.file_media[0];
    const result = await this.mediaService.tplDownloadFile(file as OvicFile);
    switch (result) {
      case DownloadProcess.rejected:
        this.notificationService.toastInfo('Chưa hỗ trợ tải xuống thư mục');
        break;
      case DownloadProcess.error:
        this.notificationService.toastError('Tải xuống thất bại');
        break;
    }
  }

  deleteNguLieuOnForm(n: Ngulieu) {
    if (this.f['ds_ngulieu'].value && Array.isArray(this.f['ds_ngulieu'].value)) {
      const newValues = this.f['ds_ngulieu'].value.filter(u => u.id !== n.id);
      this.f['ds_ngulieu'].setValue(newValues);
      this.f['ds_ngulieu'].markAsTouched();
    } else {
      this.f['ds_ngulieu'].setValue([]);
      this.f['ds_ngulieu'].markAsTouched();
    }
  }

  //==========================btn next,back===================================
  currentImageIndex: number = 0;
  dataNextBack = [];

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


  btnNext() {
    this.notificationService.isProcessing(true);
    const countChild = this.dataNextBack.length;
    this.currentImageIndex = (this.currentImageIndex + 1) % countChild;

    this.changeImage();
    this.notificationService.isProcessing(false);

  }

  btnBack() {
    this.notificationService.isProcessing(true);
    const countChild = this.dataNextBack.length;
    this.currentImageIndex = (this.currentImageIndex - 1 + countChild) % countChild;
    this.changeImage();
    this.notificationService.isProcessing(false);
  }

  pointSelect:Point;
  unListen() {
    this.audioLink = null;
    this.audio.nativeElement.pause();
    this.audio.nativeElement.remove();
    this.rotate = false;
    this.video360.pause();
    this.video360.remove();
    this.scene.clear();
    this.renderer.dispose();
    this.controls.dispose();
  }

  changeImage() {
    this.unListen();
    const currentImage = this.dataNextBack[this.currentImageIndex];
    this.pointSelect =currentImage;
    this.startSeenByDiemtruycap(currentImage);
  }

  showMap : boolean=false;

  btnviewMap(){
    this.showMap = !this.showMap;
  }


}
