import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PhotoModule } from './photo/photo.module';
import { TemplateModule } from './template/template.module';
import { PosterModule } from './poster/poster.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),
    PhotoModule,
    TemplateModule,
    PosterModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}