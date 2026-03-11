import { useState } from "react";
import { BookOpen, Phone, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login = () => {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: { phone: `+91${cleanedPhone}` },
        },
      });

      if (error) throw error;

      toast.success("OTP sent to your email!");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) throw error;

      toast.success("Login successful!");
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="khata-header px-4 py-8 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8" />
            <h1 className="text-3xl font-bold font-display">Digital Khata</h1>
          </div>
          <p className="text-primary-foreground/80 font-body text-sm">
            Login with your mobile number
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-6 flex-1 flex items-start justify-center pt-4">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="font-display text-xl">
              {step === "details" ? "Enter your details" : "Verify OTP"}
            </CardTitle>
            <CardDescription className="font-body">
              {step === "details"
                ? "We'll send a free OTP to your email for verification"
                : `OTP sent to ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "details" ? (
              <>
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-2 rounded-md border border-input">
                      +91
                    </span>
                    <Input
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="flex-1"
                      maxLength={10}
                    />
                  </div>
                  <Input
                    type="email"
                    placeholder="Enter your email (for OTP)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={loading || phone.length !== 10 || !email.includes("@")}
                  className="w-full gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Send OTP
                </Button>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="w-full gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Verify & Login
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => {
                    setStep("details");
                    setOtp("");
                  }}
                >
                  Change details
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
