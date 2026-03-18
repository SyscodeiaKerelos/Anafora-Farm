/**
 * One-time migration script to add `type` field to existing species documents.
 *
 * Usage:
 *   1. Production:  Run with Firebase CLI credentials
 *      $ cd functions && npm run migrate:species-type
 *
 *   2. Emulator:   Set FIRESTORE_EMULATOR_HOST before running
 *      $ FIRESTORE_EMULATOR_HOST=localhost:8080 npm run migrate:species-type
 *
 *   3. Manual:      Using a service account key
 *      $ GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npm run migrate:species-type
 */

import * as admin from 'firebase-admin';

const useEmulator = process.env.FIRESTORE_EMULATOR_HOST !== undefined;

if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
  admin.initializeApp({ projectId: 'demo-project' });
} else {
  admin.initializeApp();
}

const db = admin.firestore();

interface SpeciesDoc {
  nameEn?: string;
  nameAr?: string;
  type?: string;
  reproductionType?: string;
}

const PREDEFINED_SPECIES_TYPE_MAP: Record<string, string> = {
  Cow: 'animal',
  Bovine: 'animal',
  Goat: 'animal',
  Sheep: 'animal',
  Ewe: 'animal',
  Horse: 'animal',
  Chicken: 'bird',
  'H chickenn': 'bird',
  Broiler: 'bird',
  بقر: 'animal',
  ابقار: 'animal',
  ماعز: 'animal',
  ضأن: 'animal',
  خيل: 'animal',
  دجاج: 'bird',
  فراخ: 'bird',
  لاحم: 'bird',
};

export async function migrateSpecies(): Promise<void> {
  console.log('Starting species type migration...');

  const speciesRef = db.collection('species');
  const snapshot = await speciesRef.get();

  console.log(`Found ${snapshot.size} species documents`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const batch = db.batch();
  const batchSize = 100;
  let batchCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as SpeciesDoc;

    if (data.type) {
      skipped++;
      continue;
    }

    let inferredType: string;

    if (data.reproductionType === 'lays_egg') {
      inferredType = 'bird';
    } else if (data.reproductionType === 'gives_birth') {
      inferredType = 'animal';
    } else {
      inferredType =
        PREDEFINED_SPECIES_TYPE_MAP[data.nameEn ?? ''] ??
        PREDEFINED_SPECIES_TYPE_MAP[data.nameAr ?? ''] ??
        'animal';
    }

    batch.update(docSnap.ref, { type: inferredType });
    updated++;
    batchCount++;

    if (batchCount >= batchSize) {
      await batch.commit();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Migration complete:`);
  console.log(`  - Updated: ${updated}`);
  console.log(`  - Skipped (already had type): ${skipped}`);
  console.log(`  - Errors: ${errors}`);
}

migrateSpecies()
  .then(() => {
    console.log('Migration successful!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
