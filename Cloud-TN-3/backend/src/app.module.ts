import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { CsrfModule } from './security/csrf/csrf.module';
import { RequestMetadataMiddleware } from './middleware/request-metadata.middleware';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

/**
 * Main App Module
 *
 * Registers global middleware and providers.
 */

@Module({
  imports: [
    // ... other modules
    CsrfModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestMetadataMiddleware) // Attach IP/UA/Geo to all requests
      .forRoutes('*');
  }
}
