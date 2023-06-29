import {
  AfterViewInit, Component, ElementRef, HostListener, OnInit, Renderer2, TemplateRef, ViewChild
} from '@angular/core';
import {Point} from "@shared/models/point";
import * as THREE from 'three';
import {OrbitControls} from "@three-ts/orbit-controls";
import {MenuItem} from "primeng/api/menuitem";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NotificationService} from "@core/services/notification.service";
import {FileService} from "@core/services/file.service";
import {AuthService} from "@core/services/auth.service";
import {PointsService} from "@shared/services/points.service";
import {ActivatedRoute, Router} from "@angular/router";
import {DanhMucDiemDiTichService} from "@shared/services/danh-muc-diem-di-tich.service";
import {forkJoin, map, mergeMap, Observable, of} from "rxjs";
import {OvicFile} from "@core/models/file";
import {sceneControl} from "@shared/models/sceneVr";
import {DmDiemDiTich} from "@shared/models/danh-muc";

export interface fileConvent {
  file: OvicFile;
  blob: Blob;
}

@Component({
  selector: 'app-mediavr',
  templateUrl: './mediavr.component.html',
  styleUrls: ['./mediavr.component.css']
})
export class MediavrComponent implements OnInit, AfterViewInit {
  @ViewChild('fromUpdate', {static: true}) formUpdate: TemplateRef<any>;
  @ViewChild('myCanvas', {static: false}) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container', {static: true}) container: ElementRef<HTMLDivElement>;
  @ViewChild('tooltip', {static: true}) tooltip: ElementRef<HTMLDivElement>;

  //khai bao.nativeElement
  formState: {
    formType: 'add' | 'edit',
    showForm: boolean,
    formTitle: string,
    object: Point | null
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
  iconList = [
    {name: 'vị trí mới', path: 'assets/icon-png/infomation.png'},
    {name: 'Thông tin chi tiết ', path: 'assets/icon-png/location.png'},
  ]
  // three js-----------------------------------------------------------------


  spriteActive = false;
  scene: any = [];
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  controls: any;
  // controls = new OrbitControls(this.camera, this.renderer.domElement);
  rayCaster = new THREE.Raycaster();
  renderer = new THREE.WebGLRenderer();
  mouseEvent: MouseEvent;
  intersectsVecter: any;

  // menu right click
  items: MenuItem[] = [
    {
      label: 'Thêm vị trí',
      icon: 'pi pi-plus',
      command: () => this.btnFormAdd()

    },
    {
      label: 'Cập nhật vị trí',
      icon: 'pi pi-file-edit',
      command: ($event?: any) => this.btnFormEdit($event)

    },
    {
      label: 'Xoá vị trí',
      icon: 'pi pi-trash',
      command: ($event?: any) => this.btnFormDelete($event)

    },
  ];
  formSave: FormGroup = this.fb.group({

    title: ['', Validators.required],
    icon: ['', Validators.required],
    mota: [''],
    loaingulieu: [''],
    location: ['', Validators.required], // vi tri vector3
    parent_id: ['', Validators.required],
    type: ['', Validators.required], //DIRECT | INFO
    file_media: [null], // ảnh 360 | video360
    file_audio: [null], // audio thuyết minh
  })

  permission = {
    isExpert: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
  }

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
    private danhMucDiemDiTichService: DanhMucDiemDiTichService
  ) {
  }

  ngAfterViewInit(): void {
    this.container.nativeElement.addEventListener('resize', this.onResize);
    this.container.nativeElement.addEventListener('click', this.onClick);
    this.container.nativeElement.addEventListener('mousemove', this.onMouseMove);
    this.container.nativeElement.addEventListener('contextmenu', this.onRightClick);
  }

  // imageLink: string;
  // audioLink: string;
  dataDitich: any;
  idDitich: string;

  ngOnInit() {
    if (this.activatedRoute.snapshot.queryParamMap.has('code')) {
      this.idDitich = this.auth.decryptData(this.activatedRoute.snapshot.queryParamMap.get('code'));
      this.startSeen();
    } else {
      void this.router.navigate(['admin/danh-muc']);
    }
  }

