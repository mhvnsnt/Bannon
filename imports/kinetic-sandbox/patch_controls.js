const fs = require('fs');
let code = fs.readFileSync('src/components/ControlsPanel.tsx', 'utf8');

// Collapse The Vault
code = code.replace(
      /<div className="pt-2 border-b border-white\/10 pb-4 space-y-4">\s*<h3 className="text-\[12px\] font-bold text-cyan-500 uppercase tracking-widest mb-2">THE VAULT<\/h3>/g,
      '<SectionHeader id="vault" label="THE VAULT" color="#00bcd4" />\n        {expandedSections[\'vault\'] && (\n        <div className="pt-2 border-b border-white/10 pb-4 space-y-4">'
);
code = code.replace(
      /SPAWN PROCEDURAL CYLINDER\s*<\/button>\s*<\/div>\s*<\/div>\s*<div className="flex flex-col gap-2 mt-2 pt-2 border-t/g,
      'SPAWN PROCEDURAL CYLINDER\n                    </button>\n                </div>\n            </div>\n            </div>\n            )}<div className="flex flex-col gap-2 mt-2 pt-2 border-t'
);

// The Motion Nexus
code = code.replace(
      /<div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white\/10">\s*<label className="text-\[9px\] uppercase tracking-widest text-\[#00ffaa\]">The Motion Nexus \(Synapse API\)<\/label>/g,
      '<div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">\n                <SectionHeader id="motion" label="The Motion Nexus (Synapse API)" color="#00ffaa" />\n                {expandedSections[\'motion\'] && ('
);
code = code.replace(
      /uppercase">THRASH<\/button>\s*<\/div>\s*<\/div>\s*<div className="flex flex-col gap-2 mt-2/g,
      'uppercase">THRASH</button>\n                </div>\n                )}\n            </div>\n\n            <div className="flex flex-col gap-2 mt-2'
);

// FACS Matrix
code = code.replace(
    /<div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white\/10">\s*<label className="text-\[9px\] uppercase tracking-widest text-\[#00aaff\]">FACS Matrix Neural Core<\/label>/g,
    '<div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">\n                <SectionHeader id="facs" label="FACS Matrix Neural Core" color="#00aaff" />\n                {expandedSections[\'facs\'] && (\n                <>'
);
code = code.replace(
    /ENGAGE CONSCIOUSNESS LOOP<\/button>\s*<\/div>\s*<\/div>\s*<div className="flex flex-col gap-2 mt-2/g,
    'ENGAGE CONSCIOUSNESS LOOP</button>\n                </div>\n                </>\n                )}\n            </div>\n\n            <div className="flex flex-col gap-2 mt-2'
);

// Grid Chaos Mechanics
code = code.replace(
    /<div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white\/10">\s*<label className="text-\[9px\] uppercase tracking-widest text-\[#ffaa00\]">Grid Chaos Mechanics<\/label>/g,
    '<div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">\n                <SectionHeader id="chaos" label="Grid Chaos Mechanics" color="#ffaa00" />\n                {expandedSections[\'chaos\'] && ('
);
code = code.replace(
    /uppercase">VORTEX SUCK<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*<div className="pt-4 border-t/g,
    'uppercase">VORTEX SUCK</button>\n                </div>\n                )}\n            </div>\n        </div>\n\n        <div className="pt-4 border-t'
);

// Active Skeletons
code = code.replace(
    /<div className="pt-4 border-t border-white\/10 space-y-4">\s*<div>\s*<label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Active Skeletons<\/label>/g,
    '<div className="pt-4 border-t border-white/10 space-y-4">\n          <SectionHeader id="skeletons" label="Active Skeletons" />\n          {expandedSections[\'skeletons\'] && (\n          <div>'
);
code = code.replace(
    /<\/ul>\s*<\/div>\s*<\/div>\s*<div className="pt-4 border-t border-white\/10 space-y-4">\s*<div>\s*<label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Soft-Body/g,
    '</ul>\n            </div>\n          )}\n        </div>\n\n        <div className="pt-4 border-t border-white/10 space-y-4">\n          <div>\n            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Soft-Body'
);

// Soft-Body Deformers
code = code.replace(
    /<div className="pt-4 border-t border-white\/10 space-y-4">\s*<div>\s*<label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Soft-Body Deformers \(Jiggle Bones\)<\/label>/g,
    '<div className="pt-4 border-t border-white/10 space-y-4">\n          <SectionHeader id="jiggle" label="Soft-Body Deformers (Jiggle Bones)" />\n          {expandedSections[\'jiggle\'] && (\n          <div>'
);
code = code.replace(
    /<\/div>\s*<\/div>\s*<\/div>\s*<div className="pt-4 border-t border-white\/10 space-y-4">\s*<div>\s*<label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Mesh Visibility/g,
    '</div>\n            </div>\n          )}\n        </div>\n\n        <div className="pt-4 border-t border-white/10 space-y-4">\n          <div>\n            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Mesh Visibility'
);

// Mesh Visibility Matrix
code = code.replace(
    /<div className="pt-4 border-t border-white\/10 space-y-4">\s*<div>\s*<label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Mesh Visibility Matrix<\/label>/g,
    '<div className="pt-4 border-t border-white/10 space-y-4">\n          <SectionHeader id="visibility" label="Mesh Visibility Matrix" />\n          {expandedSections[\'visibility\'] && (\n          <div>'
);
code = code.replace(
    /<\/ul>\s*<\/div>\s*<\/div>\s*<div className="pt-4 border-t border-white\/10 space-y-4">\s*<div>\s*<label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Funnel Architecture/g,
    '</ul>\n            </div>\n          )}\n        </div>\n\n        <div className="pt-4 border-t border-white/10 space-y-4">\n          <div>\n            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Funnel Architecture'
);

// Funnel Architecture Coordinates
code = code.replace(
    /<div className="pt-4 border-t border-white\/10 space-y-4">\s*<div>\s*<label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Funnel Architecture Coordinates<\/label>/g,
    '<div className="pt-4 border-t border-white/10 space-y-4">\n          <SectionHeader id="funnel_coords" label="Funnel Architecture Coordinates" />\n          {expandedSections[\'funnel_coords\'] && (\n          <div>'
);
code = code.replace(
    /<\/ul>\s*<\/div>\s*<\/div>\s*<div className="pt-4 border-t border-white\/10 space-y-4">\s*<div>\s*<label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Kinetic Cylinder/g,
    '</ul>\n            </div>\n          )}\n        </div>\n\n        <div className="pt-4 border-t border-white/10 space-y-4">\n          <div>\n            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Kinetic Cylinder'
);

// Kinetic Cylinder Coordinates
code = code.replace(
    /<div className="pt-4 border-t border-white\/10 space-y-4">\s*<div>\s*<label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Kinetic Cylinder Coordinates<\/label>/g,
    '<div className="pt-4 border-t border-white/10 space-y-4">\n          <SectionHeader id="cylinder_coords" label="Kinetic Cylinder Coordinates" />\n          {expandedSections[\'cylinder_coords\'] && (\n          <div>'
);
code = code.replace(
    /<\/ul>\s*<\/div>\s*<\/div>\s*<div className="pt-4 border-t border-white\/10 space-y-4">\s*<div>\s*<div className="flex items-center gap-2 mb-2">/g,
    '</ul>\n            </div>\n          )}\n        </div>\n\n        <div className="pt-4 border-t border-white/10 space-y-4">\n          <div>\n            <div className="flex items-center gap-2 mb-2">'
);

// System Status Monitor
code = code.replace(
    /<div className="pt-4 border-t border-white\/10 space-y-4">\s*<div>\s*<div className="flex items-center gap-2 mb-2">\s*<Activity className="w-4 h-4 text-cyan-500" \/>\s*<label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider m-0">System Status Monitor<\/label>\s*<\/div>/g,
    '<div className="pt-4 border-t border-white/10 space-y-4">\n          <SectionHeader id="system_status" label="System Status Monitor" />\n          {expandedSections[\'system_status\'] && (\n          <div>\n            <div className="flex items-center gap-2 mb-2">\n              <Activity className="w-4 h-4 text-cyan-500" />\n              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider m-0">System Status</label>\n            </div>'
);
code = code.replace(
    /<\/ul>\s*<\/div>\s*<\/div>\s*<div className="mt-6 pt-4 border-t border-white\/10 space-y-4">\s*<div>\s*<label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Universal Pipeline<\/label>/g,
    '</ul>\n            </div>\n          )}\n        </div>\n\n        <div className="mt-6 pt-4 border-t border-white/10 space-y-4">\n          <div>\n            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Universal Pipeline</label>'
);

// Universal Pipeline
code = code.replace(
    /<div className="mt-6 pt-4 border-t border-white\/10 space-y-4">\s*<div>\s*<label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">Universal Pipeline<\/label>/g,
    '<div className="mt-6 pt-4 border-t border-white/10 space-y-4">\n          <SectionHeader id="universal_pipeline" label="Universal Pipeline" />\n          {expandedSections[\'universal_pipeline\'] && (\n          <div>'
);
code = code.replace(
    /<\/div>\s*<\/div>\s*<\/div>\s*<\/>\s*\)}/g,
    '</div>\n            </div>\n          )}\n        </div>\n      </>\n      )}'
);


fs.writeFileSync('src/components/ControlsPanel.tsx', code);
