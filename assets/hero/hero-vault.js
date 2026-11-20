/**
 * hero-vault.js
 * Self-contained 3D Point-Cloud WebGL Hero (Default Dark Crimson Theme)
 * + Zero-Exposure Cryptographic Portrait Vault Client (Protocol SHV2).
 */

(function () {
  'use strict';

  window.__initHeroVault = function () {
    const stageEl = document.getElementById('hero-stage');
    const canvas = document.getElementById('webgl-canvas');
    if (!stageEl || !canvas) return;

    if (window.__HERO_VAULT_ACTIVE__ && window.__HERO_CURRENT_CANVAS__ === canvas) {
      console.log('[hero-vault] Already running on active canvas.');
      return;
    }

    if (typeof window.__HERO_VAULT_CANCEL_ANIM__ === 'function') {
      try { window.__HERO_VAULT_CANCEL_ANIM__(); } catch (e) {}
      window.__HERO_VAULT_CANCEL_ANIM__ = null;
    }

    window.__HERO_VAULT_ACTIVE__ = true;
    window.__HERO_CURRENT_CANVAS__ = canvas;

  const ZERO_2X2 = new Uint8Array(16);
  const AdditiveBlending = 2;
  const NormalBlending = 1;

  class Vector2 { constructor(x = 0, y = 0) { this.x = x; this.y = y; } set(x, y) { this.x = x; this.y = y; return this; } }
  class Vector3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } }
  class BufferAttribute {
    constructor(array, itemSize) { this.array = array; this.itemSize = itemSize; this.count = array.length / itemSize; this.needsUpdate = true; }
  }
  class BufferGeometry {
    constructor() { this.attributes = {}; }
    setAttribute(name, attr) { this.attributes[name] = attr; return this; }
  }
  class PlaneGeometry extends BufferGeometry {
    constructor(width = 1, height = 1) {
      super();
      const hw = width * 0.5, hh = height * 0.5;
      this.setAttribute('position', new BufferAttribute(new Float32Array([
        -hw, -hh, 0, hw, -hh, 0, hw, hh, 0,
        -hw, -hh, 0, hw, hh, 0, -hw, hh, 0
      ]), 3));
      this.setAttribute('uv', new BufferAttribute(new Float32Array([
        0, 0, 1, 0, 1, 1,
        0, 0, 1, 1, 0, 1
      ]), 2));
    }
  }
  class Texture {
    constructor(image = null) { this.image = image; this.needsUpdate = Boolean(image); this._glTex = null; }
  }
  class ShaderMaterial {
    constructor(params = {}) {
      this.vertexShader = params.vertexShader || '';
      this.fragmentShader = params.fragmentShader || '';
      this.uniforms = params.uniforms || {};
      this.transparent = !!params.transparent;
      this.blending = params.blending || NormalBlending;
      this._program = null;
    }
  }
  class Object3D {
    constructor() { this.position = new Vector3(); this.scale = new Vector3(1, 1, 1); this.visible = true; this.renderOrder = 0; }
  }
  class Points extends Object3D { constructor(g, m) { super(); this.geometry = g; this.material = m; this.isPoints = true; } }
  class Mesh extends Object3D { constructor(g, m) { super(); this.geometry = g; this.material = m; } }
  class Scene extends Object3D { constructor() { super(); this.children = []; } add(o) { this.children.push(o); } }
  class OrthographicCamera extends Object3D {
    constructor(l, r, t, b, n, f) {
      super(); this.left = l; this.right = r; this.top = t; this.bottom = b; this.near = n; this.far = f;
      this.projectionMatrix = new Float32Array(16);
      this.updateProjectionMatrix();
    }
    updateProjectionMatrix() {
      const w = 1.0 / (this.right - this.left);
      const h = 1.0 / (this.top - this.bottom);
      const p = 1.0 / (this.far - this.near);
      const m = this.projectionMatrix;
      m[0] = 2 * w; m[4] = 0; m[8] = 0; m[12] = -(this.right + this.left) * w;
      m[1] = 0; m[5] = 2 * h; m[9] = 0; m[13] = -(this.top + this.bottom) * h;
      m[2] = 0; m[6] = 0; m[10] = -2 * p; m[14] = -(this.far + this.near) * p;
      m[3] = 0; m[7] = 0; m[11] = 0; m[15] = 1;
    }
  }

  class WebGLRenderer {
    constructor(el) {
      this.domElement = el;
      this.gl = el.getContext('webgl', { alpha: false, antialias: true, premultipliedAlpha: false, preserveDrawingBuffer: false });
      this.pixelRatio = 1;
    }
    setPixelRatio(pr) { this.pixelRatio = Math.min(pr || 1, 2); }
    setSize(w, h) {
      if (!this.gl) return;
      this.domElement.width = Math.max(1, Math.round(w * this.pixelRatio));
      this.domElement.height = Math.max(1, Math.round(h * this.pixelRatio));
      this.domElement.style.width = w + 'px';
      this.domElement.style.height = h + 'px';
      this.gl.viewport(0, 0, this.domElement.width, this.domElement.height);
    }
    setClearColor(hex, a = 1) {
      if (!this.gl) return;
      this.gl.clearColor(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255, a);
    }
    ensureTexture(tex) {
      const gl = this.gl;
      if (!tex._glTex) {
        tex._glTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex._glTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, ZERO_2X2);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      return tex._glTex;
    }
    uploadTextureImmediate(tex, source, detachRef = false) {
      const gl = this.gl;
      if (!gl) return;
      this.ensureTexture(tex);
      gl.bindTexture(gl.TEXTURE_2D, tex._glTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      tex.needsUpdate = false;
      if (detachRef) tex.image = null;
    }
    wipeTexture(tex) {
      const gl = this.gl;
      if (!gl) return;
      this.ensureTexture(tex);
      gl.bindTexture(gl.TEXTURE_2D, tex._glTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, ZERO_2X2);
      tex.image = null;
      tex.needsUpdate = false;
    }
    _compile(mat) {
      const gl = this.gl;
      const pVS = `precision highp float;\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\nattribute vec3 position;\nattribute vec2 uv;\n`;
      const pFS = `precision highp float;\n`;
      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, pVS + mat.vertexShader); gl.compileShader(vs);
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, pFS + mat.fragmentShader); gl.compileShader(fs);
      const prog = gl.createProgram();
      gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
      mat._program = prog;
    }
    render(scene, camera) {
      const gl = this.gl;
      if (!gl) return;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const items = scene.children.filter((c) => c.visible).slice().sort((a, b) => a.renderOrder - b.renderOrder);
      for (const obj of items) {
        const mat = obj.material, geom = obj.geometry;
        if (!mat._program) this._compile(mat);
        const prog = mat._program;
        gl.useProgram(prog);

        if (mat.transparent) {
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, mat.blending === AdditiveBlending ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
        } else {
          gl.disable(gl.BLEND);
        }

        const mv = new Float32Array([
          obj.scale.x, 0, 0, 0,
          0, obj.scale.y, 0, 0,
          0, 0, obj.scale.z, 0,
          obj.position.x, obj.position.y, obj.position.z - camera.position.z, 1
        ]);
        const pLoc = gl.getUniformLocation(prog, 'projectionMatrix');
        if (pLoc) gl.uniformMatrix4fv(pLoc, false, camera.projectionMatrix);
        const mvLoc = gl.getUniformLocation(prog, 'modelViewMatrix');
        if (mvLoc) gl.uniformMatrix4fv(mvLoc, false, mv);

        let texUnit = 0;
        for (const [uName, uObj] of Object.entries(mat.uniforms)) {
          const loc = gl.getUniformLocation(prog, uName);
          if (!loc) continue;
          const val = uObj.value;
          if (typeof val === 'number') gl.uniform1f(loc, val);
          else if (val instanceof Vector2) gl.uniform2f(loc, val.x, val.y);
          else if (val instanceof Vector3) gl.uniform3f(loc, val.x, val.y, val.z);
          else if (val instanceof Texture) {
            this.ensureTexture(val);
            gl.activeTexture(gl.TEXTURE0 + texUnit);
            gl.bindTexture(gl.TEXTURE_2D, val._glTex);
            if (val.needsUpdate && val.image) {
              gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, val.image);
              val.needsUpdate = false;
            }
            gl.uniform1i(loc, texUnit);
            texUnit++;
          }
        }

        let vertexCount = 0;
        for (const [aName, attr] of Object.entries(geom.attributes)) {
          const aLoc = gl.getAttribLocation(prog, aName);
          if (aName === 'position') vertexCount = attr.count;
          if (aLoc === -1) continue;
          if (!attr._glBuf) { attr._glBuf = gl.createBuffer(); attr.needsUpdate = true; }
          gl.bindBuffer(gl.ARRAY_BUFFER, attr._glBuf);
          if (attr.needsUpdate) { gl.bufferData(gl.ARRAY_BUFFER, attr.array, gl.STATIC_DRAW); attr.needsUpdate = false; }
          gl.enableVertexAttribArray(aLoc);
          gl.vertexAttribPointer(aLoc, attr.itemSize, gl.FLOAT, false, 0, 0);
        }
        gl.drawArrays(obj.isPoints ? gl.POINTS : gl.TRIANGLES, 0, vertexCount);
      }
    }
  }

  const ASSET_DOTS = stageEl.getAttribute('data-dots-url') || '/assets/hero/dots.bin';
  const ASSET_SEMI = stageEl.getAttribute('data-semi-url') || '/assets/hero/photo-semi.webp';
  const CONFIGURED_API = (stageEl.getAttribute('data-vault-api') || '').trim();
  const IS_LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const VAULT_API_BASE = CONFIGURED_API || 'https://shahriyar-face-vault.shahriyarsojibhasan.workers.dev';

  const PHOTO_ASPECT = 1672 / 941;
  const PORTRAIT_SCALE = 1.12;
  const Y_ANCHOR_OFFSET = -0.055;

  const preloaderEl = document.getElementById('hero-preloader');
  const ringProgressEl = document.getElementById('hero-ring-progress');
  const pctReadoutEl = document.getElementById('hero-pct-readout');
  const actionWrapEl = document.getElementById('hero-action-wrap');
  const statusPillEl = document.getElementById('hero-status-pill');
  const statusTextEl = document.getElementById('hero-status-text');
  const revealBtnEl = document.getElementById('hero-reveal-btn');
  const keyDockEl = document.getElementById('hero-key-dock');
  const unlockBtnEl = document.getElementById('hero-unlock-btn');
  const inlineInputWrapEl = document.getElementById('hero-inline-input-wrap');
  const inlineKeyInputEl = document.getElementById('hero-inline-key-input');
  const inlineEyeEl = document.getElementById('hero-inline-eye');
  const eyeIconOpen = document.getElementById('eye-icon-open');
  const eyeIconClosed = document.getElementById('eye-icon-closed');
  const inlineActionBtn = document.getElementById('hero-inline-action-btn');
  const actionIconCross = document.getElementById('action-icon-cross');
  const actionIconTick = document.getElementById('action-icon-tick');
  const inlineSpinnerEl = document.getElementById('hero-inline-spinner');
  let isDockExpanded = false;
  const lockBtnEl = document.getElementById('hero-lock-btn');
  const portfolioBtnEl = document.getElementById('hero-portfolio-btn');
  if (portfolioBtnEl) {
    portfolioBtnEl.addEventListener('click', (e) => {
      e.preventDefault();
      const el = document.getElementById('portfolio-nav') || document.getElementById('overview');
      if (el) {
        const targetY = el.getBoundingClientRect().top + window.pageYOffset - 70;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
      }
    });
  }

  // Obsolete modal elements removed in favor of sleek In-Button Smart Morphing Pill Dock

  stageEl.addEventListener('contextmenu', (e) => e.preventDefault());
  stageEl.addEventListener('dragstart', (e) => e.preventDefault());

  const RING_CIRCUM = 2.0 * Math.PI * 65.0;
  function setPreloaderProgress(pct) {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    if (pctReadoutEl) pctReadoutEl.textContent = clamped + '%';
    if (ringProgressEl) ringProgressEl.style.strokeDashoffset = (RING_CIRCUM * (1.0 - clamped / 100.0)).toFixed(2);
  }

  // Channel-packed Monumental Typography Canvas (2560 x 760):
  //   RED channel   = Full-width monumental "SHAHRIYAR" in original [DEVELOPER] Anton style (upper 70%)
  //   GREEN channel = Crisp small "SOJIB" (left) & "HASAN" (right) positioned right below the baseline/feet of SHAHRIYAR
  function drawBannerCanvas(isCompact) {
    const bw = 2560, bh = 760;
    const c = document.createElement('canvas');
    c.width = bw; c.height = bh;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, bw, bh);

    // 1) Massive full-width "SHAHRIYAR" in RED channel (#ff0000) — matches original [DEVELOPER] scale!
    ctx.save();
    const mainName = 'SHAHRIYAR';
    ctx.font = "900 390px 'Anton', 'Impact', 'Inter', sans-serif";
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    const m = ctx.measureText(mainName);
    const targetW = bw * 0.935;
    const scaleX = targetW / Math.max(m.width, 100);
    const scaleY = isCompact ? 1.15 : 1.24;
    ctx.translate(bw * 0.5, bh * 0.37);
    ctx.scale(scaleX, scaleY);
    ctx.fillStyle = '#ff0000';
    ctx.fillText(mainName, 0, 0);
    ctx.restore();

    // 2) Small crisp "SOJIB" (left) & "HASAN" (right) right near the bottom feet/below SHAHRIYAR in GREEN channel (#00ff00)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#00ff00';
    ctx.strokeStyle = '#00ff00';

    function drawTrackedAligned(str, anchorX, y, align, fontSize, tracking) {
      ctx.font = `600 ${fontSize}px 'Space Grotesk', 'Inter', sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      const chars = str.split('');
      const widths = chars.map((ch) => ctx.measureText(ch).width);
      const totalW = widths.reduce((a, b) => a + b, 0) + tracking * Math.max(0, chars.length - 1);
      let x = align === 'right' ? (anchorX - totalW) : anchorX;
      const startX = x;
      for (let i = 0; i < chars.length; i++) {
        ctx.fillText(chars[i], x, y);
        x += widths[i] + tracking;
      }
      return { startX, endX: startX + totalW, totalW };
    }

    const footY = isCompact ? bh * 0.80 : bh * 0.82;
    const fontSz = isCompact ? 56 : 50;
    const track = isCompact ? 22 : 20;
    const marginX = bw * 0.036;

    const leftBox = drawTrackedAligned('SOJIB', marginX, footY, 'left', fontSz, track);
    const rightBox = drawTrackedAligned('HASAN', bw - marginX, footY, 'right', fontSz, track);

    // Subtle refined flanking accent line extending inward cleanly (well outside bust silhouette)
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftBox.endX + 28, footY);
    ctx.lineTo(leftBox.endX + (isCompact ? 90 : 140), footY);
    ctx.moveTo(rightBox.startX - 28, footY);
    ctx.lineTo(rightBox.startX - (isCompact ? 90 : 140), footY);
    ctx.stroke();

    ctx.restore();
    return c;
  }

  const renderer = new WebGLRenderer(canvas);
  if (!renderer.gl) {
    if (preloaderEl) preloaderEl.classList.add('hidden');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x070608, 1);

  const scene = new Scene();
  let stageW = stageEl.clientWidth || window.innerWidth;
  let stageH = Math.max(stageEl.clientHeight || window.innerHeight, 1);
  let viewAspect = stageW / stageH;
  let lastBannerCompact = viewAspect < 1.05;

  const camera = new OrthographicCamera(-0.5 * viewAspect, 0.5 * viewAspect, 0.5, -0.5, -10.0, 10.0);
  camera.position.set(0, 0, 2.0);

  const bannerTex = new Texture(drawBannerCanvas(lastBannerCompact));
  const semiTex = new Texture();
  const fullTex = new Texture();

  function refreshBannerTexture() {
    lastBannerCompact = viewAspect < 1.05;
    renderer.uploadTextureImmediate(bannerTex, drawBannerCanvas(lastBannerCompact), true);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refreshBannerTexture);
  }

  const sharedUniforms = {
    uTime: { value: 0.0 },
    uAspect: { value: viewAspect },
    uPortraitScale: { value: PORTRAIT_SCALE },
    uYOffset: { value: Y_ANCHOR_OFFSET },
    uFlyIn: { value: 0.0 },
    uIntroSweepY: { value: 1.2 },
    uHeadYaw: { value: 0.0 },
    uHeadPitch: { value: 0.0 },
    uCursorPos: { value: new Vector2(0.0, 0.0) },
    uCursorActive: { value: 0.0 },
    uRevealBandY: { value: 0.72 },
    uUnlockBandY: { value: 0.75 },
    uUnlocked: { value: 0.0 },
    uViewportH: { value: stageH * Math.min(window.devicePixelRatio || 1, 2) },
    uBannerTex: { value: bannerTex },
    uSemiTex: { value: semiTex },
    uFullTex: { value: fullTex },
  };

  // LAYER 0: Original Dark Crimson Background + Monumental SHAHRIYAR + Lower Flanking SOJIB / HASAN
  const bgMesh = new Mesh(
    new PlaneGeometry(2.0, 2.0),
    new ShaderMaterial({
      uniforms: sharedUniforms,
      transparent: false,
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uAspect;
        uniform float uPortraitScale;
        uniform float uYOffset;
        uniform float uFlyIn;
        uniform float uHeadYaw;
        uniform float uRevealBandY;
        uniform float uUnlockBandY;
        uniform float uUnlocked;
        uniform sampler2D uBannerTex;
        uniform sampler2D uSemiTex;

        float safePow(float a, float b) { return pow(max(a, 0.0001), b); }
        float hash12(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * 0.1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
        }

        void main() {
          vec2 worldXY = vec2((vUv.x - 0.5) * uAspect, vUv.y - 0.5);

          // Exact original dark obsidian-crimson vignette
          float rad = length(vec2(worldXY.x * 0.65, worldXY.y - 0.02));
          vec3 bgCol = mix(vec3(0.055, 0.022, 0.032), vec3(0.022, 0.018, 0.024), smoothstep(0.0, 0.85, rad));

          // Banner vertical mapping:
          //   SHAHRIYAR occupies UV.y [0.28..0.98] -> worldXY.y [-0.04..+0.36] (exact original [DEVELOPER] band!)
          //   SOJIB & HASAN sit at UV.y ~0.18     -> worldXY.y ~ -0.10 (right near the feet/slightly below SHAHRIYAR!)
          vec2 bannerUV = vec2(vUv.x, (worldXY.y - (-0.195)) / 0.565);
          float inBannerY = step(0.0, bannerUV.y) * step(bannerUV.y, 1.0);
          vec2 bannerSample = vec2(0.0);
          if (inBannerY > 0.5) bannerSample = texture2D(uBannerTex, bannerUV).rg;

          float mainAlpha = bannerSample.r;  // SHAHRIYAR
          float sideAlpha = bannerSample.g;  // SOJIB & HASAN

          // Vertical fade calibrated directly over the SHAHRIYAR glyph height (UV.y 0.30..0.96)
          float vGrad = smoothstep(0.30, 0.96, bannerUV.y);

          float revSmooth = smoothstep(0.0, 1.0, clamp((worldXY.y - uRevealBandY) / 0.16, 0.0, 1.0));
          float unlockSmooth = uUnlocked * smoothstep(0.0, 1.0, clamp((worldXY.y - uUnlockBandY) / 0.15, 0.0, 1.0));

          // Original iconic Grey-to-Black (Dots) -> Deep Crimson-to-Black (Revealed) banner fill
          vec3 greyBanner = mix(bgCol, vec3(0.56, 0.55, 0.58), safePow(vGrad, 1.15));
          vec3 crimsonBanner = mix(vec3(0.035, 0.010, 0.016), vec3(0.72, 0.045, 0.075), safePow(vGrad, 1.08));
          vec3 unlockedBanner = mix(vec3(0.045, 0.012, 0.018), vec3(0.84, 0.065, 0.105), safePow(vGrad, 1.02));
          vec3 mainFill = mix(mix(greyBanner, crimsonBanner, revSmooth), unlockedBanner, unlockSmooth);

          // Crisp smaller SOJIB & HASAN labels right below SHAHRIYAR's baseline
          vec3 sideGrey = vec3(0.54, 0.52, 0.56);
          vec3 sideCrimson = vec3(0.80, 0.12, 0.17);
          vec3 sideUnlocked = vec3(0.92, 0.22, 0.26);
          vec3 sideFill = mix(mix(sideGrey, sideCrimson, revSmooth), sideUnlocked, unlockSmooth);

          // Bust dimming silhouette behind 3D head & shoulders
          vec2 localXY = vec2(worldXY.x, worldXY.y - uYOffset) / uPortraitScale;
          float headShiftX = sin(uHeadYaw) * 0.11 * smoothstep(-0.155, -0.005, localXY.y);
          vec2 photoUV = vec2((localXY.x - headShiftX) / 1.776833 + 0.5, localXY.y + 0.5);
          float bustMask = 0.0;
          if (photoUV.x >= 0.0 && photoUV.x <= 1.0 && photoUV.y >= 0.0 && photoUV.y <= 1.0) {
            bustMask = texture2D(uSemiTex, photoUV).a;
          }
          float headAura = exp(-(pow((localXY.x - headShiftX) / 0.24, 2.0) + pow((localXY.y - 0.12) / 0.28, 2.0)) * 1.4);
          float torsoAura = exp(-(pow(localXY.x / 0.44, 2.0) + pow((localXY.y + 0.32) / 0.26, 2.0)) * 1.6);
          float behindBust = clamp(max(bustMask, max(headAura, torsoAura) * 0.85), 0.0, 1.0) * smoothstep(0.1, 0.9, uFlyIn);

          float flyAlpha = smoothstep(0.05, 0.85, uFlyIn);
          vec3 col = mix(bgCol, mainFill, mainAlpha * mix(1.0, 0.045, behindBust) * flyAlpha);
          col = mix(col, sideFill, sideAlpha * mix(0.92, 0.12, behindBust) * flyAlpha);

          // Original crimson reveal band glow
          float bandGlow = exp(-pow((worldXY.y - uRevealBandY) / 0.032, 2.0)) * step(-0.62, uRevealBandY) * step(uRevealBandY, 0.62);
          col += vec3(0.45, 0.028, 0.048) * bandGlow * 0.38;

          // Decryption sweep glow when unlocking Full Reveal
          float unlockGlow = uUnlocked * exp(-pow((worldXY.y - uUnlockBandY) / 0.026, 2.0)) * step(-0.62, uUnlockBandY) * step(uUnlockBandY, 0.62);
          col += vec3(0.75, 0.10, 0.14) * unlockGlow * 0.48;

          float grain = (hash12(gl_FragCoord.xy + fract(uTime * 17.3) * 100.0) - 0.5) * 0.026;
          col = clamp(col + vec3(grain), 0.0, 1.0);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    })
  );
  bgMesh.renderOrder = 0;
  scene.add(bgMesh);

  // LAYER 1: Halftone Circle-Grid Reveal Mesh (Semi-Blurred -> Decrypted Full GPU Texture)
  const photoMesh = new Mesh(
    new PlaneGeometry(PHOTO_ASPECT, 1.0),
    new ShaderMaterial({
      uniforms: sharedUniforms,
      transparent: true,
      blending: NormalBlending,
      vertexShader: `
        varying vec2 vUv;
        varying float vWorldY;
        uniform float uPortraitScale;
        uniform float uYOffset;
        void main() {
          vUv = uv;
          vec3 scaledPos = vec3(position.x * uPortraitScale, position.y * uPortraitScale + uYOffset, 0.0);
          vWorldY = scaledPos.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vWorldY;
        uniform float uRevealBandY;
        uniform float uUnlockBandY;
        uniform float uUnlocked;
        uniform float uTime;
        uniform sampler2D uSemiTex;
        uniform sampler2D uFullTex;

        void main() {
          vec4 semiCol = texture2D(uSemiTex, vUv);

          // Full Reveal Holographic Laser Decryption
          float beamDist = vWorldY - uUnlockBandY;
          float unlockP = uUnlocked * smoothstep(-0.06, 0.06, beamDist);

          float laserWidth = 0.024;
          float laserCore = exp(-pow(beamDist / laserWidth, 2.0)) * uUnlocked;
          float laserGlow = exp(-pow(beamDist / (laserWidth * 3.8), 2.0)) * uUnlocked;

          // Chromatic aberration at the decryption event horizon
          vec2 aberr = vec2(0.0055, 0.0) * laserGlow;
          vec4 fullR = texture2D(uFullTex, vUv + aberr);
          vec4 fullG = texture2D(uFullTex, vUv);
          vec4 fullB = texture2D(uFullTex, vUv - aberr);
          vec4 fullCol = mix(fullG, vec4(fullR.r, fullG.g, fullB.b, fullG.a), laserGlow * 0.85);

          vec4 texCol = mix(semiCol, fullCol, unlockP);
          if (texCol.a < 0.005) discard;

          float revP = clamp((vWorldY - uRevealBandY) / 0.165, 0.0, 1.0);
          if (revP <= 0.01 && unlockP <= 0.01) discard;

          vec2 cellUV = fract(vUv * vec2(236.0, 133.0)) - 0.5;
          float cellDist = length(cellUV);
          float growT = smoothstep(0.08, 0.88, revP);
          float radius = growT * 0.76;
          float circleAlpha = 1.0 - smoothstep(radius - 0.055, radius + 0.015, cellDist);
          circleAlpha = mix(circleAlpha, 1.0, smoothstep(0.84, 0.96, revP));
          // Once unlocked, guarantee 100% solid unmasked clarity without halftone circle holes
          circleAlpha = mix(circleAlpha, 1.0, unlockP);

          float edgeGlow = (1.0 - smoothstep(0.0, 0.12, abs(cellDist - radius))) * (1.0 - growT) * 0.45 * (1.0 - unlockP);
          vec3 finalRGB = mix(texCol.rgb, vec3(0.85, 0.14, 0.20), edgeGlow);

          // Energetic Holographic Laser Decryption Crest
          float scanline = sin(vUv.y * 540.0 + uTime * 20.0) * 0.5 + 0.5;
          vec3 laserCol = mix(vec3(1.0, 0.18, 0.24), vec3(1.0, 0.85, 0.92), laserCore);
          finalRGB += laserCol * (laserCore * 1.5 + laserGlow * 0.75) * uUnlocked;
          finalRGB += vec3(1.0, 0.32, 0.40) * (laserGlow * scanline * 0.45) * uUnlocked;

          gl_FragColor = vec4(finalRGB, texCol.a * circleAlpha);
        }
      `
    })
  );
  photoMesh.renderOrder = 1;
  scene.add(photoMesh);

  // LAYER 2: 78,000 Additive Crimson Surface Dots (with collar-aligned geometry & refined neck pivot)
  function buildDotsSystem(buffer) {
    const dv = new DataView(buffer);
    const count = dv.getUint32(4, true);
    const minX = dv.getFloat32(8, true), maxX = dv.getFloat32(12, true);
    const minY = dv.getFloat32(16, true), maxY = dv.getFloat32(20, true);
    const minZ = dv.getFloat32(24, true), maxZ = dv.getFloat32(28, true);

    const positions = new Float32Array(count * 3);
    const normals = new Float32Array(count * 3);
    const rands = new Float32Array(count);
    const brights = new Float32Array(count);

    let offset = 32;
    const spanX = maxX - minX, spanY = maxY - minY, spanZ = maxZ - minZ;

    for (let i = 0; i < count; i++) {
      const qx = dv.getUint16(offset, true);
      const qy = dv.getUint16(offset + 2, true);
      const qz = dv.getUint16(offset + 4, true);
      const qnx = dv.getInt8(offset + 6);
      const qny = dv.getInt8(offset + 7);
      const qnz = dv.getInt8(offset + 8);
      const qrand = dv.getUint8(offset + 9);
      const qbright = dv.getUint16(offset + 10, true);
      offset += 12;

      const i3 = i * 3;
      positions[i3] = minX + (qx / 65535.0) * spanX;
      positions[i3 + 1] = minY + (qy / 65535.0) * spanY;
      positions[i3 + 2] = minZ + (qz / 65535.0) * spanZ;

      const nx = qnx / 127.0, ny = qny / 127.0, nz = qnz / 127.0;
      const nLen = Math.hypot(nx, ny, nz) || 1.0;
      normals[i3] = nx / nLen; normals[i3 + 1] = ny / nLen; normals[i3 + 2] = nz / nLen;
      rands[i] = qrand / 255.0;
      brights[i] = qbright / 65535.0;
    }

    const geom = new BufferGeometry();
    geom.setAttribute('position', new BufferAttribute(positions, 3));
    geom.setAttribute('aNormal', new BufferAttribute(normals, 3));
    geom.setAttribute('aRand', new BufferAttribute(rands, 1));
    geom.setAttribute('aBrightness', new BufferAttribute(brights, 1));

    const pts = new Points(geom, new ShaderMaterial({
      uniforms: sharedUniforms,
      transparent: true,
      blending: AdditiveBlending,
      vertexShader: `
        attribute vec3 aNormal;
        attribute float aRand;
        attribute float aBrightness;
        uniform float uTime;
        uniform float uPortraitScale;
        uniform float uYOffset;
        uniform float uFlyIn;
        uniform float uIntroSweepY;
        uniform float uHeadYaw;
        uniform float uHeadPitch;
        uniform vec2 uCursorPos;
        uniform float uCursorActive;
        uniform float uRevealBandY;
        uniform float uViewportH;
        uniform sampler2D uSemiTex;
        varying float vAlpha;
        varying vec3 vColor;

        void main() {
          // Refined neck pivot above collar line (-0.155 to -0.005) so collar & shoulders stay rock-solid
          float headWeight = smoothstep(-0.155, -0.005, position.y);
          float yaw = uHeadYaw * mix(0.18, 1.0, headWeight);
          float pitch = uHeadPitch * mix(0.14, 1.0, headWeight);

          vec3 pivot = vec3(0.0, 0.055, 0.0);
          vec3 rel = position - pivot;
          float cy = cos(yaw), sy = sin(yaw);
          vec3 rotYPos = vec3(cy * rel.x + sy * rel.z, rel.y, -sy * rel.x + cy * rel.z);
          vec3 rotYNrm = vec3(cy * aNormal.x + sy * aNormal.z, aNormal.y, -sy * aNormal.x + cy * aNormal.z);
          float cp = cos(pitch), sp = sin(pitch);
          vec3 bustPos = vec3(rotYPos.x, cp * rotYPos.y - sp * rotYPos.z, sp * rotYPos.y + cp * rotYPos.z) + pivot;
          vec3 rotNrm = normalize(vec3(rotYNrm.x, cp * rotYNrm.y - sp * rotYNrm.z, sp * rotYNrm.y + cp * rotYNrm.z));

          vec3 worldBustPos = vec3(bustPos.x * uPortraitScale, bustPos.y * uPortraitScale + uYOffset, bustPos.z * uPortraitScale);
          vec3 flatPhotoPos = vec3(position.x * uPortraitScale, position.y * uPortraitScale + uYOffset, 0.0);

          float revP = clamp((flatPhotoPos.y - uRevealBandY) / 0.165, 0.0, 1.0);
          vec3 activePos = mix(worldBustPos, flatPhotoPos, smoothstep(0.0, 0.58, revP));

          float angle = aRand * 6.2831853 + uTime * 0.35;
          float ringR = 0.092 + (fract(aRand * 13.7) - 0.5) * 0.008;
          vec3 ringPos = vec3(cos(angle) * ringR, sin(angle) * ringR, 0.0);

          float stagger = aRand * 0.28 + (0.5 - position.y) * 0.12;
          float flyT = clamp((uFlyIn - stagger) / 0.60, 0.0, 1.0);
          float flyEase = 1.0 - pow(1.0 - flyT, 3.0);
          vec3 finalPos = mix(ringPos, activePos, flyEase);

          vec3 keyDir = normalize(vec3(0.36, 0.42, 0.83));
          float keyLight = max(0.0, dot(rotNrm, keyDir));
          float rimLight = pow(1.0 - clamp(rotNrm.z, 0.0, 1.0), 2.1);
          float facingVis = smoothstep(-0.28, 0.14, rotNrm.z);

          vec2 toCursor = uCursorPos - finalPos.xy;
          float cursorDist = length(toCursor);
          vec3 cursorDir = normalize(vec3(toCursor, 0.24));
          float cursorSide = max(0.0, dot(rotNrm, cursorDir));
          float cursorBoost = uCursorActive * (0.45 + 0.85 * cursorSide) * exp(-cursorDist * cursorDist * 5.2);
          float introBand = exp(-pow((finalPos.y - uIntroSweepY) / 0.055, 2.0));

          // Exact original Dark Crimson dot palette
          vec3 baseCrimson = vec3(0.64, 0.035, 0.055);
          float shade = (0.68 + 0.42 * keyLight + 0.38 * rimLight) * (0.20 + 0.95 * pow(aBrightness, 1.10));
          vec3 dotCol = baseCrimson * (shade + cursorBoost * 0.82) + vec3(0.88, 0.20, 0.26) * (introBand * 0.70 + cursorBoost * 0.26);

          vec2 photoUV = vec2(position.x / 1.776833 + 0.5, position.y + 0.5);
          vec4 semiSample = texture2D(uSemiTex, photoUV);
          float colorTakeT = smoothstep(0.06, 0.62, revP);
          float revealWave = exp(-pow((revP - 0.18) / 0.12, 2.0)) * step(0.01, revP);

          vColor = mix(dotCol, semiSample.rgb * 1.15, colorTakeT) + vec3(0.78, 0.14, 0.20) * revealWave * 0.55;
          vAlpha = smoothstep(0.0, 0.03, uFlyIn) * mix(0.45, facingVis * (0.36 + 0.72 * aBrightness), flyEase) * (1.0 - smoothstep(0.42, 0.94, revP));

          float baseSize = (2.0 + 2.35 * aBrightness + 1.45 * aRand) * (uViewportH / 940.0);
          gl_PointSize = clamp(baseSize * (1.0 + 0.35 * introBand + 0.45 * revealWave) * mix(0.65, 1.0, flyEase), 1.3, 14.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          if (vAlpha < 0.004) discard;
          vec2 c = gl_PointCoord - vec2(0.5);
          float r2 = dot(c, c) * 4.0;
          if (r2 > 1.0) discard;
          gl_FragColor = vec4(vColor, vAlpha * pow(1.0 - r2, 1.70));
        }
      `
    }));
    pts.renderOrder = 2;
    scene.add(pts);
  }

  // LAYER 3: Faint Crimson Atmospheric Dust Motes
  (function buildDust() {
    const N = 150;
    const dPos = new Float32Array(N * 3), dRand = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      dPos[i * 3] = (Math.random() - 0.5) * 2.2;
      dPos[i * 3 + 1] = (Math.random() - 0.5) * 1.2;
      dPos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      dRand[i] = Math.random();
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(dPos, 3));
    g.setAttribute('aRand', new BufferAttribute(dRand, 1));
    const d = new Points(g, new ShaderMaterial({
      uniforms: sharedUniforms,
      transparent: true,
      blending: AdditiveBlending,
      vertexShader: `
        attribute float aRand;
        uniform float uTime; uniform float uAspect; uniform float uViewportH;
        varying float vDustAlpha;
        void main() {
          float t = uTime * (0.018 + 0.025 * aRand);
          float x = mod(position.x + t * 0.4 + sin(uTime * 0.3 + aRand * 12.0) * 0.04 + 1.1, 2.2) - 1.1;
          float y = mod(position.y + t * 0.7 + 0.6, 1.2) - 0.6;
          vDustAlpha = (0.08 + 0.14 * sin(uTime * 0.9 + aRand * 20.0)) * (0.4 + 0.6 * aRand);
          gl_PointSize = (1.5 + 2.2 * aRand) * (uViewportH / 940.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(x * uAspect * 0.65, y, position.z, 1.0);
        }
      `,
      fragmentShader: `
        varying float vDustAlpha;
        void main() {
          vec2 c = gl_PointCoord - vec2(0.5);
          float r2 = dot(c, c) * 4.0;
          if (r2 > 1.0) discard;
          gl_FragColor = vec4(0.58, 0.14, 0.18, vDustAlpha * pow(1.0 - r2, 2.0));
        }
      `
    }));
    d.renderOrder = 3;
    scene.add(d);
  })();

  // State machine & SHV2 Zero-Exposure Cryptographic Vault Client
  let appPhase = 'LOADING';
  let phaseStartTime = 0;
  let unlockSweepStart = 0;
  let isFullUnlocked = false;
  let unlockExpireAt = 0;
  let lockTimerInterval = null;
  let isHeroVisible = true;

  let hasMovedCursor = false;
  let targetMouseX = 0, targetMouseY = 0;
  let smoothMouseX = 0, smoothMouseY = 0;
  let cursorWorldX = 0, cursorWorldY = 0;
  let easeStartYaw = 0, easeStartPitch = 0;
  let revealProgress = 0;

  function formatCountdown(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  function updateControlsUI() {
    if (isFullUnlocked) {
      revealBtnEl.textContent = 'Back to dots';
      if (keyDockEl) keyDockEl.classList.add('hidden');
      if (unlockBtnEl) unlockBtnEl.classList.add('hidden');
      if (inlineInputWrapEl) inlineInputWrapEl.classList.add('hidden');
      lockBtnEl.classList.remove('hidden');
      lockBtnEl.textContent = `Lock · ${formatCountdown(unlockExpireAt - Date.now())}`;
      if (statusPillEl && statusTextEl) {
        statusPillEl.className = 'hero-status-pill visible unlocked';
        statusTextEl.textContent = 'Full Reveal';
      }
    } else if (appPhase === 'SEMI_REVEALED' || appPhase === 'REVEALING') {
      revealBtnEl.textContent = appPhase === 'REVEALING' ? 'Revealing...' : 'Back to dots';
      if (keyDockEl) keyDockEl.classList.toggle('hidden', appPhase !== 'SEMI_REVEALED');
      if (unlockBtnEl) unlockBtnEl.classList.toggle('hidden', appPhase !== 'SEMI_REVEALED' || isDockExpanded);
      if (inlineInputWrapEl) inlineInputWrapEl.classList.toggle('hidden', appPhase !== 'SEMI_REVEALED' || !isDockExpanded);
      lockBtnEl.classList.add('hidden');
      if (statusPillEl && statusTextEl) {
        statusPillEl.className = appPhase === 'SEMI_REVEALED' ? 'hero-status-pill visible semi' : 'hero-status-pill';
        statusTextEl.textContent = 'Semi-Reveal';
      }
    } else {
      revealBtnEl.textContent = appPhase === 'EASE_FORWARD' ? 'Revealing...' : 'Reveal';
      if (keyDockEl) keyDockEl.classList.add('hidden');
      if (unlockBtnEl) unlockBtnEl.classList.add('hidden');
      if (inlineInputWrapEl) inlineInputWrapEl.classList.add('hidden');
      lockBtnEl.classList.add('hidden');
      if (statusPillEl) statusPillEl.className = 'hero-status-pill';
    }
  }

  function lockAndWipeGPU(revertToDots = true) {
    if (lockTimerInterval) { clearInterval(lockTimerInterval); lockTimerInterval = null; }
    renderer.wipeTexture(fullTex);
    isFullUnlocked = false;
    unlockExpireAt = 0;
    sharedUniforms.uUnlocked.value = 0.0;
    sharedUniforms.uUnlockBandY.value = 0.75;
    if (revertToDots && (appPhase === 'SEMI_REVEALED' || appPhase === 'REVEALING' || appPhase === 'FULL_REVEALED')) {
      appPhase = 'UNREVEALING';
      phaseStartTime = performance.now() - (1.0 - revealProgress) * 3200.0;
    } else if (appPhase === 'FULL_REVEALED') {
      appPhase = 'SEMI_REVEALED';
    }
    updateControlsUI();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && isFullUnlocked) lockAndWipeGPU(true);
  });
  window.addEventListener('beforeprint', () => {
    if (isFullUnlocked) lockAndWipeGPU(true);
  });

  function bytesToBase64(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function base64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  let cachedChallengePromise = null;
  function prefetchChallenge() {
    const base = VAULT_API_BASE.replace(/\/+$/, '');
    cachedChallengePromise = fetch(`${base}/api/vault/challenge`, { method: 'GET', cache: 'no-store', credentials: 'omit' })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }

  async function executeZeroLeakUnlock(enteredKey) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Requires HTTPS or http://localhost.');
    }
    if (!IS_LOCAL && !VAULT_API_BASE) {
      throw new Error('Vault API not connected yet.');
    }
    const enc = new TextEncoder();
    const base = VAULT_API_BASE.replace(/\/+$/, '');

    let chal = null;
    if (cachedChallengePromise) {
      chal = await cachedChallengePromise;
      cachedChallengePromise = null;
    }
    if (!chal || !chal.enabled || !chal.nonce || (Date.now() - chal.ts > 55000)) {
      const chalRes = await fetch(`${base}/api/vault/challenge`, { method: 'GET', cache: 'no-store', credentials: 'omit' });
      chal = await chalRes.json().catch(() => ({}));
    }
    if (!chal || !chal.enabled || !chal.nonce) {
      throw new Error(chal && chal.error ? chal.error : 'Vault is locked.');
    }

    const clientKP = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
    const exportedPub = await crypto.subtle.exportKey('jwk', clientKP.publicKey);
    const clientPubKeyJwk = { kty: exportedPub.kty, crv: exportedPub.crv, x: exportedPub.x, y: exportedPub.y };
    const thumbprint = JSON.stringify({ crv: 'P-256', kty: 'EC', x: clientPubKeyJwk.x, y: clientPubKeyJwk.y });

    const keyHash = await crypto.subtle.digest('SHA-256', enc.encode(`SHV2-KEY-V2:${enteredKey}`));
    const hmacKey = await crypto.subtle.importKey('raw', keyHash, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const proofBuf = await crypto.subtle.sign('HMAC', hmacKey, enc.encode(`PROOF|${chal.nonce}|${chal.ts}|${thumbprint}`));

    const unlockRes = await fetch(`${base}/api/vault/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      credentials: 'omit',
      body: JSON.stringify({
        nonce: chal.nonce,
        ts: chal.ts,
        sig: chal.sig,
        clientPubKeyJwk,
        proof: bytesToBase64(new Uint8Array(proofBuf)),
      }),
    });
    const data = await unlockRes.json().catch(() => ({}));
    if (!unlockRes.ok || !data.ok) {
      const rem = typeof data.remainingAttempts === 'number' ? ` (${data.remainingAttempts} left)` : '';
      const err = new Error((data.error || 'Invalid key.') + rem);
      err.remainingAttempts = data.remainingAttempts;
      err.retryAfterSec = data.retryAfterSec;
      err.status = unlockRes.status;
      throw err;
    }

    const serverPubKey = await crypto.subtle.importKey('jwk', data.serverPubKeyJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const sharedBits = await crypto.subtle.deriveBits({ name: 'ECDH', public: serverPubKey }, clientKP.privateKey, 256);
    const hkdfKey = await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveKey']);
    const transportKey = await crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: enc.encode(chal.nonce), info: enc.encode(`SHV2-TRANSPORT-V2|${chal.ts}|${thumbprint}`) },
      hkdfKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(data.iv), additionalData: enc.encode(`SHV2-AAD|${chal.nonce}|${chal.ts}`) },
      transportKey,
      base64ToBytes(data.ciphertext)
    );
    const plainBytes = new Uint8Array(plainBuf);
        try {
      const blob = new Blob([plainBytes], { type: data.mime || 'image/webp' });
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'flipY' });
      try {
        renderer.uploadTextureImmediate(fullTex, bitmap, true);
              } finally {
        bitmap.close();
      }
    } finally {
      plainBytes.fill(0);
    }
    return data.ttlSeconds || 120;
  }

  // Vault modal replaced with inline smart morphing dock

  revealBtnEl.addEventListener('click', () => {
    if (appPhase === 'INTERACTIVE' || appPhase === 'UNREVEALING') {
      easeStartYaw = sharedUniforms.uHeadYaw.value;
      easeStartPitch = sharedUniforms.uHeadPitch.value;
      appPhase = 'EASE_FORWARD';
      phaseStartTime = performance.now();
      updateControlsUI();
    } else if (appPhase === 'SEMI_REVEALED' || appPhase === 'REVEALING' || appPhase === 'FULL_REVEALED') {
      if (isFullUnlocked) lockAndWipeGPU(true);
      else {
        appPhase = 'UNREVEALING';
        phaseStartTime = performance.now() - (1.0 - revealProgress) * 3200.0;
        updateControlsUI();
      }
    }
  });

  function updateActionIcon() {
    if (!inlineKeyInputEl || !inlineActionBtn) return;
    const hasText = inlineKeyInputEl.value.trim().length > 0;
    if (actionIconCross) actionIconCross.classList.toggle('hidden', hasText);
    if (actionIconTick) actionIconTick.classList.toggle('hidden', !hasText);
    inlineActionBtn.title = hasText ? 'Verify Key' : 'Cancel';
    inlineActionBtn.className = hasText ? 'hero-inline-btn action-btn verify-state' : 'hero-inline-btn action-btn cancel-state';
  }

  function updateInputBlur() {
    if (!inlineKeyInputEl) return;
    const hasText = inlineKeyInputEl.value.length > 0;
    const isMasked = inlineKeyInputEl.type === 'password';
    inlineKeyInputEl.classList.toggle('blurred', hasText && isMasked);
  }

  let rateLimitLockTimer = null;
  function setRateLimitLockout(seconds) {
    closeInlineDock();
    if (!unlockBtnEl) return;
    if (rateLimitLockTimer) clearInterval(rateLimitLockTimer);

    let remaining = Math.max(1, Math.ceil(seconds));
    unlockBtnEl.classList.add('rate-locked');
    unlockBtnEl.disabled = true;
    unlockBtnEl.title = `Vault Locked (${remaining}s remaining)`;

    const updateLockBtn = () => {
      unlockBtnEl.innerHTML = `
        <svg class="smart-btn-eye" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>Locked (${remaining}s)</span>
      `;
      if (statusPillEl) {
        statusPillEl.className = 'hero-status-pill visible error';
        statusTextEl.textContent = `Vault Locked (${remaining}s)`;
      }
    };

    updateLockBtn();

    rateLimitLockTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(rateLimitLockTimer);
        rateLimitLockTimer = null;
        unlockBtnEl.classList.remove('rate-locked');
        unlockBtnEl.disabled = false;
        unlockBtnEl.title = 'Full Reveal (Owner Key)';
        unlockBtnEl.innerHTML = `
          <svg class="smart-btn-eye" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <span>Full Reveal</span>
        `;
        if (statusPillEl && appPhase === 'SEMI_REVEALED') {
          statusPillEl.className = 'hero-status-pill visible semi';
          statusTextEl.textContent = 'Semi-Reveal';
        }
      } else {
        updateLockBtn();
      }
    }, 1000);
  }

  function openInlineDock() {
    if (rateLimitLockTimer) return;
    isDockExpanded = true;
    prefetchChallenge(); // Pre-warm the cryptographic challenge with 0ms delay on submit!
    if (unlockBtnEl) unlockBtnEl.classList.add('hidden');
    if (inlineInputWrapEl) inlineInputWrapEl.classList.remove('hidden');
    if (inlineKeyInputEl) {
      inlineKeyInputEl.value = '';
      inlineKeyInputEl.classList.remove('blurred'); // Sharp placeholder!
      inlineKeyInputEl.type = 'password';
      inlineKeyInputEl.placeholder = 'Enter key...';
      updateActionIcon();
      updateInputBlur();
      setTimeout(() => inlineKeyInputEl.focus(), 60);
    }
  }

  function closeInlineDock() {
    isDockExpanded = false;
    if (inlineInputWrapEl) inlineInputWrapEl.classList.add('hidden');
    if (unlockBtnEl && appPhase === 'SEMI_REVEALED') unlockBtnEl.classList.remove('hidden');
    if (inlineKeyInputEl) inlineKeyInputEl.value = '';
    updateActionIcon();
  }

  async function submitUnlockKey() {
    if (!inlineKeyInputEl || !inlineInputWrapEl) return;
    const entered = inlineKeyInputEl.value.trim();
    if (!entered || entered.length < 3) return;
    if (inlineInputWrapEl.classList.contains('verifying')) return;

    inlineInputWrapEl.classList.remove('error', 'shake');
    inlineInputWrapEl.classList.add('verifying');
    if (inlineSpinnerEl) inlineSpinnerEl.classList.remove('hidden');
    if (actionIconCross) actionIconCross.classList.add('hidden');
    if (actionIconTick) actionIconTick.classList.add('hidden');
    inlineKeyInputEl.disabled = true;

    try {
      const ttlSec = await executeZeroLeakUnlock(entered);
      isFullUnlocked = true;
      appPhase = 'FULL_REVEALED';
      sharedUniforms.uUnlocked.value = 1.0;
            sharedUniforms.uUnlockBandY.value = 0.70;
      unlockSweepStart = performance.now();
      unlockExpireAt = Date.now() + ttlSec * 1000;

      if (inlineActionBtn) inlineActionBtn.classList.add('success');
      if (statusPillEl) {
        statusPillEl.className = 'hero-status-pill visible full';
        statusTextEl.textContent = 'Full Reveal';
      }

      if (lockTimerInterval) clearInterval(lockTimerInterval);
      lockTimerInterval = setInterval(() => {
        if (!isFullUnlocked) return;
        if (Date.now() >= unlockExpireAt) lockAndWipeGPU(true);
        else updateControlsUI();
      }, 500);

      setTimeout(() => {
        closeInlineDock();
        updateControlsUI();
      }, 350);
    } catch (err) {
      inlineInputWrapEl.classList.remove('verifying');
      inlineKeyInputEl.disabled = false;
      if (inlineSpinnerEl) inlineSpinnerEl.classList.add('hidden');
      updateActionIcon();
      inlineInputWrapEl.classList.remove('shake', 'error');
      void inlineInputWrapEl.offsetWidth;
      inlineInputWrapEl.classList.add('shake', 'error');

      const isRateLimited = err.status === 429 || (typeof err.retryAfterSec === 'number' && err.retryAfterSec > 0) || err.remainingAttempts === 0;

      if (isRateLimited) {
        const lockSec = err.retryAfterSec || 600;
        setRateLimitLockout(lockSec);
      } else {
        const attemptsMsg = typeof err.remainingAttempts === 'number' ? `Wrong key (${err.remainingAttempts} left)` : 'Wrong key';
        if (statusPillEl) {
          statusPillEl.className = 'hero-status-pill visible error';
          statusTextEl.textContent = attemptsMsg;
        }
        inlineKeyInputEl.value = '';
        inlineKeyInputEl.classList.remove('blurred');
        inlineKeyInputEl.placeholder = attemptsMsg;

        setTimeout(() => {
          if (inlineInputWrapEl) {
            inlineInputWrapEl.classList.remove('shake', 'error');
          }
          if (inlineKeyInputEl && !inlineKeyInputEl.value) {
            inlineKeyInputEl.placeholder = 'Enter key...';
          }
          if (statusPillEl && appPhase === 'SEMI_REVEALED') {
            statusPillEl.className = 'hero-status-pill visible semi';
            statusTextEl.textContent = 'Semi-Reveal';
          }
        }, 2800);
      }
    } finally {
      inlineInputWrapEl.classList.remove('verifying');
      inlineKeyInputEl.disabled = false;
      if (inlineSpinnerEl) inlineSpinnerEl.classList.add('hidden');
    }
  }

  if (unlockBtnEl) {
    unlockBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      openInlineDock();
    });
  }

  if (inlineActionBtn) {
    inlineActionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = inlineKeyInputEl ? inlineKeyInputEl.value.trim() : '';
      if (val.length === 0) {
        closeInlineDock();
      } else {
        submitUnlockKey();
      }
    });
  }

  if (inlineEyeEl) {
    inlineEyeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const isPw = inlineKeyInputEl.type === 'password';
      inlineKeyInputEl.type = isPw ? 'text' : 'password';
      updateInputBlur();
      if (eyeIconOpen) eyeIconOpen.classList.toggle('hidden', isPw);
      if (eyeIconClosed) eyeIconClosed.classList.toggle('hidden', !isPw);
      inlineEyeEl.title = isPw ? 'Mask password (blur)' : 'Reveal password text';
    });
  }

  if (inlineKeyInputEl) {
    inlineKeyInputEl.addEventListener('input', () => {
      if (inlineInputWrapEl) inlineInputWrapEl.classList.remove('error');
      updateActionIcon();
      updateInputBlur(); // Masked blur only when text is entered, sharp when empty!
    });
    inlineKeyInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitUnlockKey();
      } else if (e.key === 'Escape') {
        closeInlineDock();
      }
    });
  }

  window.addEventListener('click', (e) => {
    if (inlineInputWrapEl && !inlineInputWrapEl.classList.contains('hidden')) {
      if (!keyDockEl.contains(e.target)) closeInlineDock();
    }
  });
  lockBtnEl.addEventListener('click', () => lockAndWipeGPU(true));

  const idCardTrigger = document.getElementById('identityVaultTrigger');
  if (idCardTrigger) {
    idCardTrigger.addEventListener('click', () => {
      stageEl.scrollIntoView({ behavior: 'smooth' });
      if (appPhase === 'INTERACTIVE') setTimeout(() => revealBtnEl.click(), 450);
    });
  }

  stageEl.addEventListener('pointermove', (e) => {
    if (appPhase === 'SEMI_REVEALED' || appPhase === 'REVEALING' || appPhase === 'EASE_FORWARD' || appPhase === 'FULL_REVEALED') return;
    const rect = stageEl.getBoundingClientRect();
    hasMovedCursor = true;
    const nx = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2.0 - 1.0;
    const ny = -(((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2.0 - 1.0);
    targetMouseX = Math.max(-1.0, Math.min(1.0, nx));
    targetMouseY = Math.max(-1.0, Math.min(1.0, ny));
    cursorWorldX = nx * 0.5 * viewAspect;
    cursorWorldY = ny * 0.5;
  }, { passive: true });

  function onResize() {
    stageW = stageEl.clientWidth || window.innerWidth;
    stageH = Math.max(stageEl.clientHeight || window.innerHeight, 1);
    viewAspect = stageW / stageH;
    camera.left = -0.5 * viewAspect;
    camera.right = 0.5 * viewAspect;
    camera.top = 0.5;
    camera.bottom = -0.5;
    camera.updateProjectionMatrix();
    renderer.setSize(stageW, stageH);
    sharedUniforms.uAspect.value = viewAspect;
    sharedUniforms.uViewportH.value = stageH * Math.min(window.devicePixelRatio || 1, 2);
    if ((viewAspect < 1.05) !== lastBannerCompact) refreshBannerTexture();
  }
  window.addEventListener('resize', onResize);
  onResize();
  window.__HERO_VAULT_RESIZE__ = onResize;
  window.__HERO_VAULT_TRIGGER_REVEAL__ = () => {
    if (revealBtnEl) revealBtnEl.click();
  };

  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      isHeroVisible = entries[0] ? entries[0].isIntersecting : true;
    }, { threshold: 0.02 });
    io.observe(stageEl);
  }

  const MAX_YAW_RAD = 30.0 * Math.PI / 180.0;
  let isRunning = true;
  let animFrameId = null;
  function animate(now) {
    if (!isRunning) return;
    animFrameId = requestAnimationFrame(animate);
    if (!isHeroVisible && appPhase !== 'LOADING' && appPhase !== 'FLY_IN') return;

    const tSec = now * 0.001;
    sharedUniforms.uTime.value = tSec;

    if (appPhase === 'FLY_IN') {
      const elapsed = (now - phaseStartTime) / 1350.0;
      sharedUniforms.uFlyIn.value = Math.min(1.0, elapsed);
      if (elapsed >= 1.0) { appPhase = 'SWEEP_INTRO'; phaseStartTime = now; }
    } else if (appPhase === 'SWEEP_INTRO') {
      const elapsed = (now - phaseStartTime) / 1150.0;
      sharedUniforms.uIntroSweepY.value = 0.62 - elapsed * 1.30;
      if (elapsed >= 1.0) {
        sharedUniforms.uIntroSweepY.value = -1.2;
        appPhase = 'INTERACTIVE';
        actionWrapEl.classList.add('ready');
        updateControlsUI();
      }
    }

    if (appPhase === 'FLY_IN' || appPhase === 'SWEEP_INTRO' || appPhase === 'INTERACTIVE') {
      let goalX = targetMouseX, goalY = targetMouseY;
      if (!hasMovedCursor) {
        goalX = Math.sin(tSec * 0.72) * 0.24 + Math.cos(tSec * 0.31) * 0.08;
        goalY = Math.cos(tSec * 0.54) * 0.14;
        cursorWorldX = goalX * 0.42 * viewAspect;
        cursorWorldY = goalY * 0.38;
      }
      smoothMouseX += (goalX - smoothMouseX) * 0.065;
      smoothMouseY += (goalY - smoothMouseY) * 0.065;
      const flyFactor = sharedUniforms.uFlyIn.value;
      sharedUniforms.uHeadYaw.value = smoothMouseX * MAX_YAW_RAD * flyFactor;
      sharedUniforms.uHeadPitch.value = -smoothMouseY * 0.14 * flyFactor;
      sharedUniforms.uCursorPos.value.set(cursorWorldX, cursorWorldY);
      sharedUniforms.uCursorActive.value = flyFactor * (hasMovedCursor ? 1.0 : 0.65);
    } else if (appPhase === 'EASE_FORWARD') {
      const p = Math.min(1.0, (now - phaseStartTime) / 480.0);
      const ease = 1.0 - Math.pow(1.0 - p, 3.0);
      sharedUniforms.uHeadYaw.value = easeStartYaw * (1.0 - ease);
      sharedUniforms.uHeadPitch.value = easeStartPitch * (1.0 - ease);
      sharedUniforms.uCursorActive.value = (1.0 - ease) * 0.6;
      if (p >= 1.0) {
        sharedUniforms.uHeadYaw.value = 0.0;
        sharedUniforms.uHeadPitch.value = 0.0;
        sharedUniforms.uCursorActive.value = 0.0;
        appPhase = 'REVEALING';
        phaseStartTime = now - revealProgress * 3600.0;
        updateControlsUI();
      }
    } else if (appPhase === 'REVEALING') {
      revealProgress = Math.min(1.0, (now - phaseStartTime) / 3600.0);
      sharedUniforms.uRevealBandY.value = 0.62 - revealProgress * 1.30;
      sharedUniforms.uCursorActive.value = 0.0;
      if (revealProgress >= 1.0) { appPhase = 'SEMI_REVEALED'; updateControlsUI(); }
    } else if (appPhase === 'SEMI_REVEALED') {
      sharedUniforms.uHeadYaw.value = 0.0;
      sharedUniforms.uHeadPitch.value = 0.0;
      sharedUniforms.uCursorActive.value = 0.0;
      sharedUniforms.uRevealBandY.value = -0.68;
    } else if (appPhase === 'FULL_REVEALED') {
      sharedUniforms.uHeadYaw.value = 0.0;
      sharedUniforms.uHeadPitch.value = 0.0;
      sharedUniforms.uCursorActive.value = 0.0;
      sharedUniforms.uRevealBandY.value = -0.75;
      const up = Math.min(1.0, (now - unlockSweepStart) / 1200.0);
      sharedUniforms.uUnlockBandY.value = 0.70 - (1.0 - Math.pow(1.0 - up, 2.5)) * 1.55;
    } else if (appPhase === 'UNREVEALING') {
      const p = Math.min(1.0, (now - phaseStartTime) / 3200.0);
      revealProgress = 1.0 - p;
      sharedUniforms.uRevealBandY.value = 0.62 - revealProgress * 1.30;
      sharedUniforms.uCursorActive.value = 0.0;
      if (p >= 1.0) {
        revealProgress = 0.0;
        sharedUniforms.uRevealBandY.value = 0.72;
        smoothMouseX = 0.0; smoothMouseY = 0.0;
        appPhase = 'INTERACTIVE';
        updateControlsUI();
      }
    }

    renderer.render(scene, camera);
  }
  let preloaderWatchdog = setTimeout(() => {
    if (preloaderEl && !preloaderEl.classList.contains('hidden')) {
      console.warn('[hero-vault] Preloader watchdog triggered; forcing preloader hide.');
      setPreloaderProgress(100);
      preloaderEl.classList.add('hidden');
      if (actionWrapEl) actionWrapEl.classList.add('ready');
    }
  }, 3500);

  animFrameId = requestAnimationFrame(animate);
  window.__HERO_VAULT_CANCEL_ANIM__ = () => {
    isRunning = false;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    window.removeEventListener('resize', onResize);
    if (io) {
      try { io.disconnect(); } catch (e) {}
      io = null;
    }
    if (preloaderWatchdog) {
      clearTimeout(preloaderWatchdog);
      preloaderWatchdog = null;
    }
    window.__HERO_VAULT_ACTIVE__ = false;
    window.__HERO_CURRENT_CANVAS__ = null;
  };
  window.__HERO_UNIFORMS__ = sharedUniforms;
  window.__HERO_SET_PHASE__ = (p, t) => { appPhase = p; phaseStartTime = t || performance.now(); };

  async function loadPublicAssets() {
    if (window.__HERO_CACHED_DOTS__ && window.__HERO_CACHED_SEMI__) {
      setPreloaderProgress(100);
      renderer.uploadTextureImmediate(semiTex, window.__HERO_CACHED_SEMI__, false);
      buildDotsSystem(window.__HERO_CACHED_DOTS__);
      if (preloaderWatchdog) {
        clearTimeout(preloaderWatchdog);
        preloaderWatchdog = null;
      }
      if (preloaderEl) preloaderEl.classList.add('hidden');
      appPhase = 'FLY_IN';
      phaseStartTime = performance.now();
      return;
    }

    const semiImg = new Image();
    let semiLoaded = false;
    const semiPromise = new Promise((res) => {
      semiImg.onload = () => { semiLoaded = true; res(); };
      semiImg.onerror = () => { semiLoaded = true; res(); };
      semiImg.src = ASSET_SEMI;
    });

    setPreloaderProgress(25);

    let resp;
    try {
      resp = await fetch(ASSET_DOTS);
      if (!resp.ok) {
        const fallback = ASSET_DOTS.includes('.bin') ? ASSET_DOTS.replace('.bin', '.dat') : ASSET_DOTS.replace('.dat', '.bin');
        resp = await fetch(fallback);
      }
    } catch (e) {
      const fallback = ASSET_DOTS.includes('.bin') ? ASSET_DOTS.replace('.bin', '.dat') : ASSET_DOTS.replace('.dat', '.bin');
      resp = await fetch(fallback);
    }

    setPreloaderProgress(50);
    const dotBuffer = await resp.arrayBuffer();
    setPreloaderProgress(85);

    await semiPromise;
    window.__HERO_CACHED_DOTS__ = dotBuffer;
    window.__HERO_CACHED_SEMI__ = semiImg;

    setPreloaderProgress(100);
    renderer.uploadTextureImmediate(semiTex, semiImg, false);
    buildDotsSystem(dotBuffer);
    if (preloaderWatchdog) {
      clearTimeout(preloaderWatchdog);
      preloaderWatchdog = null;
    }

    setTimeout(() => {
      if (preloaderEl) preloaderEl.classList.add('hidden');
      appPhase = 'FLY_IN';
      phaseStartTime = performance.now();
    }, 120);
  }

  loadPublicAssets().catch((err) => {
    console.error('[hero-vault] Failed to initialize 3D assets:', err);
    if (preloaderWatchdog) {
      clearTimeout(preloaderWatchdog);
      preloaderWatchdog = null;
    }
    if (preloaderEl) preloaderEl.classList.add('hidden');
    if (actionWrapEl) actionWrapEl.classList.add('ready');
  });
  }; // end window.__initHeroVault

  if (typeof document !== 'undefined' && document.getElementById('hero-stage')) {
    window.__initHeroVault();
  }
})();
