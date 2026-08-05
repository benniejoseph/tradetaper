// src/taper-ai/desk-task-queue.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudTasksClient } from '@google-cloud/tasks';

/**
 * Enqueues desk-run execution via Cloud Tasks instead of firing an unawaited
 * promise inside the request that created the run.
 *
 * Why: Cloud Run throttles CPU to near-zero once it considers the triggering
 * HTTP request "done". The desk pipeline takes ~2-3 minutes and used to run
 * as a fire-and-forget promise that kept executing after the response
 * returned — which only worked at all with `min-instances=1` and
 * `--no-cpu-throttling` set on the service, so the container would never be
 * torn down or CPU-starved mid-run. That configuration cost roughly $60-70/mo
 * for an always-on instance, most of it idle.
 *
 * Routing through Cloud Tasks means the entire pipeline runs INSIDE a normal
 * HTTP request/response cycle (see DeskInternalController) that Cloud Run
 * tracks and bills correctly — CPU is allocated for the request's actual
 * duration, and the service can scale to zero between runs.
 */
@Injectable()
export class DeskTaskQueueService {
  private readonly logger = new Logger(DeskTaskQueueService.name);
  private client: CloudTasksClient | null = null;

  constructor(private readonly config: ConfigService) {}

  private getClient(): CloudTasksClient {
    if (!this.client) this.client = new CloudTasksClient();
    return this.client;
  }

  private get project(): string {
    return this.config.get<string>('GCP_PROJECT_ID') || 'trade-taper';
  }

  private get location(): string {
    return this.config.get<string>('CLOUD_TASKS_LOCATION') || 'us-central1';
  }

  private get queueName(): string {
    return this.config.get<string>('CLOUD_TASKS_QUEUE') || 'desk-runs';
  }

  private get targetBaseUrl(): string {
    return (this.config.get<string>('DESK_INTERNAL_BASE_URL') || '').replace(/\/+$/, '');
  }

  private get internalSecret(): string {
    return this.config.get<string>('INTERNAL_TASK_SECRET') || '';
  }

  async enqueueRun(runId: string): Promise<void> {
    if (!this.targetBaseUrl || !this.internalSecret) {
      throw new Error(
        'DESK_INTERNAL_BASE_URL and INTERNAL_TASK_SECRET must be configured to enqueue desk runs',
      );
    }

    const parent = this.getClient().queuePath(
      this.project,
      this.location,
      this.queueName,
    );
    const url = `${this.targetBaseUrl}/api/v1/taper-ai/desk/internal/execute/${runId}`;

    await this.getClient().createTask({
      parent,
      task: {
        httpRequest: {
          httpMethod: 'POST',
          url,
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Task-Secret': this.internalSecret,
          },
          body: Buffer.from(JSON.stringify({ runId })).toString('base64'),
        },
        // The pipeline takes ~2-3 minutes; ceiling well above that so a slow
        // run isn't mistaken for a dead task and retried mid-flight.
        dispatchDeadline: { seconds: 1800 },
      },
    });

    this.logger.log(`Enqueued desk run ${runId} via Cloud Tasks`);
  }
}
