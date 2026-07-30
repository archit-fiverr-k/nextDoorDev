import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing all data from the database...");

  // Delete all records in reverse relation dependency order
  await prisma.dailyAnalytics.deleteMany();
  await prisma.securityLog.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.smsLog.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.staffAvailability.deleteMany();
  await prisma.trustedDevice.deleteMany();
  await prisma.userMfa.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.reviewReport.deleteMany();
  await prisma.reviewReply.deleteMany();
  await prisma.review.deleteMany();
  await prisma.searchNotificationWaitlist.deleteMany();
  await prisma.searchCallbackRequest.deleteMany();
  await prisma.searchAnalytics.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.cmsFaq.deleteMany();
  await prisma.cmsPage.deleteMany();
  await prisma.pharmacyService.deleteMany();
  await prisma.masterService.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.subscriptionHistory.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.patientNotification.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.bookingOtp.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.communicationsLog.deleteMany();
  await prisma.cRMNote.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.blockedDate.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.service.deleteMany();
  await prisma.pharmacy.deleteMany();
  await prisma.platformAdmin.deleteMany();
  await prisma.superAdmin.deleteMany();

  console.log("✨ All data successfully cleared from database!");
}

main()
  .catch((e) => {
    console.error("❌ Error clearing database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
