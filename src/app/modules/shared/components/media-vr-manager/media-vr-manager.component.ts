import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild
} from '@angular/core';
import * as THREE from 'three';
import {OrbitControls} from '@three-ts/orbit-controls';
import {NotificationService} from '@core/services/notification.service';
import {DmDiemDiTich} from "@shared/models/danh-muc";
import {FileService} from "@core/services/file.service";
import {sceneControl} from "@shared/models/sceneVr";
import {forkJoin, map, Observable} from 'rxjs';
import {OvicFile} from '@core/models/file';
import {AuthService} from "@core/services/auth.service";
import { MenuItem } from 'primeng/api/menuitem';
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Point} from "@shared/models/point";
import {PointsService} from "@shared/services/points.service";

@Component({
  selector: 'media-vr-manager',
  templateUrl: './media-vr-manager.component.html',
  styleUrls: ['./media-vr-manager.component.css']
})
export class MediaVrManagerComponent implements OnInit,AfterViewInit {
  @ViewChild('fromUpdate', {static: true}) formUpdate: TemplateRef<any>;
  @ViewChild('myCanvas', {static: false}) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() dataPoint: DmDiemDiTich;
  //khai bao
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
  menuName:'Point-location';

  filePermission         = {
    canDelete   : true ,
    canDownload : true ,
    canUpload   : true
  };
  filePermistionOnlyShow = { canDelete : false , canDownload : true , canUpload : false };

  iconList =[
    {name:'vị trí mới', path:'assets/icon-png/infomation.png'},
    {name:'Thông tin chi tiết ', path:'assets/icon-png/location.png'},
  ]
  // three js-----------------------------------------------------------------
  container = this.renderer2.createElement('div');
  tooltip = this.renderer2.createElement('div');
  spriteActive = false;
  scene: any = [];
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  controls = new OrbitControls(this.camera);
  rayCaster = new THREE.Raycaster();
  renderer = new THREE.WebGLRenderer();

  //menu right click
  items: MenuItem[] = [
    {
      label: 'Thêm vị trí',
      icon: 'pi pi-plus',
      command: ($event?: any) => this.btnFormAdd()

    },
    {
      label: 'Cập nhật vị trí',
      icon: 'pi pi-file-edit',
      command: ($event?: any) => this.btnFormEdit()

    },
    {
      label: 'Xoá vị trí',
      icon: 'pi pi-trash',
      command: ($event?: any) => this.btnFormDelete($event)

    },
    {
      label: 'Thông tin chi tiết',
      icon: 'pi pi-info-circle',
      command: ($event?: any) => this.btnShowInfo(),

    },
  ];
  formSave :FormGroup = this.fb.group({
    title:['',Validators.required],
    icon:['',Validators.required],
    mota: ['',Validators.required],
    loaingulieu:['',Validators.required],
    location:['',Validators.required], // vi tri vector3
    parent_id:['',Validators.required],
    type:['',Validators.required], //DIRECT | INFO
    media:['',Validators.required], // ảnh 360 | video360
    audio:['',Validators.required], // audio thuyết minh
  })

  constructor(
    private notificationService: NotificationService,
    private element: ElementRef,
    private renderer2: Renderer2,
    private fileService: FileService,
    private auth: AuthService,
    private fb : FormBuilder,
    private pointsService:PointsService
  ) {
  }

  ngAfterViewInit(): void {
    const tooltipElement: HTMLElement = this.tooltip.nativeElement;
    // Sử dụng tooltipElement như bạn muốn;
    console.log(tooltipElement);
  }

  imageLink: string;
  audioLink: string;


