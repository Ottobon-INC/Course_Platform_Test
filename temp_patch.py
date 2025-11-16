from pathlib import Path
path=Path('frontend/src/pages/CoursePlayerPage.tsx')
text=path.read_text(encoding='utf-8')
replacements=[
('className="relative min-h-[calc(100vh-3rem)] overflow-hidden rounded-[22px] bg-white shadow-2xl"','className="course-player-shell relative min-h-[calc(100vh-3rem)] overflow-hidden rounded-[32px] bg-white shadow-2xl"'),
('className={cn(FONT_INTER_STACK, "min-h-screen w-full")} style={{ background: DASHBOARD_GRADIENT_BG }}','className={cn(FONT_INTER_STACK, "min-h-screen w-full course-player-background")} style={{ background: DASHBOARD_GRADIENT_BG }}'),
('className="border-b border-gray-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 px-4 py-3 lg:py-3 w-full"','className="course-player-header border-b border-gray-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 px-4 py-3 lg:py-3 w-full"'),
('className="relative w-full aspect-video max-h-[65vh] min-h-[220px] rounded-2xl border border-border/60 bg-black shadow-xl overflow-hidden"','className="course-player-video relative w-full aspect-video max-h-[65vh] min-h-[220px] rounded-2xl border border-border/60 bg-black shadow-xl overflow-hidden"'),
('className="flex flex-wrap justify-between items-center gap-2" data-testid="navigation-lesson"','className="course-player-nav flex flex-wrap justify-between items-center gap-2" data-testid="navigation-lesson"'),
('className="flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto px-4 py-4 lg:py-6" data-testid="section-lesson-content"','className="course-player-content flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto px-4 py-4 lg:py-6" data-testid="section-lesson-content"')
]
for old,new in replacements:
    if old not in text:
        raise SystemExit(f'pattern not found: {old}')
    text=text.replace(old,new,1)
path.write_text(text,encoding='utf-8')
