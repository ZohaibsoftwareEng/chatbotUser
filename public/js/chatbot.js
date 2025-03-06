(function() {
    // First create and append all required styles
    const style = document.createElement('style');
    style.textContent = `
      /* Chat Interface Styles */
      .chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: var(--chat-bg-color);
      }
      .messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
      }
      .message-wrapper {
        margin-bottom: 1rem;
      }
      .message-wrapper.bot {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }
      .message-wrapper.user {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .user-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
      }
      .avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 0.875rem;
        background-color: var(--avatar-color);
      }
      .user-name {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-color);
      }
      .message {
        max-width: 80%;
        border-radius: 1rem;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      }
      .message.bot {
        background-color: var(--bot-message-color);
        color: white;
      }
      .message.user {
        background-color: var(--user-message-color);
        color: white;
      }
      .timestamp {
        font-size: 0.75rem;
        color: #6B7280;
        margin-top: 0.25rem;
      }
      .input-container {
        border-top: 1px solid #E5E7EB;
        background-color: white;
        padding: 1rem;
      }
      .input-wrapper {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        max-width: 56rem;
        margin: 0 auto;
      }
      .message-input {
        flex: 1;
        border: 1px solid #E5E7EB;
        border-radius: 9999px;
        padding: 0.5rem 1rem;
        color: var(--text-color);
        outline: none;
      }
      .message-input:focus {
        border-color: var(--user-message-color);
      }
      .send-button {
        background-color: var(--user-message-color);
        color: white;
        border-radius: 9999px;
        padding: 0.5rem;
        cursor: pointer;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .send-button:hover {
        opacity: 0.9;
      }
  
      /* Floating Chatbot Styles */
      .floating-chatbot {
        position: fixed;
        bottom: 20px;
        width: 360px;
        height: 600px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: transform 0.3s ease;
        transform: translateY(100%);
        z-index: 1000;
      }
  
      .floating-chatbot.open {
        transform: translateY(0);
      }
  
      .floating-chatbot.right {
        right: 20px;
      }
  
      .floating-chatbot.left {
        left: 20px;
      }
  
      .chat-bubble {
        position: fixed;
        bottom: 20px;
        width: 60px;
        height: 60px;
        background-color: var(--user-message-color);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        transition: transform 0.2s ease;
      }
  
      .chat-bubble:hover {
        transform: scale(1.1);
      }
  
      .chat-bubble.right {
        right: 20px;
      }
  
      .chat-bubble.left {
        left: 20px;
      }
  
      .chat-bubble svg {
        width: 24px;
        height: 24px;
        color: white;
      }
  
      .close-button {
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
      }
  
      .close-button:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
    `;
    document.head.appendChild(style);
  
    // Chat Interface Class
    class ChatInterface {
      constructor(container, user, chatbot) {
        this.container = container;
        this.user = user;
        this.chatbot = chatbot;
        this.messages = [];
        
        this.setThemeVariables();
        
        if (this.chatbot.initialMessages) {
          this.messages.push({
            type: 'bot',
            text: this.chatbot.initialMessages,
            time: this.formatTime(new Date())
          });
        }
        
        this.render();
        this.initializeEventListeners();
      }
  
      setThemeVariables() {
        const root = document.documentElement;
        root.style.setProperty('--user-message-color', this.chatbot.userMessageColor || '#3B82F6');
        root.style.setProperty('--bot-message-color', this.chatbot.chatBubbleColor || '#000000');
        root.style.setProperty('--chat-bg-color', this.chatbot.theme === 'dark' ? '#1F2937' : '#F9FAFB');
        root.style.setProperty('--text-color', this.chatbot.theme === 'dark' ? '#FFFFFF' : '#000000');
      }
  
      render() {
        this.container.innerHTML = `
          <div class="chat-container">
            <div class="messages-container"></div>
            <div class="input-container">
              <div class="input-wrapper">
                <input 
                  type="text" 
                  class="message-input" 
                  placeholder="${this.chatbot.messagePlaceholder || 'Type your message...'}"
                >
                <button class="send-button">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        `;
  
        this.messagesContainer = this.container.querySelector('.messages-container');
        this.messageInput = this.container.querySelector('.message-input');
        this.sendButton = this.container.querySelector('.send-button');
  
        this.renderMessages();
      }
  
      formatTime(date) {
        return date.toLocaleString('en-US', {
          weekday: 'long',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        }).toLowerCase();
      }
  
      renderMessages() {
        this.messagesContainer.innerHTML = this.messages.map(message => this.createMessageHTML(message)).join('');
        this.scrollToBottom();
      }
  
      createMessageHTML(message) {
        const time = message.time;
        const isBot = message.type === 'bot';
        return `
          <div class="message-wrapper ${message.type}">
            <div class="user-info">
              <div class="avatar" style="background-color: ${isBot ? this.chatbot.chatBubbleColor : this.chatbot.userMessageColor}">
                ${isBot ? this.chatbot.displayName[0] : this.user.name[0]}
              </div>
              <span class="user-name">${isBot ? this.chatbot.displayName : this.user.name}</span>
            </div>
            <div class="message ${message.type}">
              ${message.text}
            </div>
            <span class="timestamp">
              ${time}
            </span>
          </div>
        `;
      }
  
      addMessage(text, type = 'user') {
        const message = {
          type,
          text,
          time: this.formatTime(new Date())
        };
  
        this.messages.push(message);
        this.renderMessages();
  
        if (type === 'user' && this.chatbot.regenerateMessages) {
          setTimeout(() => {
            this.addMessage('This is a simulated response from the chatbot.', 'bot');
          }, 1000);
        }
      }
  
      scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      }
  
      initializeEventListeners() {
        this.sendButton.addEventListener('click', () => this.handleSend());
        this.messageInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSend();
          }
        });
      }
  
      handleSend() {
        const text = this.messageInput.value.trim();
        if (text) {
          this.addMessage(text);
          this.messageInput.value = '';
        }
      }
    }
  
    // Floating Chatbot Class
    class FloatingChatbot {
      constructor(config = {}) {
        // Store the provided chatbotId and username
        this.chatbotId = config.chatbotId || '67c00737200379bebc8f3f1'; // Default ID as fallback
        this.userName = config.userName || 'Guest';
        
        console.log('Initializing chatbot with ID:', this.chatbotId);
        
        // Fetch settings from API and initialize
        this.fetchSettings().then(() => {
          console.log('Using final config:', this.config);
          this.createElements();
          this.initializeChatInterface();
          this.setupEventListeners();
  
          if (this.config.autoShowDelay) {
            setTimeout(() => {
              this.chatBubble.style.display = 'flex';
            }, parseInt(this.config.autoShowDelay) * 1000);
          } else {
            this.chatBubble.style.display = 'flex';
          }
        }).catch(error => {
          console.error('Error during initialization:', error);
        });
      }
      
      async fetchSettings() {
          try {
            // Corrected port to 4000 instead of 5000
            const url = `http://localhost:4000/api/chatbots/${this.chatbotId}`;
            console.log('Fetching settings from:', url);
            
            const response = await fetch(url);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Raw API response:', data);
            
            // Log the full API response for debugging
            console.log('API response details:');
            for (const [key, value] of Object.entries(data)) {
              console.log(`  ${key}:`, value);
            }
            
            // Map API response to config with the exact property names from your API
            this.config = {
              position: data.chatBubbleAlignment || 'right',
              theme: data.theme || 'light',
              userMessageColor: data.userMessageColor || '#3B82F6',
              chatBubbleColor: data.chatBubbleColor || '#000000',
              displayName: data.name || 'Chatbot', // Use name property from API
              messagePlaceholder: data.messagePlaceholder || 'Type your message...',
              initialMessages: data.initialMessages || 'Hello! How can I help you today?',
              autoShowDelay: data.autoShowDelay || null,
              regenerateMessages: data.regenerateMessages || false
            };
            
            console.log('Final configuration after mapping:', this.config);
            
          } catch (error) {
            console.error('Failed to fetch chatbot settings:', error);
            console.error('Error details:', error.message);
            
            // Try to stringify the error for more details
            try {
              console.error('Error stack:', error.stack);
            } catch (e) {}
            
            // Fallback to default settings but preserve the chatbotId
            this.config = {
              position: 'right',
              theme: 'light',
              userMessageColor: '#3B82F6',
              chatBubbleColor: '#000000',
              displayName: 'Chatbot',
              messagePlaceholder: 'Type your message...',
              initialMessages: 'Hello! How can I help you today?',
              autoShowDelay: null,
              regenerateMessages: false
            };
            console.log('Using fallback configuration:', this.config);
          }
        }
  
    // Rest of your FloatingChatbot class remains the same
    createElements() {
      this.chatBubble = document.createElement('div');
      this.chatBubble.className = `chat-bubble ${this.config.position}`;
      this.chatBubble.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
  
      this.floatingContainer = document.createElement('div');
      this.floatingContainer.className = `floating-chatbot ${this.config.position}`;
      
      const closeButton = document.createElement('button');
      closeButton.className = 'close-button';
      closeButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      this.floatingContainer.appendChild(closeButton);
  
      this.chatContainer = document.createElement('div');
      this.chatContainer.style.height = '100%';
      this.floatingContainer.appendChild(this.chatContainer);
  
      document.body.appendChild(this.chatBubble);
      document.body.appendChild(this.floatingContainer);
    }
  
    initializeChatInterface() {
      this.chatInterface = new ChatInterface(
        this.chatContainer,
        { name: this.userName },
        this.config
      );
    }
  
    setupEventListeners() {
      this.chatBubble.addEventListener('click', () => {
        this.floatingContainer.classList.add('open');
        this.chatBubble.style.display = 'none';
      });
  
      this.floatingContainer.querySelector('.close-button').addEventListener('click', () => {
        this.floatingContainer.classList.remove('open');
        this.chatBubble.style.display = 'flex';
      });
    }
  
    setPosition(position) {
      if (position !== 'left' && position !== 'right') return;
      
      this.config.position = position;
      this.chatBubble.className = `chat-bubble ${position}`;
      this.floatingContainer.className = `floating-chatbot ${position}`;
    }
  
    open() {
      this.floatingContainer.classList.add('open');
      this.chatBubble.style.display = 'none';
    }
  
    close() {
      this.floatingContainer.classList.remove('open');
      this.chatBubble.style.display = 'flex';
    }
  }
  
    // Make FloatingChatbot available globally
    window.FloatingChatbot = FloatingChatbot;
  })();