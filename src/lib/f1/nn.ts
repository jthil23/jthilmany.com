export const INPUTS = 15;
export const HIDDEN = 20;
export const OUTPUTS = 2;
export const GENOME_SIZE = INPUTS * HIDDEN + HIDDEN + HIDDEN * OUTPUTS + OUTPUTS;

export function evaluate(genome: Float32Array, input: number[], output: number[], hidden: Float32Array): void {
  let p = 0;
  for (let h = 0; h < HIDDEN; h++) {
    let sum = genome[p++];
    for (let i = 0; i < INPUTS; i++) sum += genome[p++] * input[i];
    hidden[h] = Math.tanh(sum);
  }
  for (let o = 0; o < OUTPUTS; o++) {
    let sum = genome[p++];
    for (let h = 0; h < HIDDEN; h++) sum += genome[p++] * hidden[h];
    output[o] = Math.tanh(sum);
  }
}

export function randomGenome(random: () => number): Float32Array {
  const genome = new Float32Array(GENOME_SIZE), hiddenWeights = INPUTS * HIDDEN;
  const hiddenScale = Math.sqrt(6 / (INPUTS + HIDDEN)), outputWeights = hiddenWeights + HIDDEN;
  const outputBiases = outputWeights + HIDDEN * OUTPUTS, outputScale = Math.sqrt(6 / (HIDDEN + OUTPUTS));
  for (let i = 0; i < hiddenWeights; i++) genome[i] = (random() * 2 - 1) * hiddenScale;
  for (let i = hiddenWeights; i < outputWeights; i++) genome[i] = (random() * 2 - 1) * .12;
  for (let i = outputWeights; i < outputBiases; i++) genome[i] = (random() * 2 - 1) * outputScale;
  genome[outputBiases] = (random() * 2 - 1) * .12;
  genome[outputBiases + 1] = .65 + random() * .25;
  return genome;
}

export function crossover(a: Float32Array, b: Float32Array, random: () => number): Float32Array {
  const child = new Float32Array(a.length);
  for (let i = 0; i < child.length; i++) child[i] = random() < .5 ? a[i] : b[i];
  return child;
}

export function mutate(genome: Float32Array, rate: number, random: () => number): void {
  for (let i = 0; i < genome.length; i++) {
    if (random() < rate) {
      let u = Math.max(.0001, random()), v = random();
      genome[i] = Math.max(-3, Math.min(3, genome[i] + Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * .28));
    }
  }
}
