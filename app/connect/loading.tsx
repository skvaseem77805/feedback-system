import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';

export default function ConnectLoading() {
  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8 space-y-3">
          <div className="h-10 bg-muted/50 rounded-lg w-64 animate-pulse" />
          <div className="h-6 bg-muted/50 rounded-lg w-full max-w-2xl animate-pulse" />
        </div>

        {/* Search Bar Skeleton */}
        <Card className="p-4 mb-8 bg-card/50 backdrop-blur-sm border-primary/20">
          <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
        </Card>

        {/* Filter Badges Skeleton */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-8 w-24 bg-muted/50 rounded-full animate-pulse"
            />
          ))}
        </div>

        {/* Students Grid Skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card
              key={i}
              className="p-6 bg-card/50 backdrop-blur-sm border-primary/20 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 rounded-full bg-muted/50 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted/50 rounded-lg w-32 animate-pulse" />
                    <div className="h-4 bg-muted/50 rounded-lg w-20 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted/50 rounded-lg w-full animate-pulse" />
                <div className="h-4 bg-muted/50 rounded-lg w-5/6 animate-pulse" />
              </div>
              <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-border/50">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="space-y-1">
                    <div className="h-6 bg-muted/50 rounded-lg animate-pulse" />
                    <div className="h-3 bg-muted/50 rounded-lg w-16 mx-auto animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
