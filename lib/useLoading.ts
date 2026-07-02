'use client';

import { useState, useCallback } from 'react';

export const useLoading = () => {
  const [isLoading, setIsLoading] = useState(false);

  const setLoading = useCallback((status: boolean) => {
    setIsLoading(status);
  }, []);

  return { isLoading, setLoading };
};
