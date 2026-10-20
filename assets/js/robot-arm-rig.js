// A skinned raster mesh: original robot pixels, with separate articulated joints.
// Coordinates are in the source image's normalized bind pose.
// Rotate at the black bearing, while the torso-side white housing stays fixed.
const S = [0.526, 0.585],
  E = [0.202, 0.63],
  W = [0.344, 0.454];
const BODY_SOCKET = [0.5, 0.562];
const ATTACHMENT_BONE = 11;
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
const degrees = (radians) => (radians * 180) / Math.PI;
const wrap = (angle) => ((angle + 540) % 360) - 180;
const multiply = (a, b) => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
];
const point = (m, x, y) => [
  m[0] * x + m[2] * y + m[4],
  m[1] * x + m[3] * y + m[5],
];
function rotate(pivot, degrees) {
  const a = (degrees * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a),
    [x, y] = pivot;
  return [c, s, -s, c, x - c * x + s * y, y - s * x - c * y];
}
function distance(p, a, b) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(
      1,
      ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy),
    ),
  );
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

// Follow the inner edge of the white shoulder housing in bind-image space.
// Only the torso side of this curved seam is anchored; the black rotor and
// upper arm on its other side retain their articulated shoulder weights.
const SHOULDER_SEAM = [
  [0.48, 0.5],
  [0.5, 0.51],
  [0.52, 0.54],
  [0.55, 0.56],
  [0.6, 0.573],
  [0.65, 0.557],
  [0.69, 0.537],
  [0.75, 0.535],
];
export function anchorShoulderHousing(weights, x, y) {
  if (y < SHOULDER_SEAM[0][0] || y > SHOULDER_SEAM.at(-1)[0]) return weights;
  const end = SHOULDER_SEAM.findIndex(([row]) => row >= y);
  const [y0, x0] = SHOULDER_SEAM[Math.max(0, end - 1)];
  const [y1, x1] = SHOULDER_SEAM[end];
  const edge = x0 + (x1 - x0) * (y1 === y0 ? 0 : (y - y0) / (y1 - y0));
  // Keep the housing rigid; blend only a narrow strip on the black bearing side.
  const anchoredEdge = edge - 0.008;
  const amount = clamp((x - anchoredEdge + 0.012) / 0.012, 0, 1);
  if (!amount) return weights;
  return [
    ...weights.map((bone) => ({ i: bone.i, w: bone.w * (1 - amount) })),
    { i: ATTACHMENT_BONE, w: amount },
  ];
}
export function armVisibility(x, y) {
  // Remove the duplicate housing with a small overlap margin inside the dark
  // bearing rim, so bilinear texture filtering cannot leave a second white edge.
  return (
    1 -
    (anchorShoulderHousing([], x + 0.012, y).find(
      ({ i }) => i === ATTACHMENT_BONE,
    )?.w || 0)
  );
}

// Paint the upper arm first, then the forearm, palm and fingers. Source-image
// row order puts the hand behind the shoulder when the skinned mesh folds over
// itself, so triangle order must follow anatomy instead of texture coordinates.
export function orderArmTriangles(indices, vertices) {
  const depth = vertices.map(({ weights }) =>
    weights.reduce(
      (sum, bone) =>
        sum + bone.w * (bone.i === ATTACHMENT_BONE ? -1 : Math.min(bone.i, 3)),
      0,
    ),
  );
  const triangles = [];
  for (let i = 0; i < indices.length; i += 3) {
    const triangle = indices.slice(i, i + 3);
    triangles.push({
      triangle,
      depth: triangle.reduce((sum, index) => sum + depth[index], 0) / 3,
    });
  }
  triangles.sort((a, b) => a.depth - b.depth);
  return new Uint16Array(triangles.flatMap(({ triangle }) => triangle));
}

