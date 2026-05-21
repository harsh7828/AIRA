import fs from "fs"
import path from "path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.service.js";
import { transcribeAudio } from "../services/groq.service.js";
import { ResumeParser } from "../utils/ResumeParser.js";
import ttsService from "../services/ttsService.js";
import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";
import axios from "axios";

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume required" });
    }
    const filepath = req.file.path

    const fileBuffer = await fs.promises.readFile(filepath)
    const uint8Array = new Uint8Array(fileBuffer)

    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    let resumeText = "";

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      const pageText = content.items.map(item => item.str).join(" ");
      resumeText += pageText + "\n";
    }


    resumeText = resumeText
      .replace(/\s+/g, " ")
      .trim();

    const parsed = await ResumeParser.parse(resumeText);

    fs.unlinkSync(filepath)


    res.json({
      role: parsed.role,
      experience: parsed.experience,
      projects: parsed.projects,
      skills: parsed.skills,
      atsScore: parsed.atsScore,
      atsFeedback: parsed.atsFeedback,
      suggestions: parsed.suggestions || [],
      shortcomings: parsed.shortcomings || [],
      resumeText
    });

  } catch (error) {
    console.error(error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ message: error.message });
  }
};


export const generateQuestion = async (req, res) => {
  try {
    let { role, experience, mode, resumeText, projects, skills } = req.body

    role = role?.trim();
    experience = experience?.trim();
    mode = mode?.trim();

    if (!role || !experience || !mode) {
      return res.status(400).json({ message: "Role, Experience and Mode are required." })
    }

    const user = await User.findById(req.userId)

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    if (user.credits < 50) {
      return res.status(400).json({
        message: "Not enough credits. Minimum 50 required."
      });
    }

    const projectText = Array.isArray(projects) && projects.length
      ? projects.join(", ")
      : "None";

    const skillsText = Array.isArray(skills) && skills.length
      ? skills.join(", ")
      : "None";

    const safeResume = resumeText?.trim() || "None";

    let technicalProblemStr = "";
    let savedTechnicalProblem = "";
    if (mode === "Technical" && Array.isArray(skills)) {
      try {
        const problemBankPath = path.join(process.cwd(), "utils", "problem_bank.json");
        if (fs.existsSync(problemBankPath)) {
          const problemBank = JSON.parse(fs.readFileSync(problemBankPath, "utf-8"));
          const matchedProblems = problemBank.filter(p => p.relatedSkills.some(s => skills.includes(s)));
          if (matchedProblems.length > 0) {
            const randomProblem = matchedProblems[Math.floor(Math.random() * matchedProblems.length)];
            savedTechnicalProblem = `${randomProblem.title} - ${randomProblem.description}`;
            technicalProblemStr = `\nTechnical Problem Assigned for this interview: "${savedTechnicalProblem}". Do NOT ask the coding problem in Question 1. Start Question 1 with a conversational or conceptual question based on their resume to warm them up.`;
          }
        }
      } catch (err) {
        console.error("Failed to load problem bank", err);
      }
    }

    const userPrompt = `
    Role:${role}
    Experience:${experience}
    InterviewMode:${mode}
    Projects:${projectText}
    Skills:${skillsText},
    Resume:${safeResume}
    ${technicalProblemStr}
    `;

    if (!userPrompt.trim()) {
      return res.status(400).json({
        message: "Prompt content is empty."
      });
    }

    const messages = [

      {
        role: "system",
        content: `
You are a professional human interviewer conducting a ${mode} interview.

${mode === "Technical" ? `
- Focus on technical depth, data structures, algorithms, system design, and the candidate's specific skills: ${skillsText}.
- For Question 1, start with a conversational or conceptual question based on their projects: ${projectText} to warm them up.
- DO NOT ask the coding problem in Question 1.
- **CRITICAL REQUIREMENT**: You MUST include at least 1 PRACTICAL coding question in this interview. Question 3 (medium difficulty) should be the PRACTICAL coding question where the candidate writes actual code.
- The coding question should be related to their skills: ${skillsText}
` : `
- Focus on Soft Skills, behavioral patterns (STAR method), situational judgment, teamwork, leadership, and cultural fit.
- Ask questions like: "Tell me about a time you handled a conflict in a team," or "How do you prioritize tasks under pressure?"
- Relate these to their specific experience: ${experience}.
`}

Generate exactly 5 interview questions.
Each question must contain between 20 and 40 words to be descriptive.

Difficulty progression:
Question 1 → easy (Introduction/Warm-up)
Question 2 → easy (Foundational/Situational)
Question 3 → medium (Scenario-based/Deep-dive) ${mode === "Technical" ? "- THIS SHOULD BE A PRACTICAL CODING QUESTION" : ""}
Question 4 → medium (Complex scenario/Architecture)
Question 5 → hard (Challenging situation/Stress test)

Return strictly a JSON array of exactly 5 objects. Each object must have:
- "question": "The question string"
- "questionType": "CONCEPTUAL" (for explanations) or "PRACTICAL" (for coding/DSA). 
- "timeLimit": For "PRACTICAL" assign 900 (15 minutes for coding). For "CONCEPTUAL" in Technical mode assign 300. For "CONCEPTUAL" in HR mode assign 180.

${mode === "Technical" ? `**IMPORTANT**: For Technical interviews, Question 3 MUST be of type "PRACTICAL" with timeLimit 900. This is where the candidate writes actual code in the Monaco Editor.` : ''}

Example output format for Technical mode:
[
  { "question": "Tell me about your experience with...", "questionType": "CONCEPTUAL", "timeLimit": 300 },
  { "question": "Explain the concept of...", "questionType": "CONCEPTUAL", "timeLimit": 300 },
  { "question": "Write a function to solve...", "questionType": "PRACTICAL", "timeLimit": 900 },
  { "question": "How would you optimize...", "questionType": "CONCEPTUAL", "timeLimit": 300 },
  { "question": "Design a system that...", "questionType": "CONCEPTUAL", "timeLimit": 300 }
]

Example output format for HR mode:
[
  { "question": "...", "questionType": "CONCEPTUAL", "timeLimit": 180 }
]
`
      }
      ,
      {
        role: "user",
        content: userPrompt
      }
    ];


    const aiResponse = await askAi(messages)

    if (!aiResponse || !aiResponse.trim()) {
           
      return res.status(500).json({
        message: "AI returned empty response."
      });

    }

    let aiResponseStr = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
    let questionsArray;
    try {
      questionsArray = JSON.parse(aiResponseStr);
    } catch (err) {
      return res.status(500).json({ message: "Failed to parse AI response as JSON." });
    }

    if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
      return res.status(500).json({ message: "AI failed to generate valid questions array." });
    }

    // Server-side validation: Ensure at least 1 PRACTICAL question for Technical mode
    if (mode === "Technical") {
      const hasPractical = questionsArray.some(q => q.questionType === "PRACTICAL");
      if (!hasPractical) {
        console.log("AI did not generate any PRACTICAL question. Forcing Question 3 to be PRACTICAL.");
        // Force Question 3 (index 2) to be PRACTICAL with 900 seconds time limit
        if (questionsArray.length > 2) {
          questionsArray[2].questionType = "PRACTICAL";
          questionsArray[2].timeLimit = 900;
          // The Monaco Editor will be shown and the candidate will write code
        }
      }

      // Ensure all PRACTICAL questions have 900 seconds (15 minutes) time limit
      questionsArray.forEach(q => {
        if (q.questionType === "PRACTICAL") {
          q.timeLimit = 900;
        }
      });
    }

    user.credits -= 50;
    await user.save();

    const interview = await Interview.create({
      userId: user._id,
      role,
      experience,
      mode,
      resumeText: safeResume,
      technicalProblem: savedTechnicalProblem,
      questions: questionsArray.map((q, index) => ({
        question: q.question,
        questionType: q.questionType || "CONCEPTUAL",
        difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
        timeLimit: q.timeLimit || 120,
      }))
    })

    res.json({
      interviewId: interview._id,
      creditsLeft: user.credits,
      userName: user.name,
      mode: interview.mode,
      questions: interview.questions
    });
  } catch (error) {
    return res.status(500).json({message:`Failed to create interview: ${error.message}`})
  }
}


