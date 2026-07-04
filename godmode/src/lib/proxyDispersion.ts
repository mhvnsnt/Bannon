export class ChemicalProxyEngine {
  private currentConcentration: number = 0;
  private targetConcentration: number = 0;
  private decayConstant: number;
  private diffusionRate: number;

  constructor(decay: number, diffusion: number) {
    this.decayConstant = decay;
    this.diffusionRate = diffusion;
  }

  public injectProxy(amount: number) {
    this.targetConcentration += amount;
  }

  public calculateCurrentState(deltaTime: number): number {
    if (this.currentConcentration < this.targetConcentration) {
      this.currentConcentration += (this.targetConcentration - this.currentConcentration) * this.diffusionRate * deltaTime;
    } else {
      this.targetConcentration *= Math.exp(-this.decayConstant * deltaTime);
      this.currentConcentration = this.targetConcentration;
    }
    return this.currentConcentration;
  }
}
