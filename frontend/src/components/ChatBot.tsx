import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatBotProps {
  courseName?: string;
}

export default function ChatBot({ courseName }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi! I'm your AI learning assistant for ${courseName || 'this course'}. I can help you with questions about the content, explain concepts, or provide additional resources. How can I help you today?`,
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response (in real implementation, this would call your AI service)
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputValue),
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes('video') || input.includes('play') || input.includes('pause')) {
      return "I can help you with video-related questions! You can use the video controls to pause, play, or adjust the speed. If you're having trouble with the video, try refreshing the page or checking your internet connection.";
    }

    if (input.includes('quiz') || input.includes('test') || input.includes('assessment')) {
      return "For quiz and assessment help, I can explain concepts or provide hints. Remember, the goal is to learn, so try to understand the material before checking answers. Would you like me to explain any specific topic?";
    }

    if (input.includes('progress') || input.includes('complete')) {
      return "Your progress is automatically saved as you complete lessons and activities. You can see your overall progress in the sidebar and dashboard. Keep up the great work!";
    }

    if (input.includes('certificate') || input.includes('completion')) {
      return "You'll receive a certificate upon completing all course materials and assessments. Make sure to complete all lessons and maintain good quiz scores to qualify for certification.";
    }

    // Default response
    return "That's a great question! I'm here to help you learn. Can you provide more details about what you'd like to know? I can assist with course content, technical issues, or learning strategies.";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 sm:bottom-4 sm:right-4 xs:bottom-3 xs:right-3 z-50">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 sm:h-12 sm:w-12 xs:h-10 xs:w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 pulse-glow"
          >
            <MessageCircle className="h-6 w-6 sm:h-5 sm:w-5 xs:h-4 xs:w-4 text-white" />
          </Button>
        )}

        {/* Chat Window */}
        {isOpen && (
          <Card className="w-96 max-w-[calc(100vw-2rem)] h-[500px] lg:w-96 md:w-80 sm:w-72 xs:w-[calc(100vw-1rem)] md:h-[500px] sm:h-[450px] xs:h-[400px] bg-background/95 backdrop-blur border-border shadow-xl flex flex-col overflow-hidden">
            {/* Header */}
            <CardHeader className="pb-3 p-4 sm:p-3 xs:p-2 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 sm:h-7 sm:w-7 xs:h-6 xs:w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 sm:h-3 sm:w-3 xs:h-2.5 xs:w-2.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm sm:text-xs xs:text-xs truncate">Learning Assistant</CardTitle>
                    <p className="text-xs sm:text-xs xs:text-xs text-muted-foreground hidden sm:block">Always here to help</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 sm:h-5 sm:w-5 xs:h-4 xs:w-4 p-0 flex-shrink-0"
                >
                  <X className="h-4 w-4 sm:h-3 sm:w-3 xs:h-2.5 xs:w-2.5" />
                </Button>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 sm:p-3 xs:p-2 h-full">
                <div className="space-y-4 sm:space-y-3 xs:space-y-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`flex items-start space-x-2 sm:space-x-1.5 xs:space-x-1 max-w-[85%] sm:max-w-[90%] xs:max-w-[95%] ${message.isBot ? '' : 'flex-row-reverse space-x-reverse sm:space-x-reverse xs:space-x-reverse'}`}>
                        <div className={`h-6 w-6 sm:h-5 sm:w-5 xs:h-4 xs:w-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.isBot 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                            : 'bg-gradient-to-r from-green-500 to-emerald-600'
                        }`}>
                          {message.isBot ? (
                            <Bot className="h-3 w-3 sm:h-2.5 sm:w-2.5 xs:h-2 xs:w-2 text-white" />
                          ) : (
                            <User className="h-3 w-3 sm:h-2.5 sm:w-2.5 xs:h-2 xs:w-2 text-white" />
                          )}
                        </div>
                        <div className={`rounded-lg p-2 sm:p-1.5 xs:p-1 text-sm sm:text-xs xs:text-xs break-words overflow-wrap-anywhere leading-relaxed ${
                          message.isBot
                            ? 'bg-muted text-foreground'
                            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        }`}>
                          {message.text}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-2 sm:space-x-1.5 xs:space-x-1 max-w-[85%] sm:max-w-[90%] xs:max-w-[95%]">
                        <div className="h-6 w-6 sm:h-5 sm:w-5 xs:h-4 xs:w-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-3 w-3 sm:h-2.5 sm:w-2.5 xs:h-2 xs:w-2 text-white" />
                        </div>
                        <div className="bg-muted rounded-lg p-2 sm:p-1.5 xs:p-1 text-sm sm:text-xs xs:text-xs">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 sm:w-1.5 sm:h-1.5 xs:w-1 xs:h-1 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 sm:w-1.5 sm:h-1.5 xs:w-1 xs:h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 sm:w-1.5 sm:h-1.5 xs:w-1 xs:h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t border-border p-3 sm:p-2 xs:p-1.5 flex-shrink-0">
                <div className="flex space-x-2 sm:space-x-1.5 xs:space-x-1">
                  <Input
                    placeholder="Ask me anything about this course..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 text-sm sm:text-xs xs:text-xs h-9 sm:h-8 xs:h-7"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-9 sm:h-8 xs:h-7 w-9 sm:w-8 xs:w-7 p-0"
                  >
                    <Send className="h-4 w-4 sm:h-3 sm:w-3 xs:h-2.5 xs:w-2.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}