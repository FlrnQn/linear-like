export type ServiceStatus = 'ok' | 'error'

export interface HealthCheckResponse {
  status: ServiceStatus
  uptime: number
  timestamp: string
  services: {
    postgres: ServiceStatus
    redis: ServiceStatus
  }
}
