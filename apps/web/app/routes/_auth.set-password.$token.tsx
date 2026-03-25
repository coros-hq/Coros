import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { inviteService } from '~/services/invite.service';

export default function SetPasswordPage() {
  const { token } = useParams<'token'>();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!token) {
      setError('Invalid invite link.');
      return;
    }
    setLoading(true);
    try {
      await inviteService.setPassword(token, form.password);
      navigate('/login', {
        state: { message: 'Password set successfully. You can now sign in.' },
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : null;
      setError(message ?? 'Something went wrong. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Set your password
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Choose a secure password to access your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label
            className="text-xs font-medium uppercase tracking-wide text-foreground-muted"
            htmlFor="password"
          >
            New password
          </Label>
          <Input
            autoComplete="new-password"
            className="h-10"
            id="password"
            minLength={8}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            placeholder="••••••••"
            required
            type="password"
            value={form.password}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            className="text-xs font-medium uppercase tracking-wide text-foreground-muted"
            htmlFor="confirmPassword"
          >
            Confirm password
          </Label>
          <Input
            autoComplete="new-password"
            className="h-10"
            id="confirmPassword"
            minLength={8}
            onChange={(e) =>
              setForm((f) => ({ ...f, confirmPassword: e.target.value }))
            }
            placeholder="••••••••"
            required
            type="password"
            value={form.confirmPassword}
          />
        </div>

        {error ? (
          <div className="rounded bg-destructive-muted px-3 py-2.5 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <Button
          className="h-10 w-full bg-purple font-semibold text-white hover:bg-purple-mid"
          disabled={loading}
          type="submit"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner />
              Setting password…
            </span>
          ) : (
            'Set password'
          )}
        </Button>
      </form>

      <div className="mt-6 border-t border-canvas-border pt-6">
        <p className="text-center text-sm text-foreground-muted">
          Already have an account?{' '}
          <Link
            className="font-semibold text-purple underline-offset-4 hover:text-purple-mid hover:underline"
            to="/login"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
