import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TripRequest } from "@workspace/api-client-react";
import { MapPin, Calendar as CalendarIcon, Wallet, Users, PlaneTakeoff, Navigation } from "lucide-react";
import { format } from "date-fns";

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Chennai", "Kolkata",
  "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Kochi"
];

const schema = z.object({
  originCity: z.string().min(2, "Origin city is required"),
  destination: z.string().min(2, "Destination is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  budget: z.coerce.number().min(1000, "Minimum budget is ₹1,000"),
  travelers: z.coerce.number().min(1, "At least 1 traveler required"),
  preferences: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: TripRequest) => void;
  isSubmitting?: boolean;
}

export function TripRequestForm({ onSubmit, isSubmitting }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [submittedData, setSubmittedData] = useState<TripRequest | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      originCity: "Mumbai",
      destination: "",
      startDate: "",
      endDate: "",
      budget: 150000,
      travelers: 2,
      preferences: ""
    }
  });

  const handleSubmit = (data: FormValues) => {
    setSubmittedData(data);
    setCollapsed(true);
    onSubmit(data);
  };

  if (collapsed && submittedData) {
    return (
      <Card className="bg-primary/5 border-primary/10 transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" />
                {submittedData.originCity || "Mumbai"}
                <span className="text-slate-400 font-normal">→</span>
                <MapPin className="h-5 w-5 text-primary" />
                {submittedData.destination}
              </h3>
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {format(new Date(submittedData.startDate), "MMM d")} - {format(new Date(submittedData.endDate), "MMM d")}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {submittedData.travelers} travelers
                </span>
                <span className="flex items-center gap-1">
                  <Wallet className="h-4 w-4" />
                  ₹{submittedData.budget.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCollapsed(false)} disabled={isSubmitting}>
              Edit Request
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white">
      <CardHeader className="text-center pb-8 pt-8">
        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <PlaneTakeoff className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
          Where to next?
        </CardTitle>
        <CardDescription className="text-base text-slate-500 mt-2">
          Let our AI agents negotiate the perfect itinerary for your budget.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <>
              <datalist id="indian-cities">
                {INDIAN_CITIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="originCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Flying From</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Mumbai"
                        list="indian-cities"
                        className="h-12 text-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Destination</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tokyo, Japan" className="h-12 text-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">End Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Total Budget (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="travelers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Travelers</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-medium">Preferences (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Close to city center, lots of food, direct flights only" 
                      className="resize-none h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-12 text-lg font-medium shadow-md" disabled={isSubmitting}>
              {isSubmitting ? "Initiating Agents..." : "Plan My Trip"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
