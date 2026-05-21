/** Canonical study_style values — keep profile setup and profile edit in sync. */
export const STUDY_STYLE_OPTIONS = [
  "Visual Learner",
  "Auditory Learner",
  "Hands-on",
  "Discussion-based",
] as const;

export type StudyStyleOption = (typeof STUDY_STYLE_OPTIONS)[number];

/** Map old profile-edit labels to canonical values (one-time compatibility). */
const LEGACY_STUDY_STYLE_MAP: Record<string, StudyStyleOption> = {
  Visual: "Visual Learner",
  Auditory: "Auditory Learner",
  "Reading/Writing": "Discussion-based",
  Kinesthetic: "Hands-on",
};

export function normalizeStudyStyles(styles: string[] | null | undefined): string[] {
  if (!styles?.length) return [];
  const canonical = new Set<string>();
  for (const style of styles) {
    const mapped = LEGACY_STUDY_STYLE_MAP[style] ?? style;
    if ((STUDY_STYLE_OPTIONS as readonly string[]).includes(mapped)) {
      canonical.add(mapped);
    }
  }
  return Array.from(canonical);
}
