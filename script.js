const canvas = document.getElementById("cat-orb");
const gl = canvas?.getContext("webgl", {
  alpha: true,
  antialias: true,
  premultipliedAlpha: false,
  powerPreference: "high-performance"
});

if (gl) {
  const vertexShaderSource = `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision highp float;

    uniform float iTime;
    uniform vec3 iResolution;
    uniform float hue;
    uniform float hover;
    uniform float rot;
    uniform float hoverIntensity;
    uniform vec3 backgroundColor;
    varying vec2 vUv;

    vec3 rgb2yiq(vec3 c) {
      float y = dot(c, vec3(0.299, 0.587, 0.114));
      float i = dot(c, vec3(0.596, -0.274, -0.322));
      float q = dot(c, vec3(0.211, -0.523, 0.312));
      return vec3(y, i, q);
    }

    vec3 yiq2rgb(vec3 c) {
      float r = c.x + 0.956 * c.y + 0.621 * c.z;
      float g = c.x - 0.272 * c.y - 0.647 * c.z;
      float b = c.x - 1.106 * c.y + 1.703 * c.z;
      return vec3(r, g, b);
    }

    vec3 adjustHue(vec3 color, float hueDeg) {
      float hueRad = hueDeg * 3.14159265 / 180.0;
      vec3 yiq = rgb2yiq(color);
      float cosA = cos(hueRad);
      float sinA = sin(hueRad);
      float i = yiq.y * cosA - yiq.z * sinA;
      float q = yiq.y * sinA + yiq.z * cosA;
      yiq.y = i;
      yiq.z = q;
      return yiq2rgb(yiq);
    }

    vec3 hash33(vec3 p3) {
      p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
      p3 += dot(p3, p3.yxz + 19.19);
      return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
    }

    float snoise3(vec3 p) {
      const float K1 = 0.333333333;
      const float K2 = 0.166666667;
      vec3 i = floor(p + (p.x + p.y + p.z) * K1);
      vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
      vec3 e = step(vec3(0.0), d0 - d0.yzx);
      vec3 i1 = e * (1.0 - e.zxy);
      vec3 i2 = 1.0 - e.zxy * (1.0 - e);
      vec3 d1 = d0 - (i1 - K2);
      vec3 d2 = d0 - (i2 - K1);
      vec3 d3 = d0 - 0.5;
      vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
      vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
      return dot(vec4(31.316), n);
    }

    float sdCatHead(vec2 p) {
      p.y += 0.1;
      float head = length(p) - 0.5;

      vec2 leftEar = p - vec2(-0.35, 0.35);
      float ear1 = abs(leftEar.x) * 1.5 + leftEar.y - 0.3;

      vec2 rightEar = p - vec2(0.35, 0.35);
      float ear2 = abs(rightEar.x) * 1.5 + rightEar.y - 0.3;

      return min(min(head, ear1), ear2);
    }

    vec4 extractAlpha(vec3 colorIn) {
      float a = max(max(colorIn.r, colorIn.g), colorIn.b);
      return vec4(colorIn.rgb / (a + 1e-5), a);
    }

    const vec3 baseColor1 = vec3(1.0, 0.843, 0.0);
    const vec3 baseColor2 = vec3(0.804, 0.498, 0.196);
    const vec3 baseColor3 = vec3(0.2, 0.2, 0.2);
    const float innerRadius = 0.6;
    const float noiseScale = 0.65;

    float light1(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * attenuation);
    }

    float light2(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * dist * attenuation);
    }

    vec4 draw(vec2 uv) {
      vec3 color1 = adjustHue(baseColor1, hue);
      vec3 color2 = adjustHue(baseColor2, hue);
      vec3 color3 = adjustHue(baseColor3, hue);

      float ang = atan(uv.y, uv.x);
      float len = sdCatHead(uv) + 0.6;
      float invLen = len > 0.0 ? 1.0 / len : 0.0;

      float bgLuminance = dot(backgroundColor, vec3(0.299, 0.587, 0.114));

      float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
      float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
      float d0 = distance(uv, (r0 * invLen) * uv);
      float v0 = light1(1.0, 10.0, d0);

      v0 *= smoothstep(r0 * 1.05, r0, len);
      float innerFade = smoothstep(r0 * 0.8, r0 * 0.95, len);
      v0 *= mix(innerFade, 1.0, bgLuminance * 0.7);
      float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;

      float a = iTime * -1.0;
      vec2 pos = vec2(cos(a), sin(a)) * r0;
      float d = distance(uv, pos);
      float v1 = light2(1.5, 5.0, d);
      v1 *= light1(1.0, 50.0, d0);

      float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
      float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);

      vec3 colBase = mix(color1, color2, cl);
      float fadeAmount = mix(1.0, 0.1, bgLuminance);

      vec3 darkCol = mix(color3, colBase, v0);
      darkCol = (darkCol + v1) * v2 * v3;
      darkCol = clamp(darkCol, 0.0, 1.0);

      vec3 lightCol = (colBase + v1) * mix(1.0, v2 * v3, fadeAmount);
      lightCol = mix(backgroundColor, lightCol, v0);
      lightCol = clamp(lightCol, 0.0, 1.0);

      vec3 finalCol = mix(darkCol, lightCol, bgLuminance);

      return extractAlpha(finalCol);
    }

    vec4 mainImage(vec2 fragCoord) {
      vec2 center = iResolution.xy * 0.5;
      float size = min(iResolution.x, iResolution.y);
      vec2 uv = (fragCoord - center) / size * 2.0;
      float angle = rot;
      float s = sin(angle);
      float c = cos(angle);
      uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
      uv.x += hover * hoverIntensity * 2.0 * sin(uv.y * 10.0 + iTime);
      uv.y += hover * hoverIntensity * 2.0 * sin(uv.x * 10.0 + iTime);
      return draw(uv);
    }

    void main() {
      vec2 fragCoord = vUv * iResolution.xy;
      vec4 col = mainImage(fragCoord);
      gl_FragColor = vec4(col.rgb * col.a, col.a);
    }
  `;

  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

  if (program) {
    const vertices = new Float32Array([
      -1, -1, 0, 0,
      1, -1, 1, 0,
      -1, 1, 0, 1,
      -1, 1, 0, 1,
      1, -1, 1, 0,
      1, 1, 1, 1
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.useProgram(program);

    const stride = 4 * Float32Array.BYTES_PER_ELEMENT;
    const positionLocation = gl.getAttribLocation(program, "position");
    const uvLocation = gl.getAttribLocation(program, "uv");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(uvLocation);
    gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

    const uniforms = {
      time: gl.getUniformLocation(program, "iTime"),
      resolution: gl.getUniformLocation(program, "iResolution"),
      hue: gl.getUniformLocation(program, "hue"),
      hover: gl.getUniformLocation(program, "hover"),
      rot: gl.getUniformLocation(program, "rot"),
      hoverIntensity: gl.getUniformLocation(program, "hoverIntensity"),
      backgroundColor: gl.getUniformLocation(program, "backgroundColor")
    };

    const state = {
      hover: 0,
      targetHover: 0,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
    };

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const handlePointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      state.targetHover = inside ? 1 : 0;
    };

    const handlePointerLeave = () => {
      state.targetHover = 0;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    const observer = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);
    resize();

    const render = (timestamp) => {
      const elapsed = timestamp * 0.001;
      state.hover += (state.targetHover - state.hover) * 0.1;

      gl.useProgram(program);
      gl.uniform1f(uniforms.time, state.reducedMotion ? elapsed * 0.18 : elapsed);
      gl.uniform3f(uniforms.resolution, canvas.width, canvas.height, canvas.width / canvas.height);
      gl.uniform1f(uniforms.hue, 0);
      gl.uniform1f(uniforms.hover, state.reducedMotion ? 0 : state.hover);
      gl.uniform1f(uniforms.rot, 0);
      gl.uniform1f(uniforms.hoverIntensity, 0.3);
      gl.uniform3f(uniforms.backgroundColor, 5 / 255, 5 / 255, 5 / 255);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }
} else if (canvas) {
  canvas.style.display = "none";
}

document.querySelectorAll(".metaballs-canvas").forEach((metaballsCanvas) => {
  initMetaBalls(metaballsCanvas);
});

const hyperspeedCanvas = document.getElementById("writing-hyperspeed");

if (hyperspeedCanvas) {
  initHyperspeed(hyperspeedCanvas);
}

const typingBackdrop = document.getElementById("typing-backdrop-text");

if (typingBackdrop) {
  const typingSentences = [
    "Welcome to fightheyyy profile",
    "Building an Agent Universe",
    "Writing AI infra notes"
  ];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    typingBackdrop.textContent = typingSentences[0];
  } else {
    startTypingLoop(typingBackdrop, typingSentences);
  }
}

function startTypingLoop(target, sentences) {
  let sentenceIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    const current = sentences[sentenceIndex];
    target.textContent = current.slice(0, charIndex);

    if (!deleting && charIndex < current.length) {
      charIndex += 1;
      window.setTimeout(tick, 72);
      return;
    }

    if (!deleting && charIndex === current.length) {
      deleting = true;
      window.setTimeout(tick, 1600);
      return;
    }

    if (deleting && charIndex > 0) {
      charIndex -= 1;
      window.setTimeout(tick, 38);
      return;
    }

    deleting = false;
    sentenceIndex = (sentenceIndex + 1) % sentences.length;
    window.setTimeout(tick, 360);
  };

  tick();
}

