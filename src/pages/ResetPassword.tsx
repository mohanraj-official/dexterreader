import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const passwordSchema = z.string().min(6, { message: "At least 6 characters" }).max(72);

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The recovery link drops us here with a session; just confirm it's available.
    supabase.auth.getSession().then(() => setReady(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = passwordSchema.safeParse(password);
    if (!v.success) return toast.error(v.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: v.data });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate("/library");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container flex min-h-screen flex-col items-center justify-center py-12">
        <div className="mb-8 flex items-center gap-2">
          <div className="rounded-lg bg-gradient-hero p-2 shadow-elegant">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-semibold">Foliant</span>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <h1 className="font-serif text-2xl font-semibold">Set a new password</h1>
          <div className="space-y-2">
            <Label htmlFor="pw">New password</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!ready} />
          </div>
          <Button type="submit" disabled={loading || !ready} className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