export class RobotArmRig {
  constructor(canvas, image, scene) {
    this.canvas = canvas;
    this.image = image;
    this.scene = scene;
    this.width = image.naturalWidth;
    this.height = image.naturalHeight;
    this.p = (p) => [p[0] * this.width, p[1] * this.height];
    this.bones = [
      { a: S, b: E, r: 92 },
      { a: E, b: W, r: 78 },
      { a: W, b: [0.403, 0.32], r: 85 },
      { a: [0.458, 0.213], b: [0.494, 0.245], r: 28 },
      { a: [0.494, 0.245], b: [0.513, 0.29], r: 28 },
      { a: [0.443, 0.421], b: [0.484, 0.391], r: 30 },
      { a: [0.484, 0.391], b: [0.533, 0.383], r: 29 },
      { a: [0.41, 0.255], b: [0.441, 0.286], r: 29 },
      { a: [0.441, 0.286], b: [0.463, 0.344], r: 28 },
      { a: [0.37, 0.304], b: [0.401, 0.335], r: 27 },
      { a: [0.401, 0.335], b: [0.424, 0.391], r: 27 },
    ].map((b) => ({ ...b, a: this.p(b.a), b: this.p(b.b) }));
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
    });
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;
    const shader = (type, source) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const vs = shader(
      gl.VERTEX_SHADER,
      'attribute vec2 a_position; attribute vec2 a_uv; attribute float a_visibility; varying vec2 v_uv; varying float v_visibility; void main(){gl_Position=vec4(a_position,0.0,1.0);v_uv=a_uv;v_visibility=a_visibility;}',
    );
    const fs = shader(
      gl.FRAGMENT_SHADER,
      'precision mediump float; uniform sampler2D u_image; varying vec2 v_uv; varying float v_visibility; void main(){gl_FragColor=texture2D(u_image,v_uv)*v_visibility;}',
    );
    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
      throw new Error('Unable to link robot mesh');
    gl.useProgram(this.program);
    this.vertices = [];
    const uv = [],
      indices = [],
      columns = 100,
      rows = 72;
    for (let y = 0; y <= rows; y++)
      for (let x = 0; x <= columns; x++) {
        const px = (x / columns) * this.width,
          py = (y / rows) * this.height;
        const weights = this.bones
          .map((b, i) => ({
            i,
            w: Math.exp(-Math.pow(distance([px, py], b.a, b.b) / b.r, 2) * 2),
          }))
          .sort((a, b) => b.w - a.w)
          .slice(0, 3);
        const sum = weights.reduce((s, b) => s + b.w, 0) || 1;
        weights.forEach((b) => (b.w /= sum));
        this.vertices.push({
          x: px,
          y: py,
          weights: anchorShoulderHousing(weights, x / columns, y / rows),
          visibility: armVisibility(x / columns, y / rows),
        });
        uv.push(x / columns, y / rows);
      }
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < columns; x++) {
        const i = y * (columns + 1) + x;
        indices.push(
          i,
          i + 1,
          i + columns + 1,
          i + 1,
          i + columns + 2,
          i + columns + 1,
        );
      }
    this.positions = new Float32Array(this.vertices.length * 2);
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.DYNAMIC_DRAW);
    const location = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
    const uvLocation = gl.getAttribLocation(this.program, 'a_uv');
    gl.enableVertexAttribArray(uvLocation);
    gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);
    // Keep the body photograph's housing as the single visible white shoulder.
    // The arm texture's second housing must be transparent, not merely fixed.
    const visibilityBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, visibilityBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices.map(({ visibility }) => visibility)),
      gl.STATIC_DRAW,
    );
    const visibilityLocation = gl.getAttribLocation(
      this.program,
      'a_visibility',
    );
    gl.enableVertexAttribArray(visibilityLocation);
    gl.vertexAttribPointer(visibilityLocation, 1, gl.FLOAT, false, 0, 0);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      orderArmTriangles(indices, this.vertices),
      gl.STATIC_DRAW,
    );
    this.count = indices.length;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    this.resize();
  }
  resize() {
    const w = this.scene.clientWidth,
      h = this.scene.clientHeight,
      dpr = Math.min(devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    const s = Math.max(w / this.width, h / this.height);
    const position = getComputedStyle(this.image)
      .objectPosition.split(' ')
      .map(parseFloat);
    this.mapping = {
      w,
      h,
      s,
      ox: ((w - this.width * s) * position[0]) / 100,
      oy: ((h - this.height * s) * position[1]) / 100,
    };
  }
  matrices(pose) {
    const [dx, dy] = this.alignment();
    const shoulder = multiply(
      [1, 0, 0, 1, dx, dy],
      rotate(this.p(S), pose.shoulder),
    );
    const elbow = multiply(shoulder, rotate(this.p(E), pose.elbow));
    const wrist = multiply(elbow, rotate(this.p(W), pose.wrist));
    const index = multiply(wrist, rotate(this.bones[3].a, pose.curl * 3));
    const thumb = multiply(wrist, rotate(this.bones[5].a, pose.curl * -24));
    const middle = multiply(wrist, rotate(this.bones[7].a, pose.curl * 4));
    const ring = multiply(wrist, rotate(this.bones[9].a, pose.curl * 3));
    return [
      shoulder,
      elbow,
      wrist,
      index,
      multiply(index, rotate(this.bones[4].a, pose.curl * 4)),
      thumb,
      multiply(thumb, rotate(this.bones[6].a, pose.curl * -12)),
      middle,
      multiply(middle, rotate(this.bones[8].a, pose.curl * 5)),
      ring,
      multiply(ring, rotate(this.bones[10].a, pose.curl * 4)),
      [1, 0, 0, 1, 0, 0],
    ];
  }
  alignment() {
    return [
      (BODY_SOCKET[0] - S[0]) * this.width,
      (BODY_SOCKET[1] - S[1]) * this.height,
    ];
  }
  contact(pose) {
    const { s, ox, oy } = this.mapping;
    const tip = point(
      this.matrices(pose)[4],
      this.width * 0.52,
      this.height * 0.302,
    );
    return {
      x: ox + tip[0] * s + this.scene.offsetLeft,
      y: oy + tip[1] * s + this.scene.offsetTop,
    };
  }
  reach(destination, curl = 0) {
    const lowerArm = destination.approach === 'lower-arm';
    const shoulderRest = lowerArm ? -8 : 0;
    const shoulderWeight = lowerArm ? 3 : 8;
    const wristWeight = lowerArm ? 0.18 : 0.04;
    const { s, ox, oy } = this.mapping;
    const [alignX, alignY] = this.alignment();
    const goal = [
      (destination.x - this.scene.offsetLeft - ox) / s - alignX,
      (destination.y - this.scene.offsetTop - oy) / s - alignY,
    ];
    const elbow = this.p(E),
      wrist = this.p(W);
    const tip = point(
      this.matrices({ shoulder: 0, elbow: 0, wrist: 0, curl })[4],
      this.width * 0.52,
      this.height * 0.302,
    );
    const forearm = [wrist[0] - elbow[0], wrist[1] - elbow[1]];
    const hand = [tip[0] - alignX - wrist[0], tip[1] - alignY - wrist[1]];
    const l1 = Math.hypot(...forearm),
      l2 = Math.hypot(...hand);
    const base1 = Math.atan2(forearm[1], forearm[0]);
    const base2 = Math.atan2(hand[1], hand[0]) - base1;
    let best,
      bestScore = Infinity;
    // The lower-left card needs a relaxed, lowered upper arm rather than a
    // nearly fixed shoulder and a sharply bent wrist. Other reaches keep their
    // existing preference for minimal shoulder movement.
    for (let shoulder = lowerArm ? -18 : -24; shoulder <= 24; shoulder += 0.5) {
      const local = point(rotate(this.p(S), -shoulder), ...goal);
      const dx = local[0] - elbow[0],
        dy = local[1] - elbow[1];
      const bend = Math.acos(
        clamp((dx * dx + dy * dy - l1 * l1 - l2 * l2) / (2 * l1 * l2), -1, 1),
      );
      for (const q2 of [bend, -bend]) {
        const q1 =
          Math.atan2(dy, dx) -
          Math.atan2(l2 * Math.sin(q2), l1 + l2 * Math.cos(q2));
        const candidate = {
          shoulder,
          elbow: clamp(wrap(degrees(q1 - base1)), -70, 65),
          wrist: clamp(wrap(degrees(q2 - base2)), -80, 90),
          curl,
        };
        const tipAt = this.contact(candidate);
        const error = Math.hypot(
          tipAt.x - destination.x,
          tipAt.y - destination.y,
        );
        const score =
          error * error * 100 +
          (shoulder - shoulderRest) ** 2 * shoulderWeight +
          candidate.elbow * candidate.elbow * 0.08 +
          candidate.wrist * candidate.wrist * wristWeight +
          (lowerArm
            ? Math.max(0, Math.abs(candidate.wrist) - 55) ** 2 * 1.5
            : 0);
        if (score < bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
    }
    return best;
  }
  render(pose) {
    const m = this.matrices(pose),
      { w, h, s, ox, oy } = this.mapping;
    this.vertices.forEach((v, i) => {
      let x = 0,
        y = 0;
      v.weights.forEach((b) => {
        const p = point(m[b.i], v.x, v.y);
        x += p[0] * b.w;
        y += p[1] * b.w;
      });
      this.positions[i * 2] = ((ox + x * s) / w) * 2 - 1;
      this.positions[i * 2 + 1] = 1 - ((oy + y * s) / h) * 2;
    });
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.positions);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    return this.contact(pose);
  }
}