export const submitAnswer = async (req, res) => {
  try {
    let { interviewId, questionIndex, answer, timeTaken } = req.body
    
    questionIndex = parseInt(questionIndex, 10);
    timeTaken = parseInt(timeTaken, 10);

    let verbalAnswer = "";
    if (req.file) {
      try {
        verbalAnswer = await transcribeAudio(req.file.path);
        fs.unlinkSync(req.file.path);
      } catch (err) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(500).json({message: `Failed to transcribe audio: ${err.message}`});
      }
    }

    // Filter out common Whisper AI silence hallucinations
    const cleanVerbal = verbalAnswer.trim().toLowerCase();
    const hallucinations = ["thank you.", "thank you", "thanks for watching.", "thanks for watching", "subscribe", "bye", "bye.", ""];
    if (hallucinations.includes(cleanVerbal)) {
      verbalAnswer = "";
    }

    const combinedAnswer = `[Verbal Explanation]: ${verbalAnswer || "None provided"}\n[Code/Text Submitted]: ${answer || "None provided"}`;

    const interview = await Interview.findById(interviewId)
    const question = interview.questions[questionIndex]
    const isLastQuestion = questionIndex >= interview.questions.length - 1;


    // If no answer
    if (!answer && !verbalAnswer) {
      question.score = 0;
      question.feedback = "You did not submit an answer.";
      question.answer = "";

      await interview.save();

      return res.json({
        feedback: question.feedback
      });
    }

    // If time exceeded
    if (timeTaken > question.timeLimit) {
      question.score = 0;
      question.feedback = "Time limit exceeded. Answer not evaluated.";
      question.answer = answer;

      await interview.save();

      return res.json({
        feedback: question.feedback
      });
    }


    const messages = [
      {
        role: "system",
        content: `
You are a professional human interviewer evaluating a candidate's answer in a ${interview.mode} interview.

Evaluate naturally and fairly, like a real person would.

Score the answer in these areas (0 to 10):

1. Confidence – Does the answer sound clear, confident, and well-presented?
2. Communication – Is the language simple, clear, and easy to understand?
3. Correctness – 
   ${interview.mode === "Technical" ? "Is the technical logic accurate? Does it address the specific technical challenge or architectural trade-off?" : "Does the answer show high EQ, maturity, and a professional approach to the situation?"}

Rules:
- Be realistic and unbiased.
- Do not give random high scores.
- If the answer is weak, score low.
- If the answer is completely unrelated, meaningless, or just a few filler words, score 0 and explicitly state that a valid answer was not provided.
- If the answer is strong and detailed, score high.
- ${interview.mode === "Technical" ? "Evaluate the code efficiency (O(n) etc.) if applicable." : "Evaluate behavioral depth and situational awareness."}
- Consider clarity, structure, and relevance.

Calculate:
finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

Feedback Rules:
- Write natural human feedback.
- 15 to 40 words only.
- Sound like real interview feedback.
- You will receive a [Verbal Explanation] and a [Code/Text Submitted].
- If they wrote code, comment on its efficiency or logic. If they spoke an explanation, comment on their approach. Address BOTH in your feedback.
- Do NOT explain scoring.
- Keep tone professional and honest.
${!isLastQuestion ? `
Dynamic Follow-up Question Rules:
- You must generate the next question based on the candidate's answer and their Resume/Projects.
${interview.mode === "Technical" ? `
${interview.technicalProblem && questionIndex === 0 ? `- This is Question 2. You MUST now transition to the coding round. Ask them to solve the following problem: "${interview.technicalProblem}". Assign "nextQuestionType": "PRACTICAL" and "nextQuestionTimeLimit": 900.` : ''}
${interview.technicalProblem && questionIndex > 0 ? `- The coding problem has been asked. Proceed with a technical follow-up regarding their code logic or projects.` : ''}
- Ask a follow-up question specifically about a Project from their resume while relating it to their answer.
` : `
- Focus on Behavioral follow-ups. If they mentioned a situation, ask about the 'Result' or 'What they learned'.
- Do NOT ask for code. Assign type "CONCEPTUAL" and timeLimit 180.
`}
- The next question must be a single complete sentence, between 15 and 35 words.` : ''}

Return ONLY valid JSON in this format:

{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "short human feedback"${!isLastQuestion ? `,\n  "nextQuestion": "The dynamic follow-up question string",\n  "nextQuestionType": "CONCEPTUAL or PRACTICAL",\n  "nextQuestionTimeLimit": number (120 for CONCEPTUAL, 900 for PRACTICAL)` : ''}
}
`
      }
      ,
      {
        role: "user",
        content: `
Interview Mode: ${interview.mode}
Candidate Resume: ${interview.resumeText || 'None'}

Question: ${question.question}
Answer:
${combinedAnswer}
`
      }
    ];


    let aiResponse = await askAi(messages)
    aiResponse = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(aiResponse);

    question.answer = combinedAnswer;
    question.confidence = parsed.confidence;
    question.communication = parsed.communication;
    question.correctness = parsed.correctness;
    question.score = parsed.finalScore;
    question.feedback = parsed.feedback;

    if (!isLastQuestion && parsed.nextQuestion) {
      interview.questions[questionIndex + 1].question = parsed.nextQuestion;
      interview.questions[questionIndex + 1].questionType = parsed.nextQuestionType || "CONCEPTUAL";
      interview.questions[questionIndex + 1].timeLimit = parsed.nextQuestionTimeLimit || 120;
    }

    await interview.save();


    return res.status(200).json({
      feedback: parsed.feedback,
      nextQuestion: !isLastQuestion ? parsed.nextQuestion : null,
      answer: answer,
      transcription: verbalAnswer
    })
  } catch (error) {
    return res.status(500).json({message:`Failed to submit answer: ${error.message}`})
  }
}


