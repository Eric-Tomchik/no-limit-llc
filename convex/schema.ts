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
    source: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    // Timestamp tracking for growth metrics
    contactedAt: v.optional(v.number()),
    hiredAt: v.optional(v.number()),
    rejectedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_submittedAt", ["submittedAt"])
    .index("by_email", ["email"]),

  interviews: defineTable({
    bookingUid: v.string(),
    applicantEmail: v.string(),
    applicantName: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    zoomJoinUrl: v.optional(v.string()),
    zoomMeetingId: v.optional(v.string()),
    status: v.string(), // "scheduled" | "completed" | "no-show" | "cancelled"
    submissionId: v.optional(v.string()),
    notes: v.optional(v.string()),
    calEventTypeId: v.optional(v.number()),
    attendees: v.optional(v.string()), // JSON array of attendee info
  })
    .index("by_bookingUid", ["bookingUid"])
    .index("by_startTime", ["startTime"])
    .index("by_applicantEmail", ["applicantEmail"])
    .index("by_status", ["status"]),

  emailTemplates: defineTable({
    trigger: v.string(), // "new" | "contacted" | "hired" | "rejected" | "interview_scheduled" | "no_show"
    subject: v.string(),
    body: v.string(), // HTML with {{firstName}}, {{lastName}}, etc.
    enabled: v.boolean(),
    lastModified: v.number(),
  })
    .index("by_trigger", ["trigger"]),

  emailLog: defineTable({
    submissionId: v.optional(v.string()),
    interviewId: v.optional(v.string()),
    trigger: v.string(),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    sentAt: v.number(),
    status: v.string(), // "sent" | "failed" | "pending" | "queued"
  })
    .index("by_submissionId", ["submissionId"])
    .index("by_status", ["status"])
    .index("by_sentAt", ["sentAt"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
  })
    .index("by_key", ["key"]),
});
