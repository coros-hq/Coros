import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  type MetaFunction,
} from 'react-router';
import { Toaster } from 'sonner';

import './app.css';

import logoUrl from './assets/logo.svg?url';

export const meta: MetaFunction = () => [{ title: 'Coros' }];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={logoUrl} type="image/svg+xml" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster richColors closeButton position="top-right" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
