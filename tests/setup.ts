import { afterEach, beforeEach } from 'vitest'
import { config } from '@vue/test-utils'

config.global.stubs = {
  RouterLink: { template: '<a><slot /></a>' },
}

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())
