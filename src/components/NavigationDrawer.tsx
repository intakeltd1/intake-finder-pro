import { useState } from 'react';
import { Menu, X, ExternalLink } from 'lucide-react';
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

const navigationLinks = [
  { title: 'Home', url: 'https://intakeltd.com', description: 'Visit our main website' },
  { title: 'Products', url: 'https://www.intakeltd.com/collections/all', description: 'Browse our full product range' },
  { title: 'Contact', url: 'https://www.intakeltd.com/pages/contact', description: 'Get in touch with us' },
  { title: 'Mind-Muscle Connection', url: 'https://www.intakeltd.com/blogs/mind-muscle-connection', description: 'Read our latest blog posts' },
];

export function NavigationDrawer() {
  const [open, setOpen] = useState(false);

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
        
        <div className="flex-1 p-4">
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
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Intake Ltd</p>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}