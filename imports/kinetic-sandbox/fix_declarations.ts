import fs from 'fs';

const variablesToAdd = [
  'entityTemperature',
  'entityOxygen',
  'entityBloodPressure',
  'entityHeartRate',
  'fluidVaginalTransudate',
  'fluidCervicalMucus',
  'fluidBartholinMucus',
  'fluidSkeneEjaculate',
  'fluidMenstrual',
  'fluidSmegma',
  'fluidAnalMucus',
  'fluidPerianalSebum',
  'fluidAnalBile',
  'fecalMatterType',
  'fluidPurulentDischarge',
  'fluidInterstitial',
  'entityPH',
  'hypothalamicClock',
  'lactationVolume',
  'oxytocinLevel',
  'salivaryViscosity',
  'lightingIntensity',
  'physicsSpeed',
  'cameraLocked',
  'enableCylinderControl',
  'enableFleshInteraction',
  'enableForceField',
  'enableVertexPaintMode',
  'thermalVision',
  'environmentMode',
  'physicsPresets'
];

const file = 'src/components/ControlsPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

const declarations = variablesToAdd.map(v => `  const ${v} = usePhysicsStore(s => s.${v});`).join("\n");

content = content.replace(
  "  const updateCylinderTransform = usePhysicsStore(s => s.updateCylinderTransform);",
  "  const updateCylinderTransform = usePhysicsStore(s => s.updateCylinderTransform);\n" + declarations
);

fs.writeFileSync(file, content);
console.log('Fixed declarations!');
