precision mediump float;

uniform vec2 uViewportSize;
uniform sampler2D blurLevel0;
uniform sampler2D blurLevel1;
uniform sampler2D blurLevel2;
uniform sampler2D blurLevel3;
uniform sampler2D blurLevel4;
uniform float bloomStrength;
uniform float bloomRadius;

uniform float bloomFactors[5];
uniform vec3 bloomTintColors[5];

float lerpBloomFactor(const in float factor) {
  float mirrorFactor = 1.2 - factor;
  return mix(factor, mirrorFactor, bloomRadius);
}

void main() {
  vec2 vUv = gl_FragCoord.xy / uViewportSize;

  gl_FragColor =
      bloomStrength *
      (lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) *
           texture2D(blurLevel0, vUv) +
       lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) *
           texture2D(blurLevel1, vUv) +
       lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) *
           texture2D(blurLevel2, vUv) +
       lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) *
           texture2D(blurLevel3, vUv) +
       lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) *
           texture2D(blurLevel4, vUv));
}
