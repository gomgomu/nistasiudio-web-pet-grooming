// PetFlow Core Types

export type UserRole =
  | 'SUPER_ADMIN'
  | 'TENANT_OWNER'
  | 'TENANT_ADMIN'
  | 'BRANCH_MANAGER'
  | 'VETERINARIAN'
  | 'GROOMER'
  | 'RECEPTIONIST'
  | 'STAFF';

export type StaffType =
  | 'VETERINARIAN'
  | 'GROOMER'
  | 'VET_ASSISTANT'
  | 'RECEPTIONIST'
  | 'BRANCH_MANAGER'
  | 'GENERAL_STAFF';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type LeaveType = 'VACATION' | 'SICK' | 'PERSONAL' | 'OTHER';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type PetSpecies = 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'OTHER';
export type PetGender = 'MALE' | 'FEMALE' | 'UNKNOWN';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AppointmentSource =
  | 'WALK_IN'
  | 'PHONE'
  | 'LINE'
  | 'ONLINE_BOOKING'
  | 'OTHER';

export type GroomingQueueStatus =
  | 'WAITING'
  | 'BATHING'
  | 'DRYING'
  | 'GROOMING'
  | 'FINISHING'
  | 'READY'
  | 'PICKED_UP'
  | 'CANCELLED';

export type InvoiceStatus =
  | 'DRAFT'
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'VOID';

export type InvoiceItemType =
  | 'SERVICE'
  | 'PRODUCT'
  | 'MEDICATION'
  | 'CUSTOM';

export type PaymentMethodType =
  | 'CASH'
  | 'PROMPTPAY'
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'OTHER';

export type PaymentMethod = PaymentMethodType;

export type InventoryMovementType =
  | 'IN'
  | 'OUT'
  | 'ADJUSTMENT'
  | 'TRANSFER'
  | 'CONSUMPTION'
  | 'WASTE';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantScopedEntity extends BaseEntity {
  tenantId: string;
}

export interface BranchScopedEntity extends TenantScopedEntity {
  branchId: string;
}

