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
  image?: string;
}

const CategoryCard = ({
  title,
  description,
  icon: Icon,
  href,
  available,
  delay = 0,
  image,
}: CategoryCardProps) => {
  const CardContent = (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: 0.3 + delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={available ? { 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      } : undefined}
      className={`
        relative rounded-2xl border overflow-hidden group
        ${
          available
            ? "cursor-pointer"
            : "opacity-60 cursor-not-allowed"
        }
      `}
      style={{
        minHeight: "280px",
      }}
    >
      {/* Background Image with Zoom Effect */}
      {image && (
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3 + delay, ease: "easeOut" }}
        >
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        </motion.div>
      )}

      {/* Gradient Overlay */}
      <div 
        className={`
          absolute inset-0 z-[1] transition-opacity duration-500
          ${image 
            ? "bg-gradient-to-t from-background via-background/80 to-background/40 group-hover:from-background/95 group-hover:via-background/70 group-hover:to-background/30" 
            : available 
              ? "bg-card/80 backdrop-blur-sm" 
              : "bg-card/40 backdrop-blur-sm"
          }
        `}
      />

      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 z-[2] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
      </div>

      {/* Border Glow */}
      <div 
        className={`
          absolute inset-0 z-[3] rounded-2xl transition-all duration-500
          ${available 
            ? "border border-border/50 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]" 
            : "border border-border/30"
          }
        `} 
      />

      {/* Content */}
      <div className="relative z-[4] p-6 sm:p-8 h-full flex flex-col justify-end">
        {!available && (
          <Badge
            variant="secondary"
            className="absolute top-4 right-4 text-xs bg-muted/80"
          >
            Coming Soon
          </Badge>
        )}

        {/* Icon with Animation */}
        <motion.div
          className={`
            w-14 h-14 rounded-xl flex items-center justify-center mb-4
            ${available 
              ? "bg-primary/20 backdrop-blur-sm group-hover:bg-primary/30" 
              : "bg-muted/50"
            }
            transition-all duration-300
          `}
          whileHover={available ? { scale: 1.1, rotate: 5 } : undefined}
        >
          <Icon
            className={`w-7 h-7 transition-all duration-300 ${
              available 
                ? "text-primary group-hover:text-primary group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" 
                : "text-muted-foreground"
            }`}
          />
        </motion.div>

        {/* Text Content */}
        <div className="space-y-2">
          <h3
            className={`text-xl sm:text-2xl font-semibold transition-colors duration-300 ${
              available 
                ? "text-foreground group-hover:text-primary" 
                : "text-muted-foreground"
            }`}
          >
            {title}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* CTA with Arrow Animation */}
        {available && (
          <div className="mt-4 flex items-center text-primary text-sm font-medium group/cta">
            <span className="transition-all duration-300 group-hover:mr-1">
              Compare now
            </span>
            <motion.svg
              className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
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
            </motion.svg>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (available) {
    return <Link to={href}>{CardContent}</Link>;
  }

  return CardContent;
};

export default CategoryCard;
