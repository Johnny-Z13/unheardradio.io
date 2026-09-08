const RADIO_BROWSER_SERVERS = [
  'https://nl1.api.radio-browser.info',
  'https://de1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
] as const

export async function radioBrowserFetch(path: string, init?: RequestInit): Promise<Response> {
  let lastError: Error | null = null

  for (const server of RADIO_BROWSER_SERVERS) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const onAbort = () => controller.abort()
    init?.signal?.addEventListener('abort', onAbort, { once: true })
    try {
      if (init?.signal?.aborted) throw new Error('Request cancelled')
      const response = await fetch(`${server}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          'User-Agent': 'UnheardRadio/1.0',
          ...(init?.headers || {}),
        },
      })
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status} from ${server}`)
        continue
      }
      // Bound the body read too: a mirror may send headers and then stall.
      const body = await response.text()
      return new Response(body, { status: response.status, headers: response.headers })
    } catch (error) {
      if (init?.signal?.aborted) throw error
      lastError = error as Error
      continue
    } finally {
      clearTimeout(timer)
      init?.signal?.removeEventListener('abort', onAbort)
    }
  }

  throw lastError ?? new Error('All RadioBrowser mirrors failed')
}
