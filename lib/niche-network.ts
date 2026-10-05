import config from "@/config/niche-network.json";
type ContactOverride = { email?: string; operatorName?: string };
export function nicheNetworkContact(siteId: string) {
  const override = (config.contactsBySite as Record<string, ContactOverride>)[siteId];
  return { email: override?.email || config.defaultEmail, operatorName: override?.operatorName || config.operatorName };
}
export function nicheLeadRecipient(siteId: string, contactEmail: string) {
  return (config.mailRecipientsBySite as Record<string, string>)[siteId] || contactEmail;
}
