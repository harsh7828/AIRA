import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { upload } from "../middlewares/multer.js"
import { analyzeResume, finishInterview, generateQuestion, getInterviewReport, getMyInterviews, submitAnswer, synthesizeSpeech, getCacheStats, clearCache } from "../controllers/interview.controller.js"




const interviewRouter = express.Router()

interviewRouter.post("/resume",isAuth,upload.single("resume"),analyzeResume)
interviewRouter.post("/generate-questions",isAuth,generateQuestion)
interviewRouter.post("/submit-answer",isAuth,upload.single("audio"),submitAnswer)
interviewRouter.post("/finish",isAuth,finishInterview)
interviewRouter.post("/tts", isAuth, synthesizeSpeech)

interviewRouter.get("/get-interview",isAuth,getMyInterviews)
interviewRouter.get("/report/:id",isAuth,getInterviewReport)
interviewRouter.get("/cache/stats", isAuth, getCacheStats)
interviewRouter.delete("/cache/clear", isAuth, clearCache)



export default interviewRouter