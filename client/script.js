// script.js

import bot from './assets/bot.svg'
import user from './assets/user.svg'

const form = document.querySelector('form')
const chatContainer = document.querySelector('#chat_container') // index.html

let loadInterval

// Add this function at the beginning of your file
async function getServerUrl() {
  try {
    const response = await fetch('http://localhost:5050/server-info')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Error fetching server URL:', error)
    return 'http://localhost:5050' // Fallback to default URL
  }
}

function loader(element) {
  // 思考时会 . -> .. -> ...
  element.textContent = '' // 开始 empty

  loadInterval = setInterval(() => {
    // Update the text content of the loading indicator
    element.textContent += '.'

    // If the loading indicator has reached three dots, reset it
    if (element.textContent === '....') {
      element.textContent = ''
    }
  }, 300)
}

// This function creates a typing effect by adding one character at a time to the specified HTML element.
function typeText(element, text) {
  let index = 0 // Initialize a counter to keep track of the current character position in the text.

  // setInterval calls the provided function repeatedly every 20 milliseconds.
  let interval = setInterval(() => {
    // Check if the current index is less than the total length of the text. 是否还在打字
    if (index < text.length) {
      // Add the next character from the text to the inner HTML of the element.
      // charAt(index): This method returns the character at the specified index in a string.
      element.innerHTML += text.charAt(index)
      index++ // Move to the next character.
    } else {
      // If all characters have been added, stop the interval to end the typing effect.
      clearInterval(interval)
    }
  }, 20) // The interval is set to 20 milliseconds between each character.
}

// generate unique ID for each message div of bot (generate unique ID with time and date)
// necessary for typing text effect for that specific reply
// without unique ID, typing text will work on every element
function generateUniqueId() {
  const timestamp = Date.now()
  const randomNumber = Math.random() // make it random
  const hexadecimalString = randomNumber.toString(16) // make it even more random

  return `id-${timestamp}-${hexadecimalString}`
}

// This function creates a chat message HTML structure.
// Parameters:
// - isAi: Boolean indicating if the message is from the AI (true) or user (false).
// - value: The message text content.
// - uniqueId: A unique identifier for the message element.
function chatStripe(isAi, value, uniqueId) {
  // Return a template string containing the HTML structure for a chat message.
  return ` 
        <div class="wrapper ${isAi && 'ai'}"> 
            <!-- 
                - The outer div has a class of "wrapper".
                - If 'isAi' is true, it also includes the "ai" class.
                - This allows for styling differentiation between AI and user messages.
            -->
            <div class="chat">
                <div class="profile">
                    <img 
                      src=${isAi ? bot : user} 
                      alt="${isAi ? 'bot' : 'user'}" 
                      <!-- 
                          - The img src is set based on who is sending the message.
                          - If 'isAi' is true, use the 'bot' image; otherwise, use the 'user' image.
                          - The alt attribute provides alternative text for the image, enhancing accessibility.
                      -->
                    />
                </div>
                <div class="message" id=${uniqueId}>
                    ${value}
                    <!-- 
                        - The AI generated message text is inserted here.
                        - The 'id' attribute is set to 'uniqueId' for potential future reference.
                    -->
                </div>
            </div>
        </div>
        `
}

// Modify your handleSubmit function
const handleSubmit = async (e) => {
  e.preventDefault()

  const data = new FormData(form)

  // User's chat stripe
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'))

  form.reset()

  // Bot's chat stripe
  const uniqueId = generateUniqueId()
  chatContainer.innerHTML += chatStripe(true, ' ', uniqueId)

  chatContainer.scrollTop = chatContainer.scrollHeight

  const messageDiv = document.getElementById(uniqueId)

  loader(messageDiv)

  try {
    const serverUrl = await getServerUrl()
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: data.get('prompt'),
      }),
    })

    clearInterval(loadInterval)
    messageDiv.innerHTML = ' '

    if (response.ok) {
      const data = await response.json()
      const parsedData = data.bot.trim()

      typeText(messageDiv, parsedData)
    } else {
      const errorData = await response.json()
      messageDiv.innerHTML = `Error: ${
        errorData.error || 'Something went wrong'
      }`
    }
  } catch (error) {
    clearInterval(loadInterval)
    messageDiv.innerHTML = 'Error: Unable to connect to the server'
    console.error('Error:', error)
  }
}

// Adds an event listener to the form to handle submission via the "submit" event
form.addEventListener('submit', handleSubmit)

// Adds an event listener to the form to handle submission via the "keyup" event (specifically the Enter key)
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    // Checks if the pressed key is Enter (key code 13)
    handleSubmit(e) // Calls the handleSubmit function if Enter is pressed
  }
})
