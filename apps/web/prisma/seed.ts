/**
 * Prisma Seed Script
 *
 * Creates initial development data for local testing.
 * Run with: npx prisma db seed
 */
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo streamer user
  const streamer = await prisma.user.upsert({
    where: { discordId: "000000000000000001" },
    update: {},
    create: {
      discordId: "000000000000000001",
      discordName: "デモ配信者",
      nickname: "デモ配信者",
    },
  });
  console.log(`✅ Created streamer: ${streamer.discordName}`);

  // Create demo viewer user
  const viewer = await prisma.user.upsert({
    where: { discordId: "000000000000000002" },
    update: {},
    create: {
      discordId: "000000000000000002",
      discordName: "デモ視聴者",
      nickname: "デモ視聴者",
    },
  });
  console.log(`✅ Created viewer: ${viewer.discordName}`);

  // Create demo room
  const room = await prisma.room.upsert({
    where: { id: "demo-room-001" },
    update: {},
    create: {
      id: "demo-room-001",
      ownerId: streamer.id,
      name: "デモ配信者のルーム",
      displayNameMode: "nickname",
      approvalRequired: true,
    },
  });
  console.log(`✅ Created room: ${room.name}`);

  // Create demo session with passphrase
  const sessionWithPassphrase = await prisma.session.upsert({
    where: { code: "ABC123" },
    update: {},
    create: {
      roomId: room.id,
      code: "ABC123",
      passphrase: "waku",
      passphraseRequired: true,
      state: "working",
      declaration: "MVPの動作確認をしています",
    },
  });
  console.log(
    `✅ Created session: ${sessionWithPassphrase.code} (passphrase: waku)`,
  );

  // Create demo session without passphrase
  const sessionNoPassphrase = await prisma.session.upsert({
    where: { code: "XYZ789" },
    update: {},
    create: {
      roomId: room.id,
      code: "XYZ789",
      passphrase: "",
      passphraseRequired: false,
      state: "working",
      declaration: "誰でも参加できるセッション",
    },
  });
  console.log(
    `✅ Created session: ${sessionNoPassphrase.code} (no passphrase)`,
  );

  console.log("");
  console.log("🎉 Seed completed!");
  console.log("");
  console.log("📋 Test accounts:");
  console.log(`   Streamer Discord ID: ${streamer.discordId}`);
  console.log(`   Viewer Discord ID: ${viewer.discordId}`);
  console.log("");
  console.log("📋 Test sessions:");
  console.log("   ABC123 (passphrase: waku)");
  console.log("   XYZ789 (no passphrase)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
