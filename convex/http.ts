import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// ─── CORS helpers ───
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function corsResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Public: Submit Application ───
http.route({
  path: "/api/submissions",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const id = await ctx.runMutation(api.submissions.create, {
        firstName: body.firstName || "",
        lastName: body.lastName || "",
        email: body.email || "",
        phone: body.phone || "",
        salesExperience: body.salesExperience || "",
        message: body.message || undefined,
        agentReferral: body.agentReferral || undefined,
        source: body.source || body.utm_source || undefined,
        utmMedium: body.utm_medium || undefined,
        utmCampaign: body.utm_campaign || undefined,
      });
      return corsResponse({ success: true, id });
    } catch (e: any) {
      return corsResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/api/submissions",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

// ─── Admin API ───
http.route({
  path: "/api/admin",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const storedPassword = await ctx.runQuery(api.settings.get, {
      key: "adminPassword",
    });
    const password = storedPassword || "NoLimit2024!";

    if (token !== password) {
      return corsResponse({ error: "Unauthorized" }, 401);
    }

    try {
      const body = await request.json();
      const { action } = body;

      switch (action) {
        // ── Submissions ──
        case "stats": {
          const stats = await ctx.runQuery(api.submissions.stats);
          return corsResponse(stats);
        }
        case "list": {
          const list = await ctx.runQuery(api.submissions.list);
          return corsResponse(list);
        }
        case "updateStatus": {
          const updated = await ctx.runMutation(api.submissions.updateStatus, {
            id: body.id,
            status: body.status,
          });
          return corsResponse({ success: true, submission: updated });
        }
        case "updateNotes": {
          await ctx.runMutation(api.submissions.updateNotes, {
            id: body.id,
            notes: body.notes,
          });
          return corsResponse({ success: true });
        }
        case "delete": {
          await ctx.runMutation(api.submissions.remove, { id: body.id });
          return corsResponse({ success: true });
        }
        case "updateAssignment": {
          await ctx.runMutation(api.submissions.updateAssignment, {
            id: body.id,
            assignedTo: body.assignedTo,
          });
          return corsResponse({ success: true });
        }

        // ── Growth Metrics ──
        case "growthMetrics": {
          const metrics = await ctx.runQuery(api.submissions.growthMetrics);
          return corsResponse(metrics);
        }

        // ── Interviews ──
        case "listInterviews": {
          const interviews = await ctx.runQuery(api.interviews.list);
          return corsResponse(interviews);
        }
        case "todayInterviews": {
          const today = await ctx.runQuery(api.interviews.today);
          return corsResponse(today);
        }
        case "upcomingInterviews": {
          const upcoming = await ctx.runQuery(api.interviews.upcoming);
          return corsResponse(upcoming);
        }
        case "interviewStats": {
          const istats = await ctx.runQuery(api.interviews.stats);
          return corsResponse(istats);
        }
        case "upsertInterview": {
          const iid = await ctx.runMutation(api.interviews.upsert, {
            bookingUid: body.bookingUid,
            applicantEmail: body.applicantEmail,
            applicantName: body.applicantName,
            startTime: body.startTime,
            endTime: body.endTime,
            zoomJoinUrl: body.zoomJoinUrl,
            zoomMeetingId: body.zoomMeetingId,
            status: body.status || "scheduled",
            submissionId: body.submissionId,
            calEventTypeId: body.calEventTypeId,
            attendees: body.attendees,
          });
          return corsResponse({ success: true, id: iid });
        }
        case "updateInterviewStatus": {
          await ctx.runMutation(api.interviews.updateStatus, {
            id: body.id,
            status: body.status,
            notes: body.notes,
          });
          return corsResponse({ success: true });
        }
        case "deleteInterview": {
          await ctx.runMutation(api.interviews.remove, { id: body.id });
          return corsResponse({ success: true });
        }
        case "bulkUpsertInterviews": {
          const results = await ctx.runMutation(api.interviews.bulkUpsert, {
            interviews: body.interviews,
          });
          return corsResponse({ success: true, results });
        }

        // ── Email Templates ──
        case "listEmailTemplates": {
          const templates = await ctx.runQuery(api.emailTemplates.list);
          return corsResponse(templates);
        }
        case "upsertEmailTemplate": {
          const tid = await ctx.runMutation(api.emailTemplates.upsert, {
            trigger: body.trigger,
            subject: body.subject,
            body: body.body,
            enabled: body.enabled ?? true,
          });
          return corsResponse({ success: true, id: tid });
        }
        case "toggleEmailTemplate": {
          await ctx.runMutation(api.emailTemplates.toggleEnabled, {
            id: body.id,
            enabled: body.enabled,
          });
          return corsResponse({ success: true });
        }
        case "deleteEmailTemplate": {
          await ctx.runMutation(api.emailTemplates.remove, { id: body.id });
          return corsResponse({ success: true });
        }
        case "seedEmailTemplates": {
          await ctx.runMutation(api.emailTemplates.seedDefaults);
          return corsResponse({ success: true });
        }

        // ── Email Log ──
        case "logEmail": {
          const eid = await ctx.runMutation(api.emailLog.create, {
            submissionId: body.submissionId,
            interviewId: body.interviewId,
            trigger: body.trigger,
            to: body.to,
            subject: body.subject,
            body: body.body,
            status: body.status || "sent",
          });
          return corsResponse({ success: true, id: eid });
        }
        case "listEmailLog": {
          const log = await ctx.runQuery(api.emailLog.list);
          return corsResponse(log);
        }
        case "pendingEmails": {
          const pending = await ctx.runQuery(api.emailLog.pending);
          return corsResponse(pending);
        }

        // ── Settings ──
        case "getSettings": {
          const profile = await ctx.runQuery(api.settings.get, {
            key: "profile",
          });
          return corsResponse(profile || {});
        }
        case "updateProfile": {
          const profileData = {
            profileName: body.profileName || "",
            profileRole: body.profileRole || "",
            profileEmail: body.profileEmail || "",
            profilePhone: body.profilePhone || "",
            profilePhoto: body.profilePhoto || "",
          };
          await ctx.runMutation(api.settings.set, {
            key: "profile",
            value: JSON.stringify(profileData),
          });
          return corsResponse({ success: true });
        }
        case "updatePassword": {
          if (!body.newPassword || body.newPassword.length < 8) {
            return corsResponse(
              { error: "Password must be at least 8 characters" },
              400
            );
          }
          await ctx.runMutation(api.settings.set, {
            key: "adminPassword",
            value: JSON.stringify(body.newPassword),
          });
          return corsResponse({ success: true });
        }

        default:
          return corsResponse({ error: "Unknown action" }, 400);
      }
    } catch (e: any) {
      return corsResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/api/admin",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

// ─── Cal.com Webhook: Booking Created/Rescheduled ───
http.route({
  path: "/api/cal-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const payload = body.payload || body;

      // Extract booking data from Cal.com webhook
      const bookingUid = payload.uid || payload.bookingUid || "";
      if (!bookingUid) {
        return corsResponse({ success: false, error: "No booking UID" }, 400);
      }

      const attendees = payload.attendees || [];
      const firstAttendee = attendees[0] || {};

      const startTime = payload.startTime
        ? new Date(payload.startTime).getTime()
        : 0;
      const endTime = payload.endTime
        ? new Date(payload.endTime).getTime()
        : 0;

      // Extract Zoom URL from location or metadata
      const zoomUrl =
        payload.metadata?.videoCallUrl ||
        payload.location ||
        payload.meetingUrl ||
        "";

      const zoomMeetingId = zoomUrl
        ? (zoomUrl.match(/\/j\/(\d+)/)?.[1] || "")
        : "";

      await ctx.runMutation(api.interviews.upsert, {
        bookingUid,
        applicantEmail: firstAttendee.email || "",
        applicantName: firstAttendee.name || "",
        startTime,
        endTime,
        zoomJoinUrl: typeof zoomUrl === "string" ? zoomUrl : "",
        zoomMeetingId,
        status:
          body.triggerEvent === "BOOKING_CANCELLED" ? "cancelled" : "scheduled",
        calEventTypeId: payload.eventTypeId
          ? Number(payload.eventTypeId)
          : undefined,
        attendees: JSON.stringify(
          attendees.map((a: any) => ({
            name: a.name || "",
            email: a.email || "",
          }))
        ),
      });

      return corsResponse({ success: true });
    } catch (e: any) {
      return corsResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/api/cal-webhook",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

export default http;
