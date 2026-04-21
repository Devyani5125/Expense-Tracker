import { Wallet } from 'lucide-react';
import React from 'react';

const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
        <Wallet className="h-6 w-6 text-primary" />
      </div>
      <h1 className="text-2xl font-black tracking-tighter text-white">
        EXPENSE<span className="text-primary text-glow">WISE</span>
      </h1>
    </div>
  );
};

export default Logo;
