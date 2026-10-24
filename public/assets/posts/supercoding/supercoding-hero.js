const canvas = document.querySelector('#supercodingCanvas');
const hero = document.querySelector('#supercodingHero');
const context = canvas.getContext('2d', { alpha: true });
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const statusNode = document.querySelector('#supercodingStatus');

const MAX_DPR = 2;
const FRAME_INTERVAL = 1000 / 50;
const TAU = Math.PI * 2;

const instruments = {
  goal: {
    id: 'goal', rotation: -0.35, velocity: 0, lock: 0, hover: false, dragging: false, drag: null,
    hitTarget: document.querySelector('[data-instrument="goal"]')
  },
  dev: {
    id: 'dev', yaw: -0.55, pitch: 0.42, velocityYaw: 0, velocityPitch: 0, build: 1,
    hover: false, dragging: false, drag: null,
    hitTarget: document.querySelector('[data-instrument="dev"]')
  },
  review: {
    id: 'review', rotation: -0.075, scan: 0.18, flash: 0, hover: false, dragging: false, drag: null,
    hitTarget: document.querySelector('[data-instrument="review"]')
  }
};

let width = 0;
let height = 0;
let deviceScale = 1;
let animationFrame = 0;
let lastFrame = 0;
let flowPhase = 0;
let stillFrameRequested = false;
let pageVisible = true;
let heroVisible = true;
let colors = {};

const latticePoints = [];
const latticeEdges = [];

for (let x = -1; x <= 1; x += 1) {
  for (let y = -1; y <= 1; y += 1) {
    for (let z = -1; z <= 1; z += 1) {
      latticePoints.push({ x, y, z, key: `${x}:${y}:${z}` });
    }
  }
}

