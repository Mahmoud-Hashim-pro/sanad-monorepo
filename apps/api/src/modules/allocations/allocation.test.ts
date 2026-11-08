const { describe, it }: typeof import("node:test") = require("node:test");
const assert: typeof import("node:assert/strict") = require("node:assert/strict");
const { AllocationDomainService }: typeof import("./allocation.service") = require("./allocation.service.ts");

describe("AllocationDomainService & Research Governance (@sanad/api)", () => {
  const service = new AllocationDomainService();

  it("blocks VOLUNTEER role from approving research reports", () => {
    assert.throws(
      () =>
        service.validateIndependentResearchReview({
          authorUserId: "user-vol-101",
          reviewerUserId: "user-vol-102",
          reviewerRole: "VOLUNTEER",
        }),
      /لا يحق للمتطوع/,
    );
  });

  it("blocks report author from approving their own field report (Separation of Duties)", () => {
    assert.throws(
      () =>
        service.validateIndependentResearchReview({
          authorUserId: "user-sup-201",
          reviewerUserId: "user-sup-201",
          reviewerRole: "RESEARCH_SUPERVISOR",
        }),
      /فصل المهام/,
    );
  });

  it("allows an independent RESEARCH_SUPERVISOR to approve a field report", () => {
    assert.doesNotThrow(() =>
      service.validateIndependentResearchReview({
        authorUserId: "user-vol-101",
        reviewerUserId: "user-sup-201",
        reviewerRole: "RESEARCH_SUPERVISOR",
      }),
    );
  });

  it("computes atomic monetary allocation reservation in integer piasters and prevents over-allocation", () => {
    const result = service.computeMonetaryAllocationReservation({
      donationStatus: "CONFIRMED",
      restrictedCategory: "MEDICAL_AID",
      requestCategory: "MEDICAL_AID",
      availableAmountPiasters: 500000n,
      reservedAmountPiasters: 100000n,
      requestedAllocationPiasters: 150000n,
    });

    assert.equal(result.nextAvailablePiasters, 350000n);
    assert.equal(result.nextReservedPiasters, 250000n);

    assert.throws(
      () =>
        service.computeMonetaryAllocationReservation({
          donationStatus: "CONFIRMED",
          restrictedCategory: "MEDICAL_AID",
          requestCategory: "MEDICAL_AID",
          availableAmountPiasters: 100000n,
          reservedAmountPiasters: 0n,
          requestedAllocationPiasters: 200000n,
        }),
      /الرصيد المتاح/,
    );
  });
});
