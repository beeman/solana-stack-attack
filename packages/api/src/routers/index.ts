import type { RouterClient } from '@orpc/server'
import { gameRouter } from '../features/game'
import { protectedProcedure, publicProcedure } from '../index'
import { feePayerRouter } from './fee-payer'
import { solanaRouter } from './solana'
import { todoRouter } from './todo'

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return 'OK'
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: 'This is private',
      user: context.session?.user,
    }
  }),
  feePayer: feePayerRouter,
  game: gameRouter,
  todo: todoRouter,
  solana: solanaRouter,
}
export type AppRouter = typeof appRouter
export type AppRouterClient = RouterClient<typeof appRouter>
