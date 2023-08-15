import {
  Scene, PerspectiveCamera, Audio,
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
  TextureLoader,
  SpriteMaterial,
  Sprite, RepeatWrapping, DoubleSide, VideoTexture, AudioLoader,
  Vector3, LinearFilter
} from "three";

import TweenLite from "gsap";
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

  scene = new Scene();
  sprites: any = [];
  sphere: any = [];
  spheres: any = [];
  camera: PerspectiveCamera;
  points: OvicVrPoint[] = [];
  point: any = {};
  listener: any;
  sound: Audio;
  state: any;

  constructor(image, camera) {
    this.image = image;
    this.points = [];
    this.sprites = [];
    this.scene = null;
    this.camera = camera;

  }

  createScrene(scene, ovicPointId?: number, state?: boolean) {
    this.scene = scene;
    if (state) {
      this.state = scene;
    }
    const geometry = new SphereGeometry(50, 32, 32);
    let textureLoader = new TextureLoader();
    const texture = textureLoader.load(this.image);// load hinh anh bat dau
    texture.wrapS = RepeatWrapping;
    texture.repeat.x = -1;
    const material = new MeshBasicMaterial({map: texture, side: DoubleSide});
    // material.transparent = true;
    this.sphere = new Mesh(geometry, material);
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
    let spritesRemove = this.sprites.filter(f => f.userData['ovicPointId'] === ovicPointId)
    spritesRemove.forEach(f => {
      f.material.dispose();
      f.material.map.dispose();
      this.scene.remove(f);
    })
  }


  editPoint(point: OvicVrPoint) {
    this.deletePoint(point.userData.ovicPointId);
    this.addPoint(point);
  }

  async addTooltip(point) {
    let spriteMap = new TextureLoader().load(point.userData.iconPoint);
    let spriteMaterial = new SpriteMaterial({map: spriteMap});
    let sprite = new Sprite(spriteMaterial)
    sprite.name = point.name;
    sprite.userData = point.userData;
    if (point !== undefined && point.position !== undefined) {
      sprite.position.copy(point.position.clone().normalize().multiplyScalar(13));
    } else {
      // Xử lý trường hợp point không hợp lệ
    }
    sprite.scale.multiplyScalar(10);
    this.scene.add(sprite);
    this.sprites.push(sprite);
    sprite["onClick"] = () => {
      this.destroy();
      // point.scene.createScrene(screen);
      point.scene.createScrene(this.scene, point.id);
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
    //=========================create videoTexture======================
    const videoTexture = new VideoTexture(videoDom);
    const geometry = new SphereGeometry(50, 32, 32);
    const sphereMaterial = new MeshBasicMaterial({map: videoTexture, side: DoubleSide});
    sphereMaterial.needsUpdate = true;
    this.sphere = new Mesh(geometry, sphereMaterial);
    this.scene.add(this.sphere);
    videoTexture.needsUpdate = true;
    this.points.forEach((f) => {
      this.addTooltip(f);
    });
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

  hoverUp() {
    const originalScale = new Vector3();
    this.sprites.forEach(sprite => {
        TweenLite.to(sprite.scale, 0.2, {x: originalScale.x * 1.2, y: originalScale.y * 1.2, z: originalScale.z * 1.2});
      }
    )
  }

  hoverDown() {
    const originalScale = new Vector3();

    this.sprites.forEach(sprite => {
        TweenLite.to(sprite.scale, 0.2, {x: originalScale.x, y: originalScale.y, z: originalScale.z});
      }
    )

  }

}

