/** `count` means of samples of `size` drawn with replacement from `pop`. */
export function sampleMeans(pop: number[], size: number, count: number, rand: () => number): number[] {
  return Array.from({ length: count }, () => {
    let sum = 0;
    for (let i = 0; i < size; i++) sum += pop[Math.floor(rand() * pop.length)];
    return sum / size;
  });
}
