import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

export default function SettingsPage() {
  const headerPortal = useRef<Element | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    headerPortal.current = document.getElementById('page-header');
    setPortalReady(true);
  }, []);

  return (
    <>
      {portalReady && headerPortal.current
        ? createPortal(
            <div className="flex w-full items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">Settings</h1>
            </div>,
            headerPortal.current,
          )
        : null}
      <div className="p-6">
        <p className="text-base font-medium text-muted-foreground">Coming soon.</p>
      </div>
    </>
  );
}
