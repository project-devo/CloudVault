import { useEffect, useState } from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[100px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default Spinner;
