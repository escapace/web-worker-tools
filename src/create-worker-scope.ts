/* eslint-disable typescript/no-explicit-any */

declare let self: DedicatedWorkerGlobalScope

type Listener = (event: unknown) => void

class WorkerFallback<T extends DedicatedWorkerGlobalScope | Worker = Worker> {
  listeners: Listener[]

  private readonly listenersTarget: WorkerFallback<T>['listeners']

  constructor(
    listenersSource: WorkerFallback<T>['listeners'],
    listenersTarget: WorkerFallback<T>['listeners'],
  ) {
    this.listenersTarget = listenersTarget
    this.listeners = listenersSource
  }

  public postMessage: T['postMessage'] = (message: unknown) => {
    this.listenersTarget.forEach((listener) => void listener({ data: message }))
  }

  public addEventListener: T['addEventListener'] = (type: string, listener: any) => {
    if (type === 'message' && !this.listeners.includes(listener as Listener)) {
      this.listeners.push(listener as Listener)
    }
  }

  public removeEventListener: T['removeEventListener'] = (type: string, listener: any) => {
    if (type === 'message') {
      const index = this.listeners.indexOf(listener as Listener)

      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }
}

export type { WorkerFallback }
export type DedicatedWorkerGlobalScopeFallback = WorkerFallback<DedicatedWorkerGlobalScope>
export type WorkerScope =
  | {
      fallback: false
      scope: DedicatedWorkerGlobalScope
    }
  | {
      fallback: true
      scope: DedicatedWorkerGlobalScopeFallback
    }

export const isDedicatedWorkerGlobalScope = () => {
  const scope = globalThis[
    Symbol.toStringTag as unknown as keyof typeof globalThis
  ] as unknown as string

  return scope === 'DedicatedWorkerGlobalScope'
}

export function createWorkerScope(
  createWorker: (scope: WorkerScope) => void,
): WorkerFallback | undefined {
  const fallback = !isDedicatedWorkerGlobalScope()

  if (fallback) {
    const workerListeners: Listener[] = []
    const workerScopeListeners: Listener[] = []

    const worker = new WorkerFallback<Worker>(workerListeners, workerScopeListeners)
    const scope = new WorkerFallback<DedicatedWorkerGlobalScope>(
      workerScopeListeners,
      workerListeners,
    )

    createWorker({
      fallback,
      scope,
    })

    return worker
  } else {
    createWorker({
      fallback,
      scope: self,
    })

    return
  }
}
