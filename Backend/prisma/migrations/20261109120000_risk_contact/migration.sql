-- Contact details of the person responsible for a risk.
ALTER TABLE "org_risks" ADD COLUMN "responsiblePhone" TEXT, ADD COLUMN "responsibleEmail" TEXT;
ALTER TABLE "client_risks" ADD COLUMN "responsiblePhone" TEXT, ADD COLUMN "responsibleEmail" TEXT;