const pointByKey = new Map(latticePoints.map((point) => [point.key, point]));
latticePoints.forEach((point) => {
  const neighbors = [
    [point.x + 1, point.y, point.z],
    [point.x, point.y + 1, point.z],
    [point.x, point.y, point.z + 1]
  ];
  neighbors.forEach(([x, y, z]) => {
    const neighbor = pointByKey.get(`${x}:${y}:${z}`);
    if (neighbor) latticeEdges.push([point, neighbor]);
  });
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mix(from, to, amount) {
  return from + (to - from) * amount;
}

function easeOutBack(value) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}

function readRgb(name) {
  return getComputedStyle(hero).getPropertyValue(name).trim();
}

function refreshTheme() {
  colors = {
    ink: readRgb('--canvas-ink'),
    muted: readRgb('--canvas-muted'),
    signal: readRgb('--canvas-signal')
  };
  requestStillFrame();
}

function configureLayout() {
  const rect = hero.getBoundingClientRect();
  width = Math.max(1, Math.round(rect.width));
  height = Math.max(1, Math.round(rect.height));
  deviceScale = Math.min(MAX_DPR, window.devicePixelRatio || 1);

  canvas.width = Math.round(width * deviceScale);
  canvas.height = Math.round(height * deviceScale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  const mobile = width < 820;
  const layout = mobile
    ? {
        goal: { x: 0.19, y: 0.24, size: clamp(width * 0.32, 104, 140) },
        dev: { x: 0.72, y: 0.52, size: clamp(width * 0.25, 88, 118) },
        review: { x: 0.80, y: 0.22, size: clamp(width * 0.17, 60, 78) }
      }
    : {
        goal: { x: 0.19, y: 0.27, size: clamp(width * 0.135, 142, 218) },
        dev: { x: 0.72, y: 0.55, size: clamp(width * 0.105, 118, 174) },
        review: { x: 0.84, y: 0.20, size: clamp(width * 0.068, 78, 112) }
      };

  Object.entries(layout).forEach(([id, item]) => {
    const instrument = instruments[id];
    instrument.x = width * item.x;
    instrument.y = height * item.y;
    instrument.size = item.size;

    const scale = id === 'goal' ? 2.22 : id === 'dev' ? 2.35 : 2.25;
    const hitWidth = item.size * scale;
    const hitHeight = id === 'review' ? item.size * 2.05 : hitWidth;
    Object.assign(instrument.hitTarget.style, {
      left: `${instrument.x - hitWidth / 2}px`,
      top: `${instrument.y - hitHeight / 2}px`,
      width: `${hitWidth}px`,
      height: `${hitHeight}px`
    });
  });

  requestStillFrame();
}

function rgba(rgb, alpha) {
  return `rgba(${rgb}, ${alpha})`;
}

function drawBackground(time) {
  const drift = reducedMotion.matches ? 0 : (time * 0.002) % 30;
  context.save();
  context.fillStyle = rgba(colors.ink, 0.055);
  for (let y = 90; y < height - 30; y += 30) {
    for (let x = 18 + ((Math.floor(y / 30) % 2) * 15); x < width; x += 30) {
      const distanceFromCenter = Math.abs(x - width * 0.5) / width;
      context.globalAlpha = 0.16 + distanceFromCenter * 0.22;
      context.fillRect(x + drift, y, 1, 1);
    }
  }
  context.restore();
}

function quadraticPoint(start, control, end, amount) {
  const inverse = 1 - amount;
  return {
    x: inverse * inverse * start.x + 2 * inverse * amount * control.x + amount * amount * end.x,
    y: inverse * inverse * start.y + 2 * inverse * amount * control.y + amount * amount * end.y
  };
}

function drawPath(start, control, end, phase, label) {
  context.save();
  context.strokeStyle = rgba(colors.ink, 0.17);
  context.lineWidth = 1;
  context.setLineDash([3, 8]);
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.quadraticCurveTo(control.x, control.y, end.x, end.y);
  context.stroke();
  context.setLineDash([]);

  for (let index = 0; index < 3; index += 1) {
    const amount = (phase + index / 3) % 1;
    const point = quadraticPoint(start, control, end, amount);
    const next = quadraticPoint(start, control, end, Math.min(1, amount + 0.012));
    const angle = Math.atan2(next.y - point.y, next.x - point.x);
    context.save();
    context.translate(point.x, point.y);
    context.rotate(angle);
    context.fillStyle = rgba(colors.signal, 0.35 + amount * 0.55);
    context.fillRect(-6, -1.5, 12, 3);
    context.restore();
  }

  const labelPoint = quadraticPoint(start, control, end, 0.48);
  context.fillStyle = rgba(colors.muted, 0.72);
  context.font = '700 8px "SFMono-Regular", Consolas, monospace';
  context.fillText(label, labelPoint.x, labelPoint.y - 10);
  context.restore();
}

function drawSignalPath() {
  const goal = instruments.goal;
  const dev = instruments.dev;
  const review = instruments.review;
  const firstStart = { x: goal.x + goal.size * 0.82, y: goal.y + goal.size * 0.2 };
  const firstEnd = { x: dev.x - dev.size * 0.72, y: dev.y - dev.size * 0.48 };
  const firstControl = { x: mix(firstStart.x, firstEnd.x, 0.52), y: Math.min(firstStart.y, firstEnd.y) - height * 0.08 };
  drawPath(firstStart, firstControl, firstEnd, flowPhase, 'SPEC');

  const secondStart = { x: dev.x + dev.size * 0.1, y: dev.y - dev.size * 0.82 };
  const secondEnd = { x: review.x - review.size * 0.18, y: review.y + review.size * 0.82 };
  const secondControl = { x: Math.max(secondStart.x, secondEnd.x) + width * 0.04, y: mix(secondStart.y, secondEnd.y, 0.45) };
  drawPath(secondStart, secondControl, secondEnd, (flowPhase + 0.37) % 1, 'DIFF');
}

function drawArcSegments(radius, rotation, segments, segmentLength, alpha, lineWidth) {
  context.save();
  context.rotate(rotation);
  context.strokeStyle = rgba(colors.signal, alpha);
  context.lineWidth = lineWidth;
  for (let index = 0; index < segments; index += 1) {
    const start = (index / segments) * TAU;
    context.beginPath();
    context.arc(0, 0, radius, start, start + segmentLength);
    context.stroke();
  }
  context.restore();
}

function drawGoal(time) {
  const goal = instruments.goal;
  const hoverScale = goal.hover || goal.dragging ? 1.025 : 1;
  const lockCompression = 1 - Math.sin(goal.lock * Math.PI) * 0.075;
  const size = goal.size * hoverScale * lockCompression;

  context.save();
  context.translate(goal.x, goal.y);
  context.strokeStyle = rgba(colors.ink, 0.15);
  context.lineWidth = 1;
  context.setLineDash([2, 7]);
  context.beginPath();
  context.moveTo(-size * 1.18, 0);
  context.lineTo(size * 1.18, 0);
  context.moveTo(0, -size * 1.18);
  context.lineTo(0, size * 1.18);
  context.stroke();
  context.setLineDash([]);

  drawArcSegments(size, goal.rotation, 4, 0.92, 0.94, 1.4);
  drawArcSegments(size * 0.78, -goal.rotation * 0.72, 3, 1.3, 0.42, 1);
  drawArcSegments(size * 0.54, goal.rotation * 1.28, 6, 0.36, 0.78, 1);

  context.save();
  context.rotate(-goal.rotation * 0.34);
  for (let index = 0; index < 72; index += 1) {
    const angle = (index / 72) * TAU;
    const major = index % 6 === 0;
    const inner = size * (major ? 0.88 : 0.92);
    const outer = size * (major ? 1.02 : 0.98);
    context.strokeStyle = major ? rgba(colors.signal, 0.82) : rgba(colors.ink, 0.22);
    context.lineWidth = major ? 1.2 : 0.7;
    context.beginPath();
    context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    context.stroke();
  }
  context.restore();

  const sweep = reducedMotion.matches ? 0.2 : ((time * 0.00011) % 1);
  context.fillStyle = rgba(colors.signal, 0.055);
  context.beginPath();
  context.moveTo(0, 0);
  context.arc(0, 0, size * 0.76, sweep * TAU, sweep * TAU + 0.52);
  context.closePath();
  context.fill();

  context.strokeStyle = rgba(colors.signal, 0.88);
  context.lineWidth = 1;
  const bracket = size * 0.23;
  const arm = size * 0.09;
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([xDirection, yDirection]) => {
    context.beginPath();
    context.moveTo(xDirection * bracket, yDirection * (bracket - arm));
    context.lineTo(xDirection * bracket, yDirection * bracket);
    context.lineTo(xDirection * (bracket - arm), yDirection * bracket);
    context.stroke();
  });

  context.fillStyle = rgba(colors.signal, 0.96);
  context.beginPath();
  context.arc(0, 0, 2.2 + goal.lock * 2.5, 0, TAU);
  context.fill();
  context.font = `700 ${clamp(size * 0.065, 8, 13)}px "SFMono-Regular", Consolas, monospace`;
  context.fillText(goal.lock > 0.12 ? 'LOCKED' : 'GOAL', 0, size * 0.34);

  for (let index = 0; index < 4; index += 1) {
    const angle = goal.rotation + index * (TAU / 4);
    context.save();
    context.translate(Math.cos(angle) * size * 1.11, Math.sin(angle) * size * 1.11);
    context.rotate(angle + Math.PI / 2);
    context.fillStyle = rgba(colors.muted, 0.78);
    context.font = `700 ${clamp(size * 0.045, 7, 10)}px "SFMono-Regular", Consolas, monospace`;
    context.fillText('SG', 0, 0);
    context.restore();
  }

  context.restore();
}

function rotate3d(point, yaw, pitch) {
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const xYaw = point.x * cosYaw + point.z * sinYaw;
  const zYaw = -point.x * sinYaw + point.z * cosYaw;
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  return {
    x: xYaw,
    y: point.y * cosPitch - zYaw * sinPitch,
    z: point.y * sinPitch + zYaw * cosPitch
  };
}

function projectLattice(point, dev, buildScale) {
  const expanded = { x: point.x * buildScale, y: point.y * buildScale, z: point.z * buildScale };
  const rotated = rotate3d(expanded, dev.yaw, dev.pitch);
  const perspective = 1 / (2.35 - rotated.z * 0.2);
  return {
    x: dev.x + rotated.x * dev.size * perspective,
    y: dev.y - rotated.y * dev.size * perspective,
    z: rotated.z,
    scale: perspective
  };
}

function drawDev(time) {
  const dev = instruments.dev;
  const hoverScale = dev.hover || dev.dragging ? 1.04 : 1;
  const buildScale = easeOutBack(clamp(dev.build, 0, 1)) * hoverScale;
  const projected = new Map(latticePoints.map((point) => [point.key, projectLattice(point, dev, buildScale)]));

  const sortedEdges = latticeEdges
    .map(([start, end]) => ({ start: projected.get(start.key), end: projected.get(end.key) }))
    .sort((a, b) => ((a.start.z + a.end.z) - (b.start.z + b.end.z)));

  context.save();
  sortedEdges.forEach((edge, index) => {
    const depth = clamp(((edge.start.z + edge.end.z) * 0.25 + 1) / 2, 0, 1);
    const active = ((index / sortedEdges.length + flowPhase) % 1) > 0.82;
    context.strokeStyle = active ? rgba(colors.signal, 0.72) : rgba(colors.ink, 0.12 + depth * 0.38);
    context.lineWidth = active ? 1.4 : 0.8;
    context.beginPath();
    context.moveTo(edge.start.x, edge.start.y);
    context.lineTo(edge.end.x, edge.end.y);
    context.stroke();
  });

  const sortedPoints = latticePoints
    .map((point) => ({ point, projected: projected.get(point.key) }))
    .sort((a, b) => a.projected.z - b.projected.z);

  sortedPoints.forEach(({ point, projected: node }, index) => {
    const depth = clamp((node.z + 1.8) / 3.6, 0, 1);
    const pulse = reducedMotion.matches ? 0 : Math.sin(time * 0.002 + index * 0.9) * 0.5 + 0.5;
    const nodeSize = clamp(dev.size * node.scale * 0.038, 2.4, 6) + pulse * 0.5;
    const outerNode = Math.abs(point.x) + Math.abs(point.y) + Math.abs(point.z) >= 2;
    context.fillStyle = outerNode ? rgba(colors.signal, 0.42 + depth * 0.52) : rgba(colors.ink, 0.15 + depth * 0.4);
    context.fillRect(node.x - nodeSize / 2, node.y - nodeSize / 2, nodeSize, nodeSize);
  });

  const frontNodes = sortedPoints.slice(-4);
  context.fillStyle = rgba(colors.ink, 0.74);
  context.font = `700 ${clamp(dev.size * 0.06, 7, 11)}px "SFMono-Regular", Consolas, monospace`;
  frontNodes.forEach(({ projected: node }, index) => {
    if (index % 2 === 0) context.fillText(index === 0 ? '{ }' : 'SD', node.x + 12, node.y - 10);
  });

  context.translate(dev.x, dev.y);
  context.strokeStyle = rgba(colors.signal, 0.22 + (1 - dev.build) * 0.6);
  context.lineWidth = 1;
  context.strokeRect(-dev.size * 0.72, -dev.size * 0.72, dev.size * 1.44, dev.size * 1.44);
  context.fillStyle = rgba(colors.signal, 0.92);
  context.font = `700 ${clamp(dev.size * 0.055, 8, 11)}px "SFMono-Regular", Consolas, monospace`;
  context.fillText(dev.build < 0.9 ? 'ASSEMBLING' : 'STRUCTURE', 0, dev.size * 0.94);
  context.restore();
}

function drawReview() {
  const review = instruments.review;
  const size = review.size * (review.hover || review.dragging ? 1.035 : 1);
  const scanY = mix(-size * 0.72, size * 0.72, review.scan);

  context.save();
  context.translate(review.x, review.y);
  context.rotate(review.rotation);
  context.fillStyle = rgba(colors.ink, 0.025 + review.flash * 0.06);
  context.fillRect(-size * 0.78, -size * 0.78, size * 1.56, size * 1.56);

  const tokens = ['SR', '{ }', 'OK', '[ ]', 'SR', '∆', 'OK'];
  const rows = 5;
  const columns = 7;
  context.font = `700 ${clamp(size * 0.08, 7, 10)}px "SFMono-Regular", Consolas, monospace`;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = mix(-size * 0.58, size * 0.58, column / (columns - 1));
      const y = mix(-size * 0.55, size * 0.55, row / (rows - 1));
      const verified = y < scanY;
      context.fillStyle = verified ? rgba(colors.signal, 0.62) : rgba(colors.ink, 0.15);
      context.fillText(tokens[(row * columns + column) % tokens.length], x, y);
    }
  }

  context.fillStyle = rgba(colors.signal, 0.07 + review.flash * 0.13);
  context.fillRect(-size * 0.7, scanY - size * 0.16, size * 1.4, size * 0.32);
  context.strokeStyle = rgba(colors.signal, 0.94);
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(-size * 0.76, scanY);
  context.lineTo(size * 0.76, scanY);
  context.stroke();

  const corner = size * 0.76;
  const arm = size * 0.22;
  context.lineWidth = 1.4;
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([xDirection, yDirection]) => {
    context.beginPath();
    context.moveTo(xDirection * corner, yDirection * (corner - arm));
    context.lineTo(xDirection * corner, yDirection * corner);
    context.lineTo(xDirection * (corner - arm), yDirection * corner);
    context.stroke();
  });

  context.fillStyle = rgba(colors.signal, 0.94);
  context.font = `700 ${clamp(size * 0.075, 7, 11)}px "SFMono-Regular", Consolas, monospace`;
  const reviewState = review.flash > 0.3 || review.scan > 0.94 ? 'VERIFIED' : 'SCANNING';
  context.fillText(reviewState, 0, size * 1.02);
  context.restore();
}

