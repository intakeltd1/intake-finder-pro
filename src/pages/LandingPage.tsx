import { motion } from "framer-motion";
import { NavigationDrawer } from "@/components/NavigationDrawer";
import CategoryCard from "@/components/CategoryCard";
import { Droplets, Dumbbell } from "lucide-react";

const categories = [
  {
    title: "Protein Powders",
    description: "Compare value across 100+ protein supplements",
    icon: Dumbbell,
    href: "/protein",
    available: true,
  },
  {
    title: "Electrolytes",
    description: "Find the best hydration supplements",
    icon: Droplets,
    href: "/electrolytes",
    available: true,
  },
];

const LandingPage = () => {
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
              src="/lovable-uploads/147a0591-cb92-4577-9a7e-31de1281abc2.png"
              alt="Intake"
              className="h-4 sm:h-5 w-auto"
              style={{ filter: 'drop-shadow(0 0 8px #fff) drop-shadow(0 0 20px #fff) drop-shadow(0 0 40px #fff) drop-shadow(0 0 60px rgba(255,255,255,0.8))' }}
            />
          </div>
          <NavigationDrawer />
        </header>

        {/* Hero Section */}
        <section className="px-4 sm:px-6 pt-8 sm:pt-16 pb-12 sm:pb-20 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6">
              Smart Supplement
              <span className="text-primary block mt-1">Comparison</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Compare supplements by real value — not just price. Our Intake Value
              algorithm helps you find the best nutrition per pound spent.
            </p>
          </motion.div>
        </section>

        {/* Categories Grid */}
        <section className="px-4 sm:px-6 pb-16 sm:pb-24 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground text-center mb-8">
              Choose a Category
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {categories.map((category, index) => (
                <CategoryCard
                  key={category.title}
                  title={category.title}
                  description={category.description}
                  icon={category.icon}
                  href={category.href}
                  available={category.available}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="px-4 sm:px-6 pb-16 sm:pb-24 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sm:p-8"
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground text-center mb-6">
              How Intake Value Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold text-lg">1</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">Analyse</h3>
                <p className="text-sm text-muted-foreground">
                  We scan prices and nutrition data across major UK retailers
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold text-lg">2</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">Calculate</h3>
                <p className="text-sm text-muted-foreground">
                  Our algorithm weighs protein content, serving size, and price
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold text-lg">3</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">Compare</h3>
                <p className="text-sm text-muted-foreground">
                  See rankings and find the best value for your goals
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="px-4 sm:px-6 pb-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Intake Ltd. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
