declare global {
  const __ENVIRONMENT__: 'production' | 'staging' | 'testing' | undefined
  const __PLATFORM__: 'browser' | undefined
  const __VERSION__: string | undefined
}

export {}