function initHyperspeed(targetCanvas) {
  const context = targetCanvas.getContext("2d", { alpha: true });

  if (!context) {
    targetCanvas.style.display = "none";
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const colors = ["#d856bf", "#6750a2", "#03b3c3", "#dadafa", "#ffffff"];
  const streaks = Array.from({ length: 84 }, (_, index) => createHyperspeedStreak(index));
  const sticks = Array.from({ length: 34 }, (_, index) => ({
    side: index % 2 === 0 ? -1 : 1,
    z: Math.random(),
    height: 0.16 + Math.random() * 0.24,
    speed: 0.2 + Math.random() * 0.18
  }));
  const state = {
    width: 1,
    height: 1,
    dpr: 1,
    pointerInside: false,
    speedBoost: 0,
    lastTime: performance.now()
  };

  const resize = () => {
    const rect = targetCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    state.width = width;
    state.height = height;
    state.dpr = dpr;

    if (targetCanvas.width !== width || targetCanvas.height !== height) {
      targetCanvas.width = width;
      targetCanvas.height = height;
    }
  };

  const handlePointerMove = (event) => {
    const rect = targetCanvas.getBoundingClientRect();
    state.pointerInside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
  };

  const handlePointerLeave = () => {
    state.pointerInside = false;
  };

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerleave", handlePointerLeave);
  const observer = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
  observer?.observe(targetCanvas);
  resize();

  const draw = (timestamp) => {
    const delta = Math.min(0.05, (timestamp - state.lastTime) / 1000 || 0);
    state.lastTime = timestamp;
    state.speedBoost += ((state.pointerInside ? 1 : 0) - state.speedBoost) * 0.08;

    context.clearRect(0, 0, state.width, state.height);
    drawHyperspeedScene(context, state, streaks, sticks, colors, reducedMotion ? 0 : delta);

    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
}

function createHyperspeedStreak(index) {
  return {
    lane: (index % 4) - 1.5,
    side: index % 2 === 0 ? -1 : 1,
    z: Math.random(),
    length: 0.08 + Math.random() * 0.22,
    width: 0.8 + Math.random() * 1.8,
    speed: 0.18 + Math.random() * 0.34,
    colorIndex: index % 5,
    offset: Math.random() * 0.5
  };
}

function drawHyperspeedScene(context, state, streaks, sticks, colors, delta) {
  const width = state.width;
  const height = state.height;
  const cx = width * 0.52;
  const horizonY = height * 0.37;
  const roadBottom = height * 1.08;
  const roadTopWidth = width * 0.08;
  const roadBottomWidth = width * 0.9;
  const speed = 0.36 + state.speedBoost * 0.72;

  const bg = context.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "rgba(0, 0, 0, 0.1)");
  bg.addColorStop(1, "rgba(0, 0, 0, 0.92)");
  context.fillStyle = bg;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = 0.32;
  drawRoadLine(context, cx - roadTopWidth, horizonY, cx - roadBottomWidth, roadBottom, "#ffffff", 1);
  drawRoadLine(context, cx + roadTopWidth, horizonY, cx + roadBottomWidth, roadBottom, "#ffffff", 1);
  drawRoadLine(context, cx, horizonY, cx, roadBottom, "#ffffff", 0.7);
  context.restore();

  for (const stick of sticks) {
    stick.z += delta * stick.speed * speed;
    if (stick.z > 1) stick.z -= 1;

    const point = projectHyperspeedPoint(stick.z, stick.side * 1.08, cx, horizonY, roadBottom, roadBottomWidth);
    const stickHeight = height * stick.height * Math.pow(stick.z, 1.5);
    const glow = context.createLinearGradient(point.x, point.y, point.x, point.y - stickHeight);
    glow.addColorStop(0, "rgba(3, 179, 195, 0)");
    glow.addColorStop(0.45, "rgba(3, 179, 195, 0.8)");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");

    context.strokeStyle = glow;
    context.lineWidth = Math.max(1, 4 * stick.z);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x, point.y - stickHeight);
    context.stroke();
  }

  context.save();
  context.globalCompositeOperation = "lighter";

  for (const streak of streaks) {
    streak.z += delta * streak.speed * speed;
    if (streak.z > 1.16) {
      streak.z = -0.04 - Math.random() * 0.2;
      streak.colorIndex = Math.floor(Math.random() * colors.length);
    }

    const laneOffset = streak.side * (0.24 + Math.abs(streak.lane) * 0.12) + streak.lane * 0.09;
    const head = projectHyperspeedPoint(streak.z, laneOffset, cx, horizonY, roadBottom, roadBottomWidth);
    const tail = projectHyperspeedPoint(
      Math.max(0, streak.z - streak.length),
      laneOffset + streak.offset * 0.02,
      cx,
      horizonY,
      roadBottom,
      roadBottomWidth
    );

    const gradient = context.createLinearGradient(tail.x, tail.y, head.x, head.y);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.35, hexToRgba(colors[streak.colorIndex], 0.55));
    gradient.addColorStop(1, hexToRgba(colors[streak.colorIndex], 1));

    context.strokeStyle = gradient;
    context.lineWidth = Math.max(1, streak.width * (0.5 + streak.z * 3));
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(tail.x, tail.y);
    context.lineTo(head.x, head.y);
    context.stroke();
  }

  context.restore();
}

