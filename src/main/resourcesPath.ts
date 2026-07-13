import path from 'node:path'
import { app } from 'electron'

/**
 * Resolves a subfolder under the app's bundled `resources/` directory, in both dev and packaged
 * builds. Dev/smoke-test: both electron-vite and `npm run smoke-test` launch Electron with the project
 * root as cwd, so process.cwd() is more reliable there than app.getAppPath() (which resolves relative
 * to the entry script once code is bundled, not the project root). Packaged: electron-builder copies
 * `resources/<subfolder>` to `resourcesPath/<subfolder>` via `extraResources`.
 */
export function resolveBundledResourceDir(subfolder: string): string {
  return app.isPackaged ? path.join(process.resourcesPath, subfolder) : path.join(process.cwd(), 'resources', subfolder)
}
