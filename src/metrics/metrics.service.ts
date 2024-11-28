import { Inject, Injectable } from '@nestjs/common';
import { Registry, Counter } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly requestCounter: Counter<string>;

  constructor(
    @Inject(Registry) private readonly registry: Registry, // Use the shared Registry
  ) {
    // Define custom metrics
    this.requestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Number of HTTP requests made',
      labelNames: ['method', 'status_code'],
    });
    // Register the metric explicitly
    this.registry.registerMetric(this.requestCounter);
  }

  incrementRequestCounter(method: string, statusCode: string): void {
    this.requestCounter.labels(method, statusCode).inc();
  }
}
