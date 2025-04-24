// server.js - Complete MERN Backend for Exam Management System
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Models
const User = mongoose.model('User', {
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['principal', 'teacher', 'student'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const Exam = mongoose.model('Exam', {
  title: String,
  description: String,
  subject: String,
  duration: Number,
  questionCount: Number,
  maxAttempts: { type: Number, default: 5 },
  passingScore: { type: Number, default: 60 },
  isPublished: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const Question = mongoose.model('Question', {
  questionText: String,
  options: [{ text: String, isCorrect: Boolean }],
  marks: { type: Number, default: 1 },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Result = mongoose.model('Result', {
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: Number,
  totalQuestions: Number,
  percentage: Number,
  rating: String,
  attemptNumber: Number,
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOption: Number,
    isCorrect: Boolean
  }],
  submittedAt: { type: Date, default: Date.now }
});

// Auth Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id);
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) is not allowed to access this resource`
      });
    }
    next();
  };
};

// Routes

// Auth Routes
app.post('/api/auth/register', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['principal', 'teacher', 'student'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = new User(req.body);
    await user.save();
    const token = jwt.sign({ user: { id: user.id, role: user.role } }, process.env.JWT_SECRET, { expiresIn: '5h' });
    res.status(201).json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !await bcrypt.compare(req.body.password, user.password)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ user: { id: user.id, role: user.role } }, process.env.JWT_SECRET, { expiresIn: '5h' });
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Exam Routes
app.get('/api/exams', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') query.isPublished = true;
    if (req.user.role === 'teacher') query.createdBy = req.user._id;
    
    const exams = await Exam.find(query).populate('createdBy', 'name');
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/exams', auth, authorizeRoles('teacher', 'principal'), async (req, res) => {
  try {
    const exam = new Exam({ ...req.body, createdBy: req.user._id });
    await exam.save();
    res.status(201).json(exam);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Question Routes
app.get('/api/questions/random/:examId', auth, authorizeRoles('student'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (!exam.isPublished) return res.status(403).json({ error: 'Exam not published' });

    const questions = await Question.aggregate([
      { $match: { exam: exam._id } },
      { $sample: { size: exam.questionCount || 10 } },
      { $project: { 'options.isCorrect': 0 } }
    ]);

    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Result Routes
app.post('/api/results/:examId', auth, authorizeRoles('student'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    // Get attempt number
    const attemptCount = await Result.countDocuments({ exam: exam._id, user: req.user._id });
    const attemptNumber = attemptCount + 1;
    if (attemptNumber > exam.maxAttempts) {
      return res.status(400).json({ error: 'Maximum attempts reached' });
    }

    // Calculate score
    const questions = await Question.find({ _id: { $in: req.body.answers.map(a => a.question) } });
    let score = 0;
    const answers = req.body.answers.map(answer => {
      const question = questions.find(q => q._id.equals(answer.question));
      const isCorrect = question.options[answer.selectedOption]?.isCorrect;
      if (isCorrect) score += question.marks;
      return { ...answer, isCorrect };
    });

    const percentage = Math.round((score / exam.questionCount) * 100);
    let rating = 'Needs Improvement';
    if (percentage >= 90) rating = 'Excellent';
    else if (percentage >= 75) rating = 'Good';
    else if (percentage >= 60) rating = 'Satisfactory';

    // Get highest score
    const highestResult = await Result.findOne({ exam: exam._id, user: req.user._id })
      .sort('-score');
    const highestScore = highestResult ? Math.max(highestResult.score, score) : score;

    const result = new Result({
      exam: exam._id,
      user: req.user._id,
      score,
      totalQuestions: exam.questionCount,
      percentage,
      rating,
      attemptNumber,
      answers,
      highestScore
    });

    await result.save();
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/results/:examId/latest', auth, async (req, res) => {
  try {
    const result = await Result.findOne({ 
      exam: req.params.examId, 
      user: req.user._id 
    }).sort('-submittedAt');
    
    if (!result) return res.status(404).json({ error: 'No results found' });
    
    // Get highest score
    const highestResult = await Result.findOne({ 
      exam: req.params.examId, 
      user: req.user._id 
    }).sort('-score');
    
    res.json({
      ...result.toObject(),
      highestScore: highestResult?.score || result.score
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));