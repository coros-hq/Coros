import { expect, test } from 'vitest';

import DashboardPage from '../../app/routes/_app._index';

test('dashboard page is a component', () => {
  expect(typeof DashboardPage).toBe('function');
});