function projectHyperspeedPoint(zValue, xOffset, cx, horizonY, roadBottom, roadBottomWidth) {
  const z = Math.max(0, Math.min(1.2, zValue));
  const curve = Math.pow(z, 1.9);
  const y = horizonY + (roadBottom - horizonY) * curve;
  const widthAtZ = roadBottomWidth * curve;
  return {
    x: cx + xOffset * widthAtZ,
    y
  };
}

function drawRoadLine(context, x1, y1, x2, y2, color, alpha) {
  const gradient = context.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
  gradient.addColorStop(1, hexToRgba(color, alpha));
  context.strokeStyle = gradient;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const red = parseInt(clean.slice(0, 2), 16);
  const green = parseInt(clean.slice(2, 4), 16);
  const blue = parseInt(clean.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function initMetaBalls(targetCanvas) {
  const gl2 = targetCanvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    powerPreference: "high-performance"
  });

  if (!gl2) {
    targetCanvas.style.display = "none";
    return;
  }

  const vertexSource = `#version 300 es
    precision highp float;
    layout(location = 0) in vec2 position;

    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `#version 300 es
    precision highp float;

    uniform vec3 iResolution;
    uniform float iTime;
    uniform vec3 iMouse;
    uniform vec3 iColor;
    uniform vec3 iCursorColor;
    uniform float iAnimationSize;
    uniform int iBallCount;
    uniform float iCursorBallSize;
    uniform vec3 iMetaBalls[50];
    uniform bool enableTransparency;

    out vec4 outColor;

    float getMetaBallValue(vec2 c, float r, vec2 p) {
      vec2 d = p - c;
      float dist2 = max(dot(d, d), 0.0001);
      return (r * r) / dist2;
    }

    void main() {
      vec2 fc = gl_FragCoord.xy;
      float scale = iAnimationSize / iResolution.y;
      vec2 coord = (fc - iResolution.xy * 0.5) * scale;
      vec2 mouseW = (iMouse.xy - iResolution.xy * 0.5) * scale;

      float m1 = 0.0;
      for (int i = 0; i < 50; i++) {
        if (i >= iBallCount) break;
        m1 += getMetaBallValue(iMetaBalls[i].xy, iMetaBalls[i].z, coord);
      }

      float m2 = getMetaBallValue(mouseW, iCursorBallSize, coord);
      float total = m1 + m2;
      float f = smoothstep(-1.0, 1.0, (total - 1.3) / min(1.0, fwidth(total)));
      vec3 cFinal = vec3(0.0);

      if (total > 0.0) {
        float alpha1 = m1 / total;
        float alpha2 = m2 / total;
        cFinal = iColor * alpha1 + iCursorColor * alpha2;
      }

      outColor = vec4(cFinal * f, enableTransparency ? f : 1.0);
    }
  `;

  const program = createProgram(gl2, vertexSource, fragmentSource);
  if (!program) {
    targetCanvas.style.display = "none";
    return;
  }

  const vertices = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1
  ]);
  const buffer = gl2.createBuffer();
  gl2.bindBuffer(gl2.ARRAY_BUFFER, buffer);
  gl2.bufferData(gl2.ARRAY_BUFFER, vertices, gl2.STATIC_DRAW);
  gl2.useProgram(program);
  gl2.enableVertexAttribArray(0);
  gl2.vertexAttribPointer(0, 2, gl2.FLOAT, false, 0, 0);

  const uniforms = {
    time: gl2.getUniformLocation(program, "iTime"),
    resolution: gl2.getUniformLocation(program, "iResolution"),
    mouse: gl2.getUniformLocation(program, "iMouse"),
    color: gl2.getUniformLocation(program, "iColor"),
    cursorColor: gl2.getUniformLocation(program, "iCursorColor"),
    animationSize: gl2.getUniformLocation(program, "iAnimationSize"),
    ballCount: gl2.getUniformLocation(program, "iBallCount"),
    cursorBallSize: gl2.getUniformLocation(program, "iCursorBallSize"),
    metaBalls: gl2.getUniformLocation(program, "iMetaBalls[0]"),
    transparency: gl2.getUniformLocation(program, "enableTransparency")
  };

  const ballCount = 15;
  const maxBalls = 50;
  const balls = new Float32Array(maxBalls * 3);
  const ballParams = [];
  for (let i = 0; i < ballCount; i += 1) {
    const idx = i + 1;
    const h1 = hash31(idx);
    const h2 = hash33(h1);
    ballParams.push({
      st: h1[0] * Math.PI * 2,
      dtFactor: 0.1 * Math.PI + h1[1] * 0.3 * Math.PI,
      baseScale: 5 + h1[1] * 10,
      toggle: Math.floor(h2[0] * 2),
      radius: 0.5 + h2[2] * 1.5
    });
  }

  const state = {
    mouseX: 0,
    mouseY: 0,
    targetX: 0,
    targetY: 0,
    pointerInside: false,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = targetCanvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    if (targetCanvas.width !== width || targetCanvas.height !== height) {
      targetCanvas.width = width;
      targetCanvas.height = height;
      gl2.viewport(0, 0, width, height);
    }
  };

  const handlePointerMove = (event) => {
    const rect = targetCanvas.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    state.pointerInside = inside;

    if (inside) {
      const dprX = targetCanvas.width / rect.width;
      state.targetX = (event.clientX - rect.left) * dprX;
      state.targetY = (1 - (event.clientY - rect.top) / rect.height) * targetCanvas.height;
    }
  };

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", handlePointerMove);
  const observer = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
  observer?.observe(targetCanvas);
  resize();

  gl2.clearColor(0, 0, 0, 0);
  gl2.enable(gl2.BLEND);
  gl2.blendFunc(gl2.ONE, gl2.ONE_MINUS_SRC_ALPHA);

  const start = performance.now();
  const render = (timestamp) => {
    const elapsed = state.reducedMotion ? 0 : (timestamp - start) * 0.001;
    const speed = 0.3;

    for (let i = 0; i < ballCount; i += 1) {
      const p = ballParams[i];
      const dt = elapsed * speed * p.dtFactor;
      const th = p.st + dt;
      const x = Math.cos(th);
      const y = Math.sin(th + dt * p.toggle);
      balls[i * 3] = x * p.baseScale;
      balls[i * 3 + 1] = y * p.baseScale;
      balls[i * 3 + 2] = p.radius;
    }

    if (!state.pointerInside) {
      state.targetX = targetCanvas.width * 0.5 + Math.cos(elapsed * speed) * targetCanvas.width * 0.15;
      state.targetY = targetCanvas.height * 0.5 + Math.sin(elapsed * speed) * targetCanvas.height * 0.15;
    }

    state.mouseX += (state.targetX - state.mouseX) * 0.15;
    state.mouseY += (state.targetY - state.mouseY) * 0.15;

    gl2.useProgram(program);
    gl2.uniform1f(uniforms.time, elapsed);
    gl2.uniform3f(uniforms.resolution, targetCanvas.width, targetCanvas.height, 0);
    gl2.uniform3f(uniforms.mouse, state.mouseX, state.mouseY, 0);
    gl2.uniform3f(uniforms.color, 1, 1, 1);
    gl2.uniform3f(uniforms.cursorColor, 1, 1, 1);
    gl2.uniform1f(uniforms.animationSize, 30);
    gl2.uniform1i(uniforms.ballCount, ballCount);
    gl2.uniform1f(uniforms.cursorBallSize, 2);
    gl2.uniform3fv(uniforms.metaBalls, balls);
    gl2.uniform1i(uniforms.transparency, 1);
    gl2.clear(gl2.COLOR_BUFFER_BIT);
    gl2.drawArrays(gl2.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
}

function fract(value) {
  return value - Math.floor(value);
}

function hash31(value) {
  const result = [value * 0.1031, value * 0.103, value * 0.0973].map(fract);
  const yzx = [result[1], result[2], result[0]];
  const dot =
    result[0] * (yzx[0] + 33.33) +
    result[1] * (yzx[1] + 33.33) +
    result[2] * (yzx[2] + 33.33);

  for (let i = 0; i < 3; i += 1) {
    result[i] = fract(result[i] + dot);
  }

  return result;
}

function hash33(value) {
  const p = [value[0] * 0.1031, value[1] * 0.103, value[2] * 0.0973].map(fract);
  const yxz = [p[1], p[0], p[2]];
  const dot = p[0] * (yxz[0] + 33.33) + p[1] * (yxz[1] + 33.33) + p[2] * (yxz[2] + 33.33);

  for (let i = 0; i < 3; i += 1) {
    p[i] = fract(p[i] + dot);
  }

  const xxy = [p[0], p[0], p[1]];
  const yxx = [p[1], p[0], p[0]];
  const zyx = [p[2], p[1], p[0]];
  return xxy.map((item, index) => fract((item + yxx[index]) * zyx[index]));
}

function createProgram(context, vertexSource, fragmentSource) {
  const vertexShader = compileShader(context, context.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(context, context.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = context.createProgram();
  context.attachShader(program, vertexShader);
  context.attachShader(program, fragmentShader);
  context.linkProgram(program);

  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    console.error(context.getProgramInfoLog(program));
    context.deleteProgram(program);
    return null;
  }

  return program;
}

function compileShader(context, type, source) {
  const shader = context.createShader(type);
  context.shaderSource(shader, source);
  context.compileShader(shader);

  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    console.error(context.getShaderInfoLog(shader));
    context.deleteShader(shader);
    return null;
  }

  return shader;
}
