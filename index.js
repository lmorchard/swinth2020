/* global svlib, MainLoop */
import WebGLDraw from "./wgl6100/index.js";
import { initStats } from "./lib/drawStats.js";
//import { initGui } from "./debugGui.js";

export const heroShapes = [
  [
    [0.0, 0.5],
    [0.125, 0.4167],
    [0.25, 0.0],
    [0.375, -0.1667],
    [0.25, -0.5],
    [0.125, -0.5],
    [0.0625, -0.25],
    [-0.0625, -0.25],
    [-0.125, -0.5],
    [-0.25, -0.5],
    [-0.375, -0.1667],
    [-0.25, 0.0],
    [-0.125, 0.4167],
    [0.0, 0.5],
  ],
];

async function init() {
  const app = new App();
  await app.initialize();
  app.start();

  console.log("READY.");
}

class App {
  constructor({ debug = true } = {}) {
    Object.assign(this, { debug });
  }

  update(delta) {
    if (this.drawStats) this.drawStats.updateStart();

    this.webglDraw.sprites.scene.foo = {
      visible: true,      
      shapes: heroShapes,
      position: [0, 0],
      scale: 100,
      rotation: 0,
      color: [1, 1, 1, 1]
    };
    // world.execute(delta, performance.now());

    if (this.drawStats) this.drawStats.updateEnd();
  }

  async initialize() {
    const webglDraw = new WebGLDraw({
      containerSelector: "#main",
      layers: ["hud", "scene", "backdrop"],
    });
    await webglDraw.init();

    const music = await this.loadMusic();

    Object.assign(this, {
      drawStats: this.debug && (await initStats()),
      //gui: this.debug && (await initGui(worldState)),
      music,
      webglDraw,
      drawProps: {
        afterGlow: 0.1
      },
      layerDrawProps: {
        hud: {
          zoom: 1.0,
          rotation: 0.0,
          cameraX: 0.0,
          cameraY: 0.0,
          lineWidth: 2.0,
          bloomStrength: 1.0,
          bloomRadius: 0.5,
          jitter: 0.0,
        },
        scene: {
          zoom: 1.0,
          rotation: 0.0,
          cameraX: 0.0,
          cameraY: 0.0,
          lineWidth: 2.0,
          bloomStrength: 1.0,
          bloomRadius: 0.5,
          jitter: 0.0,
        },
        backdrop: {
          zoom: 1.0,
          rotation: 0.0,
          cameraX: 0.0,
          cameraY: 0.0,
          lineWidth: 2.0,
          bloomStrength: 1.0,
          bloomRadius: 0.5,
          jitter: 0.0,
        },
      }
    });
  }

  start() {
    MainLoop.setUpdate((delta) => this.update(delta))
      .setDraw((interpolationPercentage) => this.draw(interpolationPercentage))
      .setEnd((fps, panic) => this.end(fps, panic))
      .start();
  }

  draw(interpolationPercentage) {
    if (this.drawStats) this.drawStats.drawStart();
    this.webglDraw.draw(this.layerDrawProps, this.drawProps);
    if (this.drawStats) this.drawStats.drawEnd();
  }

  end(fps, panic) {
    if (panic) {
      var discardedTime = Math.round(MainLoop.resetFrameDelta());
    }
  }

  async loadMusic() {
    await this.loadSunvoxLib();

    const musicResp = await fetch(
      "sunvox/js/music/NightRadio - machine 0002.sunvox"
    );
    const musicArrayBuffer = await musicResp.arrayBuffer();
    const musicData = new Uint8Array(musicArrayBuffer);

    const ver = sv_init(0, 44100, 2, 0);
    if (ver < 0) {
      throw new Error("SunVox music init failure " + ver);
    }
    sv_open_slot(0);
    if (sv_load_from_memory(0, musicData) == 0) {
      sv_play_from_beginning(0);
    } else {
      console.log("song load error");
    }

    return {};
  }

  loadSunvoxLib() {
    // HACK: `await svlib` appears to hang the browser for reasons I do not yet
    // understand, so I'm quarantining the black magic over here.
    return new Promise((resolve, reject) => svlib.then(() => resolve()));
  }
}

init()
  .then()
  .catch((err) => console.error(err));
