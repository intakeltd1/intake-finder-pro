import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  available: boolean;
  delay?: number;
}

const CategoryCard = ({
  title,
  description,
  icon: Icon,
  href,
  available,
  delay = 0,
}: CategoryCardProps) => {
  const CardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 + delay }}
      whileHover={available ? { scale: 1.02, y: -4 } : undefined}
      className={`
        relative p-6 sm:p-8 rounded-2xl border transition-all duration-300
        ${
          available
            ? "bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 cursor-pointer"
            : "bg-card/40 backdrop-blur-sm border-border/30 opacity-60 cursor-not-allowed"
        }
      `}
    >
      {!available && (
        <Badge
          variant="secondary"
          className="absolute top-4 right-4 text-xs bg-muted/80"
        >
          Coming Soon
        </Badge>
      )}

      <div
        className={`
          w-14 h-14 rounded-xl flex items-center justify-center mb-4
          ${available ? "bg-primary/20" : "bg-muted/50"}
        `}
      >
        <Icon
          className={`w-7 h-7 ${available ? "text-primary" : "text-muted-foreground"}`}
        />
      </div>

      <h3
        className={`text-lg sm:text-xl font-semibold mb-2 ${
          available ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {title}
      </h3>

      <p className="text-sm text-muted-foreground">{description}</p>

      {available && (
        <div className="mt-4 flex items-center text-primary text-sm font-medium">
          Compare now
          <svg
            className="ml-2 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      )}
    </motion.div>
  );

  if (available) {
    return <Link to={href}>{CardContent}</Link>;
  }

  return CardContent;
};

export default CategoryCard;