function render(time = 0) {
  context.clearRect(0, 0, width, height);
  drawBackground(time);
  drawSignalPath();
  drawGoal(time);
  drawDev(time);
  drawReview();
}

function update(deltaSeconds) {
  const goal = instruments.goal;
  const dev = instruments.dev;
  const review = instruments.review;

  if (!goal.dragging) {
    if (!reducedMotion.matches) goal.rotation += 0.12 * deltaSeconds;
    goal.rotation += goal.velocity * deltaSeconds;
    goal.velocity *= Math.pow(0.055, deltaSeconds);
  }

  if (!dev.dragging) {
    if (!reducedMotion.matches) dev.yaw += 0.16 * deltaSeconds;
    dev.yaw += dev.velocityYaw * deltaSeconds;
    dev.pitch += dev.velocityPitch * deltaSeconds;
    dev.velocityYaw *= Math.pow(0.06, deltaSeconds);
    dev.velocityPitch *= Math.pow(0.06, deltaSeconds);
  }
  dev.pitch = clamp(dev.pitch, -1.15, 1.15);
  dev.build = Math.min(1, dev.build + deltaSeconds * 1.5);

  if (!review.dragging && !reducedMotion.matches) review.scan = (review.scan + deltaSeconds * 0.19) % 1;

  goal.lock = Math.max(0, goal.lock - deltaSeconds * 0.72);
  review.flash = Math.max(0, review.flash - deltaSeconds * 0.64);
  if (!reducedMotion.matches) flowPhase = (flowPhase + deltaSeconds * 0.14) % 1;
}

