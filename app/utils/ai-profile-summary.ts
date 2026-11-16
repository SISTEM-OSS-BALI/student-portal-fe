import axios from "axios";
import type {
  CvEducation,
  CvExperience,
} from "../(view)/admission/dashboard/students-management/detail/[id]/cv/editor/types";

export interface ProfileSummaryCandidate {
  fullName?: string;
  jobTitle?: string;
  educations?: CvEducation[];
  experiences?: CvExperience[];
  skills?: Array<{ name?: string } | string>;
}

export function buildFallbackProfileSummary(
  candidate: ProfileSummaryCandidate,
): string {
  const educations = candidate.educations || [];
  const experiences = candidate.experiences || [];
  const skills = (candidate.skills || [])
    .map((s) => (typeof s === "string" ? s : s.name || ""))
    .filter(Boolean);

  const topEdu = educations[0];
  const topExp = experiences[0];

  const eduSchool = topEdu?.school_name?.trim();
  const eduMajor = (topEdu?.major || topEdu?.degree || "").trim();

  const expPos =
    topExp?.job_title?.trim() ||
    ((topExp as unknown as { position?: string })?.position?.trim() ?? "");
  const expComp = topExp?.company?.trim();

  // Skenario 1: Memiliki pengalaman kerja dan latar belakang pendidikan
  if (expPos && expComp && eduMajor) {
    return `Dedicated and detail-oriented professional with a solid academic foundation in ${eduMajor} and hands-on experience as ${expPos} at ${expComp}. Demonstrates strong teamwork, organizational capabilities, and cross-cultural communication skills, committed to driving impactful outcomes in an international environment.`;
  }

  // Skenario 2: Memiliki pengalaman kerja utama
  if (expPos && expComp) {
    return `Results-oriented professional with proven operational experience as ${expPos} at ${expComp}. Possesses strong problem-solving abilities, excellent team collaboration, and adaptable communication, dedicated to achieving high standards of work excellence.`;
  }

  // Skenario 3: Memiliki latar belakang pendidikan / fresh graduate
  if (eduMajor && eduSchool) {
    return `Motivated and proactive graduate with an academic background in ${eduMajor} from ${eduSchool}. Equipped with strong analytical foundations, fast learning agility, and collaborative skills, eager to contribute effectively and grow within a global environment.`;
  }

  if (eduMajor) {
    return `Ambitious and disciplined individual with a background in ${eduMajor}. Possesses strong critical thinking, interpersonal adaptability, and eagerness to contribute actively in dynamic professional settings.`;
  }

  // Skenario 4: Memiliki daftar keahlian
  if (skills.length > 0) {
    const skillList = skills.slice(0, 3).join(", ");
    return `Adaptable and motivated professional skilled in ${skillList}. Known for strong work ethics, effective communication, and commitment to delivering consistent, high-quality results.`;
  }

  // Skenario 5: Fallback umum profesional
  return `Motivated, adaptable, and forward-thinking individual with strong collaborative capabilities and cross-cultural awareness. Passionate about personal growth and dedicated to delivering positive contributions in dynamic environments.`;
}

export async function generateProfileSummaryText(
  candidate: ProfileSummaryCandidate,
): Promise<string> {
  const educations = candidate.educations || [];
  const experiences = candidate.experiences || [];
  const skills = (candidate.skills || [])
    .map((s) => (typeof s === "string" ? s : s.name || ""))
    .filter(Boolean);

  const topEdu = educations[0];
  const topExp = experiences[0];

  const prompt = [
    "Write a concise, compelling 2-3 sentence professional profile summary in formal English for an international CV.",
    candidate.fullName ? `Candidate Name: ${candidate.fullName}` : "",
    candidate.jobTitle ? `Target/Current Role: ${candidate.jobTitle}` : "",
    topEdu
      ? `Education: ${topEdu.degree || ""} ${topEdu.major || ""} from ${topEdu.school_name || ""}`
      : "",
    topExp
      ? `Experience: ${topExp.job_title || (topExp as unknown as { position?: string }).position || ""} at ${topExp.company || ""} (${topExp.description || ""})`
      : "",
    skills.length ? `Key Skills: ${skills.slice(0, 4).join(", ")}` : "",
    "Requirements: 2-3 sentences only, third-person professional CV style, formal English, no bullet points, no preamble, no markdown formatting.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await axios.post(
      "/internal-api/generate-cv-ai",
      {
        prompt,
        student_name: candidate.fullName,
      },
      {
        timeout: 20000,
        withCredentials: true,
      },
    );

    const generated =
      res.data?.response ||
      res.data?.result?.response ||
      res.data?.message ||
      "";

    if (typeof generated === "string" && generated.trim().length > 30) {
      let cleaned = generated.trim();
      cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, "");
      return cleaned;
    }
  } catch (err) {
    // Graceful fallback jika Ollama / AI service offline
    console.info(
      "[generateProfileSummaryText] AI service unavailable, using smart synthesis fallback.",
    );
  }

  return buildFallbackProfileSummary(candidate);
}
