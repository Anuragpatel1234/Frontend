"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Clock, AlertCircle, CheckCircle, XCircle, HelpCircle } from "lucide-react"

// Mock exam data
const mockExam = {
  id: "1",
  title: "Mathematics - Chapter 3",
  subject: "Mathematics",
  class: "Class 8",
  duration: 60, // in minutes
  totalQuestions: 10,
  questions: [
    {
      id: 1,
      text: "What is the value of x in the equation 2x + 5 = 15?",
      points: 10,
      difficulty: "Easy",
      type: "MCQ",
      options: [
        { id: "a", text: "5" },
        { id: "b", text: "7.5" },
        { id: "c", text: "10" },
        { id: "d", text: "3" },
      ],
      correctAnswer: "a",
    },
    {
      id: 2,
      text: "If a triangle has sides of length 3, 4, and 5, what type of triangle is it?",
      points: 10,
      difficulty: "Medium",
      type: "MCQ",
      options: [
        { id: "a", text: "Equilateral" },
        { id: "b", text: "Isosceles" },
        { id: "c", text: "Scalene" },
        { id: "d", text: "Right-angled" },
      ],
      correctAnswer: "d",
    },
    {
      id: 3,
      text: "What is the area of a circle with radius 4 units?",
      points: 10,
      difficulty: "Medium",
      type: "MCQ",
      options: [
        { id: "a", text: "8π square units" },
        { id: "b", text: "16π square units" },
        { id: "c", text: "4π square units" },
        { id: "d", text: "12π square units" },
      ],
      correctAnswer: "b",
    },
    {
      id: 4,
      text: "Simplify: (3x² + 2x - 1) - (2x² - 3x + 4)",
      points: 10,
      difficulty: "Hard",
      type: "MCQ",
      options: [
        { id: "a", text: "x² + 5x - 5" },
        { id: "b", text: "5x² - x - 5" },
        { id: "c", text: "x² + 5x + 3" },
        { id: "d", text: "x² + 5x - 3" },
      ],
      correctAnswer: "a",
    },
    {
      id: 5,
      text: "The formula for the area of a circle is _______.",
      points: 10,
      difficulty: "Easy",
      type: "Fill-up",
      correctAnswer: "πr²",
    },
    {
      id: 6,
      text: "If f(x) = 2x² - 3x + 1, what is f(2)?",
      points: 10,
      difficulty: "Medium",
      type: "MCQ",
      options: [
        { id: "a", text: "3" },
        { id: "b", text: "5" },
        { id: "c", text: "7" },
        { id: "d", text: "9" },
      ],
      correctAnswer: "b",
    },
    {
      id: 7,
      text: "The Earth revolves around the Sun.",
      points: 10,
      difficulty: "Easy",
      type: "True/False",
      correctAnswer: "True",
    },
    {
      id: 8,
      text: "Solve for x: |x - 3| = 5",
      points: 10,
      difficulty: "Hard",
      type: "MCQ",
      options: [
        { id: "a", text: "x = -2 or x = 8" },
        { id: "b", text: "x = -5 or x = 5" },
        { id: "c", text: "x = -2 or x = 5" },
        { id: "d", text: "x = 3 only" },
      ],
      correctAnswer: "a",
    },
    {
      id: 9,
      text: "The value of 5! (5 factorial) is _______.",
      points: 10,
      difficulty: "Easy",
      type: "Fill-up",
      correctAnswer: "120",
    },
    {
      id: 10,
      text: "If a square has a perimeter of 20 units, what is its area?",
      points: 10,
      difficulty: "Medium",
      type: "MCQ",
      options: [
        { id: "a", text: "16 square units" },
        { id: "b", text: "25 square units" },
        { id: "c", text: "36 square units" },
        { id: "d", text: "100 square units" },
      ],
      correctAnswer: "b",
    },
  ],
}

