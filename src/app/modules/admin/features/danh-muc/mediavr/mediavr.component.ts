import {
  AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild
} from '@angular/core';
import {Pinable, Point} from "@shared/models/point";
import {PerspectiveCamera, Raycaster, WebGLRenderer, Vector2, Scene,
  Vector3, AudioListener, AudioLoader, Audio} from 'three';
// import {OrbitControls} from "@three-ts/orbit-controls";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {MenuItem} from "primeng/api/menuitem";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NotificationService} from "@core/services/notification.service";
import {FileService} from "@core/services/file.service";
import {AuthService} from "@core/services/auth.service";
import {PointsService} from "@shared/services/points.service";
import {ActivatedRoute, Router} from "@angular/router";
import {DanhMucDiemDiTichService} from "@shared/services/danh-muc-diem-di-tich.service";
import {forkJoin,mergeMap,of} from "rxjs";
import {OvicFile} from "@core/models/file";
import {sceneControl} from "@shared/models/sceneVr";
import {DmDiemDiTich, DmLoaiNguLieu} from "@shared/models/danh-muc";
import {DanhMucLoaiNguLieuService} from "@shared/services/danh-muc-loai-ngu-lieu.service";

import {AvatarMakerSetting, MediaService} from "@shared/services/media.service";
import {getLinkDownload} from "@env";
import {HelperService} from '@core/services/helper.service';

export interface fileConvent {
  file: OvicFile;
  blob: Blob;
}

