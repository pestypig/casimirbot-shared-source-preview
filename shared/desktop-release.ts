import { z } from "zod";

export const DESKTOP_RELEASE_STATUS_SCHEMA_VERSION =
  "casimir_desktop_release_status/1" as const;
export const DESKTOP_SOURCE_REPOSITORY = "pestypig/casimirbot-" as const;

const GITHUB_REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;

export const isSeparateDesktopBinaryRepository = (candidate: string): boolean =>
  GITHUB_REPOSITORY_PATTERN.test(candidate) &&
  candidate.toLowerCase() !== DESKTOP_SOURCE_REPOSITORY.toLowerCase();

export const desktopReleaseVersionSchema = z
  .string()
  .regex(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/,
  );

export const isImmutableDesktopReleaseUrl = (
  candidate: string,
  version: string,
  installerFileName: string,
  repository?: string,
): boolean => {
  try {
    const url = new URL(candidate);
    const repositoryPath = repository
      ? `/${repository}`
      : /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/u.exec(url.pathname)?.[0];
    if (!repositoryPath) return false;
    const expectedPath = `${repositoryPath}/releases/download/desktop-v${version}/${installerFileName}`;
    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === expectedPath
    );
  } catch {
    return false;
  }
};

export const desktopReleaseUnavailableReasonSchema = z.enum([
  "not_configured",
  "invalid_configuration",
]);

export const desktopReleaseInfoSchema = z
  .object({
    platform: z.literal("windows"),
    arch: z.literal("x64"),
    version: desktopReleaseVersionSchema,
    installerFileName: z.string().min(1),
    downloadUrl: z.string().url(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    publisher: z.string().min(1),
    publishedAt: z.string().datetime().nullable(),
    casimirGate: z
      .object({
        verdict: z.literal("PASS"),
        certificateHash: z.string().regex(/^[a-f0-9]{64}$/),
        integrity: z.literal("OK"),
      })
      .strict(),
  })
  .strict()
  .superRefine((release, context) => {
    const expectedFileName = `CasimirBot-${release.version}-x64-setup.exe`;
    if (release.installerFileName !== expectedFileName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installerFileName"],
        message: "Installer filename does not match the approved version",
      });
    }
    if (
      !isImmutableDesktopReleaseUrl(
        release.downloadUrl,
        release.version,
        release.installerFileName,
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["downloadUrl"],
        message: "Download URL is not the exact immutable release asset",
      });
    }
  });

const desktopReleaseUnavailableSchema = z
  .object({
    schemaVersion: z.literal(DESKTOP_RELEASE_STATUS_SCHEMA_VERSION),
    available: z.literal(false),
    approved: z.literal(false),
    reason: desktopReleaseUnavailableReasonSchema,
  })
  .strict();

const desktopReleaseAvailableSchema = z
  .object({
    schemaVersion: z.literal(DESKTOP_RELEASE_STATUS_SCHEMA_VERSION),
    available: z.literal(true),
    approved: z.literal(true),
    release: desktopReleaseInfoSchema,
  })
  .strict();

export const desktopReleaseStatusSchema = z.discriminatedUnion("available", [
  desktopReleaseUnavailableSchema,
  desktopReleaseAvailableSchema,
]);

export type DesktopReleaseInfo = z.infer<typeof desktopReleaseInfoSchema>;
export type DesktopReleaseStatus = z.infer<typeof desktopReleaseStatusSchema>;
