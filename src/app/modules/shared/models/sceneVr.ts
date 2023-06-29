import * as THREE from "three";
import TweenLite from "gsap";

export class sceneControl{
  image:string;
  audio:string;

  scene = new THREE.Scene();
  sprites: any = [];
  sphere: any = [];
  camera: any = [];
  points:any = [];
  point: any ={};
  listener: any;
  sound: any;
  constructor(image, camera ,audio) {
    this.image = image;
    this.points = [];
    this.sprites = [];
    this.scene = null;
    this.camera = camera;
    this.audio = audio;
  }
  createScrene(scene){
    this.scene = scene;
    const geometry = new THREE.SphereGeometry(50, 32, 32);
    let textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(this.image);
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = -1;
    const material = new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
    // material.transparent = true;
    this.sphere = new THREE.Mesh(geometry, material);
    scene.add(this.sphere);
    this.points.forEach((f) => {
      this.addTooltip(f);
    });
  }

  addPoint(point){
    this.points.push(point);
  }
  addTooltip(point) {
    console.log(point);
    let spriteMap = new THREE.TextureLoader().load('./assets/icon-png/location.png');
    let spriteMaterial = new THREE.SpriteMaterial({ map: spriteMap });
    let sprite = new THREE.Sprite(spriteMaterial);
    sprite.name = point.name;
    if (point !== undefined && point.position !== undefined) {
      sprite.position.copy(point.position.clone().normalize().multiplyScalar(13));
    } else {
      // Xử lý trường hợp point không hợp lệ
      console.log("point is undefined or has invalid position");
      console.log(this.point);
    }
    sprite.scale.multiplyScalar(10);
    this.scene.add(sprite);
    this.sprites.push(sprite);
    sprite["onClick"] = () => {
      this.destroy();
      // point.scene.createScrene(screen);
      point.scene.createScrene(this.scene);
      point.scene.appear();
    }
  }
  addAudio(audio){
    this.audio = audio;
    this.listener = new THREE.AudioListener();
    // create an AudioListener and add it to the camera
    this.camera.add(this.listener);
    // create a global audio source
    this.sound = new THREE.Audio(this.listener);
    // load a sound and set it as the Audio object's buffer
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load( audio, function (buffer) {
      this.sound.setBuffer(buffer);
      this.sound.setLoop(true);
      this.sound.setVolume(0.5);
      this.sound.play();
    });
  }
  pauseAudio(audio){
    this.sound.pause();
  }
  destroy () {
    TweenLite.to(this.sphere.material, 1, {
      opacity: 0,
      onComplete: () => {
        this.scene.remove(this.sphere)
      }
    })
    this.sprites.forEach((sprite) => {
      TweenLite.to(sprite.scale, 1, {x: 0, y: 0, z: 0,
        onComplete: () => {
          this.scene.remove(sprite)
        }
      })
    })
  }

  appear () {
    this.sphere.material.opacity = 0
    TweenLite.to(this.sphere.material, 1, {
      opacity: 1
    })
    this.sprites.forEach((sprite) => {
      sprite.scale.set(0, 0, 0)
      TweenLite.to(sprite.scale, 1, {x: 1, y: 1, z: 1})
    })
  }
}
