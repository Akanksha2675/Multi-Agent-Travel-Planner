import { useState } from "react";
import { useAuthLogin, useAuthRegister } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Globe, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthUser } from "@/hooks/use-auth";

interface Props {
  onLogin: (token: string, user: AuthUser) => void;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

function validate(fields: { name?: string; email: string; password: string }, isRegister: boolean): FieldErrors {
  const errors: FieldErrors = {};
  if (isRegister && (!fields.name || fields.name.trim().length < 2)) {
    errors.name = "Name must be at least 2 characters";
  }
  if (!fields.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Enter a valid email";
  }
  if (!fields.password || fields.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }
  return errors;
}

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const switchMode = (next: "login" | "register") => {
    setMode(next);
    setErrors({});
    setSubmitted(false);
    setName("");
    setEmail("");
    setPassword("");
  };

  const loginMutation = useAuthLogin({
    mutation: {
      onSuccess: (data: any) => {
        onLogin(data.token, data.user);
      },
      onError: (err: any) => {
        toast({
          title: "Login failed",
          description: err?.data?.error ?? "Invalid email or password",
          variant: "destructive",
        });
      },
    },
  });

  const registerMutation = useAuthRegister({
    mutation: {
      onSuccess: (data: any) => {
        onLogin(data.token, data.user);
      },
      onError: (err: any) => {
        toast({
          title: "Registration failed",
          description: err?.data?.error ?? "Could not create account",
          variant: "destructive",
        });
      },
    },
  });

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const fieldErrors = validate({ name, email, password }, mode === "register");
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (mode === "login") {
      loginMutation.mutate({ data: { email, password } });
    } else {
      registerMutation.mutate({ data: { name, email, password } });
    }
  };

  const showError = (field: keyof FieldErrors) =>
    submitted ? errors[field] : undefined;

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
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {mode === "register" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Priya Sharma"
                      className="h-11"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                    {showError("name") && (
                      <p className="text-sm text-red-500 mt-1">{showError("name")}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className="h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  {showError("email") && (
                    <p className="text-sm text-red-500 mt-1">{showError("email")}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder={mode === "register" ? "At least 6 characters" : "••••••••"}
                    className="h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                  />
                  {showError("password") && (
                    <p className="text-sm text-red-500 mt-1">{showError("password")}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-medium"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {mode === "login" ? "Sign In" : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-500">
                {mode === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
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
