import { askAi } from "../services/openRouter.service.js";

export class ResumeParser {
  static async parse(resumeText) {
    const messages = [
      {
        role: "system",
        content: `
Extract structured data from the resume and evaluate its ATS (Applicant Tracking System) compatibility. Isolate Skills, Frameworks, and Project Context.

Return strictly JSON:
{
  "role": "string, detected role (e.g., Full Stack Developer)",
  "experience": "string, detected experience (e.g., 2 years or Entry Level)",
  "skills": ["Java", "Python", "C++", "etc"],
  "frameworks": ["React", "Node.js", "Spring Boot", "etc"],
  "projects": [
    "Project 1 Name: Description of technologies used and what it does",
    "Project 2 Name: Description..."
  ],
  "atsScore": number,
  "atsFeedback": "string, a short actionable sentence on how to improve this resume for ATS",
  "suggestions": ["suggestion 1", "suggestion 2"],
  "shortcomings": ["shortcoming 1", "shortcoming 2"]
}
`
      },
      {
        role: "user",
        content: resumeText
      }
    ];

    try {
        let aiResponse = await askAi(messages);
        
        // Strip markdown formatting if present
        aiResponse = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
        
        return JSON.parse(aiResponse);
    } catch (error) {
        console.error("ResumeParser Error:", error);
        return { 
          role: "", 
          experience: "", 
          skills: [], 
          frameworks: [], 
          projects: [], 
          atsScore: null, 
          atsFeedback: "Failed to analyze resume.",
          suggestions: [],
          shortcomings: []
        };
    }
  }
}