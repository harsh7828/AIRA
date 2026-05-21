import mongoose from "mongoose";

const questionsSchema = new mongoose.Schema({
     question: String,
  difficulty: String,
  timeLimit: Number,
  questionType: String,
  answer: String,
  feedback: String,
  score: { type: Number, default: 0 },
  confidence: { type: Number, default: 0 },
communication: { type: Number, default: 0 },
correctness: { type: Number, default: 0 },
})


const interviewSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    role:{
        type:String,
        required:true
    },
    experience:{
        type:String,
        required:true
    },
    mode:{
        type:String,
        enum:["HR" ,"Technical"],
        required:true
    },
    resumeText:{
     type:String
    },
    technicalProblem:{
      type:String,
      default: ""
    },
    questions:[questionsSchema],

    finalScore: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["Incompleted", "completed"],
      default: "Incompleted",
    },

    // Prism behavioral analytics data (Enhanced)
    behavioralData: {
      type: Object,
      default: null
    },
    
    // Enhanced behavioral metrics for intelligent coaching
    sentimentScore: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1
    },
    
    activeListeningNods: {
      type: Number,
      default: 0,
      min: 0
    },
    
    engagementLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low"
    },
    
    // Gaze analysis metrics
    gazeAnalysis: {
      type: Object,
      default: null
    }
},{timestamps:true})

const Interview = mongoose.model("Interview" , interviewSchema)


export default Interview