import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthLogin, useAuthRegister } from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Globe, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthUser } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

interface Props {
  onLogin: (token: string, user: AuthUser) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { toast } = useToast();

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", name: "" },
  });

  const loginMutation = useAuthLogin({
    mutation: {
      onSuccess: (data: any) => {
        onLogin(data.token, data.user);
      },
      onError: (err: any) => {
        toast({ title: "Login failed", description: err.data?.error ?? "Invalid credentials", variant: "destructive" });
      },
    },
  });

  const registerMutation = useAuthRegister({
    mutation: {
      onSuccess: (data: any) => {
        onLogin(data.token, data.user);
      },
      onError: (err: any) => {
        toast({ title: "Registration failed", description: err.data?.error ?? "Could not register", variant: "destructive" });
      },
    },
  });

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <h1 className="font-bold tracking-tight text-lg">Trip Planner</h1>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 relative">
              <Globe className="h-8 w-8 text-primary" />
              <Sparkles className="h-4 w-4 text-primary absolute -top-0.5 -right-0.5" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-slate-500 mt-1 text-sm">
              {mode === "login"
                ? "Sign in to plan your next trip"
                : "Start planning trips with AI agents"}
            </p>
          </div>

          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="pt-6 px-8 pb-8">
              {mode === "login" ? (
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit((data) =>
                      loginMutation.mutate({ data })
                    )}
                    className="space-y-5"
                  >
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-medium">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-medium">Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-11 font-medium" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Sign In
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit((data) =>
                      registerMutation.mutate({ data })
                    )}
                    className="space-y-5"
                  >
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-medium">Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Priya Sharma" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-medium">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-medium">Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="At least 6 characters" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-11 font-medium" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Create Account
                    </Button>
                  </form>
                </Form>
              )}

              <div className="mt-6 text-center text-sm text-slate-500">
                {mode === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      onClick={() => setMode("register")}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => setMode("login")}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
