import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ExternalLink, Heart, LogIn, LogOut, User } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";

const navigationLinks = [
  { title: 'Home', url: 'https://intakeltd.com', description: 'Visit our main website' },
  { title: 'Products', url: 'https://www.intakeltd.com/collections/all', description: 'Browse our full product range' },
  { title: 'Contact', url: 'https://www.intakeltd.com/pages/contact', description: 'Get in touch with us' },
  { title: 'Mind-Muscle Connection', url: 'https://www.intakeltd.com/blogs/mind-muscle-connection', description: 'Read our latest blog posts' },
];

export function NavigationDrawer() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Drawer direction="left" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-foreground hover:bg-white/10 p-2 border border-white/30 rounded-md"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-full w-80 mt-0 rounded-none border-r">
        <DrawerHeader className="text-left border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-lg font-semibold">Navigation</DrawerTitle>
              <DrawerDescription>
                Explore Intake Ltd
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="p-1">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        
        <div className="flex-1 p-4 overflow-y-auto">
          {/* User Section */}
          {user ? (
            <div className="mb-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleNavigate('/favorites')}
              >
                <Heart className="h-4 w-4 mr-2 text-primary fill-primary" />
                My Favorites
              </Button>
            </div>
          ) : (
            <div className="mb-4">
              <Button
                variant="default"
                className="w-full"
                onClick={() => handleNavigate('/auth')}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Save favorites & get price alerts
              </p>
            </div>
          )}

          <Separator className="mb-4" />

          <nav className="space-y-3">
            {navigationLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
                onClick={() => setOpen(false)}
              >
                <div>
                  <div className="font-medium text-foreground group-hover:text-primary">
                    {link.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {link.description}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </a>
            ))}
          </nav>
        </div>
        
        <DrawerFooter className="border-t">
          {user && (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Intake Ltd</p>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
