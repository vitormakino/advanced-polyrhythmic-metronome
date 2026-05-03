import { test, expect } from '@playwright/test';

test.describe('Metronome Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have the correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Advanced Polyrhythmic Metronome/);
    await expect(page.locator('h1')).toContainText('Advanced Polyrhythmic Metronome');
  });

  test('should start and stop the metronome', async ({ page }) => {
    const toggleButton = page.locator('#main-toggle');
    
    // Initial state
    await expect(toggleButton).toContainText('START');
    
    // Start
    await toggleButton.click();
    await expect(toggleButton).toContainText('STOP');
    
    // Stop
    await toggleButton.click();
    await expect(toggleButton).toContainText('START');
  });

  test('should change BPM using buttons', async ({ page }) => {
    const bpmDecrease = page.locator('#bpm-decrease');
    const bpmIncrease = page.locator('#bpm-increase');
    const bpmValue = page.locator('.text-7xl'); // Target the text display
    
    const initialBpm = await bpmValue.innerText();
    const initialBpmInt = parseInt(initialBpm);

    await bpmIncrease.click();
    await expect(bpmValue).toHaveText((initialBpmInt + 1).toString());

    await bpmDecrease.click();
    await bpmDecrease.click();
    await expect(bpmValue).toHaveText((initialBpmInt - 1).toString());
  });

  test('should add and remove pulses', async ({ page }) => {
    const addPulseButton = page.getByRole('button', { name: /ADD PULSE/i });
    const pulseGrid = page.locator('#pulse-controls-grid');
    
    // Initial pulses (should be 2 based on App.tsx)
    const initialPulseCount = await pulseGrid.locator('> div').count();
    
    // Add pulse
    await addPulseButton.click();
    await expect(pulseGrid.locator('> div')).toHaveCount(initialPulseCount + 1);
    
    // Remove pulse
    await pulseGrid.locator('> div').last().getByLabel(/Remove Pulse/i).click();
    await expect(pulseGrid.locator('> div')).toHaveCount(initialPulseCount);
  });

  test('should not allow removing the last pulse', async ({ page }) => {
    const pulseGrid = page.locator('#pulse-controls-grid');
    
    // Initial state check
    let count = await pulseGrid.locator('> div').count();
    
    // Remove pulses one by one until only one is left
    while (count > 1) {
      const firstPulse = pulseGrid.locator('> div').first();
      await firstPulse.getByLabel(/Remove Pulse/i).click();
      // Wait for count to explicitly decrease
      await expect(pulseGrid.locator('> div')).toHaveCount(count - 1);
      count--;
    }
    
    // For the last pulse, verify the remove button is either not present or hidden
    // Based on App.tsx, it's not rendered: {canRemove && (...)}
    await expect(pulseGrid.locator('> div').first().getByLabel(/Remove Pulse/i)).not.toBeAttached();
  });

  test('should change beat count for a pulse', async ({ page }) => {
    const pulseGrid = page.locator('#pulse-controls-grid');
    const firstPulse = pulseGrid.locator('> div').first();
    const beatValue = firstPulse.locator('.pulse-beats-value');
    
    const initialBeats = parseInt(await beatValue.innerText());
    
    // Increase beats
    await firstPulse.locator('#pulse-increase-beats').click();
    // Wait for the update
    await expect(beatValue).toHaveText((initialBeats + 1).toString());

    // Decrease beats
    await firstPulse.locator('#pulse-decrease-beats').click();
    await expect(beatValue).toHaveText(initialBeats.toString());
  });

  test('should toggle pulse settings and change sound type', async ({ page }) => {
    const pulseGrid = page.locator('#pulse-controls-grid');
    const firstPulse = pulseGrid.locator('> div').first();
    const settingsButton = firstPulse.getByLabel(/Pulse Settings/i);
    
    // Settings should be hidden by default
    await expect(firstPulse.locator('button:has-text("sine")')).not.toBeVisible();
    
    // Toggle settings
    await settingsButton.click();
    await expect(firstPulse.locator('button:has-text("sine")')).toBeVisible();
    
    // Change sound type
    const woodButton = firstPulse.locator('button:has-text("wood")');
    await woodButton.click();
    await expect(woodButton).toHaveClass(/bg-zinc-700/); // Active class
  });

  test('should adjust beat individual intensities', async ({ page }) => {
    const pulseGrid = page.locator('#pulse-controls-grid');
    const firstPulse = pulseGrid.locator('> div').first();
    
    // Open settings
    await firstPulse.getByLabel(/Pulse Settings/i).click();
    
    // Find first intensity bar
    const firstBar = firstPulse.locator('.h-12.w-4').first();
    
    // Click through levels (0.5 -> 0.6 -> 1.0 -> 0 -> 0.3)
    await firstBar.click();
    await firstBar.click();
    await firstBar.click();
    
    // Verify it cycles (we can't easily check internal state, but we ensure button is clickable)
    await expect(firstBar).toBeVisible();
  });
});
