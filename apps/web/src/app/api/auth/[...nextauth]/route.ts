/**
 * NextAuth.js API Route Handler
 *
 * Handles all /api/auth/* routes for Discord OAuth
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
