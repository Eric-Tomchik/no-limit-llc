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
    // Auth check
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    // Get stored password
    const storedPassword = await ctx.runQuery(api.settings.get, {
      key: "adminPassword",
    });

    // Default password if none set
    const password = storedPassword || "NoLimit2024!";

    if (token !== password) {
      return corsResponse({ error: "Unauthorized" }, 401);
    }

    try {
      const body = await request.json();
      const { action } = body;

      switch (action) {
        case "stats": {
          const stats = await ctx.runQuery(api.submissions.stats);
          return corsResponse(stats);
        }

        case "list": {
          const list = await ctx.runQuery(api.submissions.list);
          return corsResponse(list);
        }

        case "updateStatus": {
          await ctx.runMutation(api.submissions.updateStatus, {
            id: body.id,
            status: body.status,
          });
          return corsResponse({ success: true });
        }

        case "updateNotes": {
          await ctx.runMutation(api.submissions.updateNotes, {
            id: body.id,
            notes: body.notes,
          });
          return corsResponse({ success: true });
        }

        case "delete": {
          await ctx.runMutation(api.submissions.remove, {
            id: body.id,
          });
          return corsResponse({ success: true });
        }

        case "updateAssignment": {
          await ctx.runMutation(api.submissions.updateAssignment, {
            id: body.id,
            assignedTo: body.assignedTo,
          });
          return corsResponse({ success: true });
        }

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

export default http;
