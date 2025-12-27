import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { NavigationDrawer } from "@/components/NavigationDrawer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell } from "lucide-react";

interface ComingSoonProps {
  category: string;
}

const ComingSoon = ({ category }: ComingSoonProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 opacity-30"
      >
        <source src="/background-video.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background z-[1]" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <img
              src="/intake-logo.png"
              alt="Intake IQ"
              className="h-8 sm:h-10 w-auto cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>
          <NavigationDrawer />
        </header>

        {/* Main Content */}
        <main className="flex flex-col items-center justify-center px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-primary" />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              {category}
              <span className="text-primary block mt-1">Coming Soon</span>
            </h1>

            <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-md mx-auto">
              We're working hard to bring you the best {category.toLowerCase()}{" "}
              comparison tool. Check back soon!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
              <Button onClick={() => navigate("/protein")} className="gap-2">
                Try Protein Comparison
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default ComingSoon;
