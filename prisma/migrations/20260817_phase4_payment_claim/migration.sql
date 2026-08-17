CREATE TYPE "PaymentInitializationState" AS ENUM ('READY', 'CLAIMED', 'DISPATCHED', 'CORRELATED', 'NOT_CREATED');

ALTER TABLE "Order"
ADD COLUMN "paymentInitializationState" "PaymentInitializationState",
ADD COLUMN "paymentInitializationClaimedAt" TIMESTAMP(3),
ADD COLUMN "paymentEverDispatchedAt" TIMESTAMP(3);
