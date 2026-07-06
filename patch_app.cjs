const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
    /<nav className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 border-b border-black\/5 bg-white\/80 backdrop-blur-md shrink-0 z-50 shadow-sm">/,
    '<nav className="flex flex-wrap md:flex-nowrap items-center justify-between px-3 sm:px-6 py-2 sm:py-3 border-b border-black/5 bg-white/80 backdrop-blur-md shrink-0 z-50 shadow-sm gap-y-3">'
);

content = content.replace(
    /<div className="flex flex-col gap-1 w-auto md:w-1\/3 min-w-0 md:min-w-\[150px\] lg:min-w-\[200px\] shrink-0">/,
    '<div className="flex flex-col gap-1 w-auto md:w-1/3 min-w-0 md:min-w-[150px] lg:min-w-[200px] shrink-0 order-1">'
);

content = content.replace(
    /<div className="flex bg-slate-100 rounded-lg p-0\.5 sm:p-1 border border-black\/5 overflow-x-auto max-w-\[45vw\] min-\[400px\]:max-w-\[55vw\] sm:max-w-none scrollbar-none shrink-0 mx-1 sm:mx-2">/,
    '<div className="flex bg-slate-100 rounded-lg p-0.5 sm:p-1 border border-black/5 overflow-x-auto w-full md:w-auto order-3 md:order-2 scrollbar-none shrink-0 justify-start sm:justify-center mt-1 md:mt-0">'
);

content = content.replace(
    /<div className="flex items-center gap-1\.5 sm:gap-3 w-auto md:w-1\/3 min-w-0 md:min-w-\[200px\] justify-end shrink-0">/,
    '<div className="flex items-center gap-1.5 sm:gap-3 w-auto md:w-1/3 min-w-0 md:min-w-[200px] justify-end shrink-0 order-2 md:order-3">'
);

fs.writeFileSync('src/App.tsx', content);
console.log("Patched App.tsx navigation responsive layout");
