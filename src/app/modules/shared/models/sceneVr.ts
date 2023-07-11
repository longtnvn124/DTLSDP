import * as THREE from "three";
import TweenLite from "gsap";
import {Vector3} from "three/src/math/Vector3";

interface OvicVrPoint {
  userData: {
    ovicPointId: number,
    iconPoint: string,
    [key: string]: any
  };
  name: string;
  position: Vector3,
  scene: sceneControl,
}


export class sceneControl {
  image: string;
  audio: string;

  scene = new THREE.Scene();
  sprites: any = [];
  sphere: any = [];
  spheres: any = [];
  camera :THREE.PerspectiveCamera;
  points: OvicVrPoint[] = [];
  point: any = {};
  listener: any;
  sound: THREE.Audio;
  state:any;
  constructor(image, camera, audio) {
    this.image = image;
    this.points = [];
    this.sprites = [];
    this.scene = null;
    this.camera = camera;
    this.audio = audio;
  }

  createScrene(scene, ovicPointId?: number, state?:boolean) {
    this.scene = scene;
    if(state){
      this.state = scene;
    }
    const geometry = new THREE.SphereGeometry(50, 32, 32);
    let textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(this.image);// load hinh anh bat dau
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = -1;
    const material = new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide});
    // material.transparent = true;
    this.sphere = new THREE.Mesh(geometry, material);
    if (ovicPointId) {
      this.sphere.userData = {ovicPointId: ovicPointId};
      this.spheres.push(this.sphere);
    }
    this.scene.add(this.sphere);
    this.points.forEach((f) => {
      this.addTooltip(f);
    });
  }

  addPoint(point: OvicVrPoint) {
    this.points.push(point);
  }

  deletePoint(ovicPointId: number) {
    // this.points = this.points.filter(u => u.userData.ovicPointId !== ovicPointId);
    // let object3d = this.spheres.find(f => f.userData.ovicPointId === ovicPointId)
    // this.scene.remove(object3d);
    // object3d.geometry.dispose();
    // object3d.material.dispose();
    // object3d = undefined;
    // console.log(this.scene);
    // console.log(this.spheres);
    // console.log(this.sprites);
    // ovicPointId: 27
    // console.log(this.sprites.filter(f=>f.userData['ovicPointId'] === ovicPointId));
    // console.log(this.spheres.filter(f=>f.userData['ovicPointId'] === ovicPointId));
    let spritesRemove = this.sprites.filter(f=>f.userData['ovicPointId'] === ovicPointId)
    spritesRemove.forEach(f=>{
      // sprite.material.dispose();
      // sprite.material.map.dispose();
      // sprite.texture.dispose();
      f.material.dispose();
      f.material.map.dispose();
      this.scene.remove(f);
      }
    )

  }


  editPoint(point: OvicVrPoint) {
    this.deletePoint(point.userData.ovicPointId);
    this.addPoint(point);
  }

  addTooltip(point,isCheck?:boolean) {
    // let spriteMap = new THREE.TextureLoader().load(point.userData.iconPoint);
    let spriteMap = new THREE.TextureLoader().load('./assets/icon-png/info.gif');
    let spriteMaterial = new THREE.SpriteMaterial({map: spriteMap});
    let sprite = new THREE.Sprite(spriteMaterial);

    sprite.name = point.name;
    sprite.userData = point.userData;
    // sprite.userData = { ovicPointId: 100};
    if (point !== undefined && point.position !== undefined) {
      sprite.position.copy(point.position.clone().normalize().multiplyScalar(13));
    } else {
      // Xử lý trường hợp point không hợp lệ
      console.log("point is undefined or has invalid position");
    }
    sprite.scale.multiplyScalar(10);
    this.scene.add(sprite);
    this.sprites.push(sprite);
    sprite["onClick"] = () => {
      this.destroy();
      // point.scene.createScrene(screen);
      point.scene.createScrene(this.scene);
      point.scene.appear();
    };
    sprite["mousemove"] = () => {
      point.scene.appear();
    }

    // const originalScale = sprite.scale.clone();

// // Hiệu ứng hover vào Sprite
//     sprite.on('mouseover', () => {
//       TweenLite.to(sprite.scale, 0.2, { x: originalScale.x * 1.2, y: originalScale.y * 1.2, z: originalScale.z * 1.2 });
//     });
//
// // Hiệu ứng hover ra khỏi Sprite
//     sprite.on('mouseout', () => {
//       TweenLite.to(sprite.scale, 0.2, { x: originalScale.x, y: originalScale.y, z: originalScale.z });
//     });


  }

  createMovie(scene, videoDom: HTMLVideoElement) {
    this.scene = scene;
    const geometry = new THREE.SphereGeometry(50, 32, 32);
    const videoTexture = new THREE.VideoTexture(videoDom);
    const material = new THREE.MeshBasicMaterial({map: videoTexture, side: THREE.DoubleSide});
    material.needsUpdate = true;
    // material.transparent = true;
    this.sphere = new THREE.Mesh(geometry, material);
    scene.add(this.sphere);
    this.points.forEach((f) => {
      this.addTooltip(f);
    });
  }

  addAudio(audio) {
    this.audio = audio;
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);
    this.sound = new THREE.Audio(this.listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(audio, function (buffer) {
      this.sound.setBuffer(buffer);
      this.sound.setLoop(true);
      this.sound.setVolume(0.5);
      this.sound.play();
    });
  }

  pauseAudio(audio) {
    this.sound.pause();
  }

  destroy() {
    TweenLite.to(this.sphere.material, 1, {
      opacity: 0,
      onComplete: () => {
        this.scene.remove(this.sphere)
      }
    })
    this.sprites.forEach((sprite) => {
      TweenLite.to(sprite.scale, 1, {
        x: 0, y: 0, z: 0,
        onComplete: () => {
          this.scene.remove(sprite)
        }
      })
    })
  }

  appear() {
    this.sphere.material.opacity = 0
    TweenLite.to(this.sphere.material, 1, {
      opacity: 1,
    })
    this.sprites.forEach((sprite) => {
      sprite.scale.set(0, 0, 0)
      TweenLite.to(sprite.scale, 1, {x: 1, y: 1, z: 1})
    })
  }
  hoverUp(){
    const originalScale = new THREE.Vector3();
    this.sprites.forEach(sprite=>{
      TweenLite.to(sprite.scale, 0.2, { x: originalScale.x * 1.2, y: originalScale.y * 1.2, z: originalScale.z * 1.2 });
      }
    )
  }
  hoverDown(){
    const originalScale = new THREE.Vector3();

    this.sprites.forEach(sprite=>{
        TweenLite.to(sprite.scale, 0.2, { x: originalScale.x, y: originalScale.y, z: originalScale.z });
      }
    )

  }

}
