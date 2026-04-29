import { Link, Navigate } from "react-router-dom";
import { ArrowRight, BookmarkCheck, Moon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/library" replace />;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />

      <main className="container">
        <section className="relative py-20 md:py-32">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute right-10 bottom-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              A quiet place to read
            </div>

            <h1 className="mt-6 font-serif text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Your next chapter,{" "}
              <span className="text-gradient">beautifully kept.</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Foliant is a calm, distraction-free reader for classic literature. Bookmark every page, switch between
              light and dark moods, and pick up exactly where you left off.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-gradient-hero text-primary-foreground shadow-elegant hover:opacity-90 transition-smooth"
              >
                <Link to="/auth">
                  Start reading <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/library">Browse library</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 py-16 md:grid-cols-3">
          {[
            {
              icon: BookmarkCheck,
              title: "Bookmarks that follow you",
              body: "We remember your last page on every book, on every device.",
            },
            {
              icon: Moon,
              title: "Light or dark, your call",
              body: "A typography-first reader designed to be easy on the eyes any time of day.",
            },
            {
              icon: Sparkles,
              title: "Curated classics",
              body: "Hand-picked public-domain works to get you reading in seconds.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="inline-flex rounded-lg bg-gradient-hero p-2.5 text-primary-foreground shadow-elegant">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          Built for readers, with care.
        </div>
      </footer>
    </div>
  );
};

export default Index;
