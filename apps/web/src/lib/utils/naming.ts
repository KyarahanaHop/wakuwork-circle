/**
 * Naming Utilities
 *
 * Generates session codes and display names.
 *
 * See: docs/ssot/core.md Section 4.3 (Animal name generation)
 */

// =============================================================================
// Session Code Generation
// =============================================================================

/**
 * Generate a unique 6-character session code
 * Format: ABC123 (3 letters + 3 digits)
 */
export function generateSessionCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Exclude I, O to avoid confusion
  const digits = "0123456789";

  let code = "";
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 3; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }

  return code;
}

// =============================================================================
// Animal Name Generation
// =============================================================================

// Japanese animal names (cute/friendly selection)
const ANIMALS = [
  "うさぎ",
  "ねこ",
  "いぬ",
  "くま",
  "パンダ",
  "ペンギン",
  "きつね",
  "たぬき",
  "ハムスター",
  "リス",
  "コアラ",
  "アルパカ",
  "ひつじ",
  "やぎ",
  "しか",
  "フクロウ",
  "インコ",
  "カメレオン",
  "カワウソ",
  "ラッコ",
  "アザラシ",
  "イルカ",
  "くじら",
  "カピバラ",
  "レッサーパンダ",
  "ハリネズミ",
  "モモンガ",
  "フェレット",
  "チンチラ",
  "うさぎ",
  "フラミンゴ",
  "ペリカン",
  "カモメ",
  "スズメ",
  "メジロ",
  "シマエナガ",
  "カワセミ",
  "ツバメ",
  "ハト",
  "カラス",
];

// Adjectives for animal names
const ADJECTIVES = [
  "げんき",
  "のんびり",
  "ふわふわ",
  "もふもふ",
  "すやすや",
  "きらきら",
  "にこにこ",
  "ぽかぽか",
  "わくわく",
  "どきどき",
  "ほんわか",
  "さらさら",
  "つやつや",
  "ぴかぴか",
  "もぐもぐ",
  "ゆらゆら",
  "ころころ",
  "ふかふか",
  "しっとり",
  "まったり",
];

/**
 * Generate a deterministic animal name from userId + sessionId
 * Same user in same session always gets the same name.
 * Different session = different name.
 */
export function generateAnimalName(userId: string, sessionId: string): string {
  // Simple hash function
  const hash = simpleHash(userId + sessionId);

  const adjIndex = hash % ADJECTIVES.length;
  const animalIndex = Math.floor(hash / ADJECTIVES.length) % ANIMALS.length;

  return `${ADJECTIVES[adjIndex]}${ANIMALS[animalIndex]}`;
}

/**
 * Simple string hash function (djb2)
 */
function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash >>> 0; // Convert to unsigned 32-bit integer
  }
  return hash;
}

// =============================================================================
// Passphrase Validation
// =============================================================================

/**
 * Validate passphrase format
 * - Min 2 characters
 * - Max 20 characters
 * - No spaces at start/end
 */
export function validatePassphrase(passphrase: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = passphrase.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: "合言葉は2文字以上で設定してください" };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: "合言葉は20文字以内で設定してください" };
  }

  return { valid: true };
}