  ngOnInit() {
    this.renderer2.addClass(this.container, 'ctn_body');
    this.renderer2.addClass(this.tooltip,'tooltip');
    // //setdata
    this.loadFileMedia().subscribe({
      next: files => {
        const imageObject = this.dataPoint.file_media[0] ? files.find(f => f.file.id === this.dataPoint.file_media[0].id).blob : null;
        const audioObject = this.dataPoint.file_audio ? files.find(f => f.file.id === this.dataPoint.file_audio[0].id).blob : null;
        this.imageLink = imageObject ? URL.createObjectURL(imageObject) : '';
        this.audioLink = audioObject ? URL.createObjectURL(audioObject) : '';
        this.renderer2.appendChild(this.element.nativeElement, this.container);
        this.loadInit(this.imageLink, this.audioLink);
      },
      error: () => {
        this.dataPoint['__media_info'] = [];
      },
    })
  }
  s: any;
  loadInit(image: string, audio: string) {
    //scene and controls
    this.scene = new THREE.Scene();
    this.controls.rotateSpeed = -0.2
    this.controls.enableZoom = false
    this.controls.enablePan = false
    this.controls.enableZoom = false
    this.camera.position.set(-0.1, 0, 0.1)
    this.controls.update()

    // Sphere
    this.s = new sceneControl(image, this.camera, audio);
    // let s2 = new Scene('3602.jpg', camera)
    // s.addPoint( { position: new THREE.Vector3(14, 1.9, -47), name: 'Entrée', scene: s2 })
    // s2.addPoint( { position: new THREE.Vector3(-1, 2, 49.8), name: 'Sortie', scene: s })
    this.s.createScrene(this.scene)
    // Render
    this.renderer.setSize(this.element.nativeElement.offsetWidth, this.element.nativeElement.offsetHeight);
    this.container.appendChild(this.renderer.domElement)
    const animate = () => {
      requestAnimationFrame(animate);
      this.renderer.render(this.scene, this.camera);
    }
    animate()
    this.container.addEventListener('resize', this.onResize)
    this.container.addEventListener('click', this.onClick)
    this.container.addEventListener('mousemove', this.onMouseMove)
  }
  get f() : { [ key : string ] : AbstractControl<any> } {
    return this.formSave.controls;
  }
  onResize = () => {
    let width = this.element.nativeElement.offsetWidth;
    let height = this.element.nativeElement.offsetHeight;
    this.camera.aspect = width / height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.render(this.scene, this.camera)
  }
  // onClick = (e) => {
  //   let mouse = new THREE.Vector2(
  //     (e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  //   this.rayCaster.setFromCamera(mouse, this.camera)
  //   let intersects = this.rayCaster.intersectObjects(this.scene.children)
  //   intersects.forEach(function (intersect) {
  //     if (intersect.object.type === 'Sprite') {
  //       intersect.object.onClick();
  //       if (this.spriteActive) {
  //         this.tooltip.classList.remove('is-active')
  //         this.spriteActive = false
  //       }
  //     }
  //   })
  //   intersects = this.rayCaster.intersectObject(this.s.sphere);
  //   if (intersects.length > 0) {
  //     console.log(intersects[0].point)
  //   }
  // }

