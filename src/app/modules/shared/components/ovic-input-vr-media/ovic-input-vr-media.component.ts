import {
  ChangeDetectorRef,
  Component,
  ElementRef,
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
import {PerspectiveCamera, Raycaster, Scene, WebGLRenderer} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {MenuItem} from "primeng/api/menuitem";
import {PointsService} from "@shared/services/points.service";
import {EmployeesPickerService} from "@shared/services/employees-picker.service";

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
  characterAvatar: string;
  backToScene: boolean = false;
  audioLink: string;
  dataDitich: any;
  pointHover: boolean = false;
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
    // this.container.nativeElement.addEventListener('resize', this.onResize);
    // if (!this.showOnly) {
    //   this.container.nativeElement.addEventListener('click', this.onClick);
    //   this.container.nativeElement.addEventListener('mousemove', this.onMouseMove);
    //   this.container.nativeElement.addEventListener('contextmenu', this.onRightClick);
    // } else {
    // }

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
    console.log(nglieu);
    const nglieuDerect = nglieu.find(f => f.loaingulieu === "video360" || f.loaingulieu === "image360");
    console.log(nglieuDerect);
    const nglieuInfo = nglieu.filter(f => f.id !== nglieuDerect.id);
    console.log(nglieuInfo);

  }

  loadInit(nglieuPoind){

  }

  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }


}
