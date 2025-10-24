import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, BookOpen, Sparkles, Loader2 } from 'lucide-react';

interface LessonTabsProps {
  guideContent?: string;
  onToggleComplete: (nextCompletedState: boolean) => void;
  isCompleted?: boolean;
  isUpdating?: boolean;
}

export default function LessonTabs({
  guideContent = "This is a comprehensive guide that will help you understand the concepts covered in this lesson. The content here provides detailed explanations, examples, and best practices to reinforce your learning.\n\nKey Topics Covered:\n Understanding the fundamentals\n Practical applications\n Real-world examples\n Best practices and tips\n\nThis guide serves as your reference material and can be revisited anytime to strengthen your understanding of the subject matter.",
  onToggleComplete,
  isCompleted = false,
  isUpdating = false,
}: LessonTabsProps) {
  // Parse content to add better formatting
  const formatContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Headers (lines that end with :)
      if (line.trim().endsWith(':') && line.trim().length > 3) {
        return (
          <h3 key={index} className="text-lg font-semibold text-foreground mt-6 mb-3 first:mt-0 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {line.trim()}
          </h3>
        );
      }
      // Bullet points
      if (line.trim().startsWith('') || line.trim().startsWith('-')) {
        return (
          <div key={index} className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            <p className="text-foreground/90 leading-relaxed">{line.trim().substring(1).trim()}</p>
          </div>
        );
      }
      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-3" />;
      }
      // Regular paragraphs
      return (
        <p key={index} className="text-foreground/85 leading-relaxed mb-3">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="w-full" data-testid="container-lesson-tabs">
      <Tabs defaultValue="quiz" className="w-full">
        <TabsList className="grid w-full grid-cols-1 h-auto p-0 bg-transparent border-b border-border" data-testid="tabs-lesson-content">
          <TabsTrigger
            value="quiz"
            data-testid="tab-guide"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-4 justify-start gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span className="font-semibold">Lesson Guide</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quiz" data-testid="content-guide" className="mt-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-foreground">
                    Study Material
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Read through the key concepts and notes
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
                <ScrollArea className="h-[400px] sm:h-[450px] lg:h-[500px]">
                  <div className="p-6 sm:p-8">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="space-y-1">
                        {formatContent(guideContent)}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Progress indicator */}
              {!isCompleted && (
                <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground mb-1">
                        Complete this lesson
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Mark as complete once you've reviewed all the material
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mark Complete Button */}
      <div className="mt-6 lg:mt-8 flex justify-center px-4 lg:px-0">
        <Button
          onClick={() => onToggleComplete(!isCompleted)}
          size="lg"
          disabled={isUpdating}
          className="w-full sm:w-auto sm:min-w-64 h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-wait"
          data-testid="button-mark-complete"
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              <span>Updating...</span>
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />
              <span>Mark as Incomplete</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Mark as Complete</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