export const finishInterview = async (req,res) => {
  try {
    const {
      interviewId, 
      behavioralData, 
      sentimentScore, 
      activeListeningNods, 
      engagementLevel 
    } = req.body;
    
    const interview = await Interview.findById(interviewId);
    if(!interview){
      return res.status(400).json({message:"failed to find Interview"});
    }

    const totalQuestions = interview.questions.length;

    let totalScore = 0;
    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalScore += q.score || 0;
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const finalScore = totalQuestions
      ? totalScore / totalQuestions
      : 0;

    const avgConfidence = totalQuestions
      ? totalConfidence / totalQuestions
      : 0;

    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;

    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

    interview.finalScore = finalScore;
    interview.status = "completed";
    
    // Save Prism behavioral data if provided
    if (behavioralData) {
      interview.behavioralData = behavioralData;
      
      // Extract and save gaze analysis
      if (behavioralData.gazeZoneDistribution) {
        interview.gazeAnalysis = {
          distribution: behavioralData.gazeZoneDistribution,
          totalDistractionTime: behavioralData.totalDistractionTime || 0,
          totalThinkingTime: behavioralData.totalThinkingTime || 0,
        };
      }
    }
    
    // Save enhanced behavioral metrics
    if (sentimentScore !== undefined) {
      interview.sentimentScore = Math.max(0, Math.min(1, sentimentScore));
    }
    
    if (activeListeningNods !== undefined) {
      interview.activeListeningNods = Math.max(0, activeListeningNods);
    }
    
    if (engagementLevel) {
      interview.engagementLevel = engagementLevel;
    }

    await interview.save();

    return res.status(200).json({
      finalScore: Number(finalScore.toFixed(1)),
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions.map((q) => ({
        question: q.question,
        score: q.score || 0,
        feedback: q.feedback || "",
        confidence: q.confidence || 0,
        communication: q.communication || 0,
        correctness: q.correctness || 0,
      })),
      behavioralData: interview.behavioralData,
      // Enhanced behavioral metrics
      sentimentScore: interview.sentimentScore,
      activeListeningNods: interview.activeListeningNods,
      engagementLevel: interview.engagementLevel,
      gazeAnalysis: interview.gazeAnalysis,
    });
  } catch (error) {
    return res.status(500).json({message:`Failed to finish interview: ${error.message}`});
  }
}