export default function ExamPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(mockExam.duration * 60) // in seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [examStarted, setExamStarted] = useState(false)
  const [fillUpAnswer, setFillUpAnswer] = useState("")

  // Format time left as MM:SS
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Get time color based on remaining time
  const getTimeColor = () => {
    const totalSeconds = mockExam.duration * 60
    const percentLeft = (timeLeft / totalSeconds) * 100

    if (percentLeft > 50) return "bg-green-600"
    if (percentLeft > 25) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Timer effect
  useEffect(() => {
    if (!examStarted) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [examStarted])

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: value,
    }))
  }

  const handleFillUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFillUpAnswer(e.target.value)
  }

  const handleFillUpBlur = () => {
    if (fillUpAnswer.trim()) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion]: fillUpAnswer,
      }))
    }
  }

  const handleNext = () => {
    if (currentQuestion < mockExam.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)

      // Reset fill-up answer when moving to next question
      if (mockExam.questions[currentQuestion + 1].type === "Fill-up") {
        setFillUpAnswer(answers[currentQuestion + 1] || "")
      }
    }
  }

  const handleSubmit = () => {
    // Check if all questions are answered
    if (Object.keys(answers).length < mockExam.questions.length) {
      setShowWarning(true)
      return
    }

    setIsSubmitting(true)

    // Calculate score
    let score = 0
    let totalAnswered = 0

    Object.entries(answers).forEach(([questionIndex, answer]) => {
      totalAnswered++
      const question = mockExam.questions[Number.parseInt(questionIndex)]
      if (question.correctAnswer === answer) {
        score += question.points
      }
    })

    const percentage = Math.round((score / (mockExam.questions.length * 10)) * 100)

    // Determine rating based on percentage
    let rating = "Needs Improvement"
    if (percentage >= 90) rating = "Excellent"
    else if (percentage >= 75) rating = "Good"
    else if (percentage >= 60) rating = "Satisfactory"

    // In a real app, you would send this to your backend
    console.log("Exam submitted:", {
      examId: params.id,
      answers,
      score,
      percentage,
      rating,
      timeSpent: mockExam.duration * 60 - timeLeft,
      attemptNumber: 1,
      maxAttempts: 5,
    })

    // Redirect to results page
    setTimeout(() => {
      router.push(
        `/result/${params.id}?score=${percentage}&correct=${score / 10}&total=${mockExam.questions.length}&rating=${rating}`,
      )
    }, 1000)
  }

  const startExam = () => {
    setExamStarted(true)
    setShowInstructions(false)
  }

  const question = mockExam.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / mockExam.questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-gradient-to-r from-indigo-800 to-indigo-700 text-white py-4 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <span className="bg-white text-indigo-800 rounded-lg p-1 mr-2">TA</span>
            Tech Anubhavi
          </h1>
          {examStarted && (
            <div className="flex items-center gap-4">
              <div className={`${getTimeColor()} px-4 py-2 rounded-md flex items-center shadow-md`}>
                <Clock className="h-4 w-4 mr-2" />
                <span className="font-mono font-bold">{formatTimeLeft()}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showInstructions ? (
          <div className="max-w-4xl mx-auto">
            <Card className="mb-4 border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-700 to-indigo-800 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl">{mockExam.title}</CardTitle>
                    <CardDescription className="text-indigo-200">
                      {mockExam.subject} | {mockExam.class}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Exam Instructions</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        This exam contains <strong>{mockExam.totalQuestions} questions</strong> of various types (MCQ,
                        Fill-in-the-blanks, True/False).
                      </li>
                      <li>
                        Total time allowed is <strong>{mockExam.duration} minutes</strong>.
                      </li>
                      <li>
                        Each question is worth <strong>10 points</strong>, for a total of {mockExam.totalQuestions * 10}{" "}
                        points.
                      </li>
                      <li>You cannot go back to previous questions once answered.</li>
                      <li>The exam will automatically submit when the time expires.</li>
                      <li>You can see your progress in the navigation bar at the bottom.</li>
                      <li>Questions will be randomized to prevent cheating.</li>
                      <li>
                        <strong>You can attempt this exam up to 5 times.</strong> This is attempt 1 of 5.
                      </li>
                      <li>Your highest score from all attempts will be considered for your final grade.</li>
                    </ul>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2 text-indigo-800">Exam Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-indigo-600">Subject</p>
                        <p className="font-medium">{mockExam.subject}</p>
                      </div>
                      <div>
                        <p className="text-sm text-indigo-600">Class</p>
                        <p className="font-medium">{mockExam.class}</p>
                      </div>
                      <div>
                        <p className="text-sm text-indigo-600">Duration</p>
                        <p className="font-medium">{mockExam.duration} minutes</p>
                      </div>
                      <div>
                        <p className="text-sm text-indigo-600">Total Questions</p>
                        <p className="font-medium">{mockExam.totalQuestions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-indigo-600">Maximum Score</p>
                        <p className="font-medium">{mockExam.totalQuestions * 10} points</p>
                      </div>
                      <div>
                        <p className="text-sm text-indigo-600">Passing Score</p>
                        <p className="font-medium">60%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Important Note</h4>
                        <p className="text-yellow-700 text-sm">
                          Once you start the exam, the timer will begin and cannot be paused. Make sure you have a
                          stable internet connection and enough time to complete the exam.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between p-4 bg-slate-50 border-t">
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button
                  onClick={startExam}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                >
                  Start Exam
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Card className="mb-4 border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-700 to-indigo-800 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{mockExam.title}</CardTitle>
                    <CardDescription className="text-indigo-200">
                      {mockExam.subject} | {mockExam.class} | Question {currentQuestion + 1} of{" "}
                      {mockExam.questions.length}
                    </CardDescription>
                  </div>
                  <Badge className="bg-white text-indigo-800 px-3 py-1">{question.points} points</Badge>
                </div>
                <Progress value={progress} className="h-2 mt-4" indicatorClassName="bg-indigo-400" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        question.difficulty === "Easy"
                          ? "border-green-500 text-green-700 bg-green-50"
                          : question.difficulty === "Medium"
                            ? "border-yellow-500 text-yellow-700 bg-yellow-50"
                            : "border-red-500 text-red-700 bg-red-50"
                      }
                    >
                      {question.difficulty}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        question.type === "MCQ"
                          ? "border-blue-500 text-blue-700 bg-blue-50"
                          : question.type === "Fill-up"
                            ? "border-purple-500 text-purple-700 bg-purple-50"
                            : "border-green-500 text-green-700 bg-green-50"
                      }
                    >
                      {question.type}
                    </Badge>
                    <div className="text-lg font-medium">{question.text}</div>
                  </div>

                  {question.type === "MCQ" && (
                    <RadioGroup
                      value={answers[currentQuestion] || ""}
                      onValueChange={handleAnswerChange}
                      className="space-y-3"
                    >
                      {question.options.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => handleAnswerChange(option.id)}
                        >
                          <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                          <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer">
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {question.type === "Fill-up" && (
                    <div className="space-y-2">
                      <Label htmlFor="fill-answer">Your Answer</Label>
                      <input
                        id="fill-answer"
                        type="text"
                        value={fillUpAnswer}
                        onChange={handleFillUpChange}
                        onBlur={handleFillUpBlur}
                        placeholder="Type your answer here"
                        className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  )}

                  {question.type === "True/False" && (
                    <RadioGroup
                      value={answers[currentQuestion] || ""}
                      onValueChange={handleAnswerChange}
                      className="space-y-3"
                    >
                      <div
                        className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => handleAnswerChange("True")}
                      >
                        <RadioGroupItem value="True" id="true" />
                        <Label htmlFor="true" className="flex-1 cursor-pointer">
                          True
                        </Label>
                      </div>
                      <div
                        className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => handleAnswerChange("False")}
                      >
                        <RadioGroupItem value="False" id="false" />
                        <Label htmlFor="false" className="flex-1 cursor-pointer">
                          False
                        </Label>
                      </div>
                    </RadioGroup>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between p-4 bg-slate-50 border-t">
                <Button variant="outline" className="flex items-center gap-1" onClick={() => setShowInstructions(true)}>
                  <HelpCircle className="h-4 w-4" />
                  Instructions
                </Button>

                <div className="flex gap-2 ml-auto">
                  {currentQuestion === mockExam.questions.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Exam"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                    >
                      Next
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>

            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-sm font-medium mb-3 text-slate-600">Question Navigator</h3>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {mockExam.questions.map((_, index) => (
                  <Button
                    key={index}
                    variant={answers[index] ? "default" : "outline"}
                    className={`h-10 w-10 ${
                      answers[index]
                        ? "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
                        : "border-slate-300"
                    } ${currentQuestion === index ? "ring-2 ring-offset-2 ring-indigo-500" : ""}`}
                    onClick={() => setCurrentQuestion(index)}
                    disabled={index > currentQuestion} // Disable future questions
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </div>

            {showWarning && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Unanswered Questions</h4>
                  <p className="text-amber-700 text-sm">
                    You have {mockExam.questions.length - Object.keys(answers).length} unanswered questions. Are you
                    sure you want to submit?
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowWarning(false)}
                      className="border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                      Continue Exam
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowWarning(false)
                        setIsSubmitting(true)
                        handleSubmit()
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      Submit Anyway
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Dialog for Leaving Exam */}
      <Dialog open={false}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Exam?</DialogTitle>
            <DialogDescription>Are you sure you want to leave the exam? Your progress will be lost.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button variant="destructive">
              <CheckCircle className="h-4 w-4 mr-2" />
              Leave Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
