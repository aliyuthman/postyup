import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PhotoModule } from './photo/photo.module';
import { TemplateModule } from './template/template.module';
import { PosterModule } from './poster/poster.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PhotoModule,
    TemplateModule,
    PosterModule,
    AnalyticsModule,
  ],
})
export class AppModule {}