export interface Tenant extends BaseEntity {
  name: string;
  slug: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export interface Branch extends TenantScopedEntity {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

export interface StaffProfile extends TenantScopedEntity {
  userId: string;
  nickname?: string;
  staffType: StaffType;
  specialties: string[];
  licenseNumber?: string;
  bio?: string;
  colorCode?: string;
  avatarUrl?: string;
  isBookable: boolean;
}

export interface User extends TenantScopedEntity {
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  branchIds: string[];
  staffProfile?: StaffProfile;
}

export interface Customer extends TenantScopedEntity {
  firstName: string;
  lastName: string;
  phone: string;
  lineId?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface Pet extends TenantScopedEntity {
  customerId: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  gender: PetGender;
  birthDate?: string;
  weightKg?: number;
  microchipNumber?: string;
  allergies?: string[];
  specialNotes?: string;
  photoUrl?: string;
}

export interface ServiceCategory extends TenantScopedEntity {
  name: string;
}

export interface ServicePriceRule extends TenantScopedEntity {
  serviceId: string;
  species: PetSpecies;
  name?: string;
  minWeight?: number;
  maxWeight?: number;
  priceMinor: number;
  durationMinutes?: number;
  isActive: boolean;
}

export interface PriceCalculationResult {
  serviceId: string;
  serviceName: string;
  appliedRuleId?: string;
  appliedRuleName?: string;
  isRuleApplied: boolean;
  species: PetSpecies;
  weightKg?: number;
  finalPriceMinor: number;
  durationMinutes: number;
}

export interface Service extends TenantScopedEntity {
  branchId?: string;
  categoryId?: string;
  name: string;
  category: string;
  durationMinutes: number;
  basePriceMinor: number;
  isActive: boolean;
  priceRules?: ServicePriceRule[];
}

export interface StaffSchedule extends TenantScopedEntity {
  userId: string;
  branchId?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  isActive: boolean;
}

export interface StaffLeave extends TenantScopedEntity {
  userId: string;
  leaveType: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface BlockedTime extends TenantScopedEntity {
  branchId?: string;
  userId?: string;
  title: string;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  notes?: string;
}

export interface Appointment extends BranchScopedEntity {
  customerId: string;
  petId: string;
  serviceId: string;
  staffId?: string;
  createdById?: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  priceMinor?: number;
  notes?: string;
  cancellationReason?: string;
  checkedInAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export type BookingConflictType =
  | 'STAFF_DOUBLE_BOOKED'
  | 'STAFF_UNAVAILABLE'
  | 'STAFF_ON_BREAK'
  | 'STAFF_ON_LEAVE'
  | 'BLOCKED_SLOT'
  | 'PET_DOUBLE_BOOKED'
  | 'BRANCH_UNAVAILABLE'
  | 'INVALID_TIME';

export interface BookingValidationResult {
  isValid: boolean;
  conflictType?: BookingConflictType;
  conflictReason?: string;
  conflictingEntityId?: string;
}

export interface AvailableSlot {
  startAt: string;
  endAt: string;
  staffId?: string;
  staffName?: string;
}

export interface GroomingProfile extends TenantScopedEntity {
  petId: string;
  preferredCut?: string;
  shampoo?: string;
  warnings?: string;
  behaviorNotes?: string;
  preferredGroomerId?: string;
  specialHandling?: string;
}

export type GroomingPhotoType =
  | 'BEFORE'
  | 'AFTER'
  | 'INJURY_PRE_EXISTING'
  | 'PROGRESS';

export interface GroomingPhoto extends TenantScopedEntity {
  queueItemId: string;
  type: GroomingPhotoType;
  photoUrl: string;
  caption?: string;
  uploadedAt: string;
}

export interface GroomingQueueItem extends BranchScopedEntity {
  customerId: string;
  petId: string;
  serviceId: string;
  appointmentId?: string;
  groomerId?: string;
  queueNumber: number;
  status: GroomingQueueStatus;
  specialCareNotes?: string;
  weightKg?: number;
  estimatedDurationMinutes: number;
  actualDurationMinutes?: number;
  priceMinor?: number;
  startedAt?: string;
  bathingStartedAt?: string;
  dryingStartedAt?: string;
  groomingStartedAt?: string;
  finishingStartedAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  photos?: GroomingPhoto[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemType: InvoiceItemType;
  serviceId?: string;
  productId?: string;
  staffId?: string;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  discountMinor: number;
  taxRate: number;
  totalMinor: number;
  createdAt: string;
}

export interface Payment extends BranchScopedEntity {
  invoiceId: string;
  method: PaymentMethodType;
  amountMinor: number;
  receivedAmountMinor?: number;
  changeMinor?: number;
  reference?: string;
  notes?: string;
  recordedById?: string;
  paidAt: string;
}

export interface Invoice extends BranchScopedEntity {
  customerId: string;
  petId?: string;
  appointmentId?: string;
  queueItemId?: string;
  clinicVisitId?: string;
  invoiceNo: string;
  status: InvoiceStatus;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  paidAmountMinor: number;
  notes?: string;
  issuedById?: string;
  paidAt?: string;
  voidedAt?: string;
  voidReason?: string;
  issuedAt: string;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export type InventoryTransactionType =
  | 'IN'
  | 'OUT'
  | 'ADJUSTMENT'
  | 'TRANSFER'
  | 'CONSUMPTION'
  | 'WASTE';

export interface ProductCategory extends TenantScopedEntity {
  name: string;
}

export interface Product extends TenantScopedEntity {
  categoryId?: string;
  sku: string;
  barcode?: string;
  name: string;
  category: string;
  unit: string;
  costMinor: number;
  salePriceMinor: number;
  taxRate: number;
  reorderPoint: number;
  description?: string;
  isPrescriptionOnly: boolean;
  isActive: boolean;
  productCategory?: ProductCategory;
  currentStock?: number;
}

export interface InventoryTransaction extends BranchScopedEntity {
  productId: string;
  type: InventoryTransactionType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  product?: Product;
}

export interface Supplier extends TenantScopedEntity {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface ProductLot extends BranchScopedEntity {
  productId: string;
  lotNumber: string;
  mfgDate?: string;
  expDate: string;
  initialQuantity: number;
  currentQuantity: number;
  notes?: string;
  product?: Product;
}

export type StockAlertSeverity = 'OUT_OF_STOCK' | 'CRITICAL_LOW' | 'LOW_STOCK' | 'HEALTHY';
export type ExpiryAlertSeverity = 'EXPIRED' | 'EXPIRING_CRITICAL' | 'EXPIRING_WARNING' | 'VALID';

export interface LowStockAlert {
  productId: string;
  sku: string;
  barcode?: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderPoint: number;
  deficit: number;
  suggestedReorderQuantity: number;
  severity: StockAlertSeverity;
  branchId: string;
  branchName?: string;
}

export interface ExpiryAlert {
  lotId: string;
  productId: string;
  sku: string;
  productName: string;
  lotNumber: string;
  expDate: string;
  daysRemaining: number;
  currentQuantity: number;
  unit: string;
  isPrescriptionOnly: boolean;
  severity: ExpiryAlertSeverity;
  branchId: string;
  branchName?: string;
}

export interface StockAlertSummary {
  outOfStockCount: number;
  criticalLowStockCount: number;
  lowStockCount: number;
  expiredLotsCount: number;
  expiringSoonLotsCount: number;
  totalAlerts: number;
}

export interface ProductCostSummary {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  category: string;
  masterCostMinor: number;
  movingAverageCostMinor: number;
  latestPurchaseCostMinor: number;
  salePriceMinor: number;
  unitGrossProfitMinor: number;
  grossMarginPercent: number;
  totalStockQuantity: number;
  totalValuationMinor: number;
}

export interface InventoryValuationItem {
  productId: string;
  sku: string;
  barcode?: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  unitCostMinor: number;
  salePriceMinor: number;
  totalValuationMinor: number;
  potentialRevenueMinor: number;
  potentialProfitMinor: number;
  grossMarginPercent: number;
  costingMethod: 'MOVING_AVERAGE' | 'LATEST_COST' | 'MASTER_COST';
}

export interface InventoryValuationReport {
  items: InventoryValuationItem[];
  summary: {
    totalProductCount: number;
    totalStockQuantity: number;
    totalValuationMinor: number;
    totalPotentialRevenueMinor: number;
    totalPotentialGrossProfitMinor: number;
    overallGrossMarginPercent: number;
    costingMethod: 'MOVING_AVERAGE' | 'LATEST_COST' | 'MASTER_COST';
  };
}

export interface ProductProfitabilityItem {
  productId: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  unitsSold: number;
  totalRevenueMinor: number;
  totalCogsMinor: number;
  grossProfitMinor: number;
  grossMarginPercent: number;
}

export type NotificationChannel = 'LINE' | 'SMS' | 'EMAIL' | 'IN_APP';

export type NotificationType =
  | 'APPOINTMENT_REMINDER'
  | 'GROOMING_READY'
  | 'GROOMING_STATUS_UPDATE'
  | 'VACCINE_REMINDER'
  | 'INVOICE_RECEIPT'
  | 'FOLLOW_UP'
  | 'MARKETING_CAMPAIGN'
  | 'SYSTEM_ALERT';

export type NotificationStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface Notification extends TenantScopedEntity {
  customerId: string;
  appointmentId?: string;
  channel: NotificationChannel;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
  error?: string;
  retryCount: number;
  scheduledAt: string;
  sentAt?: string;
}

export interface NotificationTemplate extends TenantScopedEntity {
  code: string;
  name: string;
  channel: NotificationChannel;
  type: NotificationType;
  title: string;
  content: string;
  lineFlexJson?: Record<string, unknown>;
  isActive: boolean;
}

export interface NotificationPreference extends TenantScopedEntity {
  customerId: string;
  allowLine: boolean;
  allowSms: boolean;
  allowEmail: boolean;
  allowMarketing: boolean;
  allowReminders: boolean;
}

// -----------------------------------------------------------------------------
// Retention & Customer Segmentation (PF-050)
// -----------------------------------------------------------------------------

export type CustomerSegment = 'NEW' | 'ACTIVE' | 'AT_RISK' | 'LOST' | 'VIP';

export interface CustomerSegmentationCriteria {
  newDaysThreshold?: number; // default: 30 days
  activeDaysThreshold?: number; // default: 60 days
  atRiskDaysThreshold?: number; // default: 120 days
  vipMinSpendMinor?: number; // default: 10,000 THB (1,000,000 satang)
  vipMinVisits?: number; // default: 5 visits
}

export interface CustomerSegmentSummary {
  segment: CustomerSegment;
  nameThai: string;
  count: number;
  percentage: number;
  totalRevenueMinor: number;
  averageTicketMinor: number;
  averageVisits: number;
  description: string;
}

export interface RetentionOverview {
  totalCustomers: number;
  totalRevenueMinor: number;
  segments: Record<CustomerSegment, CustomerSegmentSummary>;
  criteria: Required<CustomerSegmentationCriteria>;
  calculatedAt: string;
}

export interface SegmentedCustomerItem {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email?: string | null;
  lineUserId?: string | null;
  marketingStatus: 'OPTED_IN' | 'OPTED_OUT' | 'PENDING';
  segment: CustomerSegment;
  segmentReason: string;
  registeredAt: string;
  daysSinceRegistration: number;
  lastVisitAt?: string | null;
  daysSinceLastVisit?: number | null;
  totalVisits: number;
  totalSpentMinor: number;
  averageTicketMinor: number;
  petCount: number;
  pets: {
    id: string;
    name: string;
    species: PetSpecies;
    breed?: string | null;
  }[];
}

export interface CustomerSegmentDetailResponse extends SegmentedCustomerItem {
  recentAppointments: {
    id: string;
    startAt: string;
    serviceName: string;
    status: AppointmentStatus;
  }[];
  recentInvoices: {
    id: string;
    invoiceNo: string;
    totalMinor: number;
    paidAt?: string | null;
    status: InvoiceStatus;
  }[];
}

// -----------------------------------------------------------------------------
// Grooming Due Detector (PF-051)
// -----------------------------------------------------------------------------

export type GroomingDueStatus =
  | 'UPCOMING'
  | 'DUE_NOW'
  | 'OVERDUE'
  | 'CRITICAL_OVERDUE'
  | 'ON_TRACK';

export interface GroomingDueRules {
  defaultIntervalDays?: number; // default: 30
  dogIntervalDays?: number; // default: 28
  catIntervalDays?: number; // default: 45
  otherIntervalDays?: number; // default: 35
  upcomingDaysThreshold?: number; // default: 7 days before due
  overdueDaysThreshold?: number; // default: 7 days after due (becomes OVERDUE)
  criticalOverdueDaysThreshold?: number; // default: 30 days after due (becomes CRITICAL_OVERDUE)
  usePersonalizedInterval?: boolean; // default: true
}

export interface GroomingDueSummary {
  totalGroomedPets: number;
  upcomingCount: number;
  dueNowCount: number;
  overdueCount: number;
  criticalOverdueCount: number;
  onTrackCount: number;
  totalDueOrOverdue: number;
  estimatedPotentialRevenueMinor: number;
  rules: Required<GroomingDueRules>;
  calculatedAt: string;
}

export interface GroomingDuePetItem {
  petId: string;
  petName: string;
  species: PetSpecies;
  breed?: string | null;
  photoUrl?: string | null;
  specialRequirements?: string | null;
  customerId: string;
  customerName: string;
  customerPhone: string;
  lineUserId?: string | null;
  marketingStatus: 'OPTED_IN' | 'OPTED_OUT' | 'PENDING';
  lastGroomedAt?: string | null;
  lastServiceName?: string | null;
  daysSinceLastGrooming?: number | null;
  cycleDays: number;
  isPersonalizedCycle: boolean;
  totalGroomingVisits: number;
  nextGroomingDueAt?: string | null;
  daysDifference: number; // >0 means overdue by N days, <0 means N days left until due
  dueStatus: GroomingDueStatus;
  dueStatusText: string;
  hasFutureBooking: boolean;
  futureBookingAt?: string | null;
  estimatedPriceMinor: number;
  recommendedMessage: string;
}

// -----------------------------------------------------------------------------
// Vaccine Due Detector (PF-052)
// -----------------------------------------------------------------------------

export type VaccineDueStatus =
  | 'UPCOMING'
  | 'DUE_NOW'
  | 'OVERDUE'
  | 'CRITICAL_OVERDUE'
  | 'UP_TO_DATE';

export interface VaccineDueRules {
  annualIntervalDays?: number; // default: 365 days
  puppyIntervalDays?: number; // default: 28 days
  upcomingDaysThreshold?: number; // default: 30 days before due
  dueNowDaysThreshold?: number; // default: 14 days
  overdueDaysThreshold?: number; // default: 15-60 days
  criticalOverdueDaysThreshold?: number; // default: 60 days
}

export interface VaccineDueSummary {
  totalVaccinatedPets: number;
  upcomingCount: number;
  dueNowCount: number;
  overdueCount: number;
  criticalOverdueCount: number;
  upToDateCount: number;
  totalDueOrOverdue: number;
  estimatedPotentialRevenueMinor: number;
  rules: Required<VaccineDueRules>;
  calculatedAt: string;
}

export interface VaccineDuePetItem {
  vaccinationId?: string | null;
  petId: string;
  petName: string;
  species: PetSpecies;
  breed?: string | null;
  birthDate?: string | null;
  photoUrl?: string | null;
  customerId: string;
  customerName: string;
  customerPhone: string;
  lineUserId?: string | null;
  marketingStatus: 'OPTED_IN' | 'OPTED_OUT' | 'PENDING';
  vaccineName: string;
  vaccineCode?: string;
  lotNumber?: string | null;
  administeredAt?: string | null;
  nextDueAt?: string | null;
  daysDifference: number; // >0 means overdue by N days, <0 means N days remaining until due
  dueStatus: VaccineDueStatus;
  dueStatusText: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskDescription: string;
  hasFutureBooking: boolean;
  futureBookingAt?: string | null;
  estimatedPriceMinor: number;
  recommendedMessage: string;
}

export interface RecordPetVaccinationDto {
  petId: string;
  vaccineName: string;
  lotNumber?: string;
  administeredAt?: string;
  nextDueAt?: string;
  clinicVisitId?: string;
}

// -----------------------------------------------------------------------------
// Win-Back & Marketing Campaigns (PF-053)
// -----------------------------------------------------------------------------

export type CampaignChannel = 'LINE' | 'SMS' | 'EMAIL';

export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PAUSED';

export type CampaignAudienceSegment =
  | 'ALL'
  | 'AT_RISK'
  | 'LOST'
  | 'VIP'
  | 'GROOMING_DUE'
  | 'VACCINE_DUE'
  | 'NEW';

export type CampaignDiscountType = 'PERCENTAGE' | 'FIXED' | 'FREE_SERVICE' | 'NONE';

export interface CampaignRecipientItem {
  id: string;
  campaignId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  lineUserId?: string | null;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CONVERTED';
  sentAt?: string | null;
  convertedAt?: string | null;
  revenueMinor?: number | null;
}

export interface CampaignItem {
  id: string;
  tenantId: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  audienceSegment: CampaignAudienceSegment;
  audienceFilterCriteria?: Record<string, unknown> | null;
  messageTemplate: string;
  promoCode?: string | null;
  discountType: CampaignDiscountType;
  discountValue?: number | null;
  scheduledAt: string;
  createdAt: string;
  targetCount: number;
  sentCount: number;
  deliveredCount: number;
  convertedCount: number;
  revenueGeneratedMinor: number;
  conversionRate: number; // percentage
  recipients?: CampaignRecipientItem[];
}

export interface AudiencePreviewResult {
  audienceSegment: CampaignAudienceSegment;
  totalEligibleCustomers: number;
  optedInCount: number;
  withLineCount: number;
  estimatedRecoverableRevenueMinor: number;
  sampleCustomers: Array<{
    id: string;
    fullName: string;
    phone: string;
    segment: string;
    lastVisitAt?: string | null;
    daysSinceLastVisit?: number | null;
    totalSpentMinor: number;
  }>;
}

export interface CreateCampaignInput {
  name: string;
  channel?: CampaignChannel;
  audienceSegment: CampaignAudienceSegment;
  audienceFilterCriteria?: Record<string, unknown>;
  messageTemplate: string;
  promoCode?: string;
  discountType?: CampaignDiscountType;
  discountValue?: number;
  scheduledAt?: string;
  launchImmediately?: boolean;
}

export interface CampaignPerformanceSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  totalMessagesSent: number;
  totalConvertedCustomers: number;
  totalRevenueRecoveredMinor: number;
  averageConversionRate: number;
}

// -----------------------------------------------------------------------------
// No-Show Report & Revenue Loss Analytics (PF-054)
// -----------------------------------------------------------------------------

export interface NoShowReportSummary {
  totalAppointments: number;
  completedAppointments: number;
  noShowCount: number;
  cancelledCount: number;
  noShowRate: number; // percentage (e.g. 7.5)
  cancellationRate: number; // percentage
  totalLostRevenueMinor: number;
  lostCapacityMinutes: number;
  averageLostPerNoShowMinor: number;
  repeatOffendersCount: number;
  periodStart: string;
  periodEnd: string;
}

export interface NoShowByCustomerItem {
  customerId: string;
  customerName: string;
  customerPhone: string;
  lineUserId?: string | null;
  marketingStatus: 'OPTED_IN' | 'OPTED_OUT' | 'PENDING';
  totalBookings: number;
  noShowCount: number;
  noShowRate: number;
  totalLostRevenueMinor: number;
  lastNoShowAt: string;
  riskBadge: 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK';
  requireDeposit: boolean;
}

export interface NoShowByServiceItem {
  serviceId: string;
  serviceName: string;
  totalBookings: number;
  noShowCount: number;
  noShowRate: number;
  lostRevenueMinor: number;
  lostMinutes: number;
}

export interface NoShowByDayOfWeekItem {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  dayName: string;
  noShowCount: number;
  totalBookings: number;
  noShowRate: number;
  lostRevenueMinor: number;
}

export interface NoShowAppointmentItem {
  id: string;
  branchId: string;
  branchName: string;
  startAt: string;
  endAt: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  lineUserId?: string | null;
  petId: string;
  petName: string;
  species: PetSpecies;
  breed?: string | null;
  serviceId: string;
  serviceName: string;
  servicePriceMinor: number;
  durationMinutes: number;
  staffId?: string | null;
  staffName?: string | null;
  noShowReason?: string | null;
  notes?: string | null;
  hasSubsequentBooking: boolean;
}

// -----------------------------------------------------------------------------
// Owner Dashboard & Executive Metrics (PF-055)
// -----------------------------------------------------------------------------

export type DashboardPeriod =
  | 'TODAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'LAST_30_DAYS'
  | 'THIS_YEAR'
  | 'CUSTOM';

export interface DashboardRevenueMetrics {
  totalRevenueMinor: number;
  grossProfitMinor: number;
  previousPeriodRevenueMinor: number;
  growthRate: number; // percentage (e.g. +14.2%)
  revenueByPaymentMethod: Array<{
    method: string;
    methodLabel: string;
    amountMinor: number;
    count: number;
    percentage: number;
  }>;
  revenueByCategory: Array<{
    category: string;
    categoryLabel: string;
    amountMinor: number;
    percentage: number;
  }>;
}

export interface DashboardAppointmentMetrics {
  totalAppointments: number;
  completedAppointments: number;
  pendingOrConfirmedAppointments: number;
  inProgressAppointments: number;
  noShowCount: number;
  noShowRate: number; // percentage
  noShowLostRevenueMinor: number;
  cancelledCount: number;
  cancellationRate: number;
}

export interface DashboardCustomerMetrics {
  averageTicketMinor: number;
  totalActiveCustomers: number;
  newCustomersCount: number;
  repeatCustomersCount: number;
  newCustomerRevenueMinor: number;
  repeatCustomerRevenueMinor: number;
  repeatRevenueShare: number; // percentage (e.g. 78.5%)
  inactiveCustomersCount: number; // At-Risk + Lost
  recoverableRevenueOpportunityMinor: number;
}

export interface DashboardDailyTrendItem {
  date: string;
  label: string;
  revenueMinor: number;
  appointmentsCount: number;
  newCustomersCount: number;
}

export interface DashboardRecentActivityItem {
  id: string;
  type: 'INVOICE_PAID' | 'APPOINTMENT_COMPLETED' | 'NO_SHOW' | 'NEW_CUSTOMER' | 'CAMPAIGN_CONVERSION';
  title: string;
  description: string;
  amountMinor?: number | null;
  timestamp: string;
}

export interface OwnerDashboardMetrics {
  tenantId: string;
  branchId?: string | null;
  branchName?: string | null;
  period: DashboardPeriod;
  periodStart: string;
  periodEnd: string;
  revenue: DashboardRevenueMetrics;
  appointments: DashboardAppointmentMetrics;
  customerAndLtv: DashboardCustomerMetrics;
  retentionSummary: {
    vipCount: number;
    activeCount: number;
    atRiskCount: number;
    lostCount: number;
    newCount: number;
    totalCustomers: number;
  };
  dailyRevenueTrend: DashboardDailyTrendItem[];
  recentActivities: DashboardRecentActivityItem[];
  generatedAt: string;
}

// -----------------------------------------------------------------------------
// Revenue Recovery Dashboard (PF-057)
// -----------------------------------------------------------------------------

export interface RevenueRecoverySummary {
  totalOpportunityMinor: number;
  recoveredRevenueMinor: number;
  recoveryRate: number; // percentage
  recoveredCustomersCount: number;
  noShowLostMinor: number;
  noShowCount: number;
  inactiveCustomerOpportunityMinor: number;
  inactiveCustomersCount: number;
  groomingDueOpportunityMinor: number;
  groomingDuePetsCount: number;
  vaccineDueOpportunityMinor: number;
  vaccineDuePetsCount: number;
  periodStart: string;
  periodEnd: string;
}

export interface RevenueRecoveryOpportunityItem {
  id: string;
  type: 'GROOMING_DUE' | 'VACCINE_DUE' | 'AT_RISK_CUSTOMER' | 'NO_SHOW_FOLLOWUP';
  typeLabel: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  lineUserId?: string | null;
  petId?: string | null;
  petName?: string | null;
  species?: PetSpecies | null;
  breed?: string | null;
  estimatedRevenueMinor: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  daysSinceLastVisit: number;
  suggestedAction: string;
  suggestedTemplate: string;
}

export interface RevenueRecoveryDashboardData {
  tenantId: string;
  branchId?: string | null;
  summary: RevenueRecoverySummary;
  opportunities: RevenueRecoveryOpportunityItem[];
  generatedAt: string;
}

// -----------------------------------------------------------------------------
// Veterinary Clinic Core & Clinic Visit (PF-058)
// -----------------------------------------------------------------------------

export type ClinicVisitStatus =
  | 'SCHEDULED'
  | 'WAITING'
  | 'IN_CONSULTATION'
  | 'EXAMINATION'
  | 'TREATMENT'
  | 'COMPLETED'
  | 'CANCELLED';

export type ClinicVisitType =
  | 'GENERAL_CHECKUP'
  | 'VACCINATION'
  | 'SICK_VISIT'
  | 'FOLLOW_UP'
  | 'SURGERY'
  | 'DENTAL'
  | 'EMERGENCY'
  | 'GROOMING_HEALTH_CHECK';

export interface ClinicVisitVitalSigns {
  weightKg?: number | null;
  temperatureC?: number | null;
  heartRateBpm?: number | null;
  respiratoryRateBpm?: number | null;
  capillaryRefillTime?: string | null;
  mucousMembrane?: string | null;
  bodyConditionScore?: number | null; // 1-9 BCS
}

export interface ClinicVisitItem {
  id: string;
  tenantId: string;
  branchId: string;
  branchName?: string;
  appointmentId?: string | null;
  customerId: string;
  customerName: string;
  customerPhone: string;
  lineUserId?: string | null;
  petId: string;
  petName: string;
  species: PetSpecies;
  breed?: string | null;
  photoUrl?: string | null;
  allergies?: string | null;
  veterinarianId?: string | null;
  veterinarianName?: string | null;
  visitNumber?: string | null;
  status: ClinicVisitStatus;
  visitType: ClinicVisitType;
  chiefComplaint?: string | null;
  symptoms?: string | null;
  diagnosis?: string | null;
  differentialDiagnosis?: string | null;
  vitals: ClinicVisitVitalSigns;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  treatmentSummary?: string | null;
  dischargeNotes?: string | null;
  followUpDate?: string | null;
  followUpReason?: string | null;
  visitedAt: string;
  completedAt?: string | null;
  createdAt: string;
  prescriptionsCount?: number;
  treatmentsCount?: number;
}

export interface CreateClinicVisitInput {
  branchId: string;
  customerId: string;
  petId: string;
  appointmentId?: string;
  veterinarianId?: string;
  visitType?: ClinicVisitType;
  chiefComplaint?: string;
  symptoms?: string;
  vitals?: ClinicVisitVitalSigns;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  diagnosis?: string;
  differentialDiagnosis?: string;
  treatmentSummary?: string;
  dischargeNotes?: string;
  followUpDate?: string;
  followUpReason?: string;
  visitedAt?: string;
}

export interface UpdateClinicVisitInput {
  status?: ClinicVisitStatus;
  visitType?: ClinicVisitType;
  veterinarianId?: string | null;
  chiefComplaint?: string | null;
  symptoms?: string | null;
  vitals?: ClinicVisitVitalSigns;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  diagnosis?: string | null;
  differentialDiagnosis?: string | null;
  treatmentSummary?: string | null;
  dischargeNotes?: string | null;
  followUpDate?: string | null;
  followUpReason?: string | null;
  completedAt?: string | null;
}

export interface QueryClinicVisitsDto {
  branchId?: string;
  petId?: string;
  customerId?: string;
  veterinarianId?: string;
  status?: ClinicVisitStatus;
  visitType?: ClinicVisitType;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// -----------------------------------------------------------------------------
// SOAP Notes & Clinical Records API (PF-059)
// -----------------------------------------------------------------------------

export type ClinicAttachmentType =
  | 'WOUND_PHOTO'
  | 'LAB_RESULT'
  | 'XRAY'
  | 'ULTRASOUND'
  | 'PRESCRIPTION_SLIP'
  | 'OTHER';

export interface ClinicAttachmentItem {
  id: string;
  tenantId: string;
  clinicVisitId: string;
  attachmentType: ClinicAttachmentType;
  fileUrl: string;
  fileName?: string | null;
  caption?: string | null;
  uploadedAt: string;
}

export interface AddClinicAttachmentInput {
  attachmentType: ClinicAttachmentType;
  fileUrl: string;
  fileName?: string;
  caption?: string;
}

export interface SoapNoteHistoryEntry {
  id: string;
  recordType: string;
  authorName?: string;
  createdAt: string;
  summary: string;
  snapshot: Record<string, unknown>;
}

export interface SoapNoteData {
  visitId: string;
  visitNumber?: string | null;
  petId: string;
  petName: string;
  species: PetSpecies;
  breed?: string | null;
  customerId: string;
  customerName: string;
  veterinarianId?: string | null;
  veterinarianName?: string | null;
  visitType: ClinicVisitType;
  status: ClinicVisitStatus;
  visitedAt: string;
  chiefComplaint?: string | null;
  symptoms?: string | null;
  vitals: ClinicVisitVitalSigns;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  diagnosis?: string | null;
  differentialDiagnosis?: string | null;
  treatmentSummary?: string | null;
  dischargeNotes?: string | null;
  followUpDate?: string | null;
  followUpReason?: string | null;
  attachments: ClinicAttachmentItem[];
  historyEntries: SoapNoteHistoryEntry[];
}

export interface UpdateSoapNoteInput {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  chiefComplaint?: string;
  symptoms?: string;
  diagnosis?: string;
  differentialDiagnosis?: string;
  treatmentSummary?: string;
  dischargeNotes?: string;
  followUpDate?: string;
  followUpReason?: string;
  vitals?: ClinicVisitVitalSigns;
  veterinarianId?: string;
  status?: ClinicVisitStatus;
  authorNote?: string;
}

// -----------------------------------------------------------------------------
// Veterinary Prescription & Dispensing API (PF-061)
// -----------------------------------------------------------------------------

export interface PrescriptionItem {
  id: string;
  tenantId: string;
  clinicVisitId: string;
  productId?: string | null;
  productSku?: string | null;
  medicationName: string;
  genericName?: string | null;
  dosageForm?: string | null;
  strength?: string | null;
  dosagePerKg?: number | null;
  calculatedDose?: string | null;
  route?: string | null;
  frequency?: string | null;
  duration?: string | null;
  quantity: number;
  unit?: string | null;
  instruction?: string | null;
  cautionNotes?: string | null;
  priceMinor: number;
  isDispensed: boolean;
  dispensedAt?: string | null;
  dispensedById?: string | null;
  dispensedByName?: string | null;
  createdAt: string;
}

export interface CreatePrescriptionInput {
  productId?: string;
  medicationName: string;
  genericName?: string;
  dosageForm?: string;
  strength?: string;
  dosagePerKg?: number;
  calculatedDose?: string;
  route?: string;
  frequency?: string;
  duration?: string;
  quantity: number;
  unit?: string;
  instruction?: string;
  cautionNotes?: string;
  priceMinor?: number;
}

export interface UpdatePrescriptionInput {
  productId?: string | null;
  medicationName?: string;
  genericName?: string | null;
  dosageForm?: string | null;
  strength?: string | null;
  dosagePerKg?: number | null;
  calculatedDose?: string | null;
  route?: string | null;
  frequency?: string | null;
  duration?: string | null;
  quantity?: number;
  unit?: string | null;
  instruction?: string | null;
  cautionNotes?: string | null;
  priceMinor?: number;
}

export interface DispensePrescriptionsInput {
  prescriptionIds?: string[];
  deductStock?: boolean;
  branchId?: string;
}

export interface PrescriptionLabelData {
  clinicName: string;
  clinicPhone?: string;
  clinicAddress?: string;
  visitNumber?: string;
  date: string;
  petName: string;
  species: string;
  breed?: string;
  customerName: string;
  veterinarianName?: string;
  medicationName: string;
  genericName?: string;
  strength?: string;
  quantity: number;
  unit: string;
  route: string;
  frequency: string;
  instruction: string;
  cautionNotes?: string;
  lotNumber?: string;
  expiryDate?: string;
}

// -----------------------------------------------------------------------------
// Veterinary Vaccination & Immunization API (PF-062)
// -----------------------------------------------------------------------------

export type VaccineType =
  | 'DOG_CORE_5_IN_1'
  | 'DOG_CORE_6_IN_1'
  | 'DOG_RABIES'
  | 'DOG_KENNEL_COUGH'
  | 'CAT_CORE_3_IN_1'
  | 'CAT_CORE_4_IN_1'
  | 'CAT_RABIES'
  | 'CAT_LEUKEMIA'
  | 'OTHER';

export interface VaccinationRecordItem {
  id: string;
  tenantId: string;
  petId: string;
  petName: string;
  species: string;
  breed?: string | null;
  customerId: string;
  customerName: string;
  customerPhone: string;
  clinicVisitId?: string | null;
  visitNumber?: string | null;
  productId?: string | null;
  administeredById?: string | null;
  administeredByName?: string | null;
  vaccineType: VaccineType;
  vaccineName: string;
  manufacturer?: string | null;
  lotNumber?: string | null;
  administeredAt: string;
  nextDueAt?: string | null;
  weightKg?: number | null;
  temperatureC?: number | null;
  siteOfInjection?: string | null;
  certificateNumber?: string | null;
  isCompleted: boolean;
  reminderSent: boolean;
  reminderSentAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface CreateVaccinationInput {
  petId: string;
  clinicVisitId?: string;
  productId?: string;
  administeredById?: string;
  vaccineType?: VaccineType;
  vaccineName: string;
  manufacturer?: string;
  lotNumber?: string;
  administeredAt?: string;
  nextDueAt?: string;
  weightKg?: number;
  temperatureC?: number;
  siteOfInjection?: string;
  certificateNumber?: string;
  notes?: string;
}

export interface UpdateVaccinationInput {
  administeredById?: string | null;
  vaccineType?: VaccineType;
  vaccineName?: string;
  manufacturer?: string | null;
  lotNumber?: string | null;
  administeredAt?: string;
  nextDueAt?: string | null;
  weightKg?: number | null;
  temperatureC?: number | null;
  siteOfInjection?: string | null;
  certificateNumber?: string | null;
  notes?: string | null;
}

export interface PetVaccinationPassport {
  pet: {
    id: string;
    name: string;
    species: string;
    breed?: string | null;
    birthDate?: string | null;
    microchipNumber?: string | null;
    photoUrl?: string | null;
    customerName: string;
    customerPhone: string;
  };
  vaccinations: VaccinationRecordItem[];
  upcomingDueCount: number;
}

// -----------------------------------------------------------------------------
// Clinical Follow-up & Recheck Reminders API (PF-063)
// -----------------------------------------------------------------------------

export interface ClinicalFollowUpItem {
  id: string;
  tenantId: string;
  visitId: string;
  visitNumber?: string | null;
  petId: string;
  petName: string;
  species: string;
  breed?: string | null;
  customerId: string;
  customerName: string;
  customerPhone: string;
  lineUserId?: string | null;
  veterinarianId?: string | null;
  veterinarianName?: string | null;
  followUpDate: string;
  followUpReason: string;
  diagnosis?: string | null;
  daysUntilDue: number;
  urgency: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';
  reminderStatus: 'PENDING' | 'SENT' | 'CONFIRMED' | 'RESCHEDULED' | 'DISMISSED';
  lastReminderSentAt?: string | null;
}

export interface SendFollowUpReminderInput {
  visitId: string;
  channel?: 'LINE' | 'SMS';
  customMessage?: string;
}

export interface FollowUpSummary {
  totalPending: number;
  dueToday: number;
  overdue: number;
  upcoming7Days: number;
  sentThisMonth: number;
}

// -----------------------------------------------------------------------------
// SaaS Subscription Plan & Billing Schema (PF-064)
// -----------------------------------------------------------------------------

export type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'UNPAID';

export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface SubscriptionPlanItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  priceMonthlyMinor: number;
  priceYearlyMinor: number;
  currency: string;
  maxBranches: number;
  maxStaffUsers: number;
  maxMonthlyAppointments: number;
  hasLineIntegration: boolean;
  hasAdvancedInventory: boolean;
  hasClinicalSoap: boolean;
  hasVaccinationRegistry: boolean;
  hasCommissionEngine: boolean;
  hasMultiBranchCentral: boolean;
  hasApiAccess: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubscriptionDetails {
  id: string;
  tenantId: string;
  tenantName: string;
  planId?: string | null;
  planCode: string;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  priceMinor: number;
  currency: string;
  trialEndsAt?: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string | null;
  customMaxBranches?: number | null;
  customMaxStaffUsers?: number | null;
  paymentMethod?: string | null;
  // Quotas & Features
  effectiveMaxBranches: number;
  effectiveMaxStaffUsers: number;
  effectiveMaxMonthlyAppointments: number;
  currentBranchCount: number;
  currentUserCount: number;
  currentMonthlyAppointmentCount: number;
  hasLineIntegration: boolean;
  hasAdvancedInventory: boolean;
  hasClinicalSoap: boolean;
  hasVaccinationRegistry: boolean;
  hasCommissionEngine: boolean;
  hasMultiBranchCentral: boolean;
  hasApiAccess: boolean;
}

export interface CreateSubscriptionPlanInput {
  code: string;
  name: string;
  description?: string;
  priceMonthlyMinor: number;
  priceYearlyMinor: number;
  currency?: string;
  maxBranches?: number;
  maxStaffUsers?: number;
  maxMonthlyAppointments?: number;
  hasLineIntegration?: boolean;
  hasAdvancedInventory?: boolean;
  hasClinicalSoap?: boolean;
  hasVaccinationRegistry?: boolean;
  hasCommissionEngine?: boolean;
  hasMultiBranchCentral?: boolean;
  hasApiAccess?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateSubscriptionPlanInput {
  name?: string;
  description?: string;
  priceMonthlyMinor?: number;
  priceYearlyMinor?: number;
  currency?: string;
  maxBranches?: number;
  maxStaffUsers?: number;
  maxMonthlyAppointments?: number;
  hasLineIntegration?: boolean;
  hasAdvancedInventory?: boolean;
  hasClinicalSoap?: boolean;
  hasVaccinationRegistry?: boolean;
  hasCommissionEngine?: boolean;
  hasMultiBranchCentral?: boolean;
  hasApiAccess?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface AssignSubscriptionInput {
  tenantId: string;
  planCode: string;
  billingCycle?: BillingCycle;
  status?: SubscriptionStatus;
  customMaxBranches?: number;
  customMaxStaffUsers?: number;
  paymentMethod?: string;
}

export interface PlanQuotaCheckResult {
  allowed: boolean;
  resource: 'BRANCH' | 'USER' | 'APPOINTMENT' | 'FEATURE';
  currentUsage: number;
  maxAllowed: number;
  planCode: string;
  message?: string;
}

export interface SubscriptionInvoiceItem {
  id: string;
  tenantId: string;
  subscriptionId: string;
  invoiceNumber: string;
  amountMinor: number;
  currency: string;
  status: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  paidAt?: string | null;
  paymentReference?: string | null;
  receiptUrl?: string | null;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// SaaS Feature Flags Architecture (PF-065)
// -----------------------------------------------------------------------------

export type FeatureFlagKey =
  | 'LINE_MESSAGING'
  | 'ADVANCED_INVENTORY'
  | 'CLINICAL_SOAP'
  | 'VACCINATION_REGISTRY'
  | 'COMMISSION_ENGINE'
  | 'MULTI_BRANCH_HQ'
  | 'API_ACCESS'
  | 'TELE_MED_BETA'
  | 'AI_ASSISTANT';

export interface FeatureFlagItem {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category: string;
  isGlobalEnabled: boolean;
  minPlanCode?: string | null;
  overrideCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantFeatureOverrideItem {
  id: string;
  tenantId: string;
  featureFlagId: string;
  featureKey: string;
  isEnabled: boolean;
  expiresAt?: string | null;
  reason?: string | null;
  createdAt: string;
}

export interface EvaluatedFeatureFlag {
  key: string;
  name: string;
  category: string;
  isEnabled: boolean;
  source: 'GLOBAL_OFF' | 'TENANT_OVERRIDE' | 'PLAN_ENTITLEMENT' | 'DEFAULT';
  reason?: string;
}

export interface CreateFeatureFlagInput {
  key: string;
  name: string;
  description?: string;
  category?: string;
  isGlobalEnabled?: boolean;
  minPlanCode?: string;
}

export interface UpdateFeatureFlagInput {
  name?: string;
  description?: string;
  category?: string;
  isGlobalEnabled?: boolean;
  minPlanCode?: string | null;
}

export interface SetTenantFeatureOverrideInput {
  tenantId: string;
  featureKey: string;
  isEnabled: boolean;
  expiresAt?: string;
  reason?: string;
}

// -----------------------------------------------------------------------------
// SaaS Super Admin Console & Management API (PF-066)
// -----------------------------------------------------------------------------

export interface SaaSMetricsOverview {
  totalTenants: number;
  activeTenants: number;
  trialingTenants: number;
  pastDueTenants: number;
  suspendedTenants: number;
  mrrMinor: number;
  arrMinor: number;
  totalPetsCount: number;
  totalAppointmentsThisMonth: number;
  totalRevenueThisMonthMinor: number;
  planDistribution: { planCode: string; count: number }[];
  businessTypeDistribution: { businessType: string; count: number }[];
}

export interface SaaSTenantListItem {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  planCode: string;
  planName: string;
  subscriptionStatus: string;
  billingCycle: string;
  priceMinor: number;
  branchCount: number;
  userCount: number;
  customerCount: number;
  petCount: number;
  monthlyAppointmentCount: number;
  createdAt: string;
}

export interface QuerySaaSTenantsInput {
  status?: string;
  planCode?: string;
  businessType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdateTenantStatusInput {
  tenantId: string;
  isActive: boolean;
  reason?: string;
}

export interface SystemAuditLogItem {
  id: string;
  tenantId: string;
  tenantName: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ip?: string | null;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Usage Metering & Quotas Architecture (PF-067)
// -----------------------------------------------------------------------------

export type UsageMetricType =
  | 'LINE_MESSAGES'
  | 'SMS_CREDITS'
  | 'STORAGE_BYTES'
  | 'MONTHLY_APPOINTMENTS'
  | 'API_CALLS';

export interface UsageMeterItem {
  metricType: UsageMetricType;
  label: string;
  unit: string;
  used: number;
  quotaLimit: number;
  extraCredits: number;
  totalAllowed: number;
  remaining: number;
  percentage: number;
  isOverLimit: boolean;
  warningLevel: 'NORMAL' | 'WARNING_80' | 'CRITICAL_95' | 'EXCEEDED_100';
}

export interface TenantUsageDashboard {
  tenantId: string;
  tenantName: string;
  planCode: string;
  billingPeriod: string;
  meters: UsageMeterItem[];
}

export interface RecordUsageInput {
  tenantId: string;
  metricType: UsageMetricType;
  quantity: number;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

export interface TopUpCreditsInput {
  metricType: UsageMetricType;
  credits: number;
  amountMinor: number;
  paymentMethod: string;
}

export interface UsageRecordItem {
  id: string;
  tenantId: string;
  metricType: UsageMetricType;
  billingPeriod: string;
  quantity: number;
  referenceId?: string | null;
  recordedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Security & Audit Types (PF-069)
export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0 to 4
  feedback: string[];
}

export interface FileUploadValidationResult {
  isAllowed: boolean;
  sanitizedFilename: string;
  mimeType: string;
  fileSizeBytes?: number;
  error?: string;
}

export interface SecurityOverviewReport {
  tenantId: string;
  tenantName: string;
  isolationStatus: 'ENFORCED' | 'DEGRADED';
  rbacCompliance: 'COMPLIANT' | 'NON_COMPLIANT';
  rateLimitStatus: 'ACTIVE' | 'DISABLED';
  webhookSignatureEnforced: boolean;
  recentSecurityEventsCount: number;
  lastAuditAt: string;
}
