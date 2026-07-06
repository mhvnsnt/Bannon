const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

if (pkg.devDependencies && pkg.devDependencies.tsx) {
  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies.tsx = pkg.devDependencies.tsx;
  delete pkg.devDependencies.tsx;
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
}

