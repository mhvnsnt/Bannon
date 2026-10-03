import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/ControlsPanel.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /usePhysicsStore\(s => (Math\.abs\([^)]+\) > 1\.0|s\.[a-zA-Z0-9_]+(\(\))?)(\.toFixed\([0-9]+\))?\)/g;

let matches;
const extracted = new Set<string>();

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
  'environmentMode'
];

// First, do replacement for `s.propertyName` inside JSX (value or spans)
content = content.replace(/usePhysicsStore\(s => s\.([a-zA-Z0-9_]+)\)/g, (match, prop) => {
    return prop;
});

// then the toFixed ones and other complex ones
content = content.replace(/usePhysicsStore\(s => Math\.abs\(s\.entityPH - 4\.2\) > 1\.0\)/g, "Math.abs(entityPH - 4.2) > 1.0");

// Now we need to inject the extracted variables to the top of ControlsPanel
const declarations = variablesToAdd.map(v => `  const ${v} = usePhysicsStore(s => s.${v});`).join("\n");

content = content.replace(
  "  const updateCylinderTransform = usePhysicsStore(s => s.updateCylinderTransform);",
  "  const updateCylinderTransform = usePhysicsStore(s => s.updateCylinderTransform);\n" + declarations
);

fs.writeFileSync(file, content);
console.log("Done");
