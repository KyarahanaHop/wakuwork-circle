/**
 * NextAuth.js v5 Configuration for WakuWork Circle
 * OAuth: Discord only (MVP)
 *
 * See: docs/ssot/decisions.md D-006, D-007
 */
import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

// Allowlist for streamers (D-007)
const ALLOWED_STREAMER_IDS = (process.env.ALLOWED_STREAMER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist Discord ID and streamer status in the token
      if (account?.provider === "discord" && profile) {
        const discordProfile = profile as { id: string; username: string };
        token.discordId = discordProfile.id;
        token.discordName = discordProfile.username;
        token.isStreamer = ALLOWED_STREAMER_IDS.includes(discordProfile.id);
      }
      return token;
    },
    async session({ session, token }) {
      // Expose custom fields in session
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub as string, // Use JWT sub as temporary ID (will be replaced with DB ID)
          discordId: token.discordId as string,
          discordName: token.discordName as string,
          isStreamer: token.isStreamer as boolean,
        },
      };
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
});

// Type augmentation for custom session fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      discordId: string;
      discordName: string;
      isStreamer: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface JWT {
    userId?: string;
    discordId?: string;
    discordName?: string;
    isStreamer?: boolean;
  }
}

// Helper function to check if user is a streamer
export function isStreamer(discordId: string): boolean {
  return ALLOWED_STREAMER_IDS.includes(discordId);
}

// Export allowlist for other modules
export { ALLOWED_STREAMER_IDS };
