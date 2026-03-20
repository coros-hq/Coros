import { useEffect } from 'react';
import { Outlet, redirect } from 'react-router';

import { applySessionFromAccessToken, tryRefreshSession } from '~/lib/api';
import { useAuthStore } from '~/stores/auth.store';

function CorosIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="14" opacity={0.95} stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="10" opacity={0.85} stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="6" opacity={0.75} stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" fill="currentColor" opacity={0.9} r="2" />
    </svg>
  );
}

export async function clientLoader() {
  const session = await tryRefreshSession();
  if (session) {
    applySessionFromAccessToken(session.accessToken);
    throw redirect('/');
  }
  return null;
}

export default function AuthLayout() {
  useEffect(() => {
    useAuthStore.getState().setLoading(false);
  }, []);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative hidden min-h-[280px] flex-1 overflow-hidden bg-[#0E0F11] lg:flex lg:min-h-screen">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(124,58,237,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(124,58,237,0.06) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-foreground-inverse lg:p-12">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple to-purple-bright text-white">
                <CorosIcon className="h-7 w-7" />
              </div>
              <span className="text-xl font-semibold tracking-tight">Coros</span>
            </div>
            <div className="max-w-md space-y-4">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-purple-bright">
                Open company OS
              </p>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground-inverse">
                Operate your SMB with clarity.
              </h1>
              <p className="text-base leading-relaxed text-foreground-subtle">
                People, projects, and policies — unified in one calm surface.
              </p>
            </div>
          </div>
          <footer className="flex flex-wrap gap-x-6 gap-y-2 text-2xs uppercase tracking-wider text-foreground-subtle">
            <a className="transition hover:text-foreground-inverse" href="https://github.com">
              GitHub
            </a>
            <a className="transition hover:text-foreground-inverse" href="https://example.com/docs">
              Docs
            </a>
            <a className="transition hover:text-foreground-inverse" href="https://opensource.org/licenses/MIT">
              License
            </a>
          </footer>
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-canvas">
        <div className="flex items-center gap-3 border-b border-canvas-border px-6 py-4 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple to-purple-bright text-white">
            <CorosIcon className="h-6 w-6" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Coros</span>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-10 lg:py-12">
          <div className="animate-slide-up w-full max-w-[400px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