  startSeen() {
    this.notificationService.isProcessing(true);
    this.danhMucDiemDiTichService.getDataById(this.idDitich).pipe(mergeMap(list => {
      const paramId = list[0].id;
      return list ? forkJoin<[DmDiemDiTich[], fileConvent[], Point[]]>([of(list), this.loadFileMedia(list[0]), this.pointsService.getDataByparentId(paramId)]) : of([], [], []);
    })).subscribe({
      next: ([dmdiemDitich, files, dataPoint]) => {
        this.dataDitich = dmdiemDitich[0];
        const imageObject = this.dataDitich.file_media[0] ? files.find(f => f.file.id === this.dataDitich.file_media[0].id).blob : null;
        const audioObject = this.dataDitich.file_audio[0] ? files.find(f => f.file.id === this.dataDitich.file_audio[0].id).blob : null;
        let imageLink = imageObject ? URL.createObjectURL(imageObject) : '';
        let audioLink = audioObject ? URL.createObjectURL(audioObject) : '';
        const points = dataPoint;
        this.loadInit(imageLink, audioLink, points);
        this.notificationService.isProcessing(false);
      },
      error: (error) => {
        console.log(error)
        // this.dataDitich['__media_info'] = [];
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }

  s: any;

  loadFileMedia(dataditich): Observable<{ file: OvicFile, blob: Blob }[]> {
    const ids: OvicFile[] = [].concat(
      dataditich.file_media ? [...dataditich.file_media] : null,
      dataditich.file_audio ? [...dataditich.file_audio] : null
    ).filter(Boolean);

    const request: Observable<{ file: OvicFile, blob: Blob }>[] = ids.reduce((collector, file) => {
      collector.push(
        this.fileService.getFileAsBlobByName(file.id.toString(10)).pipe(map(blob => ({file, blob})))
      )
      return collector;
    }, new Array<Observable<{ file: OvicFile, blob: Blob }>>())
    return forkJoin<{ file: OvicFile, blob: Blob }[]>(request);
  }
  loadInit(image: string, audio: string, datapoint: Point[]) {
    this.notificationService.isProcessing(true);
    //camera
    this.controls = new OrbitControls(this.camera, this.container.nativeElement);
    //scene and controls
    this.scene = new THREE.Scene();
    this.controls.rotateSpeed = -0.3;
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.camera.position.set(-0.1, 0, 0.1);
    this.controls.update();

    // Sphere
    this.s = new sceneControl(image, this.camera, audio);
    // let s2 = new sceneControl('./assets/icon-png/pano1.jpg', this.camera,audio);
    // this.s.addPoint( { position: new THREE.Vector3(14, 1.9, -47), name: 'Entrée', scene: s2 });

    datapoint.forEach(f => {
      forkJoin<[string, string]>([
        f.file_media != null ? this.fileService.getFileAsObjectUrl(f.file_media[0].id.toString(10)) : of(null),
        f.file_audio != null ? this.fileService.getFileAsObjectUrl(f.file_audio[0].id.toString(10)) : of(null),
      ]).subscribe({
        next: ([media, audio]) => {
          if (audio || media) {
            let newPoint = new sceneControl(media, this.camera, audio);
            const locationX = f.location['x'];
            const locationY = f.location['y'];
            const locationZ = f.location['z'];
            console.log(f.title);
            this.s.addPoint({
              position: new THREE.Vector3(locationX, locationY, locationZ),
              name: f.title,
              scene: newPoint
            });
            this.s.createScrene(this.scene);
            this.s.appear();
          }
          this.notificationService.isProcessing(false);
        }, error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Load dữ liệu không thành công');
        }
      })
    })
    // Render
    this.renderSecene();
  }

  renderSecene() {
    // Render
    this.renderer.setSize(this.container.nativeElement.clientWidth, this.container.nativeElement.clientHeight);
    this.renderer2.appendChild(this.container.nativeElement, this.renderer.domElement);
    const animate = () => {
      requestAnimationFrame(animate);
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
    let mouse = new THREE.Vector2(
      (e.offsetX / this.container.nativeElement.clientWidth) * 2 - 1,
      -(e.offsetY / this.container.nativeElement.clientHeight) * 2 + 1,
    );
    this.rayCaster.setFromCamera(mouse, this.camera);
    let intersects = this.rayCaster.intersectObjects(this.scene.children);
    intersects.forEach((intersect: any) => {
      if (intersect.object.type === "Sprite") {
        intersect.object.onClick();
        if (this.spriteActive) {
          this.tooltip.nativeElement.classList.remove('is-active');
          this.spriteActive = false;
        }
      }
    });
    intersects = this.rayCaster.intersectObject(this.s.sphere);
    if (intersects.length > 0) {
      console.log(intersects[0].point);
    }
  }
  onMouseMove = (e: MouseEvent) => {
    let mouse = new THREE.Vector2(
      (e.offsetX / this.container.nativeElement.clientWidth) * 2 - 1,
      -(e.offsetY / this.container.nativeElement.clientHeight) * 2 + 1,
    );
    this.rayCaster.setFromCamera(mouse, this.camera);
    let foundSprite = false;
    let intersects = this.rayCaster.intersectObjects(this.scene.children);
    // const tooltip = this.tooltip.nativeElement;
    intersects.forEach((intersect: any) => {
      if (intersect.object.type === "Sprite") {
        let p = intersect.object.position.clone().project(this.camera);
        console.log(p.y);
        console.log(p.x);
        // this.tooltip.nativeElement.style.backgroundColor = '#fa983c';
        // this.tooltip.nativeElement.style.fontSize = 14+'px';
        this.tooltip.nativeElement.style.top = ((-1 * p.y + 0.9) * this.container.nativeElement.offsetHeight / 2) + 'px';
        this.tooltip.nativeElement.style.left = ((p.x + 1) * this.container.nativeElement.offsetWidth / 2) + 'px';
        console.log(this.tooltip.nativeElement.style.top);
        console.log(this.tooltip.nativeElement.style.left);
        // this.tooltip.classList.add('is-active');
        this.tooltip.nativeElement.classList.add('is-active');
        this.tooltip.nativeElement.innerHTML = intersect.object.name;
        this.spriteActive = intersect.object;
        foundSprite = true;
      }
    });
    if (foundSprite) {
      // this.container.classList.add('hover');
      // this.container.setAttribute('class', 'hover');
      this.renderer2.addClass(this.container.nativeElement, 'hover');
    } else {
      // this.container.classList.remove('hover');
      this.renderer2.removeClass(this.container.nativeElement, 'hover');
    }
    if (foundSprite === false && this.spriteActive) {
      this.tooltip.nativeElement.classList.remove('is-active');
      this.spriteActive = false;
    }
  }
  @HostListener("contextmenu", ["$event"]) onRightClick = (e: MouseEvent) => {
    let mouse = new THREE.Vector2(
      (e.offsetX / this.container.nativeElement.clientWidth) * 2 - 1,
      -(e.offsetY / this.container.nativeElement.clientHeight) * 2 + 1,
    );
    console.log(mouse);
    this.rayCaster.setFromCamera(mouse, this.camera);
    let intersects = this.rayCaster.intersectObject(this.s.sphere);
    this.intersectsVecter = intersects;
    console.log(this.intersectsVecter);
    console.log(1, intersects[0].point.x);
    console.log(2, intersects[0].point.y);
    console.log(3, intersects[0].point.z);
    this.mouseEvent = e;
  }
  // su ly Point
  danhsachPoint: Point[];

  onOpenFormEdit() {
    setTimeout(() => this.notificationService.openSideNavigationMenu({
      template: this.formUpdate,
      size: 600,
      offsetTop: '0'
    }), 100);
    this.controls.saveState();
    this.controls.dispose();
  }

  changeInputMode(formType: 'add' | 'edit', object: Point | null = null) {
    this.formState.formTitle = formType === 'add' ? 'Thêm điểm truy cập mới ' : 'Cập nhật điểm truy cập';
    this.formState.formType = formType;
    if (formType === 'add') {
      this.formSave.reset(
        {
          title: '',
          mota: '',
          loaingulieu: '1',
          icon: '',
          location: this.intersectsVecter[0].point,// vi tri vector3
          parent_id: this.dataDitich.id,
          type: 'INFO', //DIRECT | INFO
          file_media: null, // ảnh 360 | video360
          file_audio: null, // audio thuyết minh
        }
      );
    } else {
      this.formState.object = object;
      this.formSave.reset(
        {
          title: object.title,
          mota: object.mota,
          icon: object.icon,
          loaingulieu: object.loaingulieu,
          location: object.location, // vi tri vector3
          parent_id: object.parent_id,
          type: object.type, //DIRECT | INFO
          file_media: object.file_media, // ảnh 360 | video360
          file_audio: object.file_audio, // audio thuyết minh
        }
      );
    }
  }

  btnFormAdd() {
    this.onOpenFormEdit();
    this.changeInputMode("add");
  }

  btnFormEdit(event: any) {
    console.log(event);
    this.onOpenFormEdit();
    this.changeInputMode("edit");
  }

  async btnFormDelete(point: Point) {
    const xacNhanXoa = await this.notificationService.confirmDelete();
    if (xacNhanXoa) {
      this.notificationService.isProcessing(true);
      this.pointsService.delete(point.id).subscribe({
        next: () => {
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

  saveForm() {
    if (this.formSave.valid) {
      // const getMa_ns = 'ns'+ {''}
      // this.formSave.get('ma_ns').setValue(getMa_ns)
      if (this.formState.formType === "add") {
        this.notificationService.isProcessing(true);
        this.pointsService.create(this.formSave.value).subscribe({
          next: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastSuccess("Thêm mới thành công");
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

          }, error: () => {
            this.notificationService.toastError("Thêm mới thất bại");
            this.notificationService.isProcessing(false);
          }
        })
      } else {
        this.notificationService.isProcessing(true);
        const index = this.danhsachPoint.findIndex(r => r.id === this.formState.object.id);
        this.pointsService.update(this.danhsachPoint[index].id, this.formSave.value).subscribe({
          next: () => {
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
    // this.controls.update();
    // this.controls.reset();
    // this.container.addEventListener('click', this.onClick);
    this.startSeen();
  }

}

