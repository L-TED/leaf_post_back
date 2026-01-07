import { AppDataSource } from '../data-source';
import { seedVillagers } from './villagers.seed';
import { seedVillagerTones } from './villager-tone.seed';

async function runSeeds() {
  let initialized = false;

  try {
    await AppDataSource.initialize();
    initialized = true;

    console.log('[seed] DataSource initialized');

    const villagersResult = await seedVillagers(AppDataSource);
    console.log('[seed] villagers:', villagersResult);

    const villagerTonesResult = await seedVillagerTones(AppDataSource);
    console.log('[seed] villager_tones:', villagerTonesResult);

    console.log('[seed] done');
  } catch (err) {
    console.error('[seed] failed:', err);
    process.exitCode = 1;
  } finally {
    if (initialized) {
      try {
        await AppDataSource.destroy();
        console.log('[seed] DataSource destroyed');
      } catch (err) {
        console.error('[seed] DataSource destroy failed:', err);
        process.exitCode = 1;
      }
    }
  }
}

void runSeeds();
