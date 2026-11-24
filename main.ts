import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Port of make.fun's reference VM (vm.mjs) for the tiny stack ISA, version 1.
const STEP_LIMIT = 1_000_000, OUTPUT_MAX = 65_536;

// [byte, imm, pops, pushes]
const OPS = [
  [0x00, 0, 0, 0], [0x01, 1, 0, 1], [0x02, 4, 0, 1], [0x03, 0, 1, 0],
  [0x04, 0, 1, 2], [0x05, 0, 2, 2], [0x06, 0, 2, 3], [0x07, 0, 3, 3],
  [0x10, 0, 2, 1], [0x11, 0, 2, 1], [0x12, 0, 2, 1], [0x13, 0, 2, 1],
  [0x14, 0, 2, 1], [0x15, 0, 2, 1], [0x16, 0, 2, 1], [0x17, 0, 1, 1],
  [0x18, 0, 2, 1], [0x19, 0, 2, 1], [0x1a, 0, 2, 1], [0x1b, 0, 1, 1],
  [0x1c, 0, 2, 1], [0x1d, 0, 2, 1], [0x1e, 0, 2, 1], [0x20, 0, 2, 1],
  [0x21, 0, 2, 1], [0x22, 0, 2, 1], [0x30, 2, 0, 0], [0x31, 2, 1, 0],
  [0x32, 2, 1, 0], [0x33, 2, 0, 0], [0x34, 0, 0, 0], [0x40, 0, 1, 1],
  [0x41, 0, 2, 0], [0x50, 0, 1, 0], [0x51, 0, 1, 0], [0x52, 0, 0, 1],
  [0x53, 0, 1, 0],
];
const OP = new Map(OPS.map((o) => [o[0], o]));

function run(program, input) {
  const n = program.length;
  const D = new Int32Array(256);
  let sp = 0;
  const C = new Int32Array(64);
  let csp = 0;
  const M = new Int32Array(256);
  const out = new Uint8Array(OUTPUT_MAX);
  let olen = 0, inPos = 0, pc = 0, steps = 0;
  const end = (e) => ({ out: out.slice(0, olen), exit: e });
  const trap = (c) => end(c);

  for (;;) {
    if (steps === STEP_LIMIT) return trap(10);
    if (pc < 0 || pc >= n) return trap(9);
    const op = OP.get(program[pc]);
    if (op === undefined) return trap(5);
    const [code, imm, pops, pushes] = op;
    if (pc + imm >= n) return trap(9);
    steps++;
    const next = pc + 1 + imm;
    if (sp < pops) return trap(2);
    if (sp - pops + pushes > 256) return trap(3);
    pc = next;
    switch (code) {
      case 0x00: return end(0);
      case 0x01: D[sp++] = (program[next - 1] << 24) >> 24; break;
      case 0x02: D[sp++] = program[next - 4] | (program[next - 3] << 8) | (program[next - 2] << 16) | (program[next - 1] << 24); break;
      case 0x03: sp--; break;
      case 0x04: D[sp] = D[sp - 1]; sp++; break;
      case 0x05: { const t = D[sp - 1]; D[sp - 1] = D[sp - 2]; D[sp - 2] = t; break; }
      case 0x06: D[sp] = D[sp - 2]; sp++; break;
      case 0x07: { const a = D[sp - 3]; D[sp - 3] = D[sp - 2]; D[sp - 2] = D[sp - 1]; D[sp - 1] = a; break; }
      case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16:
      case 0x18: case 0x19: case 0x1a: case 0x1c: case 0x1d: case 0x1e:
      case 0x20: case 0x21: case 0x22: {
        const b = D[sp - 1], a = D[sp - 2];
        let r;
        if (code === 0x10) r = (a + b) | 0;
        else if (code === 0x11) r = (a - b) | 0;
        else if (code === 0x12) r = Math.imul(a, b);
        else if (code === 0x13) { if (b === 0) return trap(4); r = a === -2147483648 && b === -1 ? a : (a / b) | 0; }
        else if (code === 0x14) { if (b === 0) return trap(4); r = b === -1 ? 0 : a % b | 0; }
        else if (code === 0x15) { if (b === 0) return trap(4); r = Math.floor((a >>> 0) / (b >>> 0)) | 0; }
        else if (code === 0x16) { if (b === 0) return trap(4); r = (a >>> 0) % (b >>> 0) | 0; }
        else if (code === 0x18) r = a & b;
        else if (code === 0x19) r = a | b;
        else if (code === 0x1a) r = a ^ b;
        else if (code === 0x1c) r = a << (b & 31);
        else if (code === 0x1d) r = a >> (b & 31);
        else if (code === 0x1e) r = (a >>> (b & 31)) | 0;
        else if (code === 0x20) r = a === b ? 1 : 0;
        else if (code === 0x21) r = a < b ? 1 : 0;
        else r = a >>> 0 < b >>> 0 ? 1 : 0;
        sp -= 2; D[sp++] = r;
        break;
      }
      case 0x17: D[sp - 1] = -D[sp - 1] | 0; break;
      case 0x1b: D[sp - 1] = ~D[sp - 1]; break;
      case 0x30: case 0x31: case 0x32: {
        const rel = ((program[next - 2] | (program[next - 1] << 8)) << 16) >> 16;
        let take = true;
        if (code !== 0x30) { const v = D[--sp]; take = code === 0x31 ? v === 0 : v !== 0; }
        if (take) pc = next + rel;
        break;
      }
      case 0x33:
        if (csp === 64) return trap(7);
        C[csp++] = next;
        pc = program[next - 2] | (program[next - 1] << 8);
        break;
      case 0x34:
        if (csp === 0) return trap(8);
        pc = C[--csp];
        break;
      case 0x40: {
        const addr = D[sp - 1];
        if (addr < 0 || addr >= 256) return trap(6);
        D[sp - 1] = M[addr];
        break;
      }
      case 0x41: {
        const addr = D[sp - 1], v = D[sp - 2];
        if (addr < 0 || addr >= 256) return trap(6);
        sp -= 2;
        M[addr] = v;
        break;
      }
      case 0x50: {
        const s = String(D[sp - 1]);
        const bytes = new TextEncoder().encode(s);
        if (olen + bytes.length > OUTPUT_MAX) return trap(11);
        sp--;
        out.set(bytes, olen);
        olen += bytes.length;
        break;
      }
      case 0x51:
        if (olen + 1 > OUTPUT_MAX) return trap(11);
        out[olen++] = D[--sp] & 255;
        break;
      case 0x52: D[sp++] = inPos < input.length ? input[inPos++] : -1; break;
      case 0x53: return end(D[--sp] & 255);
    }
  }
}

const inDir = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
for (const id of readdirSync(inDir).sort()) {
  const r = run(readFileSync(join(inDir, id, 'program.bin')), readFileSync(join(inDir, id, 'input.bin')));
  const dir = join(outDir, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'stdout.bin'), r.out);
  writeFileSync(join(dir, 'exit.txt'), r.exit + '\n');
}