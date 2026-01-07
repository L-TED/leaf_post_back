import { DataSource } from 'typeorm';
import { Villagers } from '../../villagers/entities/villager.entity';

type VillagerSeedRow = Pick<Villagers, 'id' | 'name' | 'imageUrl'>;

const VILLAGERS: VillagerSeedRow[] = [
  {
    id: 1,
    name: '귀오미',
    imageUrl:
      'https://eksgppqzbktzdbnajkze.supabase.co/storage/v1/object/public/villager-image/1.png',
  },
  {
    id: 2,
    name: '리처드',
    imageUrl:
      'https://eksgppqzbktzdbnajkze.supabase.co/storage/v1/object/public/villager-image/2.png',
  },
  {
    id: 3,
    name: '비앙카',
    imageUrl:
      'https://eksgppqzbktzdbnajkze.supabase.co/storage/v1/object/public/villager-image/3.png',
  },
  {
    id: 4,
    name: '아폴로',
    imageUrl:
      'https://eksgppqzbktzdbnajkze.supabase.co/storage/v1/object/public/villager-image/4.png',
  },
  {
    id: 5,
    name: '애플',
    imageUrl:
      'https://eksgppqzbktzdbnajkze.supabase.co/storage/v1/object/public/villager-image/5.png',
  },
  {
    id: 6,
    name: '미첼',
    imageUrl:
      'https://eksgppqzbktzdbnajkze.supabase.co/storage/v1/object/public/villager-image/6.png',
  },
  {
    id: 7,
    name: '우락',
    imageUrl:
      'https://eksgppqzbktzdbnajkze.supabase.co/storage/v1/object/public/villager-image/7.png',
  },
  {
    id: 8,
    name: '만복이',
    imageUrl:
      'https://eksgppqzbktzdbnajkze.supabase.co/storage/v1/object/public/villager-image/8.png',
  },
];

export async function seedVillagers(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    const repo = queryRunner.manager.getRepository(Villagers);

    // Guard: if any row exists, do not insert again.
    const existingCount = await repo.count();
    if (existingCount > 0) {
      await queryRunner.rollbackTransaction();
      return {
        inserted: 0,
        skipped: VILLAGERS.length,
        reason: 'villagers 테이블에 이미 데이터가 존재합니다.',
      };
    }

    await repo.insert(VILLAGERS);

    // Keep sequence in sync for future inserts (safe even if seed is the only path).
    try {
      const seqRows = (await queryRunner.query(
        "SELECT pg_get_serial_sequence('public.villagers','id') AS seq",
      )) as Array<{ seq: string | null }>;

      const seq = seqRows?.[0]?.seq;
      if (seq) {
        await queryRunner.query(
          `SELECT setval('${seq}', (SELECT COALESCE(MAX(id), 0) FROM public.villagers))`,
        );
      }
    } catch {
      // If the PK isn't backed by a sequence (e.g., identity), ignore.
    }

    await queryRunner.commitTransaction();
    return { inserted: VILLAGERS.length, skipped: 0 };
  } catch (err) {
    try {
      await queryRunner.rollbackTransaction();
    } catch {
      // ignore
    }
    throw err;
  } finally {
    await queryRunner.release();
  }
}
