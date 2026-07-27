import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  submissions: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    salesExperience: v.string(),
    message: v.optional(v.string()),
    agentReferral: v.optional(v.string()),
    status: v.string(), // "new" | "contacted" | "hired" | "rejected"
    notes: v.optional(v.string()),
    submittedAt: v.number(),
    // New fields for enhanced tracking
    source: v.optional(v.string()),       // UTM source or referral channel
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    assignedTo: v.optional(v.string()),   // Team member assignment
  })
    .index("by_status", ["status"])
    .index("by_submittedAt", ["submittedAt"])
    .index("by_email", ["email"]),

  settings: defineTable({
    key: v.string(),   // Setting key (e.g., "admin", "profile")
    value: v.string(),  // JSON-encoded value
  })
    .index("by_key", ["key"]),
});
