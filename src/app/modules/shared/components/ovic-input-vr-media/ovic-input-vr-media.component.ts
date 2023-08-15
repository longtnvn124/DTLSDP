import {
  ChangeDetectorRef,
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
import {PerspectiveCamera, Raycaster, Scene, Vector2, WebGLRenderer} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {MenuItem} from "primeng/api/menuitem";
import {PointsService} from "@shared/services/points.service";
import {EmployeesPickerService} from "@shared/services/employees-picker.service";
import {sceneControl} from "@shared/models/sceneVr";

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

@Component({
  selector: 'ovic-input-vr-media',
  templateUrl: './ovic-input-vr-media.component.html',
  styleUrls: ['./ovic-input-vr-media.component.css']
})
export class OvicInputVrMediaComponent implements OnInit {
  @ViewChild('fromUpdate', {static: true}) formUpdate: TemplateRef<any>;
  @ViewChild('myCanvas', {static: false}) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container', {static: true}) container: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip', {static: true}) tooltip: ElementRef<HTMLDivElement>;

  @Input() Showspinning: boolean; // hiểu thị nút quay
  @Input() SpinningAction: boolean;// thực hiện quay

  @Input() AudioAction: boolean;

  @Input() ngulieu: Ngulieu;
  @Input() _pointStart: Point;
  @Input() showOnly = false; // if true; remove all mouse events

  menuName: 'Point-location';
  index: number = 1;
  isAudio = false;
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
  viewMode = [
    {label: 'Truy cập trực tiếp', value: 'DIRECT'},
    {label: 'Thông tin trực tiếp', value: 'INFO'},
  ];
  typeOptions = TypeOptions;


  audioLink: string;


  video360: HTMLVideoElement;
  destination: Ngulieu;
  otherInfo: Ngulieu[];
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
  ) {
    this.video360 = this.renderer2.createElement('video');

    this.formSave = this.fb.group({
      title: ['', Validators.required],
      icon: ['', Validators.required],
      mota: [''],
      location: ['', Validators.required], // vi tri vector3
      parent_id: [null, Validators.required],
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
    if (!this.showOnly) {
      this.container.nativeElement.addEventListener('click', this.onClick);
      this.container.nativeElement.addEventListener('mousemove', this.onMouseMove);
      this.container.nativeElement.addEventListener('contextmenu', this.onRightClick);
    } else {
    }

  }

  ngOnInit() {
    this.iconList =
      [
        {name: 'Thông tin chi tiết ', path: './assets/icon-png/infomation.png'},
        {name: 'vị trí mới', path: './assets/icon-png/pin.png'},
        {name: 'Chuyển cảnh', path: './assets/icon-png/chuyencanh.png'},
      ];
    console.log(this._pointStart);

    if (this._pointStart) {
      this.startSeenByDiemtruycap();
    }
  }

  startSeenByDiemtruycap() {
    const nglieu = this._pointStart.ds_ngulieu;
    const pointChild = this._pointStart['__child'];
    console.log(pointChild);
    console.log(nglieu);
    const nglieuDerect = nglieu.find(f => f.loaingulieu === "video360" || f.loaingulieu === "image360");
    console.log(nglieuDerect);
    const nguleuAudio = nglieu.find(f => f.loaingulieu === "audio");
    const nglieuInfo = nguleuAudio ? nglieu.filter(f => f.id !== nglieuDerect.id && f.id !== nguleuAudio.id) : nglieu.filter(f => f.id !== nglieuDerect.id);
    console.log(nglieuInfo);
    this.loadInit(nglieuDerect, nguleuAudio, pointChild);
  }

  s:sceneControl;
  loadInit(nglieuPoind: Ngulieu, nglieuAudio?: Ngulieu, point?: Point[]) {
    const pointchild = point;
    if (nglieuAudio) {
      this.audioLink = this.fileService.getPreviewLinkLocalFile(nglieuAudio);
    }

    if (nglieuPoind) {
      const src = this.fileService.getPreviewLinkLocalFile(nglieuPoind.file_media[0]);
      const audio= null;
      //scene and controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.scene = new Scene();
      this.controls.rotateSpeed = -0.3;
      this.controls.enableZoom = false;
      this.camera.position.set(-0.1, 0, 0.1);
      // Sphere
      if (nglieuPoind.loaingulieu === 'video360') {
        this.s = new sceneControl(src, this.camera,null);
        this.renderer2.setAttribute(this.video360, 'src', src);
        this.renderer2.setAttribute(this.video360, 'loop', 'true');
        this.renderer2.setAttribute(this.video360, 'autoplay', 'true');
        this.renderer2.setAttribute(this.video360, 'playsinline', 'true');
        this.renderer2.setAttribute(this.video360, 'crossorigin', 'anonymous');
        this.s.createMovie(this.scene, this.video360);
      }
      if (nglieuPoind.loaingulieu === 'image360') {
        this.s = new sceneControl(src, this.camera,null);
        this.s.createScrene(this.scene,nglieuPoind.id);
      } else {

      }
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
  //======================sukien-onclick======================
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
    intersects.forEach((intersect: any) => {
      if (intersect.object.type === "Sprite") {
        intersect.object.onClick();
        // this.backToScene = true;
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
          // this.pointHover = true;
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
      // this.pointHover = false;
    }
  }
  varMouseRight: any;
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
      this.intersectsVecter = this.rayCaster ? this.rayCaster.intersectObject(this.s.sphere) : [];
      this.rayCaster.setFromCamera(mouse, this.camera);
      let point = this.rayCaster.intersectObjects(this.scene.children);
      this.varMouseRight = point[0].object.userData['ovicPointId'];
      if (point[0].object.name == '') {
        this.items = [
          {
            label: 'Thêm điểm truy cập mới',
            icon: 'pi pi-plus',
            // command: () => this.btnFormAdd()
          },

        ]
      } else {
        this.items = [
          {
            label: 'Cập nhật vị trí',
            icon: 'pi pi-file-edit',
            // command: () => this.btnFormEdit()
          },
          {
            label: 'Xoá vị trí',
            icon: 'pi pi-trash',
            // command: () => this.btnFormDelete()
          },
          {
            label: 'Thông tin chi tiết',
            icon: 'pi pi-info-circle',
            // command: () => this.btnFormInformation()
          },
        ];
      }
    }
  }
  //=======================================su ly form========================================

}