  onClick = (e: any) => {
    const mouse = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1,
    );
    this.rayCaster.setFromCamera(mouse, this.camera);
    let intersects = this.rayCaster.intersectObjects(this.scene.children);
    console.log(intersects);
    intersects.forEach((intersect: any) => {
      if (intersect.object.type === "Sprite") {
        intersect.object.onClick();
      }
    });
  }

  onMouseMove = (e: any) => {
    const mouse = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1,
    );
    this.rayCaster.setFromCamera(mouse, this.camera);
    let foundSprite = false;
    let intersects = this.rayCaster.intersectObjects(this.scene.children);
    const tooltip   = this.tooltip.nativeElement;
    intersects.forEach((intersect: any) => {
      if (intersect.object.type === "Sprite") {
        let p = intersect.object.position.clone().project(this.camera);
        tooltip.style.top = ((-1 * p.y + 0.85) * window.innerHeight / 2) + 'px';
        tooltip.style.left = ((p.x + 1) * window.innerWidth / 2) + 'px';
        tooltip.classList.add('is-active');
        tooltip.innerHTML = intersect.object.name;
        this.spriteActive = intersect.object;
        foundSprite = true;
      }
    });
    if (foundSprite === false && this.spriteActive) {
      tooltip.classList.remove('is-active');
      this.spriteActive = false;
    }
    e.preventDefault();
  }

  loadFileMedia(): Observable<{ file: OvicFile, blob: Blob }[]> {
    const ids: OvicFile[] = [].concat(
      this.dataPoint.file_media ? [...this.dataPoint.file_media] : null,
      this.dataPoint.file_audio ? [...this.dataPoint.file_audio] : null
    ).filter(Boolean);

    const request: Observable<{ file: OvicFile, blob: Blob }>[] = ids.reduce((collector, file) => {
      collector.push(
        this.fileService.getFileAsBlobByName(file.id.toString(10)).pipe(map(blob => ({file, blob})))
      )
      return collector;
    }, new Array<Observable<{ file: OvicFile, blob: Blob }>>())

    return forkJoin<{ file: OvicFile, blob: Blob }[]>(request);
  }

  isVolumeOn = false;

  toggleVolume() {
    this.isVolumeOn = !this.isVolumeOn;
    if (this.isVolumeOn) {
      this.s.addAudio(this.audioLink);
      console.log('play');
    } else {
      this.s.pauseAudio(this.audioLink);
      console.log('pause');
    }
  }
  mouseEvent: PointerEvent;
  intersectsVecter:any;
  @HostListener("contextmenu", ["$event"]) onRightClick = (event: PointerEvent) => {
    // event.stopPropagation();
    console.log('log on right click');
    const mouse = new THREE.Vector2((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1,);
    this.rayCaster.setFromCamera(mouse, this.camera);
    let intersects = this.rayCaster.intersectObject(this.s.sphere);
    this.intersectsVecter = intersects;
    console.log(this.intersectsVecter);
    console.log(intersects[0].point.x);
    console.log(intersects[0].point.y);
    console.log(intersects[0].point.z);
    this.mouseEvent = event;
  }

  // su ly Point

  danhsachPoint: Point[];
  loadPoint(){
    this.notificationService.isProcessing(true);
    this.pointsService.load().subscribe({
      next: data=>{
        this.danhsachPoint = data.filter(f => f.parent_id === this.dataPoint.id);
        console.log(this.danhsachPoint);
        this.notificationService.isProcessing(false);
      },
      error: ()=>{
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }

  onOpenFormEdit() {
    setTimeout(() => this.notificationService.openSideNavigationMenu({ template: this.formUpdate, size: 600 }), 100);
  }

  changeInputMode(formType: 'add' | 'edit', object: Point | null = null) {
    this.formState.formTitle = formType === 'add' ? 'Thêm điểm truy cập mới ' : 'Cập nhật điểm truy cập';
    this.formState.formType = formType;
    if (formType === 'add') {
      this.formSave.reset(
        {
          title:'',
          mota: '',
          loaingulieu:'',
          icon:'',
          location:this.intersectsVecter[0].point.x+','+this.intersectsVecter[0].point.y+','+this.intersectsVecter[0].point.z, // vi tri vector3
          parent_id:this.dataPoint.id,
          type:'', //DIRECT | INFO
          file_media:null, // ảnh 360 | video360
          file_audio:null, // audio thuyết minh
        }
      );
    } else {
      this.formState.object = object;
      this.formSave.reset(
        {
          title:object.title,
          mota: object.mota,
          icon:object.icon,
          loaingulieu:object.loaingulieu,
          location:object.location, // vi tri vector3
          parent_id:object.parent_id,
          type:object.type, //DIRECT | INFO
          file_media:object.file_media, // ảnh 360 | video360
          file_audio:object.file_audio, // audio thuyết minh
        }
      );
    }
  }
  btnFormAdd(){
    this.onOpenFormEdit();
    this.changeInputMode("add");
  }
  btnFormEdit(){
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
          this.loadPoint();
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
            this.notificationService.toastSuccess("Thành công");
            this.formSave.reset({
              title:'',
              mota: '',
              loaingulieu:'',
              location:this.intersectsVecter, // vi tri vector3
              parent_id:this.dataPoint.id,
              type:'', //DIRECT | INFO
              file_media:null, // ảnh 360 | video360
              file_audio:null, // audio thuyết minh
            });
            this.loadPoint();
          }, error: () => {
            this.notificationService.toastError("Thêm nhân sự thất bại");
            this.notificationService.isProcessing(false);
          }
        })

      } else {
        this.notificationService.isProcessing(true);
        const index = this.danhsachPoint.findIndex(r => r.id === this.formState.object.id);
        console.log(this.danhsachPoint[index].id);
        this.pointsService.update(this.danhsachPoint[index].id, this.formSave.value).subscribe({
          next: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastSuccess('Cập nhật thành công');
            this.loadPoint();
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
  closeForm(){
      this.loadPoint();
      this.notificationService.closeSideNavigationMenu(this.menuName);
  }
  visible: boolean;
  btnShowInfo() {
    this.visible = true;
  }



}