function animate(time) {
  if (!pageVisible || !heroVisible || reducedMotion.matches) {
    animationFrame = 0;
    return;
  }
  animationFrame = window.requestAnimationFrame(animate);
  if (time - lastFrame < FRAME_INTERVAL) return;
  const deltaSeconds = lastFrame ? Math.min((time - lastFrame) / 1000, 0.05) : 0;
  lastFrame = time;
  update(deltaSeconds);
  render(time);
}

function requestStillFrame() {
  if (!reducedMotion.matches || stillFrameRequested) return;
  stillFrameRequested = true;
  window.requestAnimationFrame((time) => {
    stillFrameRequested = false;
    render(time);
  });
}

function startAnimation() {
  window.cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  lastFrame = 0;
  if (reducedMotion.matches) requestStillFrame();
  else if (pageVisible && heroVisible) animationFrame = window.requestAnimationFrame(animate);
}

function setStatus(message) {
  statusNode.textContent = message;
}

function triggerInstrument(instrument) {
  if (instrument.id === 'goal') {
    instrument.lock = 1;
    instrument.velocity += 1.35;
    setStatus('GOAL · TARGET LOCKED');
  } else if (instrument.id === 'dev') {
    instrument.build = 0;
    instrument.velocityYaw += 0.95;
    setStatus('DEV · ARCHITECTURE ASSEMBLING');
  } else {
    instrument.scan = 0;
    instrument.flash = 1;
    setStatus('REVIEW · EVIDENCE SCAN RUNNING');
  }
  requestStillFrame();
}

