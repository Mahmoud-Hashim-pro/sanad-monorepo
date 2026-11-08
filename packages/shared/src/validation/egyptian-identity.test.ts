import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateEgyptianNationalId,
  maskNationalId,
  normalizeAndValidateEgyptianMobile,
} from "./egyptian-identity.ts";
import {
  validateIndependentResearchReview,
  computeMonetaryAllocation,
} from "../domain/allocation-policy.ts";

describe("Egyptian National ID Validation & Masking (@sanad/shared)", () => {
  it("accepts valid 14-digit National IDs across century 2 and 3 and valid governorates (01 Cairo, 16 Gharbia, 12 Dakahlia)", () => {
    const cairoId = validateEgyptianNationalId("29005150101234");
    assert.equal(cairoId.isValid, true);
    assert.equal(cairoId.parsed?.century, 20);
    assert.equal(cairoId.parsed?.birthDateIso, "1990-05-15");
    assert.equal(cairoId.parsed?.governorateCode, "01");
    assert.equal(cairoId.parsed?.governorateNameAr, "القاهرة");

    const gharbiaId = validateEgyptianNationalId("28511201609912");
    assert.equal(gharbiaId.isValid, true);
    assert.equal(gharbiaId.parsed?.governorateCode, "16");
    assert.equal(gharbiaId.parsed?.governorateNameAr, "الغربية");

    const dakahliaCentury3 = validateEgyptianNationalId("30402291201128"); // 2004 is a leap year
    assert.equal(dakahliaCentury3.isValid, true);
    assert.equal(dakahliaCentury3.parsed?.century, 21);
    assert.equal(dakahliaCentury3.parsed?.birthDateIso, "2004-02-29");
    assert.equal(dakahliaCentury3.parsed?.governorateCode, "12");
    assert.equal(dakahliaCentury3.parsed?.governorateNameAr, "الدقهلية");
  });

  it("rejects National IDs with wrong length or non-digits", () => {
    assert.equal(validateEgyptianNationalId("2900515160123").isValid, false);
    assert.equal(validateEgyptianNationalId("290051516012345").isValid, false);
    assert.equal(validateEgyptianNationalId("2900515160123A").isValid, false);
  });

  it("rejects National IDs with invalid century digit", () => {
    const res = validateEgyptianNationalId("19005151601234");
    assert.equal(res.isValid, false);
    assert.ok(res.errorAr?.includes("القرن"));
  });

  it("rejects National IDs with impossible calendar dates (e.g. Feb 30 or non-leap Feb 29)", () => {
    const feb30 = validateEgyptianNationalId("29002301601234");
    assert.equal(feb30.isValid, false);

    const nonLeapFeb29 = validateEgyptianNationalId("30302291601234"); // 2003 is not leap
    assert.equal(nonLeapFeb29.isValid, false);
  });

  it("rejects National IDs with future birth dates", () => {
    const futureId = validateEgyptianNationalId("39912311601234"); // 2099-12-31
    assert.equal(futureId.isValid, false);
    assert.ok(futureId.errorAr?.includes("المستقبل"));
  });

  it("rejects National IDs with unknown governorate code", () => {
    const unknownGov = validateEgyptianNationalId("29005159901234"); // 99 is invalid
    assert.equal(unknownGov.isValid, false);
    assert.ok(unknownGov.errorAr?.includes("المحافظة"));
  });

  it("masks digits 10-13 of a 14-digit National ID", () => {
    assert.equal(maskNationalId("29005151601234"), "290051516****4");
    assert.equal(maskNationalId("invalid"), "**************");
  });
});

describe("Egyptian Mobile Phone Normalization (@sanad/shared)", () => {
  it("normalizes valid Egyptian mobile formats (010, +2011, 002012, 015) to E.164", () => {
    const p1 = normalizeAndValidateEgyptianMobile("01012345678");
    assert.equal(p1.isValid, true);
    assert.equal(p1.e164, "+201012345678");
    assert.equal(p1.carrierPrefix, "010");

    const p2 = normalizeAndValidateEgyptianMobile("+201123456789");
    assert.equal(p2.isValid, true);
    assert.equal(p2.e164, "+201123456789");
    assert.equal(p2.carrierPrefix, "011");

    const p3 = normalizeAndValidateEgyptianMobile("00201234567890");
    assert.equal(p3.isValid, true);
    assert.equal(p3.e164, "+201234567890");
    assert.equal(p3.carrierPrefix, "012");

    const p4 = normalizeAndValidateEgyptianMobile("01555555555");
    assert.equal(p4.isValid, true);
    assert.equal(p4.e164, "+201555555555");
    assert.equal(p4.carrierPrefix, "015");
  });

  it("rejects invalid Egyptian mobile numbers", () => {
    assert.equal(normalizeAndValidateEgyptianMobile("01312345678").isValid, false);
    assert.equal(normalizeAndValidateEgyptianMobile("0101234567").isValid, false);
    assert.equal(normalizeAndValidateEgyptianMobile("0223456789").isValid, false);
  });
});

describe("Allocation & Research Governance Domain Rules (@sanad/shared)", () => {
  it("enforces independent research review separation of duties", () => {
    const volunteerAttempt = validateIndependentResearchReview({
      authorUserId: "user-vol-1",
      reviewerUserId: "user-vol-2",
      reviewerRole: "VOLUNTEER",
    });
    assert.equal(volunteerAttempt.allowed, false);

    const selfReviewAttempt = validateIndependentResearchReview({
      authorUserId: "user-sup-1",
      reviewerUserId: "user-sup-1",
      reviewerRole: "RESEARCH_SUPERVISOR",
    });
    assert.equal(selfReviewAttempt.allowed, false);

    const validSupervisorReview = validateIndependentResearchReview({
      authorUserId: "user-vol-1",
      reviewerUserId: "user-sup-1",
      reviewerRole: "RESEARCH_SUPERVISOR",
    });
    assert.equal(validSupervisorReview.allowed, true);
  });

  it("enforces monetary allocation rules and prevents over-allocation", () => {
    const unconfirmed = computeMonetaryAllocation({
      donationStatus: "DRAFT",
      restrictedCategory: null,
      requestCategory: "MEDICAL_AID",
      availableAmountEgp: 5000,
      reservedAmountEgp: 0,
      requestedAllocationEgp: 1000,
    });
    assert.equal(unconfirmed.allowed, false);

    const mismatchedCategory = computeMonetaryAllocation({
      donationStatus: "CONFIRMED",
      restrictedCategory: "FOOD_SUPPLY",
      requestCategory: "MEDICAL_AID",
      availableAmountEgp: 5000,
      reservedAmountEgp: 0,
      requestedAllocationEgp: 1000,
    });
    assert.equal(mismatchedCategory.allowed, false);

    const overAllocated = computeMonetaryAllocation({
      donationStatus: "CONFIRMED",
      restrictedCategory: "MEDICAL_AID",
      requestCategory: "MEDICAL_AID",
      availableAmountEgp: 1500,
      reservedAmountEgp: 500,
      requestedAllocationEgp: 2000,
    });
    assert.equal(overAllocated.allowed, false);

    const validAllocation = computeMonetaryAllocation({
      donationStatus: "CONFIRMED",
      restrictedCategory: "MEDICAL_AID",
      requestCategory: "MEDICAL_AID",
      availableAmountEgp: 5000,
      reservedAmountEgp: 1200,
      requestedAllocationEgp: 1800,
    });
    assert.equal(validAllocation.allowed, true);
    assert.equal(validAllocation.nextAvailableEgp, 3200);
    assert.equal(validAllocation.nextReservedEgp, 3000);
  });
});
