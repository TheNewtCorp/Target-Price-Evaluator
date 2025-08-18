import React from 'react';

function AnimatedBackground(): React.ReactNode {
  return (
    <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-deep-bordeaux/20 rounded-full filter blur-3xl opacity-50 animate-slow-pan"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-arctic-blue/10 rounded-full filter blur-3xl opacity-50 animate-slow-pan-delay"></div>
    </div>
  );
}

export default AnimatedBackground;