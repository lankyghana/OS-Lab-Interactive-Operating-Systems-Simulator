import { expect, test } from '@playwright/test';

test('guest can open every module without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const path of ['/', '/learn', '/learn/cpu-fcfs', '/process', '/cpu', '/memory', '/paging', '/disk', '/practice', '/progress']) {
    await page.goto(path);
    await expect(page.locator('h1').first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('FCFS calculator matches the course example', async ({ page }) => {
  await page.goto('/cpu');
  await page.getByRole('tab', { name: /Calculator/ }).click();
  await page.getByRole('button', { name: 'Calculate results' }).click();
  await expect(page.getByText('5.75')).toBeVisible();
  await expect(page.getByText('11.25')).toBeVisible();
});

test('visual and text modes agree (shared engine)', async ({ page }) => {
  await page.goto('/disk');
  await page.getByLabel('Algorithm').selectOption('SSTF');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.locator('input[type=range]').fill('8');
  await expect(page.getByText('236').first()).toBeVisible();
  await page.getByRole('tab', { name: /Calculator/ }).click();
  await page.getByRole('button', { name: 'Calculate head movement' }).click();
  await expect(page.getByText('236').first()).toBeVisible();
});

test('invalid process transitions are explained', async ({ page }) => {
  await page.goto('/process');
  await page.getByRole('tab', { name: /Command console/ }).click();
  const cmd = page.getByLabel('Command');
  await cmd.fill('dispatch 1');
  await cmd.press('Enter');
  await expect(page.getByText(/only valid from READY/)).toBeVisible();
});

test('resources library filters and remembers saved items', async ({ page }) => {
  await page.goto('/resources');
  await page.getByRole('tab', { name: 'Videos' }).click();
  await expect(page.getByText('3 resources')).toBeVisible();
  await page.getByRole('tab', { name: 'All' }).click();
  const first = page.locator('main ul.divide-y > li').first();
  await first.getByRole('button', { name: 'Save' }).click();
  await page.getByLabel('Saved').check();
  await expect(page.getByText('1 resource')).toBeVisible();
  await page.reload();
  await page.getByLabel('Saved').check();
  await expect(page.getByText('1 resource')).toBeVisible();
});
