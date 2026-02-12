# Solana Stack Attack — Submission Fields

## 1. Problem Statement

Mobile games have billions of players but zero ownership. You grind for hours, spend real money on in-game currency, and walk away with nothing. Your progress, your purchases, your time — all locked inside a game that can shut down tomorrow.

Solana Stack Attack flips this: your game achievements become real token rewards in your wallet. No claims page, no bridging, no friction — hit a milestone, get tokens. The game proves that Solana Mobile can deliver seamless, real-value rewards without the player needing to understand blockchain at all.

## 2. Technical Approach

The app is a full-stack TypeScript monorepo running on **Bun** with three surfaces: a React Native mobile app (Expo), a web app (TanStack Start), and a shared Hono API server.

**Authentication** uses Sign In With Solana (SIWS) — a custom Better-Auth plugin that verifies a signed message from the player's wallet. No email, no password. The wallet *is* the account.

**Game state** is persisted server-side via oRPC (type-safe RPC) to a Turso/SQLite database using Drizzle ORM. Offline progression is calculated on reconnect based on elapsed time and upgrade levels.

**Token rewards** use Token-2022 (SPL) with on-chain metadata. When a player hits a milestone, the server mints STACK tokens directly to their wallet via a fee-payer keypair — the player pays zero gas. The fee payer is funded with devnet SOL.

**Mobile wallet integration** uses `@solana/kit` and `@wallet-ui/react-native-kit` with Mobile Wallet Adapter, supporting Seeker Wallet, Phantom, Solflare, and others natively on Android.

## 3. Target Audience

The first user is a **Solana Seeker owner** who wants to see what their device can do beyond holding tokens. They already have a wallet, they're crypto-curious, and they want a quick game that feels native — not a DeFi dashboard pretending to be fun.

Secondary audience: mobile gamers who don't know (or care) about crypto but notice that "oh, I got something in my wallet" after playing. The SIWS flow makes onboarding as easy as tapping "Connect."

## 4. Business Model

**Phase 1 (now):** Free game with token rewards funded by a treasury allocation. The token has no market value — it's a proof of concept for engagement-driven airdrops.

**Phase 2:** Introduce cosmetic upgrades purchasable with STACK tokens (burn mechanic). Partner with other Solana games/apps for cross-promotion rewards.

**Phase 3:** Token launch with DEX liquidity. Revenue from in-game purchases (cosmetics, boosts) with a percentage going to a rewards pool. Sustainable loop: players play → earn tokens → spend or trade → treasury replenishes from fees.

The key insight: the game doesn't need to sell tokens to make money. It needs to create engagement, and tokens are the hook.

## 5. Competitive Landscape

**Existing tap games (Hamster Kombat, Notcoin):** Telegram-based, no real mobile experience, centralized token distribution with delayed claims. Stack Attack is a native mobile app with instant on-chain rewards.

**Solana mobile games (Aurory, Star Atlas):** Complex, high-commitment games targeting hardcore gamers. Stack Attack is casual — 30-second sessions, no learning curve. Different market entirely.

**Other tap-to-earn:** Most are web-only, use custodial wallets, and delay token distribution. Stack Attack uses self-custody (Mobile Wallet Adapter) and instant airdrops. Your keys, your tokens, no waiting.

**Why we're better:** Native mobile experience + instant non-custodial rewards + zero gas for the player. Nobody else combines all three on Solana Mobile today.

## 6. Future Vision (6 months)

**Month 1-2:** Mainnet launch with real STACK token. Seasonal leaderboards with token prize pools. Anti-cheat system (server-side validation, rate limiting).

**Month 3-4:** Multiplayer mechanics — tap battles, guilds, cooperative milestones. NFT integration for rare cosmetics earned through gameplay. SDK for other games to plug into the STACK reward system.

**Month 5-6:** Open the reward engine as a platform. Any Solana mobile game can use our infrastructure to airdrop tokens on milestones. Stack Attack becomes the proof case; the real product is the "reward-as-a-service" layer for Solana Mobile.

The end game: every mobile game on Solana uses Stack Attack's rails to reward their players.
