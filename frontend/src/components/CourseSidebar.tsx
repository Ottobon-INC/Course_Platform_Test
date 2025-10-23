import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Play, 
  Search, 
  Clock,
  FileText,
  Vote,
  Check
} from 'lucide-react';

// Topic/Section structure
interface Topic {
  id: string;
  title: string;
  lessons: LessonWithProgress[];
  isExpanded?: boolean;
}

interface LessonWithProgress {
  id: string;
  slug: string;
  title: string;
  duration: string;
  type: 'video' | 'reading' | 'quiz';
  completed: boolean;
  current?: boolean;
  progress?: number;
  isPreview?: boolean;
}

interface CourseSidebarProps {
  lessons: LessonWithProgress[];
  totalProgress: number;
  onLessonSelect: (lessonSlug: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function CourseSidebar({ 
  lessons, 
  totalProgress, 
  onLessonSelect, 
  isCollapsed = false, 
  onToggleCollapse 
}: CourseSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set(['topic-1'])); // First topic expanded by default

  // Transform flat lessons into hierarchical topic structure
  const topics: Topic[] = [
    {
      id: 'topic-1',
      title: 'Starting Your AI-Powered Journey',
      lessons: [
        {
          id: '1',
          slug: 'introduction-to-ai-web-development',
          title: 'Welcome to Your AI Learning Journey',
          duration: '8 min',
          type: 'video',
          completed: false,
          current: lessons.find(l => l.slug === 'introduction-to-ai-web-development')?.current || false,
          progress: lessons.find(l => l.slug === 'introduction-to-ai-web-development')?.progress || 0,
          isPreview: true
        },
        {
          id: '2',
          slug: 'setting-up-development-environment',
          title: 'Essential AI Tools for Developers',
          duration: '12 min',
          type: 'video',
          completed: lessons.find(l => l.slug === 'setting-up-development-environment')?.completed || false,
          current: lessons.find(l => l.slug === 'setting-up-development-environment')?.current || false,
          progress: lessons.find(l => l.slug === 'setting-up-development-environment')?.progress || 0,
          isPreview: false
        },
        {
          id: '3',
          slug: 'building-ai-chatbot',
          title: 'Setting Up Your AI-Enhanced Workspace',
          duration: '15 min',
          type: 'video',
          completed: lessons.find(l => l.slug === 'building-ai-chatbot')?.completed || false,
          current: lessons.find(l => l.slug === 'building-ai-chatbot')?.current || false,
          progress: lessons.find(l => l.slug === 'building-ai-chatbot')?.progress || 0,
          isPreview: false
        }
      ]
    },
    {
      id: 'topic-2',
      title: 'AI-Assisted Frontend Development',
      lessons: [
        {
          id: '4',
          slug: 'ai-powered-recommendations',
          title: 'Crafting HTML with AI Assistance',
          duration: '18 min',
          type: 'video',
          completed: lessons.find(l => l.slug === 'ai-powered-recommendations')?.completed || false,
          current: lessons.find(l => l.slug === 'ai-powered-recommendations')?.current || false,
          progress: lessons.find(l => l.slug === 'ai-powered-recommendations')?.progress || 0,
          isPreview: false
        },
        {
          id: '5',
          slug: 'css-magic-with-ai',
          title: 'CSS Magic with AI',
          duration: '22 min',
          type: 'video',
          completed: false,
          current: false,
          progress: 0,
          isPreview: false
        }
      ]
    }
  ];

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  // Filter topics and lessons based on search
  const filteredTopics = topics.map(topic => ({
    ...topic,
    lessons: topic.lessons.filter(lesson =>
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(topic => 
    topic.lessons.length > 0 || 
    topic.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allLessons = topics.flatMap(topic => topic.lessons);
  const completedLessons = allLessons.filter(lesson => lesson.completed).length;
  const totalLessons = allLessons.length;

  if (isCollapsed) {
    return (
      <div className="w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 space-y-4" data-testid="sidebar-collapsed">
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleCollapse}
          data-testid="button-expand-sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="text-xs text-center text-muted-foreground" data-testid="text-progress-mini">
          {Math.round(totalProgress)}%
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-80 max-w-96 w-80 bg-sidebar border-r border-sidebar-border flex flex-col h-screen overflow-x-hidden" data-testid="sidebar-expanded">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" data-testid="title-course-content">Course Content</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleCollapse}
            data-testid="button-collapse-sidebar"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium" data-testid="text-progress-percentage">{Math.round(totalProgress)}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" data-testid="progress-bar-course" />
          <div className="text-xs text-muted-foreground" data-testid="text-lessons-completed">
            {completedLessons} of {totalLessons} lessons completed
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-lessons"
          />
        </div>
      </div>

      {/* Course Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-3 pb-4">
          {filteredTopics.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No lessons found</p>
              <p className="text-xs mt-1">Try adjusting your search</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTopics.map((topic) => (
                <div key={topic.id} className="mb-2">
                  <Collapsible
                    open={expandedTopics.has(topic.id)}
                    onOpenChange={() => toggleTopic(topic.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start p-3 h-auto hover:bg-accent/50 transition-colors group rounded-lg"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center transition-all group-hover:bg-primary/15 group-hover:border-primary/30">
                              {expandedTopics.has(topic.id) ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                              ) : (
                                <div className="w-2 h-2 rounded-sm bg-primary/70 rotate-45"></div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug break-words whitespace-normal">
                              {topic.title}
                            </p>
                          </div>
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-3 mt-1.5 space-y-1.5">
                        {topic.lessons.map((lesson) => (
                          <div key={lesson.id} className="w-full">
                            <Button
                              variant={lesson.current ? "secondary" : "ghost"}
                              className={`w-full justify-start p-3 h-auto min-h-[72px] hover:bg-accent/50 transition-all duration-200 group rounded-lg ${
                                lesson.current ? 'bg-primary/10 border border-primary/20 shadow-sm' : ''
                              }`}
                              onClick={() => onLessonSelect(lesson.slug)}
                            >
                              <div className="flex items-start gap-3 w-full">
                                <div className="flex-shrink-0 mt-0.5">
                                  {lesson.completed ? (
                                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/40 flex items-center justify-center shadow-sm">
                                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                                    </div>
                                  ) : lesson.current ? (
                                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary/25 to-primary/10 border border-primary/50 flex items-center justify-center shadow-sm">
                                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-md border border-muted-foreground/15 bg-gradient-to-br from-muted/40 to-muted/20 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <p className={`text-xs sm:text-sm font-medium leading-relaxed group-hover:text-primary transition-colors whitespace-normal ${
                                    lesson.current ? 'text-primary' : 'text-foreground'
                                  }`}>
                                    {lesson.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                      <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{lesson.duration}</span>
                                    </div>
                                    {lesson.isPreview && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/5 border-primary/30 text-primary whitespace-nowrap">
                                        Free
                                      </Badge>
                                    )}
                                  </div>
                                  {lesson.current && lesson.progress && lesson.progress > 0 && (
                                    <div className="mt-2">
                                      <div className="w-full bg-secondary/50 rounded-full h-1">
                                        <div 
                                          className="bg-primary h-1 rounded-full transition-all duration-300"
                                          style={{ width: `${lesson.progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}