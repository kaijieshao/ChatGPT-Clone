import express from 'express'
import * as dotenv from 'dotenv' // Load all the data from .env file
import cors from 'cors' // Allow us to make those cross origin requests
import OpenAI from 'openai'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { createServer } from 'http'
import util from 'util' // Add this import for better error logging

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Construct the path to the .env file (in the parent directory)
const envPath = path.join(__dirname, '..', '.env')
console.log('Attempting to load .env file from:', envPath)

// Check if the .env file exists and load it
if (fs.existsSync(envPath)) {
  console.log('.env file found')
  dotenv.config({ path: envPath })
} else {
  console.error('.env file not found at:', envPath)
}

// Log the status of the OPENAI_API_KEY
console.log(
  'OPENAI_API_KEY:',
  process.env.OPENAI_API_KEY ? 'is set' : 'is not set'
)
console.log('API Key value:', process.env.OPENAI_API_KEY)

// Initialize the OpenAI client outside of the try-catch block
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize the Express application
const app = express()

// Use the cors middleware to enable CORS
app.use(cors())

// Use the express.json middleware to parse incoming JSON requests
app.use(express.json())

// Define a GET route at the root path '/'
app.get('/', async (req, res) => {
  // Respond with a 200 status and a simple JSON message
  res.status(200).send({
    message: 'Hello from CodeX!', // Greeting message to confirm the server is running
  })
})

// Update the /server-info route
app.get('/server-info', (req, res) => {
  res.json({ url: `http://localhost:${PORT}` })
})

// Modify the POST route
app.post('/', async (req, res) => {
  try {
    console.log('Received request:', req.body)
    const prompt = req.body.prompt

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    console.log('Sending request to OpenAI')
    const response = await openai.completions.create({
      model: 'gpt-3.5-turbo-instruct',
      prompt: `${prompt}`,
      temperature: 0,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    })

    console.log('Received response from OpenAI')
    res.json({ bot: response.choices[0].text })
  } catch (error) {
    console.error('OpenAI API Error:', util.inspect(error, { depth: null }))
    res
      .status(500)
      .json({ error: 'An error occurred while processing your request' })
  }
})

// Modify the error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', util.inspect(err, { depth: null }))
  res.status(500).json({ error: 'An unexpected error occurred' })
})

// Create an HTTP server using the Express app
const server = createServer(app)

// Start the server on port 5050
const PORT = 5050
server.listen(PORT, () => {
  console.log(`AI server started on http://localhost:${PORT}`)
})
