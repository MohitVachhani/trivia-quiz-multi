import { Router, Request, Response } from 'express';

const router = Router();

// Sample trivia questions endpoint
router.get('/questions', (req: Request, res: Response) => {
  // This is a sample - you'll replace with actual trivia data
  const sampleQuestions = [
    {
      id: 1,
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: 2
    },
    {
      id: 2,
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: 1
    }
  ];

  res.json({ questions: sampleQuestions });
});

// Submit answer endpoint
router.post('/answer', (req: Request, res: Response) => {
  const { questionId, answer } = req.body;
  
  // Basic validation
  if (!questionId || answer === undefined) {
    return res.status(400).json({ error: 'Question ID and answer are required' });
  }

  // This is a sample - you'll implement actual answer checking logic
  res.json({ 
    correct: true, // Replace with actual logic
    message: 'Answer submitted successfully' 
  });
});

export default router;