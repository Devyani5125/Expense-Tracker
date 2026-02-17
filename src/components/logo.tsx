import { Wallet } from 'lucide-react';
import React from 'react';

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <Wallet className="h-7 w-7 text-primary" />
      <h1 className="text-2xl font-bold text-foreground">
        ExpenseWise
      </h1>
    </div>
  );
};

export default Logo;
