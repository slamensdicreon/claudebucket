import type { CrowdmindApi } from './index'

declare global {
  interface Window {
    crowdmind: CrowdmindApi
  }
}
