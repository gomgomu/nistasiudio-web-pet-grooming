import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { appConfig, databaseConfig, redisConfig, authConfig } from './config/configuration';
import { validate } from './config/config.validation';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { TenantsModule } from './tenants/tenants.module';
import { BranchesModule } from './branches/branches.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { PetsModule } from './pets/pets.module';
import { ServicesModule } from './services/services.module';
import { StaffModule } from './staff/staff.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { GroomingModule } from './grooming/grooming.module';
import { PosModule } from './pos/pos.module';
import { InventoryModule } from './inventory/inventory.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LineModule } from './line/line.module';
import { SearchModule } from './search/search.module';
import { RetentionModule } from './retention/retention.module';
import { ReportsModule } from './reports/reports.module';
import { ClinicalModule } from './clinical/clinical.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { SaaSAdminModule } from './saas-admin/saas-admin.module';
import { UsageMeteringModule } from './usage-metering/usage-metering.module';
import { SecurityModule } from './security/security.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, authConfig],
      validate,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    TenantsModule,
    BranchesModule,
    UsersModule,
    AuthModule,
    CustomersModule,
    PetsModule,
    ServicesModule,
    StaffModule,
    SchedulesModule,
    AppointmentsModule,
    GroomingModule,
    ClinicalModule,
    PosModule,
    InventoryModule,
    NotificationsModule,
    LineModule,
    SearchModule,
    RetentionModule,
    ReportsModule,
    SubscriptionsModule,
    FeatureFlagsModule,
    SaaSAdminModule,
    UsageMeteringModule,
    SecurityModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
