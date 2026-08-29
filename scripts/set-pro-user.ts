import { createAdminClient } from '@insforge/sdk';

/**
 * Script to grant Pro status to any user account directly in the database,
 * without going through Stripe checkout.
 *
 * Usage:
 *   bun run scripts/set-pro-user.ts <email-or-userId-or-all> [plan: yearly|monthly]
 *
 * Examples:
 *   bun run make-pro 73e27390-e7dc-4a44-9ad1-7f10f2f48544
 *   bun run make-pro all
 */

const target = process.argv[2]?.trim();
const planArg = (process.argv[3]?.trim().toLowerCase() as 'monthly' | 'yearly') || 'yearly';

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const adminKey = process.env.INSFORGE_ADMIN_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!baseUrl || !adminKey) {
  console.error('\x1b[31mError:\x1b[0m NEXT_PUBLIC_INSFORGE_URL and INSFORGE_ADMIN_KEY must be set in .env.local.');
  process.exit(1);
}

const client = createAdminClient({ baseUrl, apiKey: adminKey });

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function upgradeUser(userId: string) {
  const now = new Date().toISOString();
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 50); // 50 years pro access

  const record = {
    user_id: userId,
    plan: planArg,
    billing_interval: planArg === 'yearly' ? 'year' : 'month',
    status: 'active',
    current_period_start: now,
    current_period_end: futureDate.toISOString(),
    cancel_at_period_end: false,
    updated_at: now,
  };

  // Check if record exists
  const { data: existing } = await client.database
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (existing && existing.length > 0) {
    const { error: updateErr } = await client.database
      .from('subscriptions')
      .update(record)
      .eq('user_id', userId);

    if (updateErr) {
      throw new Error(`Failed to update subscription for ${userId}: ${updateErr.message}`);
    }
  } else {
    const { error: insertErr } = await client.database
      .from('subscriptions')
      .insert([{ ...record, created_at: now }]);

    if (insertErr) {
      throw new Error(`Failed to insert subscription for ${userId}: ${insertErr.message}`);
    }
  }

  console.log(`\x1b[32m✔ SUCCESS!\x1b[0m User \x1b[1m${userId}\x1b[0m is now a \x1b[1m\x1b[32mPRO (${planArg.toUpperCase()})\x1b[0m user! 🎉`);
  console.log(`  • Unlimited Projects: \x1b[32mEnabled\x1b[0m`);
  console.log(`  • Shopify Theme ZIP Export: \x1b[32mUnlocked\x1b[0m`);
  console.log(`  • Expiration: \x1b[32m${futureDate.toLocaleDateString()}\x1b[0m\n`);
}

async function main() {
  console.log(`\x1b[36m[Pro Upgrade]\x1b[0m Checking user records in database...`);

  // Fetch all user IDs from existing projects and subscriptions
  const [{ data: projects }, { data: subs }] = await Promise.all([
    client.database.from('projects').select('user_id, name').limit(100),
    client.database.from('subscriptions').select('user_id, plan, status').limit(100),
  ]);

  const userIdsFromProjects = Array.from(
    new Set((projects ?? []).map((p: { user_id?: string }) => p.user_id).filter(Boolean))
  ) as string[];

  const userIdsFromSubs = Array.from(
    new Set((subs ?? []).map((s: { user_id?: string }) => s.user_id).filter(Boolean))
  ) as string[];

  const allDiscoveredUserIds = Array.from(new Set([...userIdsFromProjects, ...userIdsFromSubs]));

  if (!target || target === 'all') {
    if (allDiscoveredUserIds.length === 0) {
      console.error('\x1b[31mNo users found in database.\x1b[0m Please sign in or create a project first.');
      process.exit(1);
    }

    console.log(`Found ${allDiscoveredUserIds.length} user account(s) in database. Upgrading all to Pro...`);
    for (const uid of allDiscoveredUserIds) {
      await upgradeUser(uid);
    }
    return;
  }

  // If target is a valid UUID
  if (UUID_REGEX.test(target)) {
    await upgradeUser(target);
    return;
  }

  // If target is an email or name
  console.log(`Target provided: "${target}" (not a direct UUID).`);

  if (allDiscoveredUserIds.length === 1) {
    const singleUserId = allDiscoveredUserIds[0];
    console.log(`\x1b[33mMatching to single active user in database:\x1b[0m ${singleUserId}`);
    await upgradeUser(singleUserId);
    return;
  }

  if (allDiscoveredUserIds.length > 1) {
    console.log(`\n\x1b[36mMultiple user accounts found in database:\x1b[0m`);
    allDiscoveredUserIds.forEach((uid, index) => {
      console.log(`  [${index + 1}] ${uid}`);
    });
    console.log(`\nTo upgrade all of them, run: \x1b[1mbun run make-pro all\x1b[0m`);
    console.log(`Or specify the UUID: \x1b[1mbun run make-pro <USER_UUID>\x1b[0m\n`);
    process.exit(1);
  }

  console.error(`\x1b[31mError:\x1b[0m Could not resolve UUID for "${target}".`);
  console.log(`Tip: Run \x1b[1mbun run make-pro all\x1b[0m or pass your User UUID directly.`);
  process.exit(1);
}

main().catch((err) => {
  console.error('\n\x1b[31m[Pro Upgrade Failed]:\x1b[0m', err.message || err);
  process.exit(1);
});