export const getMyInterviews = async (req,res) => {
  try {
    const interviews = await Interview.find({userId:req.userId})
    .sort({ createdAt: -1 })
    .select("role experience mode finalScore status createdAt");

    return res.status(200).json(interviews)

  } catch (error) {
     return res.status(500).json({message:`Failed to fetch interviews: ${error.message}`})
  }
}

export const getInterviewReport = async (req,res) => {
  try {
    const interview = await Interview.findById(req.params.id)

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }


    const totalQuestions = interview.questions.length;

    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });
    const avgConfidence = totalQuestions
      ? totalConfidence / totalQuestions
      : 0;

    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;

    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

       return res.json({
      finalScore: interview.finalScore,
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions,
      behavioralData: interview.behavioralData || null,
    });

  } catch (error) {
    return res.status(500).json({message:`Failed to fetch interview report: ${error.message}`})
  }
}

export const synthesizeSpeech = async (req, res) => {
  try {
    const { text, gender } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text is required for TTS.", fallback: true });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(503).json({ message: "ElevenLabs API key is not configured.", fallback: true });
    }

    // Use the TTS service with caching
    const voiceType = gender === "male" ? "interviewer" : "default";
    const audioResult = await ttsService.textToSpeech(text, voiceType);

    // Stream the cached audio file
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000");
    fs.createReadStream(audioResult.audioPath).pipe(res);

  } catch (error) {
    // Use the actual HTTP status from ElevenLabs (e.g. 401, 429) if available,
    // otherwise fall back to 503 so the client knows to use browser TTS.
    const statusCode = error.status || 503;
    console.error(`TTS Error [${statusCode}]:`, error.message || error);
    res.status(statusCode).json({
      message: "ElevenLabs TTS unavailable. Falling back to browser voice.",
      error: error.message || "Unknown error",
      fallback: true
    });
  }
}

export const getCacheStats = async (req, res) => {
  try {
    const stats = ttsService.getCacheStats();
    return res.status(200).json(stats);
  } catch (error) {
    return res.status(500).json({ message: `Failed to get cache stats: ${error.message}` });
  }
};

export const clearCache = async (req, res) => {
  try {
    ttsService.clearCache();
    return res.status(200).json({ message: "Cache cleared successfully" });
  } catch (error) {
    return res.status(500).json({ message: `Failed to clear cache: ${error.message}` });
  }
};
