export interface Stimulus {
  intensity: number;
  receptivityWeight: number;
}

export const calculateBehavioralOutput = (
  stimuliArray: Stimulus[],
  deltaTime: number,
  baselineShift: number
): number => {
  let sensorySum = 0;

  for (let i = 0; i < stimuliArray.length; i++) {
    sensorySum += stimuliArray[i].receptivityWeight * stimuliArray[i].intensity;
  }

  const integratedState = sensorySum * deltaTime;
  const totalOutput = integratedState + baselineShift;

  return totalOutput;
};
