// ponytail: Start migration — AGENTS.md still says router.tsx is shim, but spec #13 requires getRouter for prerender
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export const getRouter = () => createRouter({ routeTree, scrollRestoration: true })
