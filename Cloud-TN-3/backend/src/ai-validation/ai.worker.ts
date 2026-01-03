import { Injectable, OnModuleInit } from '@nestjs/common';
import { AiQueueService } from './ai-queue.service';

@Injectable()
export class AiWorker implements OnModuleInit {
  constructor(private readonly queue: AiQueueService) {}

  onModuleInit() {
    // Worker lives inside application; queue processing starts lazily on enqueue.
    // Hook exists to ensure provider is instantiated.
  }
}
