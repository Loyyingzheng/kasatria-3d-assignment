import * as THREE from 'three';

const NS = 'http://www.w3.org/2000/svg';
function svgNode(name, className) {
  const el = document.createElementNS(NS, name);
  if (className) el.setAttribute('class', className);
  return el;
}

/** Lightweight 2D projected guides: 2 SVG paths, not ~200 extra CSS3DObjects. */
export class HelixGuides {
  constructor(container) {
    this.svg = svgNode('svg', 'helix-guides');
    this.svg.setAttribute('aria-hidden', 'true');
    this.visible = false;
    this.svg.setAttribute('hidden', '');
    this.strands = [svgNode('path', 'helix-strand strand-a'), svgNode('path', 'helix-strand strand-b')];
    this.rungs = svgNode('path', 'helix-rungs');
    this.svg.append(this.rungs, ...this.strands);
    container.prepend(this.svg);
    this.tmp = new THREE.Vector3();
  }

  setVisible(visible) {
    this.visible = Boolean(visible);
    if (this.visible) this.svg.removeAttribute('hidden');
    else this.svg.setAttribute('hidden', '');
  }

  update(camera, targets, width, height) {
    if (!this.visible || !targets?.length || width < 1 || height < 1) return;
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    camera.updateMatrixWorld();
    const coords = [[], []];
    for (const target of targets) {
      const { x, y, z } = target.position;
      this.tmp.set(x, y, z).project(camera);
      coords[target.strand].push([ (this.tmp.x * 0.5 + 0.5) * width, (-this.tmp.y * 0.5 + 0.5) * height ]);
    }
    for (let s = 0; s < 2; s++) {
      const d = coords[s].map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
      this.strands[s].setAttribute('d', d);
    }
    // A small number of subtle rungs makes the DNA metaphor legible without DOM overload.
    const rungs = [];
    for (let i = 0; i < Math.min(coords[0].length, coords[1].length); i += 8) {
      const a = coords[0][i], b = coords[1][i];
      rungs.push(`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
    }
    this.rungs.setAttribute('d', rungs.join(' '));
  }

  destroy() { this.svg.remove(); }
}
