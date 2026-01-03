import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { CsrfService } from './csrf.service';
import { CsrfMiddleware } from './csrf.middleware';

/**
 * CSRF Module
 *
 * Provides CSRF service and middleware.
 * Middleware is applied to all routes except GET/HEAD/OPTIONS.
 */

@Module({
  providers: [
    CsrfService,
    CsrfMiddleware,
  ],
  exports: [
    CsrfService,
    CsrfMiddleware,
  ],
})
export class CsrfModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST }, // Login needs CSRF (usually), but if we are generating token on client fetch, we need it.
        // Note: For login, CSRF token can be retrieved via a GET /csrf endpoint first, or embedded in HTML.
        // To simplify, we'll enforce CSRF on all POST/PUT/PATCH/DELETE.
        // Exclusions should be explicit if needed.
      )
      .forRoutes('*');
  }
}
