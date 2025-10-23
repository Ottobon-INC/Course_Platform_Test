import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { CartItem, CartResponse } from '@/types/cart';
import type { StoredSession } from '@/types/session';
import { buildApiUrl } from '@/lib/api';
import { ShoppingCart, X, Trash2, Star, Clock, Users, CreditCard, ArrowLeft, Home } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle'; // Import ThemeToggle

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isLoadingCart, setIsLoadingCart] = useState(true);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("session");
    localStorage.removeItem("user");
    localStorage.setItem("isAuthenticated", "false");
    setIsAuthenticated(false);
    setSession(null);
    setCart([]);
    setIsLoadingCart(false);
    toast({
      variant: "destructive",
      title: "Session expired",
      description: "Please sign in again to view your cart.",
    });
  }, [toast]);

  const updateCartFromResponse = useCallback(
    async (response: Response): Promise<boolean> => {
      if (response.status === 401) {
        handleUnauthorized();
        return false;
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Cart request failed: ${response.status}`);
      }

      const data = (await response.json()) as CartResponse;
      setCart(data.items ?? []);
      return true;
    },
    [handleUnauthorized],
  );

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !session?.accessToken) {
      setCart([]);
      setIsLoadingCart(false);
      return;
    }

    setIsLoadingCart(true);
    try {
      const response = await fetch(buildApiUrl("/cart"), {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      await updateCartFromResponse(response);
    } catch (error) {
      console.error("Failed to load cart", error);
    } finally {
      setIsLoadingCart(false);
    }
  }, [isAuthenticated, session?.accessToken, updateCartFromResponse]);

  useEffect(() => {
    const syncAuthState = () => {
      const authStatus = localStorage.getItem('isAuthenticated');
      const sessionData = localStorage.getItem('session');

      if (authStatus === 'true' && sessionData) {
        try {
          const parsedSession = JSON.parse(sessionData) as StoredSession;
          setSession(parsedSession);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Failed to parse stored session", error);
          setSession(null);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
        setSession(null);
        setCart([]);
        setIsLoadingCart(false);
      }
    };

    syncAuthState();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'isAuthenticated' || event.key === 'session' || event.key === 'user') {
        syncAuthState();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const totalCartValue = cart.reduce((sum, item) => sum + item.price, 0);
  const totalSavings = cart.reduce((sum, item) => sum + (item.price * 0.2), 0);

  const getLevelColor = (level: string = 'Beginner') => {
    switch (level) {
      case 'Beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const removeFromCart = useCallback(
    async (courseId: string, options?: { silent?: boolean }) => {
      if (!isAuthenticated || !session?.accessToken) {
        setCart(prevCart => prevCart.filter(item => item.courseId !== courseId));
        if (!options?.silent) {
          toast({
            title: "Removed from Cart",
            description: "Course has been removed from your cart.",
          });
        }
        return;
      }

      try {
        const response = await fetch(buildApiUrl(`/cart/items/${encodeURIComponent(courseId)}`), {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        const updated = await updateCartFromResponse(response);

        if (!options?.silent && updated) {
          toast({
            title: "Removed from Cart",
            description: "Course has been removed from your cart.",
          });
        }
      } catch (error) {
        console.error("Failed to remove course from cart", error);
        if (!options?.silent) {
          toast({
            variant: "destructive",
            title: "Could not update cart",
            description: "Please try again.",
          });
        }
      }
    },
    [isAuthenticated, session?.accessToken, toast, updateCartFromResponse],
  );

  const clearCart = useCallback(
    async ({ silent = false } = {}) => {
      if (!isAuthenticated || !session?.accessToken) {
        setCart([]);
        if (!silent) {
          toast({
            title: "Cart Cleared",
            description: "All courses have been removed from your cart.",
          });
        }
        return;
      }

      try {
        const response = await fetch(buildApiUrl("/cart"), {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (response.status === 401) {
          handleUnauthorized();
          throw new Error("unauthorized");
        }

        if (!response.ok && response.status !== 204) {
          const message = await response.text();
          throw new Error(message || `Failed to clear cart: ${response.status}`);
        }

        setCart([]);
        if (!silent) {
          toast({
            title: "Cart Cleared",
            description: "All courses have been removed from your cart.",
          });
        }
      } catch (error) {
        console.error("Failed to clear cart", error);
        if (!silent) {
          toast({
            variant: "destructive",
            title: "Could not clear cart",
            description: "Please try again.",
          });
        }
        if (silent) {
          throw error instanceof Error ? error : new Error("Failed to clear cart");
        }
      }
    },
    [handleUnauthorized, isAuthenticated, session?.accessToken, toast],
  );

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) return;

    setIsProcessingCheckout(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      await clearCart({ silent: true });

      toast({
        title: "Checkout Successful!",
        description: `You've enrolled in ${cart.length} course${cart.length > 1 ? 's' : ''}. Check your dashboard to start learning.`,
      });

      setLocation('/dashboard');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: "Please try again or contact support.",
      });
    } finally {
      setIsProcessingCheckout(false);
    }
  }, [cart.length, clearCart, setLocation, toast]);

  const handleEnrollSingle = async (courseId: string) => {
    await removeFromCart(courseId, { silent: true });
    toast({
      title: "Enrolled Successfully!",
      description: "Course has been added to your learning dashboard.",
    });
    setLocation(`/course/${courseId}/learn/welcome-to-ai-journey`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setLocation('/dashboard')}
                className="hover:bg-muted"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[hsl(var(--gradient-text-from))] to-[hsl(var(--gradient-text-to))] bg-clip-text text-transparent">
                Shopping Cart
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle /> {/* Theme toggle button */}
              <Button 
                variant="outline"
                onClick={() => setLocation('/dashboard')}
                className="hidden sm:flex"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8 lg:py-10">
        {isLoadingCart ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 border-2 border-muted-foreground/40 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground">Loading your cart...</p>
            </div>
          </div>
        ) : cart.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4 max-w-md">
              <div className="flex justify-center">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-muted flex items-center justify-center">
                  <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Your cart is empty</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Explore our courses and add them to your cart to get started on your learning journey!
              </p>
              <Button 
                onClick={() => setLocation('/dashboard')}
                className="mt-6 bg-gradient-to-r from-[hsl(var(--gradient-text-from))] to-[hsl(var(--gradient-text-to))]"
              >
                Browse Courses
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items - Takes 2 columns on large screens */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">
                  {cart.length} {cart.length === 1 ? 'Course' : 'Courses'} in Cart
                </h2>
                {cart.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => void clearCart()}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-4">
                {cart.map((item) => (
                  <Card key={item.courseId} className="hover:shadow-lg transition-shadow bg-card">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Course Thumbnail */}
                        <div className="flex-shrink-0">
                          <div className="w-full sm:w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-3xl sm:text-2xl">
                            {item.thumbnail || '📚'}
                          </div>
                        </div>

                        {/* Course Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-base sm:text-lg leading-tight mb-1 text-foreground">
                                {item.title}
                              </h3>
                              {item.instructor && (
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  by {item.instructor}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                              {item.level && (
                                <Badge className={`${getLevelColor(item.level)} text-xs whitespace-nowrap`}>
                                  {item.level}
                                </Badge>
                              )}
                              <span className="text-lg sm:text-xl font-bold whitespace-nowrap text-foreground">
                                ₹{item.price}
                              </span>
                            </div>
                          </div>

                          {item.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}

                          {/* Course Stats */}
                          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            {item.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                                <span>{item.rating}</span>
                              </div>
                            )}
                            {item.students && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">{item.students.toLocaleString()}</span>
                                <span className="sm:hidden">{(item.students / 1000).toFixed(1)}k</span>
                              </div>
                            )}
                            {item.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{item.duration}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col xs:flex-row gap-2 pt-2 border-t border-border">
                            <Button 
                              size="sm"
                              onClick={() => handleEnrollSingle(item.courseId)}
                              className="bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm"
                            >
                              Enroll Now
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => void removeFromCart(item.courseId)}
                              className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs sm:text-sm"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Order Summary - Sticky on large screens */}
            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-24 bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg sm:text-xl text-foreground">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-muted-foreground">Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
                      <span className="font-medium text-foreground">₹{totalCartValue}</span>
                    </div>
                    {cart.length > 1 && (
                      <div className="flex justify-between text-sm sm:text-base text-green-600 dark:text-green-400">
                        <span>Bundle Discount (20%)</span>
                        <span>-₹{totalSavings.toFixed(0)}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between font-semibold text-lg sm:text-xl">
                        <span className="text-foreground">Total</span>
                        <span className="bg-gradient-to-r from-[hsl(var(--gradient-text-from))] to-[hsl(var(--gradient-text-to))] bg-clip-text text-transparent">
                          ₹{cart.length > 1 ? (totalCartValue - totalSavings).toFixed(0) : totalCartValue}
                        </span>
                      </div>
                    </div>
                  </div>

                  {cart.length > 1 && (
                    <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-medium">
                        🎉 You're saving ₹{totalSavings.toFixed(0)} with the bundle discount!
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-sm sm:text-base py-5 sm:py-6"
                      onClick={handleCheckout}
                      disabled={isProcessingCheckout}
                    >
                      {isProcessingCheckout ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </span>
                      ) : (
                        `Checkout - ₹${cart.length > 1 ? (totalCartValue - totalSavings).toFixed(0) : totalCartValue}`
                      )}
                    </Button>

                    <div className="text-xs text-center text-muted-foreground">
                      🛡️ 30-day money-back guarantee
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <h4 className="font-semibold text-sm text-foreground">What's included:</h4>
                    <ul className="text-xs sm:text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Lifetime access to all courses</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Certificate of completion</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Mobile and desktop access</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>24/7 student support</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
