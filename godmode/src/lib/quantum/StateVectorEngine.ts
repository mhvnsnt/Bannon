export class ComplexNumber {
  constructor(public real: number, public imag: number) {}
  
  // Math for amplitude manipulation
  multiply(other: ComplexNumber): ComplexNumber {
    return new ComplexNumber(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    )
  }
}

export class QuantumState {
  public amplitudes: ComplexNumber[]

  constructor(numQubits: number) {
    const numStates = Math.pow(2, numQubits)
    this.amplitudes = Array(numStates).fill(null).map(() => new ComplexNumber(0, 0))
    // Initialize in pure state |00...0>
    this.amplitudes[0] = new ComplexNumber(1, 0)
  }

  /**
   * Applies a Hadamard gate to throw the agent's decision matrix into superposition.
   * This allows the swarm to explore multiple logic paths simultaneously.
   */
  applyHadamard(targetQubit: number, numQubits: number): void {
    const numStates = Math.pow(2, numQubits)
    const newAmplitudes = Array(numStates).fill(null).map(() => new ComplexNumber(0, 0))
    const invSqrt2 = 1 / Math.sqrt(2)

    for (let state = 0; state < numStates; state++) {
      const bit = (state >> targetQubit) & 1
      const partnerState = state ^ (1 << targetQubit)
      
      const currentAmp = this.amplitudes[state]
      
      if (bit === 0) {
        newAmplitudes[state].real += currentAmp.real * invSqrt2
        newAmplitudes[state].imag += currentAmp.imag * invSqrt2
        newAmplitudes[partnerState].real += currentAmp.real * invSqrt2
        newAmplitudes[partnerState].imag += currentAmp.imag * invSqrt2
      } else {
        newAmplitudes[state].real -= currentAmp.real * invSqrt2
        newAmplitudes[state].imag -= currentAmp.imag * invSqrt2
      }
    }
    this.amplitudes = newAmplitudes
  }

  /**
   * Applies a CNOT gate to entangle two states.
   * Allows the Swarm Monitor to visualize cross-agent synchronicity.
   */
  entangle(controlQubit: number, targetQubit: number, numQubits: number): void {
    const numStates = Math.pow(2, numQubits)
    const newAmplitudes = Array(numStates).fill(null).map(() => new ComplexNumber(0, 0))

    for (let state = 0; state < numStates; state++) {
      const controlBit = (state >> controlQubit) & 1
      if (controlBit === 1) {
        const partnerState = state ^ (1 << targetQubit)
        newAmplitudes[partnerState] = new ComplexNumber(this.amplitudes[state].real, this.amplitudes[state].imag)
      } else {
        newAmplitudes[state] = new ComplexNumber(this.amplitudes[state].real, this.amplitudes[state].imag)
      }
    }

    this.amplitudes = newAmplitudes
  }

  /**
   * Collapses the superposition into a single definitive execution path based on probability.
   */
  measureAndCollapse(): number {
    let rand = Math.random()
    let cumulativeProbability = 0
    for (let i = 0; i < this.amplitudes.length; i++) {
      const prob = Math.pow(this.amplitudes[i].real, 2) + Math.pow(this.amplitudes[i].imag, 2)
      cumulativeProbability += prob
      if (rand <= cumulativeProbability) {
        return i // Returns the integer representing the chosen execution path
      }
    }
    return 0
  }
}
