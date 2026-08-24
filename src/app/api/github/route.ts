import { NextResponse } from "next/server";
import { profile } from "@/content/profile";

export const runtime = "nodejs";
/* Contribution data changes at most once a day, so cache hard. Without this
   every visitor spends one of your GitHub rate-limit calls. */
export const revalidate = 3600;

/**
 * GitHub's contribution calendar.
 *
 * Only available through the GraphQL API — the REST API has no equivalent,
 * which is why this needs a token at all. A classic token with NO scopes
 * ticked is enough for public contribution counts; don't grant it more.
 *
 * With no token set this returns 204 and the graph simply doesn't render —
 * the same graceful-absence rule the logos follow.
 */
const QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { date contributionCount contributionLevel }
          }
        }
      }
    }
  }
`;

const LEVEL: Record<string, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return new NextResponse(null, { status: 204 });

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: QUERY, variables: { login: profile.handle } }),
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`github ${res.status}`);

    const json = (await res.json()) as {
      data?: {
        user?: {
          contributionsCollection?: {
            contributionCalendar?: {
              totalContributions: number;
              weeks: {
                contributionDays: { date: string; contributionCount: number; contributionLevel: string }[];
              }[];
            };
          };
        };
      };
      errors?: { message: string }[];
    };

    if (json.errors?.length) throw new Error(json.errors[0].message);

    const cal = json.data?.user?.contributionsCollection?.contributionCalendar;
    if (!cal) return new NextResponse(null, { status: 204 });

    return NextResponse.json({
      total: cal.totalContributions,
      weeks: cal.weeks.map((w) =>
        w.contributionDays.map((d) => ({
          d: d.date,
          c: d.contributionCount,
          l: LEVEL[d.contributionLevel] ?? 0,
        }))
      ),
    });
  } catch (e) {
    console.error("[github]", (e as Error).message);
    return new NextResponse(null, { status: 204 });
  }
}
