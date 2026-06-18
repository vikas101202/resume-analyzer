type AnalysisResult = {
  ats_score: number;
  impact_score: number;
  readability_score: number;
  strengths: string[];
  gaps: string[];
  skills: string[];
  suggestions: string[];
  summary: string;
};

export async function POST(request: Request) {
  const body = await request.json();
  const resumeText = String(body.resumeText || "");

  if (!resumeText.trim()) {
    return Response.json(
      { error: "No resume text received." },
      { status: 400 }
    );
  }

  const text = resumeText.toLowerCase();

  const strengths: string[] = [];
  const gaps: string[] = [];
  const skills: string[] = [];
  const suggestions: string[] = [];

  let contactScore = 0;
  let profileScore = 0;
  let projectScore = 0;
  let skillScore = 0;
  let educationScore = 0;
  let impactScore = 45;
  let readabilityScore = 70;

  if (text.includes("@")) {
    contactScore += 5;
    strengths.push("Email address found");
  } else {
    gaps.push("Email address missing");
  }

  const hasPhone = /\+?\d[\d\s-]{8,}/.test(resumeText);
  if (hasPhone) {
    contactScore += 5;
    strengths.push("Phone number found");
  } else {
    gaps.push("Phone number missing");
  }

  if (text.includes("hyderabad") || text.includes("india")) {
    contactScore += 3;
    strengths.push("Location included");
  }

  if (text.includes("linkedin")) {
    profileScore += 5;
    strengths.push("LinkedIn profile included");
  } else {
    gaps.push("LinkedIn profile missing");
    suggestions.push("Add your LinkedIn profile link.");
  }

  if (text.includes("github")) {
    profileScore += 5;
    strengths.push("GitHub profile included");
  } else {
    gaps.push("GitHub profile missing");
    suggestions.push("Add your GitHub profile link.");
  }

  if (text.includes("project")) {
    projectScore += 8;
    strengths.push("Projects section detected");
  } else {
    gaps.push("Projects section missing");
    suggestions.push("Add at least 2-3 strong projects.");
  }

  const projectMentions = (text.match(/project/g) || []).length;
  if (projectMentions >= 2) {
    projectScore += 5;
    strengths.push("Multiple projects detected");
  }

  if (text.includes("api") || text.includes("web app") || text.includes("backend")) {
    projectScore += 5;
    strengths.push("Relevant development projects found");
  }

  const detectedSkills = [
    "python",
    "django",
    "flask",
    "sql",
    "javascript",
    "react",
    "next.js",
    "typescript",
    "html",
    "css",
    "tensorflow",
    "keras",
    "git",
    "postman",
    "maven",
    "rest api",
    "openai api"
  ];

  for (const skill of detectedSkills) {
    if (text.includes(skill)) {
      skills.push(skill);
    }
  }

  if (skills.length >= 10) {
    skillScore = 23;
    strengths.push("Strong technical skills section");
  } else if (skills.length >= 7) {
    skillScore = 19;
    strengths.push("Good technical skills coverage");
  } else if (skills.length >= 4) {
    skillScore = 13;
  } else {
    skillScore = 7;
    gaps.push("Limited technical skills detected");
    suggestions.push("Add more role-relevant technical skills.");
  }

  if (text.includes("education") || text.includes("b.tech") || text.includes("computer science")) {
    educationScore += 8;
    strengths.push("Education section detected");
  } else {
    gaps.push("Education section missing");
  }

  if (text.includes("2026") || text.includes("expected")) {
    educationScore += 2;
  }

  const hasNumbers =
    /\d+%|\d+\+|\d+\s*users|\d+\s*projects|\d+\s*endpoints|\d+\s*apis/i.test(resumeText);

  if (hasNumbers) {
    impactScore += 20;
    strengths.push("Quantifiable achievements detected");
  } else {
    gaps.push("No measurable achievements found");
    suggestions.push("Add numbers, percentages, users, or impact metrics.");
  }

  if (text.includes("built") || text.includes("developed") || text.includes("implemented")) {
    impactScore += 10;
    strengths.push("Strong action verbs detected");
  }

  if (text.includes("docker")) {
    skillScore += 2;
  } else {
    suggestions.push("Consider learning Docker for backend roles.");
  }

  if (text.includes("aws")) {
    skillScore += 2;
  } else {
    suggestions.push("Adding cloud skills like AWS can strengthen your profile.");
  }

  if (text.includes("internship")) {
    impactScore += 5;
  } else {
    suggestions.push("Practical internship experience can improve employability.");
  }

  const wordCount = resumeText.trim().split(/\s+/).length;

  if (wordCount >= 300 && wordCount <= 700) {
    readabilityScore += 10;
    strengths.push("Resume length is suitable");
  } else if (wordCount < 250) {
    readabilityScore -= 10;
    gaps.push("Resume content appears too short");
  } else {
    readabilityScore -= 5;
    gaps.push("Resume may be slightly long");
  }

  contactScore = Math.min(contactScore, 15);
  profileScore = Math.min(profileScore, 10);
  projectScore = Math.min(projectScore, 20);
  skillScore = Math.min(skillScore, 25);
  educationScore = Math.min(educationScore, 10);
  impactScore = Math.min(impactScore, 90);
  readabilityScore = Math.min(Math.max(readabilityScore, 40), 95);

  const atsScore = Math.round(
    contactScore +
      profileScore +
      projectScore +
      skillScore +
      educationScore +
      Math.round((impactScore / 100) * 15) +
      Math.round((readabilityScore / 100) * 5)
  );

  const finalSuggestions =
    suggestions.length > 0
      ? suggestions.slice(0, 5)
      : ["Your resume has a strong structure. Keep improving project impact and clarity."];

  const result: AnalysisResult = {
    ats_score: Math.min(atsScore, 98),
    impact_score: Math.min(impactScore, 90),
    readability_score: readabilityScore,
    strengths: strengths.slice(0, 8),
    gaps: gaps.slice(0, 6),
    skills,
    suggestions: finalSuggestions,
    summary: `Resume analyzed successfully. ${skills.length} skills detected with weighted ATS scoring.`,
  };

  return Response.json(result);
}