function releaseInstrument(instrument, event, cancelled = false) {
  if (!instrument.dragging || !instrument.drag) return;
  const shouldTrigger = !cancelled && !instrument.drag.moved;
  instrument.dragging = false;
  instrument.hitTarget.classList.remove('is-dragging');
  if (instrument.hitTarget.hasPointerCapture(event.pointerId)) instrument.hitTarget.releasePointerCapture(event.pointerId);
  instrument.drag = null;
  if (shouldTrigger) triggerInstrument(instrument);
  requestStillFrame();
}

Object.values(instruments).forEach((instrument) => {
  const target = instrument.hitTarget;

  target.addEventListener('pointerenter', () => {
    instrument.hover = true;
    requestStillFrame();
  });

  target.addEventListener('pointerleave', () => {
    if (!instrument.dragging) instrument.hover = false;
    requestStillFrame();
  });

  target.addEventListener('pointerdown', (event) => {
    instrument.dragging = true;
    instrument.drag = {
      pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      x: event.clientX, y: event.clientY, time: event.timeStamp, moved: false
    };
    target.setPointerCapture(event.pointerId);
    target.classList.add('is-dragging');
  });

  target.addEventListener('pointermove', (event) => {
    const drag = instrument.drag;
    if (!instrument.dragging || !drag || event.pointerId !== drag.pointerId) return;

    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    const elapsed = Math.max(8, event.timeStamp - drag.time);
    drag.moved = drag.moved || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 6;

    if (instrument.id === 'goal') {
      const delta = deltaX * 0.007 + deltaY * 0.003;
      instrument.rotation += delta;
      instrument.velocity = clamp((delta * 1000) / elapsed, -4, 4);
      setStatus('GOAL · CALIBRATING TARGET');
    } else if (instrument.id === 'dev') {
      instrument.yaw += deltaX * 0.008;
      instrument.pitch += deltaY * 0.006;
      instrument.velocityYaw = clamp((deltaX * 0.008 * 1000) / elapsed, -4, 4);
      instrument.velocityPitch = clamp((deltaY * 0.006 * 1000) / elapsed, -3, 3);
      setStatus('DEV · INSPECTING STRUCTURE');
    } else {
      instrument.scan = clamp(instrument.scan + deltaY / (instrument.size * 2) + deltaX / (instrument.size * 5), 0, 1);
      setStatus('REVIEW · SCRUBBING EVIDENCE');
    }

    instrument.drag = { ...drag, x: event.clientX, y: event.clientY, time: event.timeStamp };
    requestStillFrame();
  });

  target.addEventListener('pointerup', (event) => releaseInstrument(instrument, event));
  target.addEventListener('pointercancel', (event) => releaseInstrument(instrument, event, true));

  target.addEventListener('focus', () => {
    instrument.hover = true;
    setStatus(`${instrument.id.toUpperCase()} · READY`);
    requestStillFrame();
  });

  target.addEventListener('blur', () => {
    instrument.hover = false;
    requestStillFrame();
  });

  target.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    triggerInstrument(instrument);
  });
});

document.addEventListener('visibilitychange', () => {
  pageVisible = !document.hidden;
  startAnimation();
});

const resizeObserver = new ResizeObserver(configureLayout);
resizeObserver.observe(hero);
const visibilityObserver = new IntersectionObserver(([entry]) => {
  heroVisible = entry.isIntersecting;
  startAnimation();
});
visibilityObserver.observe(hero);
reducedMotion.addEventListener('change', startAnimation);

refreshTheme();
configureLayout();
startAnimation();