@Component({
  selector: 'app-mediavr',
  templateUrl: './mediavr.component.html',
  styleUrls: ['./mediavr.component.css']
})
export class MediavrComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('fromUpdate', {static: true}) formUpdate: TemplateRef<any>;
  @ViewChild('myCanvas', {static: false}) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container', {static: true}) container: ElementRef<HTMLDivElement>;
  // @ViewChild('video360', {static: true}) video360: ElementRef<HTMLVideoElement>;
  @ViewChild('tooltip', {static: true}) tooltip: ElementRef<HTMLDivElement>;
  @ViewChild('fileChooser', {static: true}) fileChooser: TemplateRef<any>;

  //khai bao.nativeElement
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
  viewMode = [
    {label: 'Truy cập trực tiếp', value: 'DIRECT'},
    {label: 'Thông tin trực tiếp', value: 'info'},
  ]

  permission = {
    isExpert: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
  }
  characterAvatar: string;
  backToScene: boolean = false;
  // three js-----------------------------------------------------------------
  spriteActive = false;
  scene: any = [];
  // camera = new Three.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  controls: OrbitControls;
  // controls = new OrbitControls(this.camera, this.renderer.domElement);
  // rayCaster = new Three.Raycaster();
  rayCaster = new Raycaster();
  // renderer = new Three.WebGLRenderer({antialias: true});
  renderer = new WebGLRenderer({antialias: true});
  intersectsVecter: any;

  // menu right click
  items: MenuItem[];
  formSave: FormGroup = this.fb.group({
    title: ['', Validators.required],
    icon: ['', Validators.required],
    mota: [''],
    location: ['', Validators.required], // vi tri vector3
    parent_id: [null, Validators.required],
    type: ['', Validators.required], //DIRECT | INFO
    file_media: [null, Validators.required], // ảnh 360 | video360
    donvi_id: [null, Validators.required]
  })


  constructor(
    private notificationService: NotificationService,
    private element: ElementRef,
    private renderer2: Renderer2,
    private fileService: FileService,
    private auth: AuthService,
    private fb: FormBuilder,
    private pointsService: PointsService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private danhMucDiemDiTichService: DanhMucDiemDiTichService,
    private danhMucLoaiNguLieuService: DanhMucLoaiNguLieuService,
    private mediaService: MediaService,
    private helperService: HelperService
  ) {
    this.video360 = this.renderer2.createElement('video');
    this.danhMucLoaiNguLieuService.getData(this.auth.userDonViId).subscribe({
      next: (data) => {
        this.dataLoaiNguLieu = data;
      }
    });
  }

  ngOnDestroy(): void {
    // if (this.renderer) {
    //   this.renderer.dispose();
    // }
    // if (this.scene) {
    //   this.scene.dispose();
    // }
  }

  ngAfterViewInit(): void {
    this.container.nativeElement.addEventListener('resize', this.onResize);
    this.container.nativeElement.addEventListener('click', this.onClick);
    this.container.nativeElement.addEventListener('mousemove', this.onMouseMove);
    this.container.nativeElement.addEventListener('contextmenu', this.onRightClick);
  }

  imageLink: string;
  audioLink: string;
  dataDitich: any;
  idDitich: string;

  pointHover: boolean = false;
  video360: HTMLVideoElement;
  dataLoaiNguLieu: DmLoaiNguLieu[];


  ngOnInit() {
    this.iconList = this.typeAdd === 'THONGTIN' ?
      [{name: 'Thông tin chi tiết ', path: './assets/icon-png/infomation.png'}] :
      [
        {name: 'vị trí mới', path: './assets/icon-png/location.png'},
        {name: 'Chuyển cảnh', path: './assets/icon-png/chuyencanh.png'},
      ];
    // this.dataLoaiNguLieu = this.danhMucLoaiNguLieuService.getData(this.auth.userDonViId).subscribe();
    if (this.activatedRoute.snapshot.queryParamMap.has('code')) {
      this.idDitich = this.auth.decryptData(this.activatedRoute.snapshot.queryParamMap.get('code'));
      this.startSeen();
    } else {
      void this.router.navigate(['admin/danh-muc']);
    }
  }


  dataPoint: Pinable[];
  typeMedia: string;
  mediaLink: string;

  startSeen() {
    this.backToScene = false;
    this.notificationService.isProcessing(true);
    this.danhMucDiemDiTichService.getDataById(this.idDitich).pipe(mergeMap(list => {
      const parramId = list[0].id;
      return list ? forkJoin<[DmDiemDiTich[], Point[]]>([of(list), this.pointsService.getDataByparentId(parramId)]) : of([], []);
    })).subscribe({
      next: ([dataDiemditich, dataPoint]) => {

        this.dataDitich = dataDiemditich;
        const fileMedia = this.dataDitich.file_media;
        this.mediaLink = fileMedia ? this.fileService.getPreviewLinkLocalFile(fileMedia[0]) : null;
        this.typeMedia = this.dataDitich.file_media.type.split("/")[0] === "video" ? "video" : 'image';
        this.dataPoint = dataPoint.map(m => {
          const Mediafile = fileMedia.find(f => f.type.split('/')[0] === 'image' || 'video');
          const Audiofile = fileMedia.find(f => f.type.split('/')[0] === 'audio');
          m['imageLink'] = fileMedia ? this.fileService.getPreviewLinkLocalFile(Mediafile) : null;
          m['audioLink'] = Audiofile ? this.fileService.getPreviewLinkLocalFile(Audiofile) : null;
          return m;
        });
        this.loadInit(this.mediaLink, null, this.dataPoint);
        this.notificationService.isProcessing(false);

      }, error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ')
      }
    })
  }

  s: sceneControl;

  loadInit(image: string, audio?: string, datapoint?: Pinable[]) {

    console.log('loadInit');

    //camera
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    //scene and controls
    // this.scene = new Three.Scene();
    this.scene = new Scene();
    this.controls.rotateSpeed = -0.3;
    this.controls.enableZoom = false;
    // this.controls.enablePan = true;
    this.camera.position.set(-0.1, 0, 0.1);

    // Sphere
    this.s = new sceneControl(image, this.camera);
    // let s2 = new sceneControl('./assets/icon-png/pano1.jpg', this.camera,audio);
    // this.s.addPoint( { position: new Three.Vector3(14, 1.9, -47), name: 'Entrée', scene: s2 });

    if (datapoint && datapoint.length) {
      this.addPointInScene(datapoint);
    } else {
      if (this.typeMedia == "video") {
        this.renderer2.setAttribute(this.video360, 'src', image);
        this.renderer2.setAttribute(this.video360, 'loop', 'true');
        this.renderer2.setAttribute(this.video360, 'autoplay', 'true');
        this.renderer2.setAttribute(this.video360, 'playsinline', 'true');
        this.s.createMovie(this.scene, this.video360);
      } else {
        this.s.createScrene(this.scene, this.dataDitich.id);
      }
      this.renderSecene();
    }
    // Render
  }

  addPointInScene(dataPoint: Pinable[]) {
    dataPoint.forEach(f => this.pin(f, false));
    this.renderSecene();
  }

  pin(info: Pinable, renderSecene = true) {

    const dataNgulieu= info.ds_ngulieu;
    const fileMedia  =dataNgulieu && dataNgulieu.find( nl => nl.loaingulieu === 'video360') ? dataNgulieu[0].file_media.find(f => f.type.split('/')[0] === 'image' || 'video'): null;
    const fileAudio =dataNgulieu && dataNgulieu[0] ? dataNgulieu[0].file_media.find(f => f.type.split('/')[0] === 'audio'): null;
    const media = fileMedia ? this.fileService.getPreviewLinkLocalFile(fileMedia) : null;
    const audio = fileAudio ? this.fileService.getPreviewLinkLocalFile(fileAudio) : null;
    const type = fileMedia.type.split('/')[0] === "video" ? 'video' : 'image';
    if (audio || media) {
      let newPoint = new sceneControl(media, this.camera);
      const locationX = info.location['x'];
      const locationY = info.location['y'];
      const locationZ = info.location['z'];
      this.s.addPoint({
        // position: new Three.Vector3(locationX, locationY, locationZ),
        position: new Vector3(locationX, locationY, locationZ),
        name: info.title,
        scene: newPoint,
        userData: {
          ovicPointId: info.id,
          iconPoint: info.icon,
          dataPoint: null,
          parentPointId:null,
          type:null
        }
      });
      if (type === "image") {
        this.s.createScrene(this.scene, info.id);
      } else {
        this.s.createMovie(this.scene, this.video360);
      }
      this.s.appear();
    }
    if (renderSecene) {
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

  onResize = () => {
    let width = this.container.nativeElement.clientWidth;
    let height = this.container.nativeElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.render(this.scene, this.camera)
  }
  onClick = (e: MouseEvent) => {
    // let mouse = new Three.Vector2(
    let mouse = new Vector2(
      (e.offsetX / this.container.nativeElement.clientWidth) * 2 - 1,
      -(e.offsetY / this.container.nativeElement.clientHeight) * 2 + 1,
    );
    this.rayCaster.setFromCamera(mouse, this.camera);
    let intersects = this.rayCaster.intersectObjects(this.scene.children);
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
    // intersects = this.rayCaster.intersectObject(this.s.sphere);
    // if (intersects.length > 0) {
    // console.log(intersects[0].point);
    // }
  }
  onMouseMove = (e: MouseEvent) => {
    // let mouse = new Three.Vector2(
    let mouse = new Vector2(
      (e.offsetX / this.container.nativeElement.clientWidth) * 2 - 1,
      -(e.offsetY / this.container.nativeElement.clientHeight) * 2 + 1,
    );
    this.rayCaster.setFromCamera(mouse, this.camera);
    let foundSprite = false;
    let intersects = this.rayCaster.intersectObjects(this.scene.children);

    intersects.forEach((intersect: any) => {
      if (intersect.object.type === "Sprite") {
        let p = intersect.object.position.clone().project(this.camera);
        this.tooltip.nativeElement.style.top = ((-1 * p.y + 0.9) * this.container.nativeElement.offsetHeight / 2) + 'px';
        this.tooltip.nativeElement.style.left = ((p.x + 1) * this.container.nativeElement.offsetWidth / 2) + 'px';
        // this.tooltip.classList.add('is-active');
        this.tooltip.nativeElement.classList.add('is-active');

        this.tooltip.nativeElement.innerHTML = intersect.object.name;
        this.spriteActive = intersect.object;
        foundSprite = true;
        this.pointHover = true;
      }
    });
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
    // let mouse = new Three.Vector2(
    let mouse = new Vector2(
      (e.offsetX / this.container.nativeElement.clientWidth) * 2 - 1,
      -(e.offsetY / this.container.nativeElement.clientHeight) * 2 + 1,
    );
    this.rayCaster.setFromCamera(mouse, this.camera);
    let intersectss = this.rayCaster ? this.rayCaster.intersectObject(this.s.sphere) : [];
    this.intersectsVecter = intersectss;
    this.rayCaster.setFromCamera(mouse, this.camera);
    let point = this.rayCaster.intersectObjects(this.scene.children);
    this.varMouseRight = point[0].object.userData['ovicPointId'];
    if (point[0].object.name == '') {
      this.items = [
        {
          label: 'Thêm mới vị trí mới',
          icon: 'pi pi-plus',
          command: () => this.btnFormAdd('VITRI')
        },
        {
          label: 'Thêm mới thông tin ',
          icon: 'pi pi-plus',
          command: () => this.btnFormAdd('THONGTIN')
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
          // command: () => this.btnDelete1()
        },
        {
          label: 'Thông tin chi tiết',
          icon: 'pi pi-info-circle',
          command: () => this.btnFormInformation()
        },
      ];
    }

  }

  // su ly Point
  onOpenFormEdit() {
    setTimeout(() => this.notificationService.openSideNavigationMenu({
      template: this.formUpdate,
      size: 600,
      offsetTop: '0'
    }), 100);
    this.controls.saveState();
  }

  changeInputMode(formType: 'add' | 'edit', object: Pinable | null = null) {
    this.formState.formTitle = formType === 'add' ? 'Thêm điểm truy cập mới ' : 'Cập nhật điểm truy cập';
    this.formState.formType = formType;
    if (formType === 'add') {
      this.formSave.reset(
        {
          title: '',
          mota: '',
          icon: '',
          location: this.intersectsVecter[0].point,// vi tri vector3
          parent_id: this.dataDitich.id,
          type: 'INFO', //DIRECT | INFO
          file_media: null, // ảnh 360 | video360

        }
      );
      this.characterAvatar = '';
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

        }
      );
      // this.characterAvatar = object.file_media ? getLinkDownload(object.file_media[0].id) : '';//get media
    }
  }

  typeAdd: 'VITRI' | 'THONGTIN';

  btnFormAdd(type: 'VITRI' | 'THONGTIN') {
    this.typeAdd = type;
    this.onOpenFormEdit();
    this.f['type'].setValue(type === 'VITRI' ? 'DIRECT ' : 'INFO');
    this.changeInputMode("add");
  }

  btnFormEdit() {
    const object = this.dataPoint.find(f => f.id === this.varMouseRight);
    this.typeAdd = object.type === 'INFO' ? 'THONGTIN' : 'VITRI';
    this.onOpenFormEdit();
    this.changeInputMode("edit", object);
  }

  async btnFormDelete() {
    // const idDelete = this.dataPoint.find(f => f.id === this.varMouseRight).id;
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

  visible: boolean = false;
  dataInformation: Pinable;

  btnFormInformation() {
    this.visible = true;
    this.dataInformation = this.dataPoint.find(f => f.id === this.varMouseRight);
  }

  saveForm() {
    if (this.formSave.valid) {
      const newPin: Pinable = {
        id: 0,
        icon: this.f['icon'].value,
        title: this.f['title'].value,
        location: this.f['location'].value,
        type: this.f['type'].value,
        ds_ngulieu: this.f['ds_ngulieu'].value,
        parent_id: this.f['parent_id'].value,
        mota: this.f['mota'].value,
        donvi_id: this.f['donvi_id'].value
      }
      if (this.formState.formType === "add") {
        this.notificationService.isProcessing(true);
        this.pointsService.create(this.formSave.value).subscribe({
          next: (id) => {
            // this.typeMedia = this.dataDitich.file_media[0].type.split("/")[0] === "video" ? "video" : 'image';
            newPin.id = id;
            this.pin(newPin);
            this.dataPoint.push(newPin)
            this.formSave.reset({
              title: '',
              mota: '',
              loaingulieu: '',
              location: this.intersectsVecter, // vi tri vector3
              parent_id: this.dataDitich.id,
              type: '', //DIRECT | INFO
              file_media: null, // ảnh 360 | video360
              file_audio: null, // audio thuyết minh
            });
            this.characterAvatar = '';
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
            this.s.deletePoint(this.formState.object.id);
            this.pin(this.formState.object, false);
            this.renderSecene();
            this.notificationService.isProcessing(false);
            this.notificationService.toastSuccess('Cập nhật thành công');

          }, error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastError("Cập nhật thất bại");
          }
        })
      }
    } else {
      this.notificationService.toastError("Lỗi nhập liệu");
    }
  }

  closeForm() {
    this.notificationService.closeSideNavigationMenu(this.menuName);
  }

  rotate: boolean = false;
  sound: boolean = false;

  btnRotate() {
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

  btnVolume() {
    if (this.audioLink) {
      // const audioListener = new Three.AudioListener();
      const audioListener = new AudioListener();
      // const audioLoader = new Three.AudioLoader();
      const audioLoader = new AudioLoader();
      // var audio = new Three.Audio(audioListener);
      var audio = new Audio(audioListener);
      this.camera.add(audioListener);

      this.sound = !this.sound;

      if (this.sound == true) {
        audioLoader.load(this.audioLink, function (buffer) {
          audio.setBuffer(buffer);
          audio.setLoop(true);
          audio.setVolume(0.5);
          audio.play();
        });
      } else {
        audio.stop();
      }
    } else {
      this.notificationService.toastWarning('Bạn chưa lưu audio thuyết minh');
    }
  }

  btnPausePlay() {
    if (this.video360.paused) {
      this.video360.play();
    } else {
      this.video360.pause();
    }
  }

  //file information
  async makeCharacterAvatar(file: File, characterName: string): Promise<File> {
    try {
      const options: AvatarMakerSetting = {
        aspectRatio: 3 / 2,
        resizeToWidth: 200,
        format: 'jpeg',
        cropperMinWidth: 10,
        dirRectImage: {
          enable: true,
          dataUrl: URL.createObjectURL(file)
        }
      };
      const avatar = await this.mediaService.callAvatarMaker(options);
      if (avatar && !avatar.error && avatar.data) {
        const none = new Date().valueOf();
        const fileName = characterName + none + '.jpg';
        return Promise.resolve(this.fileService.base64ToFile(avatar.data.base64, fileName));
      } else {
        return Promise.resolve(null);
      }
    } catch (e) {
      this.notificationService.isProcessing(false);
      this.notificationService.toastError('Quá trình tạo avatar thất bại');
      return Promise.resolve(null);
    }
  }

  async onInputAvatar(event, fileChooser: HTMLInputElement) {
    if (fileChooser.files && fileChooser.files.length) {
      const file = await this.makeCharacterAvatar(fileChooser.files[0], fileChooser.files[0].name);
      // upload file to server
      this.fileService.uploadFile(file, 1).subscribe({
        next: fileUl => {
          this.formSave.get('file_media').setValue([fileUl]);
        }, error: () => {
          this.notificationService.toastError('Upload file không thành công');
        }
      })
      // laasy thoong tin vaf update truongwf
      this.characterAvatar = URL.createObjectURL(file);
    }
  }

  btnBackToScere(event: MouseEvent) {
    this.startSeen();
    // this.s.backToScene();
  }

}

