import { isCountryCode } from "@/lib/countries";
import { isUsState } from "@/lib/us-states";

export type AddressDraft = {
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  city: string;
  zip: string;
  countryCode: string;
  provinceCode: string;
  isDefault: boolean;
};

export type SavedAddress = AddressDraft & { id: number };

const LIMITS = {
  label: 40,
  firstName: 80,
  lastName: 80,
  phone: 40,
  address1: 120,
  city: 80,
  zip: 20,
} as const;

export function addressDraftError(input: AddressDraft) {
  const countryCode = input.countryCode.trim().toUpperCase();
  const provinceCode = input.provinceCode.trim().toUpperCase();
  if (!input.firstName.trim() || !input.lastName.trim() || !input.address1.trim() || !input.city.trim()) return "missing" as const;
  if (input.label.length > LIMITS.label) return "address" as const;
  if (input.firstName.length > LIMITS.firstName || input.lastName.length > LIMITS.lastName) return "address" as const;
  if (input.phone.length > LIMITS.phone || input.address1.length > LIMITS.address1) return "address" as const;
  if (input.city.length > LIMITS.city || input.zip.length > LIMITS.zip) return "address" as const;
  if (!isCountryCode(countryCode)) return "address" as const;
  if (countryCode === "US" && !isUsState(provinceCode)) return "address" as const;
  return null;
}

export function cleanAddressDraft(input: AddressDraft): AddressDraft {
  const countryCode = input.countryCode.trim().toUpperCase();
  return {
    label: input.label.trim().slice(0, LIMITS.label),
    firstName: input.firstName.trim().slice(0, LIMITS.firstName),
    lastName: input.lastName.trim().slice(0, LIMITS.lastName),
    phone: input.phone.trim().slice(0, LIMITS.phone),
    address1: input.address1.trim().slice(0, LIMITS.address1),
    city: input.city.trim().slice(0, LIMITS.city),
    zip: input.zip.trim().slice(0, LIMITS.zip),
    countryCode,
    provinceCode: countryCode === "US" ? input.provinceCode.trim().toUpperCase() : "",
    isDefault: input.isDefault,
  };
}
