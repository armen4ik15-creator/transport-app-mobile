import { useEffect } from 'react';
import { checkAndApplyUpdate } from '../utils/appUpdate';

export function OtaUpdateManager() {
  useEffect(() => {
    void checkAndApplyUpdate(false);
  }, []);

  return null;
}
