import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { authService } from '~/services/auth.service';
import { useAuthStore } from '~/stores/auth.store';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, accessToken } = await authService.login(form);
      setAuth(user, accessToken);
      navigate('/');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : null;
      setError(message ?? 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-1.5 text-sm text-foreground-muted">Sign in to your workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label
            className="text-xs font-medium uppercase tracking-wide text-foreground-muted"
            htmlFor="email"
          >
            Work email
          </Label>
          <Input
            autoComplete="email"
            className="h-10"
            id="email"
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@company.com"
            required
            type="email"
            value={form.email}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            className="text-xs font-medium uppercase tracking-wide text-foreground-muted"
            htmlFor="password"
          >
            Password
          </Label>
          <Input
            autoComplete="current-password"
            className="h-10"
            id="password"
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="••••••••"
            required
            type="password"
            value={form.password}
          />
        </div>

        {error ? (
          <div className="rounded bg-destructive-muted px-3 py-2.5 text-sm text-destructive">{error}</div>
        ) : null}

        <Button
          className="h-10 w-full bg-purple font-semibold text-white hover:bg-purple-mid"
          disabled={loading}
          type="submit"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner />
              Signing in…
            </span>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <div className="mt-6 border-t border-canvas-border pt-6">
        <p className="text-center text-sm text-foreground-muted">
          Don&apos;t have an account?{' '}
          <Link
            className="font-semibold text-purple underline-offset-4 hover:text-purple-mid hover:underline"
            to="/register"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
