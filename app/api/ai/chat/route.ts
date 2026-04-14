import { NextRequest, NextResponse } from 'next/server'

const HEALTH_RESPONSES: Record<string, string[]> = {
  'hello|hi|hey': [
    "Hello! I'm Aarogya, your health assistant. How can I help you today? You can ask me about symptoms, medications, health tips, or general medical questions.",
  ],
  'appointment': [
    "To book an appointment, go to the **Appointments** section in your dashboard. You can select your doctor, preferred date and time, and describe your chief complaint.",
  ],
  'report|lab|test': [
    "Your lab reports are available in the **Lab Reports** section. Your doctor has access to them too. If you see abnormal values marked in red, please consult your doctor immediately.",
  ],
  'prescription|medicine|medication': [
    "Your prescriptions are recorded in your **Medical Records**. Always take medications as prescribed. Never stop a medication without consulting your doctor, especially antibiotics.",
  ],
  'blood pressure|bp|hypertension': [
    "Normal blood pressure is below 120/80 mmHg. Readings above 130/80 are considered elevated (hypertension). Reduce salt intake, exercise regularly, manage stress, and take prescribed medications consistently.",
  ],
  'diabetes|sugar|glucose': [
    "Diabetes management includes: monitoring blood sugar regularly, following a low-glycemic diet, regular exercise (30 min/day), taking medications on time, and regular HbA1c checks every 3 months.",
  ],
  'diet|nutrition|food': [
    "A balanced diet for good health: Include plenty of fruits and vegetables (5 servings/day), whole grains, lean proteins, and healthy fats. Limit processed foods, sugar, and salt. Stay hydrated with 8 glasses of water daily.",
  ],
  'exercise|workout|physical activity': [
    "WHO recommends at least 150 minutes of moderate aerobic activity per week (e.g., brisk walking, cycling). Strength training 2x/week. Start slow and gradually increase intensity.",
  ],
  'sleep|insomnia|rest': [
    "Adults need 7-9 hours of quality sleep. Tips: Maintain a consistent sleep schedule, keep your bedroom cool and dark, avoid screens 1 hour before bed, limit caffeine after 2 PM.",
  ],
  'stress|anxiety|mental health': [
    "Mental health is as important as physical health. Try: deep breathing exercises, regular physical activity, talking to someone you trust, limiting news consumption, and mindfulness/meditation. If persistent, please consult a mental health professional.",
  ],
  'weight|bmi|obesity': [
    "Healthy BMI range is 18.5–24.9. To manage weight: Create a caloric deficit through diet + exercise, focus on sustainable habits not crash diets, get adequate sleep (poor sleep increases hunger hormones), and track progress weekly not daily.",
  ],
  'smoking|tobacco': [
    "Smoking causes cancer, heart disease, and COPD. Quitting benefits start within 20 minutes of stopping. Try nicotine replacement therapy, consult your doctor about prescription aids, set a quit date, and identify your triggers.",
  ],
  'covid|corona|virus': [
    "COVID-19 precautions: Stay up to date on vaccinations, wash hands frequently, wear masks in crowded enclosed spaces, maintain ventilation. If symptomatic: isolate and consult your healthcare provider.",
  ],
}

function getRuleBasedResponse(message: string): string {
  const lower = message.toLowerCase()

  for (const [pattern, responses] of Object.entries(HEALTH_RESPONSES)) {
    const keywords = pattern.split('|')
    if (keywords.some(kw => lower.includes(kw))) {
      return responses[Math.floor(Math.random() * responses.length)]
    }
  }

  return "I can help you with health-related questions, symptoms, medications, appointments, and medical records. Could you be more specific about your health concern? For urgent medical situations, please call emergency services or visit the nearest hospital."
}

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Try OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      try {
        const { default: OpenAI } = await import('openai')
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const messages: any[] = [
          {
            role: 'system',
            content: `You are Aarogya, a friendly and knowledgeable health assistant for Aarogya Darpan hospital management system.
You help users with:
- General health questions and advice
- Understanding symptoms and when to seek care  
- Medication information and adherence
- Healthy lifestyle tips
- Navigating hospital services (appointments, records, bills)

Rules:
- Always recommend professional medical consultation for serious concerns
- Never diagnose or prescribe medications
- Be empathetic and clear
- Keep responses concise (2-3 paragraphs max)
- Use markdown formatting for readability`,
          },
          ...(history || []).slice(-10),
          { role: 'user', content: message },
        ]

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 500,
          temperature: 0.7,
        })

        return NextResponse.json({
          response: response.choices[0].message.content,
          source: 'ai',
        })
      } catch (aiError) {
        console.error('OpenAI chat error:', aiError)
      }
    }

    // Rule-based fallback
    const response = getRuleBasedResponse(message)
    return NextResponse.json({ response, source: 'rule-based' })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
