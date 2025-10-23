import LessonTabs from '../LessonTabs';

export default function LessonTabsExample() {
  const mockTranscript = [
    { timestamp: "00:00", text: "Welcome to this lesson on React hooks. In this video, we'll explore the fundamentals of useState and useEffect." },
    { timestamp: "00:15", text: "First, let's understand what hooks are and why they were introduced to React.", isActive: true },
    { timestamp: "00:30", text: "Hooks allow you to use state and other React features without writing a class component." },
    { timestamp: "00:45", text: "The most commonly used hook is useState, which lets you add state to functional components." },
    { timestamp: "01:00", text: "Let's see how to implement useState in a practical example." }
  ];

  const mockNotes = `
    <h3>Key Concepts</h3>
    <ul>
      <li><strong>useState:</strong> Manages local component state</li>
      <li><strong>useEffect:</strong> Handles side effects and lifecycle events</li>
      <li><strong>Custom Hooks:</strong> Reusable stateful logic</li>
    </ul>
    
    <h3>Code Example</h3>
    <pre><code>const [count, setCount] = useState(0);

useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);</code></pre>
    
    <h3>Best Practices</h3>
    <ol>
      <li>Always include dependencies in useEffect array</li>
      <li>Use multiple useEffect hooks for different concerns</li>
      <li>Extract complex logic into custom hooks</li>
    </ol>
  `;

  const mockResources = [
    { id: "1", title: "React Hooks Cheat Sheet", type: "pdf" as const, url: "#", size: "2.1 MB" },
    { id: "2", title: "Practice Exercises", type: "code" as const, url: "#", size: "156 KB" },
    { id: "3", title: "Official React Documentation", type: "link" as const, url: "https://react.dev" }
  ];

  const mockQuiz = [
    {
      id: "q1",
      question: "What is the primary purpose of the useState hook?",
      options: [
        { id: "a", text: "To handle side effects", isCorrect: false },
        { id: "b", text: "To manage local component state", isCorrect: true },
        { id: "c", text: "To optimize performance", isCorrect: false },
        { id: "d", text: "To handle routing", isCorrect: false }
      ]
    },
    {
      id: "q2", 
      question: "When does useEffect run by default?",
      options: [
        { id: "a", text: "Only on component mount", isCorrect: false },
        { id: "b", text: "After every render", isCorrect: true },
        { id: "c", text: "Only when state changes", isCorrect: false },
        { id: "d", text: "Before component unmounts", isCorrect: false }
      ]
    }
  ];

  const handleMarkComplete = () => {
    console.log('Lesson marked as complete');
  };

  return (
    <div className="p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Lesson Content Tabs</h2>
        <LessonTabs
          transcript={mockTranscript}
          notes={mockNotes}
          resources={mockResources}
          quiz={mockQuiz}
          onMarkComplete={handleMarkComplete}
          isCompleted={false}
        />
      </div>
    </div>
  );
}