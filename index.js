/* global svlib, MainLoop */
import WebGLDraw from "./wgl6100/index.js";
import { initStats } from "./lib/drawStats.js";
import { initGui, guiObjectFolder } from "./lib/debugGui.js";

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

const baseDrawProps = {
  zoom: 1.0,
  rotation: 0.0,
  cameraX: 0.0,
  cameraY: 0.0,
  lineWidth: 2.0,
  bloomStrength: 1.0,
  bloomRadius: 0.5,
  jitter: 0.0,
};

async function init() {
  const app = new App();
  await app.initialize();
  app.start();

  console.log("READY.");
}

const rndRange = (min, max) => min + Math.random() * (max - min);

class App {
  constructor({ debug = true } = {}) {
    Object.assign(this, { debug });
  }

  async initialize() {
    const webglDraw = new WebGLDraw({
      containerSelector: "#main",
      layers: ["hud", "scene", "backdrop"],
    });
    await webglDraw.init();

    const music = await this.loadMusic();

    this.bounds = {
      x: [-400, 400],
      y: [-400, 400],
    };

    this.lines = [];
    
    for (let idx = 0; idx < 3; idx++) {
      this.lines.push(
        {
          color: {
            h: Math.random(),
            s: rndRange(0.6, 0.8),
            l: rndRange(0.4, 0.6),
            dh: rndRange(0.1, 0.3),
          },          
          start: {
            x: rndRange(...this.bounds.x),
            y: rndRange(...this.bounds.y),
            dx: rndRange(10, 150),
            dy: rndRange(10, 150),
          },
          end: {
            x: rndRange(...this.bounds.x),
            y: rndRange(...this.bounds.y),
            dx: rndRange(10, 150),
            dy: rndRange(10, 150),
          },
        },  
      )
    }

    const drawProps = {
      afterGlow: 0.98,
    };

    const layerDrawProps = {
      hud: {},
      scene: {
        zoom: 1.0,
        rotation: 0.0,
        cameraX: 0.0,
        cameraY: 0.0,
        lineWidth: 1.0,
        bloomStrength: 0.1,
        bloomRadius: 0.2,
        jitter: 0.0,
      },
      backdrop: {},
    };

    const gui = await initGui();
    guiObjectFolder(gui, "drawProps", drawProps, [], false);
    guiObjectFolder(gui, "drawProps.scene", layerDrawProps.scene, [], false);

    Object.assign(this, {
      drawStats: this.debug && (await initStats()),
      gui,
      music,
      webglDraw,
      drawProps,
      layerDrawProps,
    });
  }

  updatePosition(deltaT, position, bounds) {
    position.x += position.dx * deltaT;
    if (position.x < bounds.x[0] || position.x > bounds.x[1]) {
      position.dx = 0 - position.dx;
    }
    position.y += position.dy * deltaT;
    if (position.y < bounds.y[0] || position.y > bounds.y[1]) {
      position.dy = 0 - position.dy;
    }
  }

  update(deltaMS) {
    const deltaT = deltaMS / 1000.0;

    if (this.drawStats) this.drawStats.updateStart();

    const { scene } = this.webglDraw.sprites;
    for (let idx = 0; idx < this.lines.length; idx++) {
      const line = this.lines[idx];

      this.updatePosition(deltaT, line.start, this.bounds);
      this.updatePosition(deltaT, line.end, this.bounds);

      line.color.h += line.color.dh * deltaT;
      if (line.color.h > 1.0 || line.color.h < 0.0) {
        line.color.h = Math.max(0.0, Math.min(1.0, line.color.h));
        line.color.dh = 0 - line.color.dh;
      }

      const baseProps = {
        visible: true,
        position: [0, 0],
        scale: 1,
        rotation: 0,
        color: [...hslToRgb(line.color.h, line.color.s, line.color.l), 1.0],
        shapes: [
          [
            [line.start.x, line.start.y],
            [line.end.x, line.end.y],
          ],
        ],
      };

      const fs = [
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ];
      for (const [fx, fy] of fs) {
        scene[`line-${idx}-${fx}-${fy}`] = {
          ...baseProps,
          shapes: [
            [
              [fx * line.start.x, fy * line.start.y],
              [fx * line.end.x, fy * line.end.y],
            ],
          ],
        };
      }

      /*
      const rotations = 2;
      const angle = (Math.PI * 2) / rotations;
      for (let j = 0; j < rotations; j++) {
        scene[`line-${j}`] = {
          ...baseProps,
          rotation: angle * j
        };
      }
      */
    }

    if (this.drawStats) this.drawStats.updateEnd();
  }

  async loadMusic() {
    await this.loadSunvoxLib();
    const musicResp = await fetch(
      "sunvox/js/music/NightRadio - machine 0004.sunvox"
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
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 1].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l){
  var r, g, b;

  if(s == 0){
      r = g = b = l; // achromatic
  }else{
      var hue2rgb = function hue2rgb(p, q, t){
          if(t < 0) t += 1;
          if(t > 1) t -= 1;
          if(t < 1/6) return p + (q - p) * 6 * t;
          if(t < 1/2) return q;
          if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
  }

  return [r, g, b];
}

init()
  .then()
  .catch((err) => console.error(err));
